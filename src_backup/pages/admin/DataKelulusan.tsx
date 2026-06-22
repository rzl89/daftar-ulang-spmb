import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Download, Trash2, FileSpreadsheet, CheckCircle2, AlertCircle, 
  X, Search, Users, RefreshCw, Eye, ArrowUpFromLine
} from 'lucide-react';
import { toast } from 'sonner';

interface PassedStudent {
  id?: number;
  nisn: string;
  namaLengkap: string;
  tanggalLahir?: string;
  asalSekolah?: string;
  jurusanDiterima?: string;
}

import * as XLSX from 'xlsx';

const EXCEL_HEADERS = ['NISN', 'Nama Lengkap', 'Tanggal Lahir', 'Asal Sekolah', 'Jurusan Diterima'];

function generateTemplateData() {
  return [
    EXCEL_HEADERS,
    ['0012345678', 'Ahmad Rizki Pratama', '2009-05-15', 'SMP Negeri 1 Serang', 'PPLG'],
    ['0012345679', 'Siti Nurhaliza', '2009-08-22', 'SMP Negeri 2 Serang', 'TJKT'],
    ['0012345680', 'Budi Santoso', '2010-01-10', 'MTs Negeri 1 Serang', 'DKV'],
  ];
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

  // Fetch existing data from DB
  useEffect(() => {
    fetchSavedData();
  }, []);

  const fetchSavedData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/passed-students');
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

  // Download template Excel
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet(generateTemplateData());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "template_data_kelulusan_spmb.xlsx");
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
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to array of arrays
        const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
        
        if (rows.length < 2) {
          toast.error('File Excel kosong atau format tidak sesuai template.');
          setIsUploading(false);
          return;
        }

        // Skip header
        const dataRows = rows.slice(1);
        const parsed: PassedStudent[] = [];

        for (const row of dataRows) {
          if (row.length >= 2 && row[0] && row[1]) {
            parsed.push({
              nisn: String(row[0]).trim(),
              namaLengkap: String(row[1]).trim(),
              tanggalLahir: row[2] ? String(row[2]).trim() : '',
              asalSekolah: row[3] ? String(row[3]).trim() : '',
              jurusanDiterima: row[4] ? String(row[4]).trim() : '',
            });
          }
        }

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
      const res = await fetch('/api/admin/passed-students/bulk', {
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
      const res = await fetch('/api/admin/passed-students', { method: 'DELETE' });
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {activeTab === 'saved' && isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-500 dark:text-slate-400">Memuat data...</p>
                  </td>
                </tr>
              ) : (activeTab === 'saved' ? filteredSaved : previewData).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
              onClick={(e) => e.stopPropagation()}
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
