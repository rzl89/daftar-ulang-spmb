import {
  Camera,
  MessageCircle,
  Globe,
  ExternalLink,
  ThumbsUp,
  Play,
  type LucideIcon,
} from 'lucide-react';

// Mapping nama icon (disimpan di DB) → komponen Lucide
export const SOCIAL_ICON_MAP: Record<string, LucideIcon> = {
  camera: Camera,
  'thumbs-up': ThumbsUp,
  play: Play,
  'message-circle': MessageCircle,
  globe: Globe,
};

// Opsi dropdown untuk admin form
export const SOCIAL_ICON_OPTIONS = [
  { value: 'camera', label: 'Camera (Instagram)' },
  { value: 'thumbs-up', label: 'Thumbs Up (Facebook)' },
  { value: 'play', label: 'Play (YouTube)' },
  { value: 'message-circle', label: 'Message Circle (WhatsApp/Telegram)' },
  { value: 'globe', label: 'Globe (Website/Lainnya)' },
];

// Fallback icon jika nama tidak ditemukan di map
export { ExternalLink };
