import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, GraduationCap } from "lucide-react";
import { cn } from "@/utils";
import { NAV_LINKS } from "@/constants/school";
import { Button } from "@/components/ui";
import { useSettingsStore } from "@/store/useSettingsStore";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const schoolName = useSettingsStore(s => s.getSetting('school_name'));
  const schoolYear = useSettingsStore(s => s.getSetting('school_year'));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300",
        scrolled ? "py-4" : "py-0"
      )}
    >
      <div className={cn(
        "mx-auto transition-all duration-300",
        scrolled 
          ? "max-w-5xl px-4 sm:px-6 lg:px-8 glass rounded-full shadow-xl shadow-primary/5"
          : "max-w-7xl px-4 sm:px-6 lg:px-8 bg-white/80 backdrop-blur-md"
      )}>
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
              <GraduationCap className="h-6 w-6 text-accent" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-primary leading-tight tracking-tight">
                {schoolName}
              </h1>
              <p className="text-[10px] text-accent font-semibold uppercase tracking-widest">
                SPMB {schoolYear}
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-slate-500 hover:text-primary hover:bg-primary/10"
                  )}
                >
                  {link.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/daftar-ulang">
              <Button variant="accent" size="sm" className="pulse-glow">
                Daftar Ulang
              </Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden border-t border-slate-100 bg-white overflow-hidden transition-all duration-300",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 py-4 space-y-1">
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "block px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-slate-600 hover:bg-primary/10 hover:text-primary"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <Link to="/daftar-ulang" className="block">
              <Button variant="accent" size="md" className="w-full">
                Daftar Ulang Sekarang
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
