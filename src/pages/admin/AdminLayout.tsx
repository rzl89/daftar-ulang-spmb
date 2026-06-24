import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from '@/utils/motion-lite';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Megaphone,
  BarChart3,
  Settings,
  History,
  Menu,
  X,
  Bell,
  Moon,
  Sun,
  LogOut,
  Shield,
  ChevronLeft,
  FileSpreadsheet,
  BookOpen,
  FileText,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Layout } from 'lucide-react';

const menuItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/peserta', label: 'Data Peserta', icon: Users },
  { path: '/admin/kelulusan', label: 'Data Kelulusan', icon: FileSpreadsheet },
  { path: '/admin/verifikasi', label: 'Verifikasi Berkas', icon: FileCheck },
  { path: '/admin/pengumuman', label: 'Pengumuman', icon: Megaphone },
  { path: '/admin/jurusan', label: 'Kelola Jurusan', icon: BookOpen },
  { path: '/admin/landing-page', label: 'Kelola Landing Page', icon: Layout },
  { path: '/admin/konten', label: 'Kelola Konten', icon: FileText },
  { path: '/admin/pertanyaan', label: 'Kelola Pertanyaan', icon: HelpCircle },
  { path: '/admin/laporan', label: 'Laporan', icon: BarChart3 },
  { path: '/admin/aktivitas', label: 'Log Aktivitas', icon: History },
  { path: '/admin/pengaturan', label: 'Pengaturan', icon: Settings },
];

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const schoolName = useSettingsStore(s => s.getSetting('school_name'));
  const schoolLogo = useSettingsStore(s => s.getSetting('school_logo'));
  
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize auth check and dark mode
  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_auth');
    if (!isAuth && location.pathname !== '/admin/login') {
      navigate('/admin/login');
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, [navigate, location.pathname]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    toast.success('Berhasil logout');
    navigate('/admin/login');
  };

  const currentMenu = menuItems.find(m => location.pathname.startsWith(m.path));
  const pageTitle = currentMenu ? currentMenu.label : 'Admin Panel';

  // Sidebar Component
  const SidebarContent = () => (
    <div className="flex flex-col h-full text-white">
      {/* Logo Area */}
      <div className={`flex items-center justify-between p-4 border-b border-slate-700/50 ${!isSidebarOpen && 'justify-center'}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          {schoolLogo ? (
            <img src={schoolLogo} alt="Logo" width={32} height={32} className="w-8 h-8 object-contain shrink-0 drop-shadow-md" />
          ) : (
            <div className="p-1.5 bg-accent rounded-lg shrink-0 shadow-lg shadow-accent/20">
              <Shield className="w-6 h-6 text-primary" />
            </div>
          )}
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="whitespace-nowrap"
            >
              <h1 className="font-bold text-lg leading-tight">{schoolName}</h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </motion.div>
          )}
        </div>
        
        {/* Desktop Collapse Toggle */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden md:flex p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${!isSidebarOpen && 'rotate-180'}`} />
        </button>
        
        {/* Mobile Close Toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-accent/10 text-accent' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              title={!isSidebarOpen ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-accent' : 'group-hover:text-white'}`} />
              
              <AnimatePresence mode="wait">
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="font-medium whitespace-nowrap overflow-hidden text-sm"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full shadow-[0_0_8px_rgba(var(--color-accent),0.5)]"
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Area */}
      <div className="p-4 border-t border-white/10">
        <button 
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-white/60 hover:text-red-400 hover:bg-red-400/10 transition-colors ${!isSidebarOpen && 'justify-center'}`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {isSidebarOpen && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-warm dark:bg-slate-900 transition-colors duration-200 flex">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 256 : 80 }}
        className="hidden md:block sticky top-0 h-screen z-40 gradient-mesh-navy border-r border-white/10 overflow-hidden shrink-0"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-slate-900"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400 hidden sm:inline-block">Admin</span>
                <span className="text-slate-300 hidden sm:inline-block">/</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{pageTitle}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
              </button>

              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Admin Utama</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">admin@smkn5.sch.id</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-primary font-extrabold shadow-sm ring-2 ring-white dark:ring-slate-800">
                  A
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 min-w-0 w-full overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
