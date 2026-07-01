import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Navbar, Footer } from "@/components/layout";
import { AlertBanner } from "@/components/ui";
import { useSettingsStore } from "@/store/useSettingsStore";

import React, { Suspense } from "react";

// Lazy Load Pages
const Beranda = React.lazy(() => import("@/pages/Beranda"));
const Verifikasi = React.lazy(() => import("@/pages/Verifikasi"));
const DaftarUlang = React.lazy(() => import("@/pages/DaftarUlang"));
const BuktiDaftarUlang = React.lazy(() => import("@/pages/BuktiDaftarUlang"));

// Lazy Load Admin Pages
const AdminLayout = React.lazy(() => import("@/pages/admin/AdminLayout"));
const LoginAdmin = React.lazy(() => import("@/pages/admin/LoginAdmin"));
const Dashboard = React.lazy(() => import("@/pages/admin/Dashboard"));
const DataPeserta = React.lazy(() => import("@/pages/admin/DataPeserta"));
const DataKelulusan = React.lazy(() => import("@/pages/admin/DataKelulusan"));
const VerifikasiBerkas = React.lazy(() => import("@/pages/admin/VerifikasiBerkas"));
const Laporan = React.lazy(() => import("@/pages/admin/Laporan"));
const LogAktivitas = React.lazy(() => import("@/pages/admin/LogAktivitas"));
const Pengaturan = React.lazy(() => import("@/pages/admin/Pengaturan"));
const KelolaJurusan = React.lazy(() => import("@/pages/admin/KelolaJurusan"));
const KelolaPertanyaan = React.lazy(() => import("@/pages/admin/KelolaPertanyaan"));
const KelolaSocialMedia = React.lazy(() => import("@/pages/admin/KelolaSocialMedia"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
  </div>
);
function AppLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  // Scroll to top on route change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Fetch global settings once
  const fetchSettings = useSettingsStore(s => s.fetchSettings);
  const theme_color_primary = useSettingsStore(s => s.theme_color_primary);
  const theme_color_secondary = useSettingsStore(s => s.theme_color_secondary);
  
  React.useEffect(() => {
    fetchSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply dynamic theme colors
  React.useEffect(() => {
    const root = document.documentElement;
    if (theme_color_primary) {
      root.style.setProperty('--app-primary', theme_color_primary);
      // Keep light/dark variants in sync (simplified)
      root.style.setProperty('--app-primary-light', theme_color_primary);
      root.style.setProperty('--app-primary-dark', theme_color_primary);
    }
    if (theme_color_secondary) {
      root.style.setProperty('--app-accent', theme_color_secondary);
      root.style.setProperty('--app-accent-light', theme_color_secondary);
      root.style.setProperty('--app-accent-dark', theme_color_secondary);
    }
  }, [theme_color_primary, theme_color_secondary]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Alert banner + Navbar fixed together */}
      {!isAdmin && (
        <div className="fixed top-0 left-0 right-0 z-50">
          {location.pathname === "/" && <AlertBanner />}
          <Navbar />
        </div>
      )}
      {/* Spacer to push content below fixed header */}
      {!isAdmin && <div className={location.pathname === "/" ? "h-[104px]" : "h-[72px]"} />}
      
      <main className="flex-1 w-full bg-slate-50/50">
        <Suspense fallback={<PageLoader />}>
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
              <Route path="jurusan" element={<KelolaJurusan />} />
              <Route path="pertanyaan" element={<KelolaPertanyaan />} />
              <Route path="social-media" element={<KelolaSocialMedia />} />
              <Route path="laporan" element={<Laporan />} />
              <Route path="pengaturan" element={<Pengaturan />} />
              <Route path="aktivitas" element={<LogAktivitas />} />
            </Route>
          </Routes>
        </Suspense>
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

