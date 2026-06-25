import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/utils/api';
import { motion } from '@/utils/motion-lite';
import { FileCheck, CheckCircle2, XCircle, AlertTriangle, User, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Registration {
  id: number;
  registrationId: string;
  nisn: string;
  namaLengkap: string;
  status: string;
  dokumen: {
    ijazahUrl?: string;
    kartuKeluargaUrl?: string;
    aktaKelahiranUrl?: string;
    pasFotoUrl?: string;
  } | null;
}

export default function VerifikasiBerkas() {
  const [data, setData] = useState<Registration[]>([]);
  const [filteredData, setFilteredData] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('MENUNGGU_VERIFIKASI');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/admin/registrations');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      toast.error('Gagal memuat data verifikasi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'SEMUA') {
      setFilteredData(data);
    } else {
      setFilteredData(data.filter(r => r.status === activeTab));
    }
  }, [activeTab, data]);

  const handleVerifikasi = async (id: number, status: string, message: string) => {
    try {
      const res = await apiFetch(`/api/admin/registrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(message);
        fetchData();
      } else {
        toast.error('Gagal mengubah status');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  const tabs = [
    { id: 'MENUNGGU_VERIFIKASI', label: 'Menunggu' },
    { id: 'DITERIMA', label: 'Terverifikasi' },
    { id: 'DITOLAK', label: 'Ditolak' },
    { id: 'SEMUA', label: 'Semua' },
  ];

  return (
    <div className="space-y-6 min-w-0 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-blue-600" />
            Verifikasi Berkas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Pengecekan dan validasi dokumen pendaftar</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-200 dark:border-slate-700 w-full">
        <div className="flex gap-6 min-w-max px-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors relative
                ${activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTabVerify" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 animate-pulse min-w-0">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4" />
              <div className="space-y-3">
                {[...Array(4)].map((_, j) => <div key={j} className="h-8 bg-slate-100 dark:bg-slate-700/50 rounded" />)}
              </div>
            </div>
          ))
        ) : filteredData.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 min-w-0">
            <FileCheck className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p>Tidak ada berkas untuk ditampilkan</p>
          </div>
        ) : (
          filteredData.map((reg) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={reg.id} 
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col min-w-0"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white leading-tight">{reg.namaLengkap}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{reg.registrationId} • {reg.nisn}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Checklist Dokumen</h4>
                
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <span className="text-sm flex items-center gap-2 text-slate-700 dark:text-slate-300"><FileText className="w-4 h-4"/> Ijazah / SKHUN</span>
                  {reg.dokumen?.ijazahUrl ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <span className="text-sm flex items-center gap-2 text-slate-700 dark:text-slate-300"><FileText className="w-4 h-4"/> Kartu Keluarga</span>
                  {reg.dokumen?.kartuKeluargaUrl ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <span className="text-sm flex items-center gap-2 text-slate-700 dark:text-slate-300"><FileText className="w-4 h-4"/> Akta Kelahiran</span>
                  {reg.dokumen?.aktaKelahiranUrl ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <span className="text-sm flex items-center gap-2 text-slate-700 dark:text-slate-300"><FileText className="w-4 h-4"/> Pas Foto</span>
                  {reg.dokumen?.pasFotoUrl ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                {reg.status === 'MENUNGGU_VERIFIKASI' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleVerifikasi(reg.id, 'DITERIMA', 'Berkas berhasil diverifikasi')}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-xl font-medium text-sm transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Valid
                    </button>
                    <button 
                      onClick={() => handleVerifikasi(reg.id, 'DITOLAK', 'Berkas ditolak')}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl font-medium text-sm transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Tolak
                    </button>
                    <button 
                      onClick={() => toast.success('Pesan revisi dikirim ke siswa')}
                      className="col-span-2 flex items-center justify-center gap-1 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 rounded-xl font-medium text-sm transition-colors"
                    >
                      <AlertTriangle className="w-4 h-4" /> Minta Revisi
                    </button>
                  </div>
                ) : (
                  <div className={`text-center py-2 rounded-xl text-sm font-semibold border ${
                    reg.status === 'DITERIMA' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                      : 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                  }`}>
                    {reg.status === 'DITERIMA' ? 'TERVERIFIKASI' : 'DITOLAK'}
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
