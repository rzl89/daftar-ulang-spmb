import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/utils/api';
import { motion, AnimatePresence } from '@/utils/motion-lite';
import { 
  Upload, Download, Trash2, FileSpreadsheet, CheckCircle2, AlertCircle, 
  X, Search, Users, RefreshCw, Eye, ArrowUpFromLine, UserPlus
} from 'lucide-react';
import { toast } from 'sonner';

interface Jurusan {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

interface PassedStudent {
  id?: number;
  nisn: string;
  namaLengkap: string;
  tanggalLahir?: string;
  asalSekolah?: string;
  jurusanDiterima?: string;
}

import ExcelJS from 'exceljs';

const EXCEL_HEADERS = ['NISN', 'Nama Lengkap', 'Tanggal Lahir (dd/mm/yyyy)', 'Asal Sekolah', 'Jurusan Diterima'];

function generateTemplateData() {
  return [
    EXCEL_HEADERS,
    ['0012345678', 'Contoh Nama Siswa 1', '15/01/2009', 'SMP N 1 Contoh', 'JURUSAN1'],
    ['0012345679', 'Contoh Nama Siswa 2', '20/02/2009', 'SMP N 2 Contoh', 'JURUSAN2'],
    ['0012345680', 'Contoh Nama Siswa 3', '10/03/2009', 'MTs N 1 Contoh', 'JURUSAN1'],
  ];
}

/**
 * Normalize any date value from Excel to YYYY-MM-DD format.
 * Handles: Date objects, dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd, Excel serial numbers.
 */
function normalizeDateToISO(cellValue: unknown): string {
  if (!cellValue) return '';

  // Handle ExcelJS Date objects
  if (cellValue instanceof Date) {
    const yyyy = cellValue.getFullYear();
    const mm = String(cellValue.getMonth() + 1).padStart(2, '0');
    const dd = String(cellValue.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  const raw = String(cellValue).trim();
  if (!raw) return '';

  // Handle Excel serial date number (e.g. 39814)
  if (/^\d{4,5}$/.test(raw)) {
    const serial = Number(raw);
    const utcDays = Math.floor(serial - 25569);
    const d = new Date(utcDays * 86400 * 1000);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.substring(0, 10);
  }

  // Handle dd/mm/yyyy or dd-mm-yyyy
  const match = raw.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (match) {
    const part1 = parseInt(match[1], 10);
    const part2 = parseInt(match[2], 10);
    const year = match[3];
    
    let day: number, month: number;
    if (part1 > 12) {
      // First part > 12, must be day (dd/mm/yyyy)
      day = part1;
      month = part2;
    } else if (part2 > 12) {
      // Second part > 12, must be day (mm/dd/yyyy)
      day = part2;
      month = part1;
    } else {
      // Ambiguous — assume dd/mm/yyyy (Indonesian convention)
      day = part1;
      month = part2;
    }
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Fallback: try parsing as JS Date
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Return raw if nothing worked
  return raw;
}



export default function DataKelulusan() {
  const [savedData, setSavedData] = useState<PassedStudent[]>([]);
  const [previewData, setPreviewData] = useState<PassedStudent[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'saved' | 'preview'>('saved');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for add single student modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    nisn: '', namaLengkap: '', tanggalLahir: '', asalSekolah: '', jurusanDiterima: '',
  });
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);

  // State for individual delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<PassedStudent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch existing data from DB
  useEffect(() => {
    fetchSavedData();
    fetchJurusanList();
  }, []);

  const fetchSavedData = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/admin/passed-students');
      if (res.ok) {
        const data = await res.json();
        setSavedData(data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch jurusan list for dropdown
  const fetchJurusanList = async () => {
    try {
      const res = await apiFetch('/api/jurusan');
      if (res.ok) {
        const data = await res.json();
        setJurusanList(data);
      }
    } catch (err) {
      console.error('Fetch jurusan error:', err);
    }
  };

  // Add single student
  const handleAddSingle = async () => {
    if (!addForm.nisn.trim() || !addForm.namaLengkap.trim()) {
      toast.error('NISN dan Nama Lengkap wajib diisi');
      return;
    }
    if (addForm.nisn.trim().length < 10) {
      toast.error('NISN harus minimal 10 digit');
      return;
    }
    setIsAdding(true);
    try {
      const res = await apiFetch('/api/admin/passed-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        toast.success(`Data ${addForm.namaLengkap} berhasil ditambahkan`);
        setShowAddModal(false);
        setAddForm({ nisn: '', namaLengkap: '', tanggalLahir: '', asalSekolah: '', jurusanDiterima: '' });
        fetchSavedData();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Gagal menambahkan data');
      }
    } catch (err) {
      toast.error('Koneksi ke server gagal');
    } finally {
      setIsAdding(false);
    }
  };

  // Delete single student
  const handleDeleteSingle = async () => {
    if (!deleteTarget?.id) return;
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/admin/passed-students/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Data ${deleteTarget.namaLengkap} berhasil dihapus`);
        setDeleteTarget(null);
        fetchSavedData();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Gagal menghapus data');
      }
    } catch (err) {
      toast.error('Koneksi ke server gagal');
    } finally {
      setIsDeleting(false);
    }
  };

  // Download template Excel
  const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template');
    worksheet.addRows(generateTemplateData());
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_data_kelulusan_spmb.xlsx';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template Excel berhasil diunduh');
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const validExtensions = ['.csv', '.xls', '.xlsx'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      toast.error('Format file tidak didukung. Gunakan file Excel (.xlsx) atau CSV.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          toast.error('File Excel kosong atau format tidak sesuai template.');
          setIsUploading(false);
          return;
        }

        const parsed: PassedStudent[] = [];
        worksheet.eachRow((row, rowNum) => {
          if (rowNum === 1) return; // skip header
          const nisn = row.getCell(1).value;
          const namaLengkap = row.getCell(2).value;
          if (nisn && namaLengkap) {
            parsed.push({
              nisn: String(nisn).trim(),
              namaLengkap: String(namaLengkap).trim(),
              tanggalLahir: normalizeDateToISO(row.getCell(3).value),
              asalSekolah: row.getCell(4).value ? String(row.getCell(4).value).trim() : '',
              jurusanDiterima: row.getCell(5).value ? String(row.getCell(5).value).trim() : '',
            });
          }
        });

        if (parsed.length === 0) {
          toast.error('Tidak ada data valid yang bisa dibaca.');
          setIsUploading(false);
          return;
        }

        setPreviewData(parsed);
        setActiveTab('preview');
        toast.success(`${parsed.length} data peserta berhasil dibaca dari file`);
      } catch (err) {
        toast.error('Gagal membaca file Excel/CSV');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Save preview data to database
  const handleSaveToDb = async () => {
    if (previewData.length === 0) return;
    setIsSaving(true);
    try {
      const res = await apiFetch('/api/admin/passed-students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: previewData }),
      });
      if (res.ok) {
        toast.success(`${previewData.length} data kelulusan berhasil disimpan ke database`);
        setPreviewData([]);
        setActiveTab('saved');
        fetchSavedData();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Gagal menyimpan data');
      }
    } catch (err) {
      toast.error('Koneksi ke server gagal');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset all data
  const handleResetData = async () => {
    try {
      const res = await apiFetch('/api/admin/passed-students', { method: 'DELETE' });
      if (res.ok) {
        toast.success('Seluruh data kelulusan berhasil di-reset');
        setSavedData([]);
        setShowResetConfirm(false);
      }
    } catch (err) {
      toast.error('Gagal mereset data');
    }
  };

  // Filter data
  const filteredSaved = savedData.filter(s =>
    s.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nisn.includes(searchQuery)
  );

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            Data Kelulusan SPMB
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Upload dan kelola database peserta yang lulus seleksi penerimaan
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-600/20 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Data
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Download Template
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-8 text-center hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={handleFileChange}
          className="hidden"
          id="csv-upload"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <ArrowUpFromLine className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Upload File Excel/CSV</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Klik tombol di bawah atau drag & drop file Excel (.xlsx) yang sudah diisi sesuai template. 
              Pastikan file menggunakan format yang benar.
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="mt-2 flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 whitespace-nowrap"
          >
            {isUploading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            {isUploading ? 'Membaca File...' : 'Pilih File Excel/CSV'}
          </button>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Belum punya template? <button onClick={handleDownloadTemplate} className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">Download di sini</button>
          </p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{savedData.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Tersimpan</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <Eye className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{previewData.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Preview (Belum Disimpan)</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">Aktif</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Status Database</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'saved'
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Data Tersimpan ({savedData.length})
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'preview'
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Preview Upload {previewData.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full text-xs">
              {previewData.length}
            </span>
          )}
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden min-w-0 w-full">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari NISN atau nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            {activeTab === 'preview' && previewData.length > 0 && (
              <>
                <button
                  onClick={() => { setPreviewData([]); toast('Preview dibersihkan'); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" /> Batal
                </button>
                <button
                  onClick={handleSaveToDb}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {isSaving ? 'Menyimpan...' : 'Simpan ke Database'}
                </button>
              </>
            )}
            {activeTab === 'saved' && savedData.length > 0 && (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4" /> Reset Data
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">No</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">NISN</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Nama Lengkap</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Tanggal Lahir</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Asal Sekolah</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Jurusan Diterima</th>
                {activeTab === 'saved' && <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 w-20">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {activeTab === 'saved' && isLoading ? (
                <tr>
                  <td colSpan={activeTab === 'saved' ? 7 : 6} className="px-4 py-12 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-500 dark:text-slate-400">Memuat data...</p>
                  </td>
                </tr>
              ) : (activeTab === 'saved' ? filteredSaved : previewData).length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'saved' ? 7 : 6} className="px-4 py-12 text-center">
                    <FileSpreadsheet className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                      {activeTab === 'saved' ? 'Belum ada data kelulusan' : 'Belum ada file yang diupload'}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {activeTab === 'saved' 
                        ? 'Upload file CSV terlebih dahulu untuk menambahkan data peserta lulus'
                        : 'Pilih file CSV untuk melihat pratinjau data sebelum disimpan'}
                    </p>
                  </td>
                </tr>
              ) : (
                (activeTab === 'saved' ? filteredSaved : previewData).map((student, i) => (
                  <tr key={student.nisn + '-' + i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-slate-800 dark:text-white font-medium">{student.nisn}</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-white font-medium">{student.namaLengkap}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{student.tanggalLahir || '-'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{student.asalSekolah || '-'}</td>
                    <td className="px-4 py-3">
                      {student.jurusanDiterima ? (
                        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold">
                          {student.jurusanDiterima}
                        </span>
                      ) : '-'}
                    </td>
                    {activeTab === 'saved' && (
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setDeleteTarget(student)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          title={`Hapus ${student.namaLengkap}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Single Student Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Tambah Data Kelulusan</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Input data peserta lulus secara manual</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* NISN */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    NISN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addForm.nisn}
                    onChange={(e) => setAddForm(f => ({ ...f, nisn: e.target.value }))}
                    placeholder="Masukkan NISN (min. 10 digit)"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all dark:text-white"
                    maxLength={20}
                  />
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addForm.namaLengkap}
                    onChange={(e) => setAddForm(f => ({ ...f, namaLengkap: e.target.value }))}
                    placeholder="Masukkan nama lengkap peserta"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all dark:text-white"
                  />
                </div>

                {/* Tanggal Lahir */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={addForm.tanggalLahir}
                    onChange={(e) => setAddForm(f => ({ ...f, tanggalLahir: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all dark:text-white"
                  />
                </div>

                {/* Asal Sekolah */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Asal Sekolah
                  </label>
                  <input
                    type="text"
                    value={addForm.asalSekolah}
                    onChange={(e) => setAddForm(f => ({ ...f, asalSekolah: e.target.value }))}
                    placeholder="Masukkan asal sekolah"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all dark:text-white"
                  />
                </div>

                {/* Jurusan Diterima - Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Jurusan Diterima
                  </label>
                  <select
                    value={addForm.jurusanDiterima}
                    onChange={(e) => setAddForm(f => ({ ...f, jurusanDiterima: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all dark:text-white"
                  >
                    <option value="">— Pilih Jurusan —</option>
                    {jurusanList.map((j) => (
                      <option key={j.id} value={j.code}>{j.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddSingle}
                  disabled={isAdding || !addForm.nisn.trim() || !addForm.namaLengkap.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-500 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isAdding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {isAdding ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Single Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Hapus Data Peserta</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
                Apakah Anda yakin ingin menghapus data kelulusan untuk <strong>{deleteTarget.namaLengkap}</strong> (NISN: {deleteTarget.nisn}) dari database?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteSingle}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-xl font-medium hover:bg-red-500 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Reset Data Kelulusan</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
                Seluruh data kelulusan ({savedData.length} peserta) akan dihapus dari database. 
                Peserta yang sudah daftar ulang tidak akan terpengaruh, namun peserta baru tidak akan bisa login sampai data diupload kembali.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleResetData}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl font-medium hover:bg-red-500 transition-colors shadow-sm"
                >
                  Ya, Reset Semua
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
