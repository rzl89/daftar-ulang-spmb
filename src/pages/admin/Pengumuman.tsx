import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/utils/motion-lite';
import { Megaphone, Plus, Edit, Trash2, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Announcement {
  id: number;
  title: string;
  content: string;
  category: string;
  isPublished: boolean;
  createdAt: string;
}

export default function Pengumuman() {
  const [data, setData] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/announcements');
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      toast.error('Gagal memuat pengumuman');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setSelectedAnnouncement(null);
    setIsModalOpen(true);
  };

  const openEdit = (item: Announcement) => {
    setSelectedAnnouncement(item);
    setIsModalOpen(true);
  };

  const openDelete = (item: Announcement) => {
    setSelectedAnnouncement(item);
    setIsDeleteOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const payload = {
      title: formData.get('title'),
      category: formData.get('category'),
      content: formData.get('content'),
      isPublished: formData.get('isPublished') === 'on'
    };

    try {
      const url = selectedAnnouncement 
        ? `/api/admin/announcements/${selectedAnnouncement.id}` 
        : '/api/admin/announcements';
        
      const res = await fetch(url, {
        method: selectedAnnouncement ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(`Pengumuman berhasil ${selectedAnnouncement ? 'diperbarui' : 'dibuat'}`);
        setIsModalOpen(false);
        fetchData();
      } else {
        toast.error('Gagal menyimpan pengumuman');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  const handleDelete = async () => {
    if (!selectedAnnouncement) return;
    try {
      const res = await fetch(`/api/admin/announcements/${selectedAnnouncement.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Pengumuman berhasil dihapus');
        setIsDeleteOpen(false);
        fetchData();
      } else {
        toast.error('Gagal menghapus pengumuman');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  return (
    <div className="space-y-6 min-w-0 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-600" />
            Pengumuman
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Kelola informasi dan pengumuman untuk peserta</p>
        </div>
        <button 
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all"
        >
          <Plus className="w-5 h-5" />
          Buat Pengumuman
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 animate-pulse min-w-0">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4" />
              <div className="space-y-2 mb-6">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                  <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                </div>
              </div>
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 min-w-0">
            <Megaphone className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-medium">Belum ada pengumuman</p>
            <p className="text-sm mt-1">Klik tombol "Buat Pengumuman" untuk mulai</p>
          </div>
        ) : (
          data.map((item) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={item.id} 
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col min-w-0"
            >
              <div className="flex items-start justify-between mb-3 gap-4">
                <h3 className="font-bold text-slate-800 dark:text-white line-clamp-2 leading-tight">{item.title}</h3>
                <span className={`shrink-0 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full border
                  ${item.category === 'Pendaftaran' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' : 
                    item.category === 'Jadwal' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' : 
                    'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}>
                  {item.category}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-6 flex-1">
                {item.content}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700 mt-auto">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium
                  ${item.isPublished ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${item.isPublished ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {item.isPublished ? 'Dipublikasikan' : 'Draft'}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => openDelete(item)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {selectedAnnouncement ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Judul Pengumuman</label>
                  <input required name="title" defaultValue={selectedAnnouncement?.title} placeholder="Contoh: Jadwal Tes Wawancara" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Kategori</label>
                  <select name="category" defaultValue={selectedAnnouncement?.category || 'Umum'} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white">
                    <option value="Umum">Umum</option>
                    <option value="Pendaftaran">Pendaftaran</option>
                    <option value="Jadwal">Jadwal</option>
                    <option value="Pengumuman Hasil">Pengumuman Hasil</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Konten / Isi Pengumuman</label>
                  <textarea required name="content" defaultValue={selectedAnnouncement?.content} rows={5} placeholder="Tulis isi pengumuman di sini..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white resize-none" />
                </div>
                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <input type="checkbox" name="isPublished" defaultChecked={selectedAnnouncement ? selectedAnnouncement.isPublished : true} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white text-sm">Langsung Publikasikan</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Pengumuman akan langsung terlihat oleh pendaftar</p>
                    </div>
                  </label>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">Batal</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20">Simpan</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isDeleteOpen && selectedAnnouncement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDeleteOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Hapus Pengumuman?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Apakah Anda yakin ingin menghapus pengumuman <strong>{selectedAnnouncement.title}</strong>? Tindakan ini tidak dapat dibatalkan.
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
