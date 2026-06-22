import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Edit, Trash2, X, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';

interface Jurusan {
  id: number;
  code: string;
  name: string;
  description: string | null;
  quota: number;
  isActive: boolean;
  sortOrder: number;
}

export default function KelolaJurusan() {
  const [data, setData] = useState<Jurusan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Jurusan | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/jurusan');
      if (res.ok) setData(await res.json());
    } catch {
      toast.error('Gagal memuat data jurusan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setSelected(null); setIsModalOpen(true); };
  const openEdit = (j: Jurusan) => { setSelected(j); setIsModalOpen(true); };
  const openDelete = (j: Jurusan) => { setSelected(j); setIsDeleteOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);

    const payload = {
      code: fd.get('code') as string,
      name: fd.get('name') as string,
      description: fd.get('description') as string || null,
      quota: Number(fd.get('quota')) || 36,
      sortOrder: Number(fd.get('sortOrder')) || 0,
      isActive: true,
    };

    if (!payload.code || !payload.name) {
      toast.error('Kode dan Nama Jurusan wajib diisi');
      return;
    }

    try {
      const url = selected ? `/api/admin/jurusan/${selected.id}` : '/api/admin/jurusan';
      const res = await fetch(url, {
        method: selected ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(`Jurusan berhasil ${selected ? 'diperbarui' : 'ditambahkan'}`);
        setIsModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Gagal menyimpan');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/admin/jurusan/${selected.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Jurusan berhasil dihapus');
        setIsDeleteOpen(false);
        fetchData();
      } else {
        toast.error('Gagal menghapus');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  const toggleActive = async (j: Jurusan) => {
    try {
      const res = await fetch(`/api/admin/jurusan/${j.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !j.isActive }),
      });
      if (res.ok) {
        toast.success(`Jurusan ${!j.isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
        fetchData();
      }
    } catch {
      toast.error('Gagal mengubah status');
    }
  };

  return (
    <div className="space-y-6 min-w-0 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Kelola Jurusan
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Tambah, edit, dan kelola jurusan yang tersedia</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all"
        >
          <Plus className="w-5 h-5" />
          Tambah Jurusan
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden min-w-0 w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-4">Kode</th>
                <th className="px-6 py-4">Nama Jurusan</th>
                <th className="px-6 py-4">Kuota</th>
                <th className="px-6 py-4">Urutan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse border-b dark:border-slate-700">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-10" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-8" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-16" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24 mx-auto" /></td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="text-lg font-medium">Belum ada jurusan</p>
                    <p className="text-sm mt-1">Klik "Tambah Jurusan" untuk memulai</p>
                  </td>
                </tr>
              ) : (
                data.map((j) => (
                  <tr key={j.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold">{j.code}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{j.name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-semibold">{j.quota}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{j.sortOrder}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleActive(j)} className="group" title={j.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
                        {j.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                            <ToggleRight className="w-3.5 h-3.5" /> Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600">
                            <ToggleLeft className="w-3.5 h-3.5" /> Nonaktif
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(j)} className="p-1.5 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => openDelete(j)} className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Hapus">
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
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {selected ? 'Edit Jurusan' : 'Tambah Jurusan Baru'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kode Jurusan *</label>
                    <input required name="code" defaultValue={selected?.code} placeholder="Misal: TJKT" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kuota</label>
                    <input type="number" name="quota" defaultValue={selected?.quota || 36} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nama Jurusan *</label>
                  <input required name="name" defaultValue={selected?.name} placeholder="Misal: Teknik Jaringan Komputer dan Telekomunikasi" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Deskripsi (opsional)</label>
                  <textarea name="description" defaultValue={selected?.description || ''} rows={3} placeholder="Deskripsi singkat jurusan..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Urutan Tampil</label>
                  <input type="number" name="sortOrder" defaultValue={selected?.sortOrder || 0} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white" />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">Batal</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20">Simpan</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Modal */}
        {isDeleteOpen && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDeleteOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Hapus Jurusan?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Apakah Anda yakin ingin menghapus jurusan <strong>{selected.name}</strong> ({selected.code})? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setIsDeleteOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl font-medium transition-colors">Batal</button>
                <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-600/20">Hapus</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
