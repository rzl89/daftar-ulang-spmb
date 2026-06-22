import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Download, Printer, TrendingUp, Users, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Stats {
  totalPendaftar: number;
  sudahDaftarUlang: number;
  belumDaftarUlang: number;
  ditolak: number;
}

interface Registration {
  id: number;
  pilihanJurusan1: string;
  status: string;
  jenisKelamin: string;
}

export default function Laporan() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, regRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/registrations')
        ]);
        
        if (statsRes.ok) setStats(await statsRes.json());
        if (regRes.ok) setRegistrations(await regRes.json());
      } catch (error) {
        toast.error('Gagal memuat data laporan');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExport = () => {
    if (registrations.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }
    
    // Simple CSV export
    const headers = ['ID', 'NISN', 'Nama Lengkap', 'Asal Sekolah', 'Jurusan 1', 'Jurusan 2', 'Status'];
    const csvContent = [
      headers.join(','),
      ...registrations.map(r => [
        r.id, 
        (r as any).nisn || '', 
        `"${(r as any).namaLengkap || ''}"`, 
        `"${(r as any).asalSekolah || ''}"`, 
        `"${r.pilihanJurusan1 || ''}"`, 
        `"${(r as any).pilihanJurusan2 || ''}"`, 
        r.status
      ].join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan_pendaftar_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data berhasil diekspor ke CSV');
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate distributions
  const jurusanDist = registrations.reduce((acc, curr) => {
    acc[curr.pilihanJurusan1] = (acc[curr.pilihanJurusan1] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const jkDist = registrations.reduce((acc, curr) => {
    const jk = curr.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan';
    acc[jk] = (acc[jk] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusDist = registrations.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxJurusanCount = Math.max(...Object.values(jurusanDist), 1);
  const maxStatusCount = Math.max(...Object.values(statusDist), 1);
  const totalJk = Object.values(jkDist).reduce((a, b) => a + b, 0) || 1;

  const statCards = [
    { title: 'Total Pendaftar', value: stats?.totalPendaftar || 0, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { title: 'Diterima', value: stats?.sudahDaftarUlang || 0, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { title: 'Ditolak', value: stats?.ditolak || 0, icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
    { title: 'Rata-rata Harian', value: Math.round((stats?.totalPendaftar || 0) / 7), icon: TrendingUp, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
  ];

  return (
    <div className="space-y-6 min-w-0 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Laporan & Statistik
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Ringkasan data penerimaan peserta didik baru</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-colors whitespace-nowrap"
          >
            <Printer className="w-4 h-4" /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 min-w-0"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{card.title}</p>
            {isLoading ? (
              <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-lg" />
            ) : (
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{card.value}</h3>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribusi Jurusan */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 min-w-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Distribusi per Jurusan</h2>
          <div className="space-y-5">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2 animate-pulse">
                  <div className="flex justify-between"><div className="w-20 h-4 bg-slate-200 dark:bg-slate-700 rounded"/><div className="w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded"/></div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-700/50 rounded-full"><div className="h-full bg-slate-200 dark:bg-slate-600 rounded-full" style={{width: `${Math.random()*100}%`}}/></div>
                </div>
              ))
            ) : Object.keys(jurusanDist).length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400 py-4">Belum ada data</p>
            ) : (
              Object.entries(jurusanDist).sort((a,b) => b[1] - a[1]).map(([jurusan, count]) => (
                <div key={jurusan} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{jurusan}</span>
                    <span className="text-slate-500 font-semibold">{count} org</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${(count / maxJurusanCount) * 100}%` }} 
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-blue-500 rounded-full" 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <div className="space-y-6 min-w-0">
          {/* Distribusi Status */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 min-w-0">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Status Pendaftaran</h2>
            <div className="space-y-5">
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-slate-100 dark:bg-slate-700/50 rounded-lg" />)}
                </div>
              ) : (
                [
                  { status: 'DITERIMA', label: 'Diterima', color: 'bg-emerald-500', count: statusDist['DITERIMA'] || 0 },
                  { status: 'MENUNGGU_VERIFIKASI', label: 'Menunggu', color: 'bg-amber-500', count: statusDist['MENUNGGU_VERIFIKASI'] || 0 },
                  { status: 'DITOLAK', label: 'Ditolak', color: 'bg-red-500', count: statusDist['DITOLAK'] || 0 },
                ].map(item => (
                  <div key={item.status} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium text-slate-600 dark:text-slate-300">{item.label}</div>
                    <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${(item.count / maxStatusCount) * 100}%` }} 
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full ${item.color} rounded-full`} 
                      />
                    </div>
                    <div className="w-12 text-right text-sm font-bold text-slate-700 dark:text-slate-200">{item.count}</div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Distribusi Jenis Kelamin */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 min-w-0">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Demografi Gender</h2>
            {isLoading ? (
              <div className="h-12 bg-slate-100 dark:bg-slate-700/50 animate-pulse rounded-xl" />
            ) : Object.keys(jkDist).length === 0 ? (
              <p className="text-center text-slate-500 py-2">Belum ada data</p>
            ) : (
              <div className="space-y-4">
                <div className="flex h-6 rounded-full overflow-hidden shadow-sm">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${((jkDist['Laki-laki'] || 0) / totalJk) * 100}%` }} className="bg-blue-500 h-full" />
                  <motion.div initial={{ width: 0 }} animate={{ width: `${((jkDist['Perempuan'] || 0) / totalJk) * 100}%` }} className="bg-pink-500 h-full" />
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-slate-600 dark:text-slate-300">Laki-laki ({(jkDist['Laki-laki'] || 0)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-500" />
                    <span className="text-slate-600 dark:text-slate-300">Perempuan ({(jkDist['Perempuan'] || 0)})</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
