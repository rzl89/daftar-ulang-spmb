import {
  Camera,
  Facebook,
  Youtube,
  Twitter,
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
  facebook: Facebook,
  'thumbs-up': ThumbsUp,
  youtube: Youtube,
  play: Play,
  twitter: Twitter,
  'message-circle': MessageCircle,
  globe: Globe,
};

// Opsi dropdown untuk admin form
export const SOCIAL_ICON_OPTIONS = [
  { value: 'camera', label: 'Camera (Instagram)' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'thumbs-up', label: 'Thumbs Up (Facebook alt)' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'play', label: 'Play (YouTube alt)' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'message-circle', label: 'Message Circle (WhatsApp/Telegram)' },
  { value: 'globe', label: 'Globe (Website)' },
];

// Fallback icon jika nama tidak ditemukan di map
export { ExternalLink };
