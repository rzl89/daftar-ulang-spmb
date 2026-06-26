import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/utils/api';
import { motion } from '@/utils/motion-lite';
import { Settings, Save, LayoutTemplate, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function Pengaturan() {
  const [settings, setSettings] = useState({
    school_name: '',
    school_full_name: '',
    school_address: '',
    school_email: '',
    school_website: '',
    school_tagline: '',
    school_year: '',
    quota: '',
    school_phone: '',
    is_registration_open: 'true',
    registration_deadline: '',
    school_logo: '',
    theme_color_primary: '#1A237E',
    theme_color_secondary: '#F9A825'
  });
  const [activeTab, setActiveTab] = useState('umum');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiFetch('/api/admin/settings');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        const newSettings = { ...settings };
        data.forEach((item: any) => {
          if (item.key in newSettings) {
            newSettings[item.key as keyof typeof newSettings] = item.value;
          }
        });
        setSettings(newSettings);
      }
    } catch (error) {
      toast.error('Gagal memuat pengaturan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error(`Format ${file.type || 'tidak dikenal'} tidak didukung. Gunakan JPG, PNG, WebP, atau SVG.`);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 10MB.');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;

      if (!cloudName || !apiKey) {
        toast.error('Cloudinary belum dikonfigurasi. Gunakan URL/Path sebagai alternatif.');
        setIsUploadingLogo(false);
        return;
      }

      // Step 1: Get upload signature
      const signRes = await fetch('/api/cloudinary/sign', { credentials: 'same-origin' });
      if (!signRes.ok) {
        const errText = await signRes.text().catch(() => 'Unknown error');
        throw new Error(`Signature error (${signRes.status}): ${errText.substring(0, 100)}`);
      }
      const { timestamp, signature } = await signRes.json();

      // Step 2: Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file, file.name);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', 'logo');

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(`Upload failed (${uploadRes.status}): ${JSON.stringify(errData).substring(0, 200)}`);
      }

      const result = await uploadRes.json();
      setSettings(prev => ({ ...prev, school_logo: result.secure_url }));
      toast.success('Logo berhasil diupload!');
    } catch (err: any) {
      console.error('Logo upload error:', err);
      toast.error(err?.message || 'Gagal mengupload logo. Coba lagi.');
    } finally {
      setIsUploadingLogo(false);
      const input = document.querySelector('input[type="file"][accept*="image/png"]') as HTMLInputElement;
      if (input) input.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Save each setting sequentially (skip empty optional fields)
      for (const [key, value] of Object.entries(settings)) {
        if (value === '' && (key === 'registration_deadline' || key === 'school_logo')) continue;
        await apiFetch(`/api/admin/settings/${key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value })
        });
      }
      
      // Log activity
      await apiFetch('/api/admin/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_SETTINGS',
          description: 'Admin memperbarui pengaturan sistem',
        })
      });

      toast.success('Pengaturan berhasil disimpan');
    } catch (error) {
      toast.error('Terjadi kesalahan saat menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked.toString() : value
    }));
  };

  return (
    <div className="space-y-6 min-w-0 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            Pengaturan Sistem
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Konfigurasi aplikasi dan jadwal PPDB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-2 min-w-0">
          {[
            { id: 'umum', label: 'Pengaturan Umum', icon: LayoutTemplate },
            { id: 'tema', label: 'Tampilan & Tema', icon: LayoutTemplate },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left
                ${activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 min-w-0">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-700"
          >
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">
              {activeTab === 'umum' ? 'Pengaturan Umum PPDB' : 'Pengaturan Tampilan & Tema'}
            </h2>
            
            {isLoading ? (
              <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                {activeTab === 'umum' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tahun Ajaran</label>
                        <input 
                          type="text" 
                          name="school_year"
                          value={settings.school_year} 
                          onChange={handleChange}
                          placeholder="Misal: 2025/2026"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kuota Penerimaan</label>
                        <input 
                          type="number" 
                          name="quota"
                          value={settings.quota} 
                          onChange={handleChange}
                          placeholder="Misal: 320"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Batas Waktu Daftar Ulang</label>
                        <input 
                          type="datetime-local" 
                          name="registration_deadline"
                          value={settings.registration_deadline ? new Date(settings.registration_deadline).toISOString().slice(0, 16) : ''} 
                          onChange={(e) => {
                            const dateVal = e.target.value ? new Date(e.target.value).toISOString() : '';
                            setSettings(prev => ({ ...prev, registration_deadline: dateVal }));
                          }}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nama Singkat Sekolah</label>
                        <input type="text" name="school_name" value={settings.school_name} onChange={handleChange} placeholder="Misal: NAMA SEKOLAH" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nama Lengkap Sekolah</label>
                        <input type="text" name="school_full_name" value={settings.school_full_name} onChange={handleChange} placeholder="Misal: Nama Lengkap Sekolah" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tagline / Slogan</label>
                      <input type="text" name="school_tagline" value={settings.school_tagline} onChange={handleChange} placeholder="Misal: Disiplin, Cerdas dan Terampil" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Alamat Lengkap</label>
                      <textarea name="school_address" value={settings.school_address} onChange={handleChange} rows={2} placeholder="Alamat lengkap sekolah" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white resize-none" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Utama</label>
                        <input type="email" name="school_email" value={settings.school_email} onChange={handleChange} placeholder="admin@sekolah.sch.id" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Telepon / WA</label>
                        <input type="text" name="school_phone" value={settings.school_phone} onChange={handleChange} placeholder="081234567890" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Website</label>
                        <input type="text" name="school_website" value={settings.school_website} onChange={handleChange} placeholder="www.sekolah.sch.id" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white" />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Status Pendaftaran</h3>
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">Buka Pendaftaran Baru</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Izinkan calon siswa untuk melihat info pendaftaran dan mendaftar</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            name="is_registration_open"
                            className="sr-only peer" 
                            checked={settings.is_registration_open === 'true'} 
                            onChange={handleChange}
                          />
                          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'tema' && (
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Logo Sekolah</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="school_logo"
                          value={settings.school_logo}
                          onChange={handleChange}
                          placeholder="URL atau path logo..."
                          className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white"
                        />
                        <label className={`flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm cursor-pointer transition-colors shrink-0 ${isUploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                          <Upload className="w-4 h-4" />
                          {isUploadingLogo ? 'Mengupload...' : 'Upload'}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/svg+xml"
                            onChange={handleLogoUpload}
                            className="hidden"
                            disabled={isUploadingLogo}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-slate-500">Masukkan URL/Path logo, atau upload file JPG/PNG/WebP/SVG langsung ke Cloudinary.</p>
                      {settings.school_logo && (
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                          <img src={settings.school_logo} alt="Preview Logo" className="h-16 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Warna Utama (Primary)</label>
                        <div className="flex gap-3">
                          <input 
                            type="color" 
                            name="theme_color_primary"
                            value={settings.theme_color_primary || '#1A237E'} 
                            onChange={handleChange}
                            className="h-11 w-16 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer" 
                          />
                          <input 
                            type="text" 
                            name="theme_color_primary"
                            value={settings.theme_color_primary || '#1A237E'} 
                            onChange={handleChange}
                            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white uppercase font-mono" 
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Warna Aksen (Secondary)</label>
                        <div className="flex gap-3">
                          <input 
                            type="color" 
                            name="theme_color_secondary"
                            value={settings.theme_color_secondary || '#F9A825'} 
                            onChange={handleChange}
                            className="h-11 w-16 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer" 
                          />
                          <input 
                            type="text" 
                            name="theme_color_secondary"
                            value={settings.theme_color_secondary || '#F9A825'} 
                            onChange={handleChange}
                            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white uppercase font-mono" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-end gap-3">
                  <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50">
                    <Save className="w-4 h-4" /> {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
