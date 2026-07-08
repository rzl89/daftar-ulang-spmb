import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '@/utils/api';
import { motion } from '@/utils/motion-lite';
import {
  Search, Download, Users, UserCheck, UserX, TrendingUp,
  GraduationCap, Clock, CheckCircle2, XCircle, AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';

interface RekapItem {
  nisn: string;
  namaLengkap: string;
  tanggalLahir: string;
  asalSekolah: string;
  jurusanDiterima: string;
  sudahDaftarUlang: boolean;
  registrationId: string | null;
  statusDaftarUlang: string | null;
  pilihanJurusan1: string | null;
  tanggalDaftar: string | null;
}

interface RekapStats {
  totalLulus: number;
  sudahDaftarUlang: number;
  belumDaftarUlang: number;
  diterima: number;
  menunggu: number;
  ditolak: number;
  revisi: number;
  persentaseDaftarUlang: number;
}

type FilterStatus = 'SEMUA' | 'SUDAH' | 'BELUM' | 'DITERIMA' | 'MENUNGGU' | 'DITOLAK' | 'REVISI';

export default function RekapDaftarUlang() {
  const [data, setData] = useState<RekapItem[]>([]);
  const [stats, setStats] = useState<RekapStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('SEMUA');
  const [sekolahFilter, setSekolahFilter] = useState('');
  const [jurusanFilter, setJurusanFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/admin/rekap-daftar-ulang');
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
        setStats(json.stats);
      } else {
        toast.error('Gagal memuat data rekap');
      }
    } catch (e) {
      toast.error('Gagal memuat data rekap');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Derive filter options from data
  const { sekolahOptions, jurusanOptions } = useMemo(() => {
    const sekolahSet = new Set<string>();
    const jurusanSet = new Set<string>();
    for (const item of data) {
      if (item.asalSekolah && item.asalSekolah !== '-') sekolahSet.add(item.asalSekolah);
      if (item.jurusanDiterima && item.jurusanDiterima !== '-') jurusanSet.add(item.jurusanDiterima);
    }
    return {
      sekolahOptions: Array.from(sekolahSet).sort(),
      jurusanOptions: Array.from(jurusanSet).sort(),
    };
  }, [data]);

  // Filter data
  const filteredData = useMemo(() => {
    let result = data;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.namaLengkap.toLowerCase().includes(lower) ||
        r.nisn.toLowerCase().includes(lower) ||
        (r.registrationId && r.registrationId.toLowerCase().includes(lower))
      );
    }

    switch (statusFilter) {
      case 'SUDAH':
        result = result.filter(r => r.sudahDaftarUlang);
        break;
      case 'BELUM':
        result = result.filter(r => !r.sudahDaftarUlang);
        break;
      case 'DITERIMA':
        result = result.filter(r => r.statusDaftarUlang === 'DITERIMA');
        break;
      case 'MENUNGGU':
        result = result.filter(r => r.statusDaftarUlang === 'MENUNGGU_VERIFIKASI');
        break;
      case 'DITOLAK':
        result = result.filter(r => r.statusDaftarUlang === 'DITOLAK');
        break;
      case 'REVISI':
        result = result.filter(r => r.statusDaftarUlang === 'REVISI');
        break;
    }

    if (sekolahFilter) {
      result = result.filter(r => r.asalSekolah === sekolahFilter);
    }

    if (jurusanFilter) {
      result = result.filter(r => r.jurusanDiterima === jurusanFilter);
    }

    return result;
  }, [data, searchTerm, statusFilter, sekolahFilter, jurusanFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sekolahFilter, jurusanFilter]);

  // CSV Export
  const handleExport = () => {
    if (filteredData.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }
    const headers = ['NISN', 'Nama Lengkap', 'Tanggal Lahir', 'Asal Sekolah', 'Jurusan Diterima', 'Status Daftar Ulang', 'ID Registrasi', 'Jurusan Daftar', 'Tanggal Daftar'];
    const rows = filteredData.map(r => [
      r.nisn,
      `"${r.namaLengkap}"`,
      r.tanggalLahir,
      `"${r.asalSekolah}"`,
      `"${r.jurusanDiterima}"`,
      r.sudahDaftarUlang ? (r.statusDaftarUlang === 'DITERIMA' ? 'Diterima' : r.statusDaftarUlang === 'MENUNGGU_VERIFIKASI' ? 'Menunggu Verifikasi' : r.statusDaftarUlang === 'DITOLAK' ? 'Ditolak' : 'Revisi') : 'Belum Daftar Ulang',
      r.registrationId || '-',
      `"${r.pilihanJurusan1 || '-'}"`,
      r.tanggalDaftar ? new Date(r.tanggalDaftar).toLocaleDateString('id-ID') : '-',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rekap_daftar_ulang_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data berhasil diekspor ke CSV');
  };

  const statCards = [
    { title: 'Total Lulus', value: stats?.totalLulus || 0, icon: GraduationCap, color: 'from-slate-600 to-slate-700', shadow: 'shadow-slate-500/20', darkColor: 'dark:from-slate-500 dark:to-slate-600' },
    { title: 'Sudah Daftar Ulang', value: stats?.sudahDaftarUlang || 0, icon: UserCheck, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20', darkColor: 'dark:from-emerald-600 dark:to-emerald-700' },
    { title: 'Belum Daftar Ulang', value: stats?.belumDaftarUlang || 0, icon: UserX, color: 'from-red-500 to-red-600', shadow: 'shadow-red-500/20', darkColor: 'dark:from-red-600 dark:to-red-700' },
    { title: 'Persentase', value: `${stats?.persentaseDaftarUlang || 0}%`, icon: TrendingUp, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20', darkColor: 'dark:from-blue-600 dark:to-blue-700' },
  ];

  const statusDetailCards = stats ? [
    { label: 'Diterima', value: stats.diterima, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Menunggu Verifikasi', value: stats.menunggu, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { label: 'Ditolak', value: stats.ditolak, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-500/10' },
    { label: 'Revisi', value: stats.revisi, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  ] : [];

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            Rekap Daftar Ulang
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Perbandingan data kelulusan dengan status daftar ulang siswa
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors whitespace-nowrap"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.color} ${card.darkColor} p-5 text-white shadow-lg ${card.shadow} min-w-0`}
          >
            <div className="absolute -right-4 -top-4 opacity-20">
              <card.icon className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <p className="text-white/80 text-xs font-medium mb-1 truncate">{card.title}</p>
              {isLoading ? (
                <div className="h-8 w-16 bg-white/20 animate-pulse rounded-lg" />
              ) : (
                <h3 className="text-3xl font-bold">{card.value}</h3>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Status Breakdown */}
      {!isLoading && stats && stats.sudahDaftarUlang > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statusDetailCards.map((card) => (
            <div key={card.label} className={`flex items-center gap-3 p-3 rounded-xl ${card.bg} border border-transparent`}>
              <card.icon className={`w-5 h-5 ${card.color} shrink-0`} />
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{card.label}</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-3 min-w-0 w-full">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, NISN, atau ID registrasi..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as FilterStatus)}
              className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white flex-1 sm:w-[180px]"
            >
              <option value="SEMUA">Semua Status</option>
              <option value="SUDAH">✓ Sudah Daftar Ulang</option>
              <option value="BELUM">✗ Belum Daftar Ulang</option>
              <option value="DITERIMA">✓ Diterima</option>
              <option value="MENUNGGU">⏳ Menunggu Verifikasi</option>
              <option value="DITOLAK">✗ Ditolak</option>
              <option value="REVISI">↺ Revisi</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={sekolahFilter}
            onChange={e => setSekolahFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white text-sm flex-1 sm:w-[220px] sm:flex-none"
          >
            <option value="">Semua Sekolah Asal</option>
            {sekolahOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={jurusanFilter}
            onChange={e => setJurusanFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white text-sm flex-1 sm:w-[200px] sm:flex-none"
          >
            <option value="">Semua Jurusan Diterima</option>
            {jurusanOptions.map(j => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
          <div className="flex items-center ml-auto text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {filteredData.length} dari {data.length} siswa
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden min-w-0 w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-3">NISN</th>
                <th className="px-4 py-3">Nama Lengkap</th>
                <th className="px-4 py-3 hidden md:table-cell">Asal Sekolah</th>
                <th className="px-4 py-3 hidden lg:table-cell">Jur. Diterima</th>
                <th className="px-4 py-3">Status Daftar Ulang</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse border-b dark:border-slate-700">
                    <td className="px-4 py-3"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-6 w-28 bg-slate-200 dark:bg-slate-700 rounded-full" /></td>
                  </tr>
                ))
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p>Tidak ada data yang sesuai dengan filter</p>
                  </td>
                </tr>
              ) : (
                currentData.map((item) => (
                  <tr key={item.nisn} className={`border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors ${!item.sudahDaftarUlang ? 'bg-red-50/30 dark:bg-red-500/5' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm text-slate-600 dark:text-slate-400">{item.nisn}</div>
                      {item.registrationId && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">{item.registrationId}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{item.namaLengkap}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 md:hidden">{item.asalSekolah}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-600 dark:text-slate-400">{item.asalSekolah}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-600 dark:text-slate-400">{item.jurusanDiterima}</td>
                    <td className="px-4 py-3">
                      {!item.sudahDaftarUlang ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                          <XCircle className="w-3 h-3" />
                          Belum Daftar Ulang
                        </span>
                      ) : item.statusDaftarUlang === 'DITERIMA' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Diterima
                        </span>
                      ) : item.statusDaftarUlang === 'DITOLAK' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                          <XCircle className="w-3 h-3" />
                          Ditolak
                        </span>
                      ) : item.statusDaftarUlang === 'REVISI' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          Revisi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          Menunggu
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
