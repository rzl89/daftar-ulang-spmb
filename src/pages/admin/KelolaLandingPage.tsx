import React, { useState, useEffect } from 'react';
import { motion } from '@/utils/motion-lite';
import { LayoutDashboard, Plus, GripVertical, Trash2, Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui';

interface Block {
  id: number;
  type: string;
  content: any;
  sortOrder: number;
  isActive: boolean;
}

const defaultContent = {
  HERO: { title: 'Selamat Datang', description: 'Deskripsi hero', buttonText: 'Daftar Sekarang' },
  STEPS: { title: 'Alur Pendaftaran', description: 'Langkah-langkah' },
  MAP: { title: 'Lokasi Kami', description: 'Peta sekolah' },
  TEXT: { title: 'Judul Teks', html: 'Isi teks...' },
  IMAGE: { title: 'Gambar Promosi', imageUrl: 'https://via.placeholder.com/800x400' }
};

function SortableItem({ item, onEdit, onDelete, onToggleActive }: { item: Block, onEdit: (i: Block) => void, onDelete: (i: number) => void, onToggleActive: (i: Block) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`bg-white dark:bg-slate-800 rounded-xl p-4 mb-3 border ${isDragging ? 'border-blue-500 shadow-xl shadow-blue-500/20' : 'border-slate-200 dark:border-slate-700 shadow-sm'} flex items-center gap-4`}>
      <div {...attributes} {...listeners} className="cursor-grab hover:text-blue-500 text-slate-400 p-2">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            {item.type}
          </span>
          <h4 className="font-bold text-slate-800 dark:text-white truncate">
            {item.content?.title || 'Tanpa Judul'}
          </h4>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
          {item.type === 'TEXT' ? item.content?.html : item.content?.description || item.content?.imageUrl || 'Tidak ada konten tambahan'}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <label className="relative inline-flex items-center cursor-pointer mr-2">
          <input type="checkbox" className="sr-only peer" checked={item.isActive} onChange={() => onToggleActive(item)} />
          <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
        </label>
        
        <button onClick={() => onEdit(item)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
          <Edit className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function KelolaLandingPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Partial<Block> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/landing-blocks');
      const data = await res.json();
      setBlocks(data);
    } catch (e) {
      toast.error('Gagal memuat konfigurasi landing page');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      
      const newBlocks = arrayMove(blocks, oldIndex, newIndex).map((b, index) => ({
        ...b,
        sortOrder: index
      }));
      
      setBlocks(newBlocks);
      
      try {
        await fetch('/api/admin/landing-blocks/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: newBlocks.map(b => ({ id: b.id, sortOrder: b.sortOrder })) })
        });
        toast.success('Urutan berhasil disimpan');
      } catch (e) {
        toast.error('Gagal menyimpan urutan');
      }
    }
  };

  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlock?.type) return;

    try {
      const isNew = !editingBlock.id;
      const url = isNew ? '/api/admin/landing-blocks' : `/api/admin/landing-blocks/${editingBlock.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = {
        ...editingBlock,
        sortOrder: isNew ? blocks.length : editingBlock.sortOrder,
        content: editingBlock.content || {}
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(`Blok berhasil ${isNew ? 'ditambahkan' : 'diperbarui'}`);
        setIsModalOpen(false);
        fetchBlocks();
      } else {
        toast.error('Gagal menyimpan blok');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus blok ini?')) return;
    try {
      const res = await fetch(`/api/admin/landing-blocks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Blok dihapus');
        setBlocks(blocks.filter(b => b.id !== id));
      }
    } catch (e) {
      toast.error('Gagal menghapus');
    }
  };

  const handleToggleActive = async (block: Block) => {
    try {
      const res = await fetch(`/api/admin/landing-blocks/${block.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !block.isActive })
      });
      if (res.ok) {
        setBlocks(blocks.map(b => b.id === block.id ? { ...b, isActive: !b.isActive } : b));
      }
    } catch (e) {
      toast.error('Gagal mengubah status');
    }
  };

  const openNewBlockModal = () => {
    setEditingBlock({ type: 'HERO', content: { ...defaultContent.HERO }, isActive: true });
    setIsModalOpen(true);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    setEditingBlock(prev => ({
      ...prev,
      type,
      content: { ...(defaultContent[type as keyof typeof defaultContent] || {}) }
    }));
  };

  const handleContentChange = (key: string, value: string) => {
    setEditingBlock(prev => ({
      ...prev,
      content: { ...prev?.content, [key]: value }
    }));
  };

  return (
    <div className="space-y-6 min-w-0 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-600" />
            Kelola Landing Page
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Atur urutan dan konten halaman utama</p>
        </div>
        <Button onClick={openNewBlockModal} className="flex items-center gap-2 shadow-lg shadow-blue-500/20">
          <Plus className="w-4 h-4" /> Tambah Blok
        </Button>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
        {isLoading ? (
           <div className="flex justify-center p-12">
             <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : blocks.length === 0 ? (
          <div className="text-center py-12">
            <LayoutDashboard className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Belum ada blok konten</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Tambahkan blok pertama Anda untuk menyusun landing page.</p>
            <Button onClick={openNewBlockModal}>Tambah Blok Pertama</Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
              {blocks.map(block => (
                <SortableItem 
                  key={block.id} 
                  item={block} 
                  onEdit={(b) => { setEditingBlock(b); setIsModalOpen(true); }}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {isModalOpen && editingBlock && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingBlock.id ? 'Edit Blok' : 'Tambah Blok Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveBlock} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipe Blok</label>
                <select 
                  value={editingBlock.type} 
                  onChange={handleTypeChange}
                  disabled={!!editingBlock.id}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white"
                >
                  <option value="HERO">Hero Section (Atas)</option>
                  <option value="STEPS">Steps / Alur Pendaftaran</option>
                  <option value="MAP">Peta & Kontak</option>
                  <option value="TEXT">Teks Custom</option>
                  <option value="IMAGE">Gambar Tunggal</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Judul (Title)</label>
                <input 
                  type="text" 
                  value={editingBlock.content?.title || ''} 
                  onChange={(e) => handleContentChange('title', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
                />
              </div>

              {(editingBlock.type === 'HERO' || editingBlock.type === 'STEPS' || editingBlock.type === 'MAP') && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Deskripsi Pendek</label>
                  <textarea 
                    value={editingBlock.content?.description || ''} 
                    onChange={(e) => handleContentChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
                  />
                </div>
              )}

              {editingBlock.type === 'TEXT' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Isi Teks (HTML diizinkan)</label>
                  <textarea 
                    value={editingBlock.content?.html || ''} 
                    onChange={(e) => handleContentChange('html', e.target.value)}
                    rows={5}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
                  />
                </div>
              )}

              {editingBlock.type === 'IMAGE' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">URL Gambar</label>
                  <input 
                    type="text" 
                    value={editingBlock.content?.imageUrl || ''} 
                    onChange={(e) => handleContentChange('imageUrl', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
                  />
                </div>
              )}

              {editingBlock.type === 'HERO' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Teks Tombol</label>
                  <input 
                    type="text" 
                    value={editingBlock.content?.buttonText || ''} 
                    onChange={(e) => handleContentChange('buttonText', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
                  />
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" className="flex items-center gap-2 shadow-lg shadow-blue-500/20">
                  <Save className="w-4 h-4" /> Simpan
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
