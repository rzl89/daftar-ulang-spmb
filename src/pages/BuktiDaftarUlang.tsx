import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";

import { CheckCircle2, Printer, Home, AlertCircle, Loader2 } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { useSettingsStore } from "@/store/useSettingsStore";
import { generateBuktiPdf } from "@/utils/generatePdf";

interface RegistrationData {
  registrationId: string;
  nisn: string;
  namaLengkap: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  pilihanJurusan1: string;
  status: string;
  createdAt: string;
}

export default function BuktiDaftarUlang() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const schoolFullName = useSettingsStore(s => s.getSetting('school_full_name'));
  const schoolYear = useSettingsStore(s => s.getSetting('school_year'));
  
  const nisn = searchParams.get("nisn");
  
  const [data, setData] = useState<RegistrationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    if (!nisn) {
      setError("Data NISN tidak ditemukan di URL.");
      setIsLoading(false);
      return;
    }

    fetch(`/api/registrations/${nisn}`)
      .then(res => {
        if (!res.ok) throw new Error("Data tidak ditemukan");
        return res.json();
      })
      .then(result => {
        setData(result);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [nisn]);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Terjadi Kesalahan</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <Link to="/">
            <Button>Kembali ke Beranda</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pt-32 pb-12 px-6 md:px-8 max-w-3xl mx-auto flex flex-col items-center">
      
      <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Daftar Ulang Berhasil!</h1>
        <p className="text-slate-500">Data dan berkas Anda telah berhasil disimpan ke dalam sistem kami.</p>
      </div>

      <div className="w-full">
        <Card className="w-full shadow-2xl border-0 overflow-hidden relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-slate-50/50 rounded-full" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 bg-slate-50/50 rounded-full" />
          
          <CardContent className="p-0">
            <div className="bg-primary p-6 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-accent mb-1">Bukti Registrasi</h2>
                <h3 className="text-xl font-bold">SPMB {schoolFullName}</h3>
              </div>
              <div className="text-right z-10">
                <span className="text-xs text-white/70 block">Tahun Ajaran</span>
                <span className="font-bold">{schoolYear}</span>
              </div>
            </div>

            <div className="p-8 border-b-2 border-dashed border-slate-200">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <span className="block text-xs text-slate-400 font-semibold uppercase mb-1">No. Registrasi</span>
                  <span className="font-bold text-slate-800 text-lg">{data.registrationId}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-400 font-semibold uppercase mb-1">Tanggal Daftar</span>
                  <span className="font-bold text-slate-800 text-lg">
                    {new Date(data.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                
                <div className="col-span-2">
                  <span className="block text-xs text-slate-400 font-semibold uppercase mb-1">Nama Siswa / NISN</span>
                  <span className="font-bold text-slate-800 text-xl">{data.namaLengkap} <span className="text-sm text-slate-500 font-normal">({data.nisn})</span></span>
                </div>
                
                <div className="col-span-2">
                  <span className="block text-xs text-slate-400 font-semibold uppercase mb-1">Tempat, Tanggal Lahir</span>
                  <span className="font-bold text-slate-800 text-lg">
                    {data.tempatLahir && data.tanggalLahir
                      ? `${data.tempatLahir}, ${new Date(data.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
                      : data.tempatLahir || data.tanggalLahir || '-'}
                  </span>
                </div>
                
                <div className="col-span-2">
                  <span className="block text-xs text-slate-400 font-semibold uppercase mb-1">Jurusan Diterima</span>
                  <span className="font-bold text-primary text-lg">{data.pilihanJurusan1}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-slate-600 mb-1">
                  <AlertCircle className="w-4 h-4 text-warning" />
                  <span className="text-xs font-semibold uppercase">Status Dokumen</span>
                </div>
                <span className="text-sm font-bold text-success">
                  {data.status === 'MENUNGGU_VERIFIKASI' ? 'MENUNGGU VERIFIKASI PANITIA' : data.status}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm shrink-0">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${data.registrationId}`} alt="QR Code" className="w-16 h-16" width={64} height={64} loading="lazy" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center print:hidden">
          <Button 
            size="lg" 
            leftIcon={<Printer className="w-5 h-5" />}
            onClick={() => data && generateBuktiPdf(data)}
          >
            Download PDF Bukti
          </Button>
          <Link to="/">
            <Button size="lg" variant="outline" leftIcon={<Home className="w-5 h-5" />}>
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
        
        <p className="text-center text-sm text-slate-500 mt-6 max-w-md mx-auto print:hidden">
          Silakan cetak atau simpan bukti ini dan bawa pada saat hari pertama kegiatan pengenalan lingkungan sekolah.
        </p>
      </div>
    </div>
  );
}
