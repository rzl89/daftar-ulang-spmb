import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  CheckCircle2, 
  FileText, 
  Printer, 
  ArrowRight,
  Clock,
  MapPin,
  Phone,
  Mail,
  ChevronRight
} from "lucide-react";
import { Button, Card, CardContent, FlipClock } from "@/components/ui";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useLandingBlocks } from "@/hooks";


export default function Beranda() {
  const { blocks, loading } = useLandingBlocks();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const getSetting = useSettingsStore(s => s.getSetting);
  const schoolName = getSetting('school_name');
  const schoolFullName = getSetting('school_full_name');
  const schoolYear = getSetting('school_year');
  const schoolAddress = getSetting('school_address');
  const schoolPhone = getSetting('school_phone');
  const schoolEmail = getSetting('school_email');
  const registrationDeadline = getSetting('registration_deadline');

  useEffect(() => {
    // Set deadline based on settings or fallback
    let deadline: Date;
    if (registrationDeadline) {
      deadline = new Date(registrationDeadline);
    } else {
      deadline = new Date();
      deadline.setDate(deadline.getDate() + 7);
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = deadline.getTime() - now;

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [registrationDeadline]);

  const steps = [
    {
      icon: <CheckCircle2 className="w-10 h-10 text-accent" />,
      title: "1. Verifikasi Kelulusan",
      desc: "Masukkan NISN Anda untuk memverifikasi status kelulusan di portal resmi."
    },
    {
      icon: <FileText className="w-10 h-10 text-accent" />,
      title: "2. Lengkapi & Upload",
      desc: "Isi form biodata, data orang tua, dan unggah dokumen persyaratan dalam format digital."
    },
    {
      icon: <Printer className="w-10 h-10 text-accent" />,
      title: "3. Cetak Bukti",
      desc: "Setelah semua tervalidasi, cetak lembar bukti daftar ulang dan bawa saat hari pertama."
    }
  ];

  const renderHero = () => (
    <section key="hero" className="relative w-full min-h-[95vh] flex flex-col items-center justify-center overflow-hidden gradient-mesh-navy text-white px-6 md:px-8">
      {/* Batik Kawung Background Motif */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-batik-kawung" />

      <div className="relative z-10 text-center w-full max-w-5xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass border border-white/20 shadow-lg mb-8">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-sm font-medium tracking-wide">PENGUMUMAN HASIL SPMB {schoolYear}</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Selamat! Anda Dinyatakan <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-linear-to-r from-accent via-white to-accent-light">
            LULUS SPMB
          </span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-12 font-medium px-4">
          Segera lakukan proses Daftar Ulang secara online melalui portal ini sebelum batas waktu berakhir untuk mengamankan kursi Anda.
        </p>

        {/* Countdown Timer */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-12">
          {Object.entries(timeLeft).map(([unit, value]) => (
            <FlipClock key={unit} value={value as number} label={unit} />
          ))}
        </div>

        <Link to="/daftar-ulang">
          <Button size="xl" variant="accent" className="rounded-full shadow-accent/50 hover:shadow-accent/80 text-lg px-8 group">
            MULAI DAFTAR ULANG SEKARANG
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
      
      {/* Curved Bottom Divider */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
        <svg className="relative block w-full h-[50px] md:h-[100px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,137.94,136.27,208.5,130.64Z" fill="#f8fafc"></path>
        </svg>
      </div>
    </section>
  );

  const renderSteps = () => (
    <section key="steps" className="py-20 px-6 md:px-8 w-full bg-surface-warm">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Alur Pendaftaran Ulang</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 relative">
          {/* Connector Line — dashed with arrow heads to reinforce forward motion */}
          <div className="hidden lg:block absolute top-1/2 left-[8%] right-[8%] -translate-y-1/2 -z-10">
            <div className="w-full border-t-2 border-dashed border-primary/20" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 border-t-2 border-r-2 border-primary/20 rotate-45" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 border-t-2 border-r-2 border-primary/20 rotate-[-135deg]" />
          </div>
          
          {steps.map((step, index) => (
            <div key={index} className="flex">
              <Card className="flex-1 w-full border-0 glass-card bg-white/80 hover:-translate-y-3 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-accent/8 rounded-2xl flex items-center justify-center mb-6 shrink-0 ring-1 ring-accent/15">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{step.desc}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderMap = () => (
    <section key="map" className="pb-20 pt-4 px-6 md:px-8 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-primary rounded-3xl overflow-hidden shadow-2xl text-white">
        <div className="p-10 md:p-16 flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-6">Pusat Informasi SPMB</h2>
          <p className="text-white/80 mb-10 leading-relaxed">
            Jika Anda mengalami kesulitan dalam melakukan proses Daftar Ulang, silakan datang langsung ke loket pendaftaran di sekolah atau hubungi kontak layanan kami.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <MapPin className="text-accent w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Lokasi Sekolah</h4>
                <p className="text-white/70 mt-1 whitespace-pre-line">{schoolAddress}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Phone className="text-accent w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Telepon / WhatsApp</h4>
                <p className="text-white/70 mt-1">{schoolPhone}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Mail className="text-accent w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Email</h4>
                <p className="text-white/70 mt-1">{schoolEmail}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="h-[400px] lg:h-auto lg:min-h-[500px] w-full relative bg-slate-200">
          <iframe 
            src={`https://maps.google.com/maps?q=${encodeURIComponent(schoolFullName)}&t=&z=15&ie=UTF8&iwloc=&output=embed`} 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen={true} 
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            title={`Peta Lokasi ${schoolName}`}
          />
        </div>
      </div>
    </section>
  );

  const renderCustomText = (block: any) => (
    <section key={block.id} className="py-16 px-6 md:px-8 w-full">
      <div
        className="max-w-4xl mx-auto prose prose-slate md:prose-lg text-slate-700"
        dangerouslySetInnerHTML={{ __html: block.content?.html || '' }}
      />
    </section>
  );

  const renderImage = (block: any) => (
    <section key={block.id} className="py-12 px-6 md:px-8 w-full max-w-7xl mx-auto">
      <img src={block.content?.imageUrl} alt={block.content?.title || 'Image'} className="w-full h-auto rounded-3xl shadow-lg" loading="lazy" style={{ aspectRatio: '16/9' }} />
    </section>
  );

  const renderBlocks = () => {
    if (loading) return null;
    
    // If no blocks are defined yet, show default blocks
    if (blocks.length === 0) {
      return (
        <>
          {renderHero()}
          {renderSteps()}
          {renderMap()}
        </>
      );
    }

    return blocks.map(block => {
      switch (block.type) {
        case 'HERO': return renderHero();
        case 'STEPS': return renderSteps();
        case 'MAP': return renderMap();
        case 'TEXT': return renderCustomText(block);
        case 'IMAGE': return renderImage(block);
        default: return null;
      }
    });
  };

  return (
    <div className="w-full flex flex-col pb-20">
      {renderBlocks()}
    </div>
  );
}
