import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Navbar, Footer } from "@/components/layout";
import { AlertBanner } from "@/components/ui";
import { useSettingsStore } from "@/store/useSettingsStore";

// Pages
import Beranda from "@/pages/Beranda";
import Verifikasi from "@/pages/Verifikasi";
import DaftarUlang from "@/pages/DaftarUlang";
import BuktiDaftarUlang from "@/pages/BuktiDaftarUlang";

// Admin Pages
import { 
  AdminLayout, 
  LoginAdmin, 
  Dashboard, 
  DataPeserta, 
  DataKelulusan,
  VerifikasiBerkas, 
  Pengumuman, 
  Laporan, 
  LogAktivitas, 
  Pengaturan,
  KelolaJurusan 
} from "@/pages/admin";
function AppLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  // Scroll to top on route change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Fetch global settings once
  const fetchSettings = useSettingsStore(s => s.fetchSettings);
  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Alert banner only on Beranda or specific pages */}
      {!isAdmin && location.pathname === "/" && <AlertBanner />}
      
      {!isAdmin && <Navbar />}
      
      <main className="flex-1 w-full bg-slate-50/50">
        <Routes>
          <Route path="/" element={<Beranda />} />
          <Route path="/verifikasi" element={<Verifikasi />} />
          <Route path="/daftar-ulang" element={<DaftarUlang />} />
          <Route path="/bukti-daftar-ulang" element={<BuktiDaftarUlang />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<LoginAdmin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="peserta" element={<DataPeserta />} />
            <Route path="kelulusan" element={<DataKelulusan />} />
            <Route path="verifikasi" element={<VerifikasiBerkas />} />
            <Route path="pengumuman" element={<Pengumuman />} />
            <Route path="jurusan" element={<KelolaJurusan />} />
            <Route path="laporan" element={<Laporan />} />
            <Route path="pengaturan" element={<Pengaturan />} />
            <Route path="aktivitas" element={<LogAktivitas />} />
          </Route>
        </Routes>
      </main>

      {!isAdmin && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: {
            fontFamily: "var(--font-sans)",
          },
        }}
      />
    </BrowserRouter>
  );
}

import React from 'react';
