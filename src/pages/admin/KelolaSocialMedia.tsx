import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/utils/api';
import { motion, AnimatePresence } from '@/utils/motion-lite';
import { Share2, Plus, Edit, Trash2, X, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { SOCIAL_ICON_OPTIONS, SOCIAL_ICON_MAP, ExternalLink } from '@/constants/icons';

interface SocialMedia {
  id: number;
  name: string;
  url: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

export default function KelolaSocialMedia() {
  const [data, setData] = useState<SocialMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<SocialMedia | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/admin/social-media');
      if (res.ok) setData(await res.json());
    } catch {
      toast.error('Gagal memuat data social media');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setSelected(null); setIsModalOpen(true); };
  const openEdit = (s: SocialMedia) => { setSelected(s); setIsModalOpen(true); };
  const openDelete = (s: SocialMedia) => { setSelected(s); setIsDeleteOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);

    const payload = {
      name: fd.get('name') as string,
      url: fd.get('url') as string,
      icon: fd.get('icon') as string,
      sortOrder: Number(fd.get('sortOrder')) || 0,
      isActive: fd.get('isActive') === 'true',
    };

    if (!payload.name || !payload.url || !payload.icon) {
      toast.error('Nama, URL, dan Ikon wajib diisi');
      return;
    }

    setIsSaving(true);
    try {
      const url = selected ? `/api/admin/social-media/${selected.id}` : '/api/admin/social-media';
      const res = await apiFetch(url, {
        method: selected ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(`Social media berhasil ${selected ? 'diperbarui' : 'ditambahkan'}`);
        setIsModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Gagal menyimpan');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      const res = await apiFetch(`/api/admin/social-media/${selected.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Social media berhasil dihapus');
        setIsDeleteOpen(false);
        fetchData();
      } else {
        toast.error('Gagal menghapus');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  const toggleActive = async (s: SocialMedia) => {
    try {
      const res = await apiFetch(`/api/admin/social-media/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !s.isActive }),
      });
      if (res.ok) {
        toast.success(`Social media ${!s.isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
        fetchData();
      }
    } catch {
      toast.error('Gagal mengubah status');
    }
  };

  const renderIcon = (iconName: string) => {
    const Icon = SOCIAL_ICON_MAP[iconName] || ExternalLink;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6 min-w-0 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Share2 className="w-6 h-6 text-blue-600" />
            Kelola Social Media
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Atur link social media yang tampil di landing page</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all"
        >
          <Plus className="w-5 h-5" />
          Tambah Social Media
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden min-w-0 w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">URL</th>
                <th className="px-6 py-4">Ikon</th>
                <th className="px-6 py-4">Urutan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse border-b dark:border-slate-700">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-6" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48" /></td>
                    <td className="px-6 py-4"><div className="h-5 w-5 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-8" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-16" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24 mx-auto" /></td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <Share2 className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="text-lg font-medium">Belum ada social media</p>
                    <p className="text-sm mt-1">Klik "Tambah Social Media" untuk memulai</p>
                  </td>
                </tr>
              ) : (
                data.map((s, idx) => (
                  <tr key={s.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{idx + 1}</td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{s.name}</td>
                    <td className="px-6 py-4">
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate block max-w-[240px]">
                        {s.url}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        {renderIcon(s.icon)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{s.sortOrder}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleActive(s)} className="group" title={s.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
                        {s.isActive ? (
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
                        <button onClick={() => openEdit(s)} className="p-1.5 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => openDelete(s)} className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Hapus">
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
                  {selected ? 'Edit Social Media' : 'Tambah Social Media Baru'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nama Platform *</label>
                  <input required name="name" defaultValue={selected?.name} placeholder="Misal: Instagram, Facebook, YouTube..." className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">URL Link *</label>
                  <input required name="url" type="url" defaultValue={selected?.url} placeholder="https://instagram.com/sekolah" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ikon *</label>
                    <select required name="icon" defaultValue={selected?.icon || ''} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white">
                      <option value="" disabled>Pilih Ikon</option>
                      {SOCIAL_ICON_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Urutan Tampil</label>
                    <input type="number" name="sortOrder" defaultValue={selected?.sortOrder || 0} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status Aktif</label>
                  <select name="isActive" defaultValue={selected ? String(selected.isActive) : 'true'} className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-sm dark:text-white">
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">Batal</button>
                  <button type="submit" disabled={isSaving} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                  </button>
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
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Hapus Social Media?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Apakah Anda yakin ingin menghapus <strong>{selected.name}</strong>? Tindakan ini tidak dapat dibatalkan.
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
