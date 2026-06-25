import React, { useState, useEffect } from 'react';
import { motion } from '@/utils/motion-lite';
import { History, Activity } from 'lucide-react';

interface Log {
  id: number;
  action: string;
  description: string;
  createdAt: string;
  performedBy: string;
}

export default function LogAktivitas() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await (function(url, opts) {
  const token = sessionStorage.getItem('admin_token');
  opts = opts || {};
  opts.headers = {
    ...opts.headers,
    Authorization: 'Bearer ' + token
  };
  return fetch(url, opts);
})('/api/admin/logs');
        if (res.ok) {
          setLogs(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 min-w-0 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            Log Aktivitas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Riwayat semua aktivitas di panel admin</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-700 min-w-0 w-full">
        {isLoading ? (
          <div className="space-y-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-12 text-right"><div className="h-3 w-10 bg-slate-200 dark:bg-slate-700 rounded ml-auto" /></div>
                <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700 mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">
            <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-medium">Belum ada aktivitas yang tercatat</p>
          </div>
        ) : (
          <div className="relative border-l border-slate-200 dark:border-slate-700 ml-4 sm:ml-24">
            {logs.map((log, i) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="mb-8 relative"
              >
                {/* Date Label (Desktop) */}
                <div className="hidden sm:block absolute -left-28 top-0.5 w-20 text-right">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(new Date(log.createdAt))}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(log.createdAt))}
                  </p>
                </div>

                {/* Timeline Dot */}
                <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-slate-800
                  ${log.action.includes('CREATE') || log.action.includes('SEED') ? 'bg-emerald-500' :
                    log.action.includes('DELETE') ? 'bg-red-500' : 'bg-blue-500'}`} 
                />

                <div className="pl-6 sm:pl-8">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded border w-fit
                        ${log.action.includes('CREATE') || log.action.includes('SEED') ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 
                          log.action.includes('DELETE') ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 
                          'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'}`}>
                        {log.action}
                      </span>
                      
                      {/* Date Label (Mobile) */}
                      <span className="sm:hidden text-xs text-slate-500 dark:text-slate-400">
                        {new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(log.createdAt))}
                      </span>
                    </div>
                    
                    <p className="text-slate-800 dark:text-slate-200 text-sm font-medium">{log.description}</p>
                    
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-slate-300">
                        {log.performedBy.charAt(0).toUpperCase()}
                      </div>
                      <span>Dilakukan oleh <span className="font-semibold text-slate-700 dark:text-slate-300">{log.performedBy}</span></span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
