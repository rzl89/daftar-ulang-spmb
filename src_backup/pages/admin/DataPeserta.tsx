import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Eye, Edit, Trash2, X, AlertCircle, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { generateBuktiPdf } from '@/utils/generatePdf';

interface Registration {
  id: number;
  registrationId: string;
  nisn: string;
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  agama: string;
  alamatLengkap: string;
  asalSekolah: string;
  namaOrangTua: string;
  pekerjaanOrangTua: string;
  noTelpOrangTua: string;
  pilihanJurusan1: string;
  pilihanJurusan2: string;
  status: string;
  createdAt: string;
}

export default function DataPeserta() {
  const [data, setData] = useState<Registration[]>([]);
  const [filteredData, setFilteredData] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [jurusanFilter, setJurusanFilter] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Registration | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/registrations');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setFilteredData(json);
      }
    } catch (e) {
      toast.error('Gagal memuat data peserta');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let result = data;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.namaLengkap.toLowerCase().includes(lower) || 
        r.nisn.toLowerCase().includes(lower) ||
        r.registrationId.toLowerCase().includes(lower)
      );
    }
    if (statusFilter) {
      result = result.filter(r => r.status === statusFilter);
    }
    if (jurusanFilter) {
      result = result.filter(r => r.pilihanJurusan1 === jurusanFilter);
    }
    setFilteredData(result);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, jurusanFilter, data]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openDetail = (student: Registration) => {
    setSelectedStudent(student);
    setIsDetailOpen(true);
  };

  const openEdit = (student: Registration) => {
    setSelectedStudent(student);
    setIsEditOpen(true);
  };

  const openDelete = (student: Registration) => {
    setSelectedStudent(student);
    setIsDeleteOpen(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const res = await fetch(`/api/admin/registrations/${selectedStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: formData.get('status'),
        })
      });
      if (res.ok) {
        toast.success('Data berhasil diubah');
        setIsEditOpen(false);
        fetchData();
      } else {
        toast.error('Gagal mengubah data');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan');
    }
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;
    try {
      const res = await fetch(`/api/admin/registrations/${selectedStudent.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Data berhasil dihapus');
        setIsDeleteOpen(false);
        fetchData();
      } else {
        toast.error('Gagal menghapus data');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan');
    }
  };

  return (
    <div className="space-y-6 min-w-0 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Data Peserta</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Kelola data pendaftar SPMB</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl font-semibold border border-blue-100 dark:border-blue-500/20 text-sm whitespace-nowrap">
          Total: {filteredData.length} Peserta
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-4 min-w-0 w-full">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama, NISN, atau ID pendaftaran..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white"
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white flex-1 sm:w-[160px]"
          >
            <option value="">Semua Status</option>
            <option value="MENUNGGU_VERIFIKASI">Menunggu</option>
            <option value="DITERIMA">Diterima</option>
            <option value="DITOLAK">Ditolak</option>
          </select>
          <select 
            value={jurusanFilter}
            onChange={e => setJurusanFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white flex-1 sm:w-[200px]"
          >
            <option value="">Semua Jurusan</option>
            <option value="TJKT">TJKT</option>
            <option value="PPLG">PPLG</option>
            <option value="DKV">DKV</option>
            <option value="AKL">AKL</option>
            <option value="MP">MP</option>
            <option value="BDP">BDP</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden min-w-0 w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-4">No. Reg / NISN</th>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Asal Sekolah</th>
                <th className="px-6 py-4">Jurusan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse border-b dark:border-slate-700">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-2"/><div className="h-3 bg-slate-100 dark:bg-slate-600 rounded w-16"/></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"/></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-40"/></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"/></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20"/></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24 mx-auto"/></td>
                  </tr>
                ))
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    Data tidak ditemukan
                  </td>
                </tr>
              ) : (
                currentData.map((reg) => (
                  <tr key={reg.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-blue-600 dark:text-blue-400">{reg.registrationId}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{reg.nisn}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{reg.namaLengkap}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{reg.asalSekolah}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{reg.pilihanJurusan1}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                        ${reg.status === 'DITERIMA' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 
                          reg.status === 'DITOLAK' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 
                          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'}`}>
                        {reg.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openDetail(reg)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title="Detail">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(reg)} className="p-1.5 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => generateBuktiPdf({
                          registrationId: reg.registrationId,
                          namaLengkap: reg.namaLengkap,
                          nisn: reg.nisn,
                          pilihanJurusan1: reg.pilihanJurusan1,
                          pilihanJurusan2: reg.pilihanJurusan2,
                          createdAt: reg.createdAt
                        })} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10 rounded-lg transition-colors" title="Cetak Bukti">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => openDelete(reg)} className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Hapus">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!isLoading && totalPages > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Prev
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isDetailOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDetailOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Detail Peserta</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{selectedStudent.registrationId}</p>
                </div>
                <button onClick={() => setIsDetailOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">Data Pribadi</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Nama Lengkap</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{selectedStudent.namaLengkap}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">NISN</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{selectedStudent.nisn}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Tempat, Tanggal Lahir</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{selectedStudent.tempatLahir}, {selectedStudent.tanggalLahir}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Jenis Kelamin</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{selectedStudent.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                  <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">Data Akademik</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Asal Sekolah</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{selectedStudent.asalSekolah}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Pilihan Jurusan 1</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{selectedStudent.pilihanJurusan1}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Pilihan Jurusan 2</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{selectedStudent.pilihanJurusan2}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                <button onClick={() => generateBuktiPdf({
                    registrationId: selectedStudent.registrationId,
                    namaLengkap: selectedStudent.namaLengkap,
                    nisn: selectedStudent.nisn,
                    pilihanJurusan1: selectedStudent.pilihanJurusan1,
                    pilihanJurusan2: selectedStudent.pilihanJurusan2,
                    createdAt: selectedStudent.createdAt
                })} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2">
                  <Printer className="w-4 h-4" /> Cetak Bukti
                </button>
                <button onClick={() => setIsDetailOpen(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl font-medium transition-colors">Tutup</button>
              </div>
            </motion.div>
          </div>
        )}

        {isEditOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Edit Status Peserta</h3>
                <button onClick={() => setIsEditOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditSave} className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Status</label>
                  <select name="status" defaultValue={selectedStudent.status} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white">
                    <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
                    <option value="DITERIMA">Diterima / Sudah Daftar Ulang</option>
                    <option value="DITOLAK">Ditolak</option>
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors">Simpan</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isDeleteOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDeleteOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Hapus Data?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Apakah Anda yakin ingin menghapus data <strong>{selectedStudent.namaLengkap}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setIsDeleteOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl font-medium transition-colors">Batal</button>
                <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors">Hapus</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
