import { Link } from "react-router-dom";
import {
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Camera,
  ThumbsUp,
  Play,
  Heart,
  ArrowUpRight,
} from "lucide-react";
import { NAV_LINKS } from "@/constants/school";
import { useSettingsStore } from "@/store/useSettingsStore";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const getSetting = useSettingsStore(s => s.getSetting);
  
  const name = getSetting('school_name');
  const fullName = getSetting('school_full_name');
  const year = getSetting('school_year');
  const tagline = getSetting('school_tagline');
  const address = getSetting('school_address');
  const phone = getSetting('school_phone');
  const email = getSetting('school_email');
  const website = getSetting('school_website');

  return (
    <footer className="bg-primary text-white relative overflow-hidden bg-gradient-to-br from-primary-dark to-primary">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Branding */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                <GraduationCap className="h-7 w-7 text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">{name}</h3>
                <p className="text-accent text-xs font-medium">SPMB {year}</p>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              "{tagline}"
            </p>
            <p className="text-white/50 text-xs leading-relaxed">
              Sistem Penerimaan Murid Baru untuk pendaftaran ulang calon peserta didik baru
              tahun ajaran {year}.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-accent text-sm uppercase tracking-wider mb-4">
              Navigasi
            </h4>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-white/60 hover:text-accent text-sm flex items-center gap-2 transition-colors group"
                  >
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold text-accent text-sm uppercase tracking-wider mb-4">
              Kontak
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-accent mt-1 flex-shrink-0" />
                <span className="text-white/60">{address}</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-accent flex-shrink-0" />
                <span className="text-white/60">{phone}</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-accent flex-shrink-0" />
                <a
                  href={`mailto:${email}`}
                  className="text-white/60 hover:text-accent transition-colors"
                >
                  {email}
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Globe className="h-4 w-4 text-accent flex-shrink-0" />
                <a
                  href={`https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-accent transition-colors"
                >
                  {website}
                </a>
              </li>
            </ul>
          </div>

          {/* Hours & Social */}
          <div>
            <h4 className="font-bold text-accent text-sm uppercase tracking-wider mb-4">
              Jam Layanan
            </h4>
            <div className="space-y-2.5 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-accent flex-shrink-0" />
                <div>
                  <p className="text-white/80 font-medium">Senin — Jumat</p>
                  <p className="text-white/50 text-xs">08.00 — 15.00 WIB</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-accent flex-shrink-0" />
                <div>
                  <p className="text-white/80 font-medium">Sabtu</p>
                  <p className="text-white/50 text-xs">08.00 — 12.00 WIB</p>
                </div>
              </div>
            </div>

            <h4 className="font-bold text-accent text-sm uppercase tracking-wider mb-3">
              Sosial Media
            </h4>
            <div className="flex items-center gap-3">
              <a
                href="https://instagram.com/smkn5kotaserang"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-accent/20 flex items-center justify-center transition-colors group"
                aria-label="Instagram"
              >
                <Camera className="h-4 w-4 text-white/60 group-hover:text-accent transition-colors" />
              </a>
              <a
                href="https://facebook.com/smkn5kotaserang"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-accent/20 flex items-center justify-center transition-colors group"
                aria-label="Facebook"
              >
                <ThumbsUp className="h-4 w-4 text-white/60 group-hover:text-accent transition-colors" />
              </a>
              <a
                href="https://youtube.com/@smkn5kotaserang"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-accent/20 flex items-center justify-center transition-colors group"
                aria-label="YouTube"
              >
                <Play className="h-4 w-4 text-white/60 group-hover:text-accent transition-colors" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/40 text-xs">
            © {currentYear} {fullName}. Hak Cipta Dilindungi.
          </p>
          <p className="text-white/30 text-xs flex items-center gap-1">
            Dibuat oleh <a href="https://www.tiktok.com/@rizaa119" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">rizaldev</a> dengan <Heart className="h-3 w-3 text-danger fill-danger" /> untuk pendidikan Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}
