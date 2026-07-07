import { create } from 'zustand';

/** Hitung tahun ajaran saat ini secara otomatis (kalender Indonesia: Juli–Juni) */
function computeAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-based
  return month >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

const PLACEHOLDER_SCHOOL_YEAR = 'YYYY/YYYY';

interface SettingsState {
  // School biodata
  school_name: string;
  school_full_name: string;
  school_year: string;
  school_address: string;
  school_phone: string;
  school_email: string;
  school_website: string;
  school_tagline: string;
  school_city: string;
  is_registration_open: string;
  quota: string;
  registration_deadline: string;
  school_logo: string;
  theme_color_primary: string;
  theme_color_secondary: string;

  // Status
  isLoaded: boolean;

  // Actions
  fetchSettings: () => Promise<void>;
  getSetting: (key: string) => string;
}

// Fallback defaults (used before API data loads)
const DEFAULTS: Omit<SettingsState, 'isLoaded' | 'fetchSettings' | 'getSetting'> & Record<string, string> = {
  school_name: 'NAMA SEKOLAH',
  school_full_name: 'Nama Lengkap Sekolah',
  school_year: 'YYYY/YYYY',
  school_address: 'Alamat Sekolah',
  school_phone: '(021) 12345678',
  school_email: 'email@sekolah.sch.id',
  school_website: 'www.sekolah.sch.id',
  school_tagline: 'Tagline Sekolah',
  school_city: 'Kota',
  is_registration_open: 'true',
  quota: '100',
  registration_deadline: '',
  school_logo: '',
  theme_color_primary: '#1A237E',
  theme_color_secondary: '#F9A825',
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  isLoaded: false,

  fetchSettings: async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const updates: Record<string, string> = {};
          data.forEach((item: { key: string; value: string }) => {
            updates[item.key] = item.value;
          });
          set({ ...updates, isLoaded: true });
        }
      }
    } catch {
      // Use defaults silently
      set({ isLoaded: true });
    }
  },

  getSetting: (key: string) => {
    const state = get() as any;
    const raw = state[key] || DEFAULTS[key] || '';
    // Auto-compute academic year when the value is still the placeholder
    if (key === 'school_year' && raw === PLACEHOLDER_SCHOOL_YEAR) {
      return computeAcademicYear();
    }
    return raw;
  },
}));
