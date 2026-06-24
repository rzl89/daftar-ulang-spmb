import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/utils/motion-lite';
import { FileText, Search, Save, RefreshCw, Edit2, Check, X, Database, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui';
import { invalidatePageContentCache } from '@/hooks/usePageContent';

interface ContentItem {
  id: number;
  page: string;
  section: string;
  label: string | null;
  value: string;
  updatedAt: string;
}

const PAGE_TABS = [
  { key: 'beranda', label: '🏠 Beranda' },
  { key: 'verifikasi', label: '✅ Verifikasi' },
  { key: 'daftar-ulang', label: '📝 Daftar Ulang' },
  { key: 'bukti', label: '🧾 Bukti' },
];

function ContentRow({
  item,
  onSave,
}: {
  item: ContentItem;
  onSave: (id: number, value: string, label: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.value);
  const [editLabel, setEditLabel] = useState(item.label || '');
  const [isSaving, setIsSaving] = useState(false);
  const isLong = item.value.length > 80;

  const handleSave = async () => {
    if (!editValue.trim()) {
      toast.error('Nilai tidak boleh kosong');
      return;
    }
    setIsSaving(true);
    await onSave(item.id, editValue, editLabel);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(item.value);
    setEditLabel(item.label || '');
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editLabel}
              onChange={e => setEditLabel(e.target.value)}
              placeholder="Label / nama bagian"
              className="w-full text-sm font-semibold px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg outline-none dark:text-white mb-1"
            />
          ) : (
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
              {item.label || item.section}
            </p>
          )}
          <span className="inline-block text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md">
            {item.section}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                title="Simpan"
              >
                {isSaving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={handleCancel}
                className="p-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                title="Batal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        isLong ? (
          <textarea
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-white resize-none"
          />
        ) : (
          <input
            type="text"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-white"
          />
        )
      ) : (
        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {item.value}
        </p>
      )}
    </div>
  );
}

export default function KelolaKonten() {
  const [allContents, setAllContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('beranda');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchContents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/page-contents');
      if (!res.ok) throw new Error('Gagal memuat');
      const data = await res.json();
      setAllContents(data);
    } catch {
      toast.error('Gagal memuat konten halaman');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  const handleSave = async (id: number, value: string, label: string) => {
    try {
      const res = await fetch(`/api/admin/page-contents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, label }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setAllContents(prev => prev.map(c => (c.id === id ? { ...c, value: updated.value, label: updated.label, updatedAt: updated.updatedAt } : c)));
      // Invalidate cache halaman publik yang terpengaruh
      invalidatePageContentCache(updated.page);
      toast.success('Konten berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan konten');
      throw new Error('save failed');
    }
  };

  const handleSeedDefault = async () => {
    if (!confirm('Tambahkan konten default untuk semua halaman? Konten yang sudah ada tidak akan ditimpa.')) return;
    setIsSeeding(true);
    try {
      const res = await fetch('/api/admin/page-contents/seed', { method: 'POST' });
      const data = await res.json();
      toast.success(data.message || 'Seed berhasil');
      fetchContents();
    } catch {
      toast.error('Gagal seed konten default');
    } finally {
      setIsSeeding(false);
    }
  };

  const filteredContents = allContents.filter(c => {
    const matchPage = c.page === activeTab;
    const matchSearch = !searchQuery ||
      c.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.value.toLowerCase().includes(searchQuery.toLowerCase());
    return matchPage && matchSearch;
  });

  const tabCounts = PAGE_TABS.reduce((acc, tab) => {
    acc[tab.key] = allContents.filter(c => c.page === tab.key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Kelola Konten Halaman
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Ubah teks dan konten yang tampil di setiap halaman publik
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSeedDefault}
            disabled={isSeeding}
            className="flex items-center gap-2"
          >
            {isSeeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Seed Default
          </Button>
          <Button onClick={fetchContents} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      {allContents.length === 0 && !isLoading && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Belum ada konten tersimpan</p>
            <p className="text-amber-700 dark:text-amber-400 text-sm mt-0.5">
              Klik <strong>Seed Default</strong> untuk mengisi konten awal dari semua halaman, kemudian edit sesuai kebutuhan.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-0">
        {PAGE_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 rounded-t-xl text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
            {tabCounts[tab.key] > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}>
                {tabCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Cari konten, label, atau section..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-white text-sm"
        />
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredContents.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
            {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada konten untuk halaman ini'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {searchQuery ? 'Coba kata kunci lain' : 'Klik "Seed Default" untuk menambahkan konten awal.'}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            {filteredContents.map(item => (
              <ContentRow key={item.id} item={item} onSave={handleSave} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Footer info */}
      {filteredContents.length > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          {filteredContents.length} item konten pada halaman <strong>{activeTab}</strong>.
          Klik ikon ✏️ pada item untuk mengedit, lalu ✅ untuk menyimpan.
        </p>
      )}
    </div>
  );
}
