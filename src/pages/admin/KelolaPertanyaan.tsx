import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/utils/api';
import { motion } from '@/utils/motion-lite';
import {
  HelpCircle, Plus, GripVertical, Trash2, Edit, Save, X, RefreshCw,
  Database, ToggleLeft, ToggleRight, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui';

interface FormQuestion {
  id: number;
  section: string;
  fieldName: string;
  label: string;
  fieldType: string;
  placeholder: string | null;
  options: string[] | null;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

const SECTIONS = [
  { key: 'dataPribadi', label: 'Data Pribadi', color: 'blue' },
  { key: 'dataOrangTua', label: 'Data Orang Tua', color: 'purple' },
  { key: 'akademik', label: 'Akademik & Jurusan', color: 'green' },
  { key: 'dokumen', label: 'Dokumen', color: 'orange' },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Teks Pendek' },
  { value: 'textarea', label: 'Teks Panjang' },
  { value: 'date', label: 'Tanggal' },
  { value: 'select', label: 'Pilihan Dropdown' },
  { value: 'radio', label: 'Pilihan Radio' },
  { value: 'number', label: 'Angka' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'No. Telepon' },
  { value: 'file', label: 'Upload Berkas / File' },
];

const SECTION_COLORS: Record<string, string> = {
  dataPribadi: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  dataOrangTua: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  akademik: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  dokumen: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const TYPE_COLORS: Record<string, string> = {
  text: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  textarea: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  date: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  select: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  radio: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  number: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  email: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  tel: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  file: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

// ─── Sortable Row ───────────────────────────────────────────────────────────
function SortableQuestionRow({
  item, onEdit, onDelete, onToggleActive,
}: {
  item: FormQuestion;
  onEdit: (item: FormQuestion) => void;
  onDelete: (id: number) => void;
  onToggleActive: (item: FormQuestion) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.7 : 1, zIndex: isDragging ? 10 : 1 };

  const sectionInfo = SECTIONS.find(s => s.key === item.section);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-slate-800 rounded-xl p-4 mb-2.5 border ${
        isDragging ? 'border-blue-500 shadow-xl shadow-blue-500/20' : 'border-slate-200 dark:border-slate-700 shadow-sm'
      } flex items-center gap-3`}
    >
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab hover:text-blue-500 text-slate-300 dark:text-slate-600 p-1 shrink-0">
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-1.5 mb-1">
          <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${SECTION_COLORS[item.section] || 'bg-slate-100 text-slate-600'}`}>
            {sectionInfo?.label || item.section}
          </span>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${TYPE_COLORS[item.fieldType] || 'bg-slate-100 text-slate-600'}`}>
            {FIELD_TYPES.find(t => t.value === item.fieldType)?.label || item.fieldType}
          </span>
          {item.isRequired && (
            <span className="text-xs text-red-500 font-medium">* wajib</span>
          )}
        </div>
        <h4 className="font-semibold text-slate-800 dark:text-white text-sm truncate">{item.label}</h4>
        <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{item.fieldName}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onToggleActive(item)}
          title={item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          className={`p-1.5 rounded-lg transition-colors ${
            item.isActive
              ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          {item.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
        </button>
        <button onClick={() => onEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
          <Edit className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Default editing state ───────────────────────────────────────────────────
const emptyQuestion = (): Partial<FormQuestion> => ({
  section: 'dataPribadi',
  fieldName: '',
  label: '',
  fieldType: 'text',
  placeholder: '',
  options: null,
  isRequired: true,
  isActive: true,
  sortOrder: 0,
});

// ─── Main Component ──────────────────────────────────────────────────────────
export default function KelolaPertanyaan() {
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQ, setEditingQ] = useState<Partial<FormQuestion> | null>(null);
  const [filterSection, setFilterSection] = useState<string>('all');
  const [isSeeding, setIsSeeding] = useState(false);
  const [optionInput, setOptionInput] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/admin/form-questions');
      if (!res.ok) throw new Error();
      setQuestions(await res.json());
    } catch {
      toast.error('Gagal memuat pertanyaan');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const filtered = displayedQuestions;
    const oldIdx = filtered.findIndex(q => q.id === active.id);
    const newIdx = filtered.findIndex(q => q.id === over.id);
    const reordered = arrayMove(filtered, oldIdx, newIdx);

    // Rebuild full list to maintain global sortOrder integrity
    let reorderIndex = 0;
    const newQuestions = questions.map(q => {
      // If question was in the filtered list, replace it with the reordered sequence
      if (filtered.some(f => f.id === q.id)) {
        return reordered[reorderIndex++];
      }
      return q;
    });

    const updated = newQuestions.map((q, i) => ({ ...q, sortOrder: i }));
    setQuestions(updated);

    try {
      await apiFetch('/api/admin/form-questions/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updated.map((q) => ({ id: q.id, sortOrder: q.sortOrder })) }),
      });
      toast.success('Urutan berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan urutan');
      fetchQuestions();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQ?.fieldName || !editingQ?.label || !editingQ?.fieldType) {
      toast.error('Field Name, Label, dan Tipe wajib diisi');
      return;
    }

    const isNew = !editingQ.id;
    const url = isNew ? '/api/admin/form-questions' : `/api/admin/form-questions/${editingQ.id}`;
    const method = isNew ? 'POST' : 'PUT';
    const payload = {
      ...editingQ,
      sortOrder: isNew ? questions.length : editingQ.sortOrder,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message || 'Gagal menyimpan');
        return;
      }
      toast.success(`Pertanyaan berhasil ${isNew ? 'ditambahkan' : 'diperbarui'}`);
      setIsModalOpen(false);
      fetchQuestions();
    } catch {
      toast.error('Terjadi kesalahan');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus pertanyaan ini? Tindakan ini tidak bisa dibatalkan.')) return;
    try {
      const res = await apiFetch(`/api/admin/form-questions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setQuestions(prev => prev.filter(q => q.id !== id));
        toast.success('Pertanyaan dihapus');
      }
    } catch {
      toast.error('Gagal menghapus');
    }
  };

  const handleToggleActive = async (item: FormQuestion) => {
    try {
      const res = await apiFetch(`/api/admin/form-questions/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, isActive: !item.isActive }),
      });
      if (res.ok) {
        setQuestions(prev => prev.map(q => q.id === item.id ? { ...q, isActive: !q.isActive } : q));
        toast.success(item.isActive ? 'Pertanyaan dinonaktifkan' : 'Pertanyaan diaktifkan');
      }
    } catch {
      toast.error('Gagal mengubah status');
    }
  };

  const handleSeed = async () => {
    if (!confirm('Tambahkan pertanyaan default? Field yang sudah ada tidak akan ditimpa.')) return;
    setIsSeeding(true);
    try {
      const res = await apiFetch('/api/admin/form-questions/seed', { method: 'POST' });
      const data = await res.json();
      toast.success(`${data.seeded} pertanyaan baru ditambahkan`);
      fetchQuestions();
    } catch {
      toast.error('Gagal seed pertanyaan default');
    } finally {
      setIsSeeding(false);
    }
  };

  const openNew = () => {
    setEditingQ({
      ...emptyQuestion(),
      section: filterSection === 'all' ? 'dataPribadi' : filterSection
    });
    setOptionInput('');
    setIsModalOpen(true);
  };

  const openEdit = (q: FormQuestion) => {
    setEditingQ({ ...q });
    setOptionInput('');
    setIsModalOpen(true);
  };

  const addOption = () => {
    const val = optionInput.trim();
    if (!val) return;
    setEditingQ(prev => ({
      ...prev,
      options: [...(prev?.options || []), val],
    }));
    setOptionInput('');
  };

  const removeOption = (idx: number) => {
    setEditingQ(prev => ({
      ...prev,
      options: (prev?.options || []).filter((_, i) => i !== idx),
    }));
  };

  const displayedQuestions = questions.filter(q =>
    filterSection === 'all' || q.section === filterSection,
  );

  const sectionCounts = SECTIONS.reduce((acc, s) => {
    acc[s.key] = questions.filter(q => q.section === s.key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-indigo-600" />
            Kelola Pertanyaan Daftar Ulang
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Atur pertanyaan / field yang tampil pada formulir daftar ulang peserta
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSeed} disabled={isSeeding} className="flex items-center gap-2">
            {isSeeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Seed Default
          </Button>
          <Button onClick={openNew} className="flex items-center gap-2 shadow-lg shadow-indigo-500/20">
            <Plus className="w-4 h-4" /> Tambah Pertanyaan
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SECTIONS.map(s => (
          <div key={s.key} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{sectionCounts[s.key] || 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterSection('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterSection === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300'
          }`}
        >
          Semua ({questions.length})
        </button>
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setFilterSection(s.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterSection === s.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300'
            }`}
          >
            {s.label} ({sectionCounts[s.key] || 0})
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayedQuestions.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Belum ada pertanyaan</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Klik "Seed Default" untuk memuat pertanyaan awal, atau "Tambah Pertanyaan" untuk buat baru.
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={displayedQuestions.map(q => q.id)} strategy={verticalListSortingStrategy}>
              {displayedQuestions.map(q => (
                <SortableQuestionRow
                  key={q.id}
                  item={q}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Modal Tambah / Edit */}
      {isModalOpen && editingQ && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingQ.id ? 'Edit Pertanyaan' : 'Tambah Pertanyaan Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Section */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Section / Kelompok</label>
                <div className="relative">
                  <select
                    value={editingQ.section}
                    onChange={e => setEditingQ(p => ({ ...p, section: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white appearance-none"
                  >
                    {SECTIONS.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Field Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Field Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingQ.fieldName || ''}
                  onChange={e => setEditingQ(p => ({ ...p, fieldName: e.target.value.replace(/\s/g, '') }))}
                  placeholder="contoh: namaLengkap (tanpa spasi)"
                  disabled={!!editingQ.id}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white font-mono text-sm disabled:opacity-60"
                />
                <p className="text-xs text-slate-400">Identifier unik, tidak bisa diubah setelah disimpan.</p>
              </div>

              {/* Label */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Label / Pertanyaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingQ.label || ''}
                  onChange={e => setEditingQ(p => ({ ...p, label: e.target.value }))}
                  placeholder="Teks yang tampil di form"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
                />
              </div>

              {/* Field Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tipe Field <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={editingQ.fieldType || 'text'}
                    onChange={e => setEditingQ(p => ({ ...p, fieldType: e.target.value, options: null }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white appearance-none"
                  >
                    {FIELD_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Placeholder */}
              {!['radio', 'select'].includes(editingQ.fieldType || '') && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Placeholder</label>
                  <input
                    type="text"
                    value={editingQ.placeholder || ''}
                    onChange={e => setEditingQ(p => ({ ...p, placeholder: e.target.value }))}
                    placeholder="Teks hint dalam kotak input"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
                  />
                </div>
              )}

              {/* Options (for select / radio) */}
              {['select', 'radio'].includes(editingQ.fieldType || '') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Opsi Pilihan
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={optionInput}
                      onChange={e => setOptionInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
                      placeholder="Ketik opsi lalu Enter"
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white text-sm"
                    />
                    <button type="button" onClick={addOption} className="px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {(editingQ.options || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(editingQ.options || []).map((opt, idx) => (
                        <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm">
                          {opt}
                          <button type="button" onClick={() => removeOption(idx)} className="text-indigo-400 hover:text-red-500 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingQ.isRequired ?? true}
                    onChange={e => setEditingQ(p => ({ ...p, isRequired: e.target.checked }))}
                    className="w-4 h-4 rounded accent-indigo-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Wajib Diisi</p>
                    <p className="text-xs text-slate-400">Tampilkan tanda *</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingQ.isActive ?? true}
                    onChange={e => setEditingQ(p => ({ ...p, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded accent-indigo-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Aktif</p>
                    <p className="text-xs text-slate-400">Tampil di form</p>
                  </div>
                </label>
              </div>

              {/* Footer */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" className="flex items-center gap-2 shadow-lg shadow-indigo-500/20">
                  <Save className="w-4 h-4" />
                  {editingQ.id ? 'Simpan Perubahan' : 'Tambah Pertanyaan'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
