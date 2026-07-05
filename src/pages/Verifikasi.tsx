import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, UserCircle2, GraduationCap, Award, Calendar, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button, Card, CardContent, Input } from "@/components/ui";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function Verifikasi() {
  const getSetting = useSettingsStore(s => s.getSetting);
  const registrationDeadline = getSetting('registration_deadline');
  const [nisn, setNisn] = useState("");
  const [tglLahir, setTglLahir] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<null | 'success' | 'not-found'>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCekKelulusan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setStudentData(null);
    
    try {
      const res = await fetch('/api/verifikasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nisn, tanggalLahir: tglLahir })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setStudentData(data.data);
        setResult("success");
      } else {
        setErrorMessage(data.message || 'Data tidak ditemukan.');
        setResult("not-found");
      }
    } catch (err) {
      setErrorMessage('Terjadi kesalahan pada server. Silakan coba lagi nanti.');
      setResult("not-found");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen pt-32 pb-12 px-6 md:px-8 xl:max-w-6xl mx-auto flex flex-col items-center">
      
      <div className="text-center mb-10 w-full">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-600 mb-6">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">Verifikasi Kelulusan</h1>
        <p className="text-slate-500 max-w-lg mx-auto">
          Silakan masukkan NISN dan Tanggal Lahir Anda untuk mengecek status kelulusan dan melanjutkan ke tahap daftar ulang.
        </p>
      </div>

      <Card className="w-full max-w-xl shadow-xl shadow-slate-200/50 border-0 mb-8">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleCekKelulusan} className="space-y-6">
            <Input 
              label="NISN (Nomor Induk Siswa Nasional)"
              placeholder="Contoh: 0012345678"
              required
              value={nisn}
              onChange={(e) => setNisn(e.target.value)}
              hint="Masukkan 10 digit NISN Anda."
            />
            
            <Input 
              label="Tanggal Lahir"
              type="date"
              required
              value={tglLahir}
              onChange={(e) => setTglLahir(e.target.value)}
              hint="Pilih tanggal lahir Anda sesuai data yang terdaftar."
            />

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              isLoading={isLoading}
              leftIcon={<Search className="w-5 h-5" />}
            >
              CEK STATUS KELULUSAN
            </Button>
          </form>
        </CardContent>
      </Card>

      {result === 'success' && studentData && (
        <div className="w-full">
          <Card className="border-2 border-emerald-500 overflow-hidden shadow-2xl shadow-emerald-500/10">
            <div className="bg-emerald-500 text-white text-center py-3 font-bold tracking-widest text-sm">
              LULUS - SILAKAN DAFTAR ULANG
            </div>
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                
                <div className="shrink-0">
                  <div className="w-32 h-40 bg-slate-100 rounded-xl border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                    <UserCircle2 className="w-20 h-20 text-slate-300" />
                  </div>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-slate-800 mb-1">{studentData.namaLengkap}</h3>
                  <p className="text-slate-500 font-medium mb-6">NISN: {studentData.nisn}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4 mb-8 w-full">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <GraduationCap className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase">Asal Sekolah</span>
                      </div>
                      <p className="font-bold text-slate-800">{studentData.asalSekolah || '-'}</p>
                    </div>
                    
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Award className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase">Diterima di Jurusan</span>
                      </div>
                      <p className="font-bold text-blue-600">{studentData.jurusanDiterima || '-'}</p>
                    </div>

                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                      <div className="flex items-center gap-2 text-emerald-600 mb-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase">Status</span>
                      </div>
                      <p className="font-bold text-emerald-700">Lulus Seleksi</p>
                    </div>

                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                      <div className="flex items-center gap-2 text-amber-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase">Batas Daftar Ulang</span>
                      </div>
                      <p className="font-bold text-amber-700">
                        {registrationDeadline
                          ? new Date(registrationDeadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Segera — Jangan Sampai Terlewat'}
                      </p>
                    </div>
                  </div>

                  <Link to={`/daftar-ulang?nisn=${studentData.nisn}`}>
                    <Button size="xl" className="w-full md:w-auto group">
                      Lanjutkan Proses Daftar Ulang
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {result === 'not-found' && (
        <div className="w-full max-w-xl text-center bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
          <p className="font-semibold">{errorMessage}</p>
          <p className="text-sm mt-1">Pastikan NISN dan Tanggal Lahir yang Anda masukkan benar, atau hubungi panitia jika merasa ada kesalahan.</p>
        </div>
      )}

    </div>
  );
}
