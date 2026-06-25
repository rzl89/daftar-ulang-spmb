import React, { useEffect, useState } from 'react';
import { motion } from '@/utils/motion-lite';
import { Users, UserCheck, Clock, UserX, Activity } from 'lucide-react';
import { apiFetch } from '@/utils/api';

interface Stats {
  totalPendaftar: number;
  sudahDaftarUlang: number;
  belumDaftarUlang: number;
  ditolak: number;
}

interface Log {
  id: number;
  action: string;
  description: string;
  createdAt: string;
  performedBy: string;
}

interface Registration {
  id: number;
  registrationId: string;
  namaLengkap: string;
  pilihanJurusan1: string;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, logsRes, regRes] = await Promise.all([
          apiFetch('/api/admin/stats'),
          apiFetch('/api/admin/logs'),
          apiFetch('/api/admin/registrations'),
        ]);
        
        if (statsRes.ok) setStats(await statsRes.json());
        if (logsRes.ok) setLogs(await logsRes.json());
        if (regRes.ok) {
          const allRegs = await regRes.json();
          setRegistrations(allRegs.slice(0, 5)); // Just top 5
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { title: 'Total Pendaftar', value: stats?.totalPendaftar || 0, icon: Users, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
    { title: 'Sudah Daftar Ulang', value: stats?.sudahDaftarUlang || 0, icon: UserCheck, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
    { title: 'Menunggu Verifikasi', value: stats?.belumDaftarUlang || 0, icon: Clock, color: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/20' },
    { title: 'Ditolak', value: stats?.ditolak || 0, icon: UserX, color: 'from-red-500 to-red-600', shadow: 'shadow-red-500/20' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.color} p-6 text-white shadow-lg ${card.shadow} min-w-0`}
          >
            <div className="absolute -right-6 -top-6 opacity-20">
              <card.icon className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <p className="text-white/80 text-sm font-medium mb-1 truncate">{card.title}</p>
              {isLoading ? (
                <div className="h-10 w-24 bg-white/20 animate-pulse rounded-lg" />
              ) : (
                <h3 className="text-4xl font-bold">{card.value}</h3>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Registrations Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Pendaftar Terbaru</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">ID</th>
                  <th className="px-4 py-3">Nama Lengkap</th>
                  <th className="px-4 py-3">Jurusan</th>
                  <th className="px-4 py-3 rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                      <td className="px-4 py-4"><div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-full" /></td>
                    </tr>
                  ))
                ) : registrations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      Belum ada data pendaftar
                    </td>
                  </tr>
                ) : (
                  registrations.map((reg) => (
                    <tr key={reg.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">{reg.registrationId}</td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{reg.namaLengkap}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{reg.pilihanJurusan1}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                          ${reg.status === 'DITERIMA' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 
                            reg.status === 'DITOLAK' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 
                            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'}`}>
                          {reg.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Logs */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Aktivitas Terbaru
            </h2>
          </div>
          <div className="space-y-6">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700 mt-1" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                </div>
              ))
            ) : logs.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">Belum ada aktivitas</p>
            ) : (
              logs.slice(0, 6).map((log, i) => (
                <div key={log.id} className="relative pl-6">
                  {i !== logs.slice(0, 6).length - 1 && (
                    <div className="absolute left-1.5 top-3 w-px h-full bg-slate-200 dark:bg-slate-700" />
                  )}
                  <div className={`absolute left-0 top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800
                    ${log.action.includes('CREATE') || log.action.includes('SEED') ? 'bg-emerald-500' :
                      log.action.includes('DELETE') ? 'bg-red-500' : 'bg-blue-500'}`} 
                  />
                  <div>
                    <p className="text-sm text-slate-800 dark:text-slate-200">{log.description}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(log.createdAt))}
                      {' • '}{log.performedBy}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
