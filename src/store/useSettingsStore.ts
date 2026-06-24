import { create } from 'zustand';

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
  school_name: 'SMKN 5 KOTA SERANG',
  school_full_name: 'SMK Negeri 5 Kota Serang',
  school_year: '2025/2026',
  school_address: 'Jl. Raya Gunungsari, Cilowong, Kec. Taktakan, Kota Serang, Banten',
  school_phone: '0254 7919331',
  school_email: 'infosmkn5@gmail.com',
  school_website: 'www.smkn5kotaserang.sch.id',
  school_tagline: 'Disiplin, Cerdas dan Terampil',
  is_registration_open: 'true',
  quota: '320',
  registration_deadline: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  school_logo: '/Logo SKEMA.png',
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
    return state[key] || DEFAULTS[key] || '';
  },
}));
