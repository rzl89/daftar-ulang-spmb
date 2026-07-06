import { create } from 'zustand';

interface SocialMediaItem {
  id: number;
  name: string;
  url: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

interface SocialMediaState {
  items: SocialMediaItem[];
  isLoaded: boolean;
  fetchSocialMedia: () => Promise<void>;
}

export const useSocialMediaStore = create<SocialMediaState>((set) => ({
  items: [],
  isLoaded: false,

  fetchSocialMedia: async () => {
    try {
      const res = await fetch('/api/social-media');
      if (res.ok) {
        const data = await res.json();
        set({ items: data, isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },
}));
