import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight } from "lucide-react";
import { Button, Card, CardContent, Input, Select, Stepper } from "@/components/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const STEPS = ["Data Pribadi", "Data Orang Tua", "Data Akademik", "Upload & Konfirmasi"];

// Schema Validasi
const formSchema = z.object({
  dataPribadi: z.object({
    nisn: z.string().length(10, "NISN harus tepat 10 angka").regex(/^\d+$/, "NISN hanya boleh berisi angka"),
    namaLengkap: z.string().min(3, "Nama lengkap minimal 3 karakter"),
    tempatLahir: z.string().min(3, "Tempat lahir wajib diisi"),
    tanggalLahir: z.string().min(1, "Tanggal lahir wajib diisi"),
    jenisKelamin: z.enum(["L", "P"], { required_error: "Jenis kelamin wajib dipilih" }),
    agama: z.string().min(1, "Agama wajib diisi"),
    alamat: z.string().min(10, "Alamat lengkap wajib diisi (minimal 10 karakter)"),
  }),
  dataOrtu: z.object({
    namaAyah: z.string().min(3, "Nama Ayah wajib diisi"),
    pekerjaanAyah: z.string().min(1, "Pekerjaan Ayah wajib dipilih"),
    namaIbu: z.string().min(3, "Nama Ibu wajib diisi"),
    pekerjaanIbu: z.string().min(1, "Pekerjaan Ibu wajib dipilih"),
    noTelpOrtu: z.string().min(10, "Nomor telepon valid wajib diisi").regex(/^\d+$/, "Hanya boleh berisi angka"),
  }),
  dataAkademik: z.object({
    asalSekolah: z.string().min(3, "Asal sekolah wajib diisi"),
    jurusanPilihan1: z.string().min(1, "Pilihan jurusan 1 wajib dipilih"),
    jurusanPilihan2: z.string().min(1, "Pilihan jurusan 2 wajib dipilih"),
  })
}).refine(data => data.dataAkademik.jurusanPilihan1 !== data.dataAkademik.jurusanPilihan2, {
  message: "Jurusan Pilihan 1 dan 2 tidak boleh sama",
  path: ["dataAkademik", "jurusanPilihan2"],
});

type FormData = z.infer<typeof formSchema>;

export default function DaftarUlang() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [jurusanList, setJurusanList] = useState<{code: string, name: string}[]>([]);
  const [files, setFiles] = useState<Record<string, File | null>>({
    "Surat Keterangan Lulus (SKL)": null,
    "Kartu Keluarga (KK)": null,
    "Akta Kelahiran": null
  });

  const { register, handleSubmit, trigger, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataPribadi: { jenisKelamin: 'L', agama: 'Islam' },
      dataAkademik: { jurusanPilihan1: '', jurusanPilihan2: '' }
    }
  });

  useEffect(() => {
    fetch('/api/jurusan')
      .then(res => res.json())
      .then(data => setJurusanList(data))
      .catch(err => console.error("Gagal mengambil data jurusan:", err));
  }, []);

  const handleNext = async () => {
    let fieldsToValidate: any = [];
    if (currentStep === 1) {
      fieldsToValidate = ['dataPribadi.nisn', 'dataPribadi.namaLengkap', 'dataPribadi.tempatLahir', 'dataPribadi.tanggalLahir', 'dataPribadi.jenisKelamin', 'dataPribadi.agama', 'dataPribadi.alamat'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['dataOrtu.namaAyah', 'dataOrtu.pekerjaanAyah', 'dataOrtu.namaIbu', 'dataOrtu.pekerjaanIbu', 'dataOrtu.noTelpOrtu'];
    } else if (currentStep === 3) {
      fieldsToValidate = ['dataAkademik.asalSekolah', 'dataAkademik.jurusanPilihan1', 'dataAkademik.jurusanPilihan2'];
    }

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      if (currentStep === 1) {
        setIsSubmitting(true);
        try {
          const { nisn, tanggalLahir } = getValues('dataPribadi');
          const res = await fetch('/api/verifikasi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nisn, tanggalLahir })
          });
          const result = await res.json();
          setIsSubmitting(false);
          
          if (!res.ok) {
            toast.error(result.message || "Data tidak ditemukan atau Anda tidak terdaftar sebagai peserta yang lulus.");
            return;
          }
        } catch (error) {
          setIsSubmitting(false);
          toast.error("Gagal memverifikasi data. Periksa koneksi Anda.");
          return;
        }
      }

      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const onSubmitForm = async (data: FormData) => {
    // Validasi apakah file sudah dipilih semua
    const unselectedFiles = Object.entries(files).filter(([_, file]) => file === null);
    if (unselectedFiles.length > 0) {
      toast.error(`Mohon unggah semua dokumen yang diwajibkan (${unselectedFiles[0][0]}).`);
      return;
    }

    setIsSubmitting(true);
    
    // Simulate Upload Progress visually
    let progress = 0;
    const interval = setInterval(async () => {
      progress += 25;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        
        try {
          // If we had a real backend for files, we would use FormData here
          // const formDataToSend = new window.FormData();
          // Object.entries(files).forEach(([key, file]) => {
          //   if (file) formDataToSend.append(key, file);
          // });
          
          const res = await fetch('/api/registrations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data) // for now, we just simulate success with the JSON payload
          });
          
          const result = await res.json();
          setIsSubmitting(false);
          
          if (res.ok) {
            toast.success("Pendaftaran berhasil disimpan!");
            navigate(`/bukti-daftar-ulang?nisn=${result.nisn}`);
          } else {
            toast.error(result.message || "Gagal menyimpan pendaftaran");
          }
        } catch (error) {
          setIsSubmitting(false);
          toast.error("Gagal terhubung ke server. Periksa koneksi Anda.");
        }
      }
    }, 300);
  };

  const handleFileChange = (docName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Basic size validation 2MB
      if (selectedFile.size > 2 * 1024 * 1024) {
        toast.error(`Ukuran file ${docName} melebihi 2MB.`);
        return;
      }
      setFiles(prev => ({ ...prev, [docName]: selectedFile }));
    }
  };

  const jurusanOptions = [
    { value: "", label: "-- Pilih Jurusan --" },
    ...jurusanList.map(j => ({ value: j.code, label: j.name }))
  ];

  return (
    <div className="w-full min-h-screen py-10 px-4 md:px-8 xl:max-w-6xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Formulir Daftar Ulang</h1>
        <p className="text-slate-500">Lengkapi data di bawah ini dengan informasi yang valid dan benar.</p>
      </div>

      <div className="mb-10 px-2 md:px-10">
        <Stepper steps={STEPS} currentStep={currentStep} />
      </div>

      <Card className="shadow-xl shadow-slate-200/50 border-0 overflow-hidden">
        <CardContent className="p-0">
          <form onSubmit={(e) => { 
            e.preventDefault(); 
            if (currentStep === 4) handleSubmit(onSubmitForm)(); 
            else handleNext(); 
          }}>
            <div className="p-6 md:p-10 min-h-[400px]">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-bold text-slate-800 border-b pb-2 mb-6">1. Data Pribadi Calon Siswa</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input 
                        label="NISN (Nomor Induk Siswa Nasional)" 
                        placeholder="10 Digit NISN" 
                        {...register("dataPribadi.nisn")}
                        error={errors.dataPribadi?.nisn?.message}
                        required 
                      />
                      <Input 
                        label="Nama Lengkap" 
                        placeholder="Sesuai Ijazah/Akte" 
                        {...register("dataPribadi.namaLengkap")}
                        error={errors.dataPribadi?.namaLengkap?.message}
                        required 
                      />
                      <Input 
                        label="Tempat Lahir" 
                        placeholder="Kota Lahir" 
                        {...register("dataPribadi.tempatLahir")}
                        error={errors.dataPribadi?.tempatLahir?.message}
                        required 
                      />
                      <Input 
                        type="date"
                        label="Tanggal Lahir" 
                        {...register("dataPribadi.tanggalLahir")}
                        error={errors.dataPribadi?.tanggalLahir?.message}
                        required 
                      />
                      <Select 
                        label="Jenis Kelamin" 
                        options={[
                          {value: "L", label: "Laki-laki"},
                          {value: "P", label: "Perempuan"}
                        ]}
                        {...register("dataPribadi.jenisKelamin")}
                        error={errors.dataPribadi?.jenisKelamin?.message}
                        required 
                      />
                      <Select 
                        label="Agama" 
                        options={[
                          {value: "Islam", label: "Islam"},
                          {value: "Kristen", label: "Kristen"},
                          {value: "Katolik", label: "Katolik"},
                          {value: "Hindu", label: "Hindu"},
                          {value: "Buddha", label: "Buddha"},
                          {value: "Konghucu", label: "Konghucu"}
                        ]}
                        {...register("dataPribadi.agama")}
                        error={errors.dataPribadi?.agama?.message}
                        required 
                      />
                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Alamat Lengkap Sesuai KK <span className="text-destructive">*</span></label>
                        <textarea 
                          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm focus:outline-none transition-all ${errors.dataPribadi?.alamat ? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/10' : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10'}`}
                          rows={3}
                          placeholder="Jalan, RT/RW, Desa/Kelurahan, Kecamatan..."
                          {...register("dataPribadi.alamat")}
                        />
                        {errors.dataPribadi?.alamat && (
                          <p className="text-xs text-destructive font-medium">{errors.dataPribadi.alamat.message}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-bold text-slate-800 border-b pb-2 mb-6">2. Data Orang Tua / Wali</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input 
                        label="Nama Ayah" 
                        placeholder="Nama Lengkap Ayah" 
                        {...register("dataOrtu.namaAyah")}
                        error={errors.dataOrtu?.namaAyah?.message}
                        required 
                      />
                      <Select 
                        label="Pekerjaan Ayah" 
                        options={[
                          {value: "", label: "-- Pilih Pekerjaan --"},
                          {value: "PNS", label: "PNS / TNI / POLRI"},
                          {value: "Wiraswasta", label: "Wiraswasta / Pengusaha"},
                          {value: "Karyawan Swasta", label: "Karyawan Swasta"},
                          {value: "Petani/Nelayan", label: "Petani / Nelayan"},
                          {value: "Buruh", label: "Buruh / Pekerja Lepas"},
                          {value: "Lainnya", label: "Lainnya"}
                        ]}
                        {...register("dataOrtu.pekerjaanAyah")}
                        error={errors.dataOrtu?.pekerjaanAyah?.message}
                        required 
                      />
                      <Input 
                        label="Nama Ibu" 
                        placeholder="Nama Lengkap Ibu" 
                        {...register("dataOrtu.namaIbu")}
                        error={errors.dataOrtu?.namaIbu?.message}
                        required 
                      />
                      <Select 
                        label="Pekerjaan Ibu" 
                        options={[
                          {value: "", label: "-- Pilih Pekerjaan --"},
                          {value: "Ibu Rumah Tangga", label: "Ibu Rumah Tangga"},
                          {value: "PNS", label: "PNS / TNI / POLRI"},
                          {value: "Wiraswasta", label: "Wiraswasta / Pengusaha"},
                          {value: "Karyawan Swasta", label: "Karyawan Swasta"},
                          {value: "Buruh", label: "Buruh / Pekerja Lepas"},
                          {value: "Lainnya", label: "Lainnya"}
                        ]}
                        {...register("dataOrtu.pekerjaanIbu")}
                        error={errors.dataOrtu?.pekerjaanIbu?.message}
                        required 
                      />
                      <Input 
                        label="No. Telepon / WhatsApp Orang Tua" 
                        placeholder="Contoh: 081234567890" 
                        className="md:col-span-2"
                        {...register("dataOrtu.noTelpOrtu")}
                        error={errors.dataOrtu?.noTelpOrtu?.message}
                        required 
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-bold text-slate-800 border-b pb-2 mb-6">3. Data Akademik & Pilihan Jurusan</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input 
                        label="Asal Sekolah Dasar (SMP/MTs)" 
                        placeholder="Nama SMP/MTs Asal" 
                        className="md:col-span-2"
                        {...register("dataAkademik.asalSekolah")}
                        error={errors.dataAkademik?.asalSekolah?.message}
                        required 
                      />
                      <Select 
                        label="Pilihan Jurusan 1" 
                        options={jurusanOptions}
                        {...register("dataAkademik.jurusanPilihan1")}
                        error={errors.dataAkademik?.jurusanPilihan1?.message}
                        required 
                      />
                      <Select 
                        label="Pilihan Jurusan 2" 
                        options={jurusanOptions}
                        {...register("dataAkademik.jurusanPilihan2")}
                        error={errors.dataAkademik?.jurusanPilihan2?.message}
                        required 
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-bold text-slate-800 border-b pb-2 mb-6">4. Upload Berkas & Konfirmasi</h2>
                    <p className="text-sm text-slate-500 mb-4">Pilih dokumen pendaftaran (PDF/JPG maksimal 2MB per file).</p>
                    
                    <div className="space-y-4 mb-8">
                      {["Surat Keterangan Lulus (SKL)", "Kartu Keluarga (KK)", "Akta Kelahiran"].map((doc) => (
                        <div key={doc} className="border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                              <FileText className={`w-5 h-5 ${files[doc] ? 'text-success' : ''}`} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-800 text-sm">{doc}</h4>
                              {files[doc] && (
                                <p className="text-xs text-slate-500 mt-1">{files[doc]?.name}</p>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 relative">
                            <input 
                              type="file" 
                              id={`file-upload-${doc}`}
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileChange(doc, e)}
                              className="hidden"
                            />
                            <Button 
                              type="button" 
                              variant={files[doc] ? "ghost" : "outline"} 
                              size="sm" 
                              leftIcon={<Upload className="w-4 h-4" />}
                              onClick={() => document.getElementById(`file-upload-${doc}`)?.click()}
                            >
                              {files[doc] ? "Ubah File" : "Pilih File"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-warning/10 border-l-4 border-warning p-4 rounded-r-xl flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                      <div>
                        <h4 className="font-bold text-warning-dark text-sm">Konfirmasi Akhir</h4>
                        <p className="text-warning-dark text-xs mt-1">
                          Pastikan seluruh data dan berkas yang diunggah sudah benar. Data yang dikirim <strong>tidak dapat diubah kembali</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 mt-4">
                      <div className="flex items-center gap-3 mb-4">
                        <CheckCircle2 className="text-success w-5 h-5" />
                        <span className="font-semibold text-slate-700">Pernyataan Persetujuan</span>
                      </div>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" required className="mt-1 w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" />
                        <span className="text-sm text-slate-600 leading-relaxed">
                          Saya menyatakan bahwa seluruh data yang saya isikan adalah BENAR dan sesuai dengan dokumen asli.
                        </span>
                      </label>
                    </div>

                    {isSubmitting && (
                      <div className="space-y-2 mt-6">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-primary">Mengirim Data & Berkas...</span>
                          <span className="text-primary">{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-primary" 
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Form Footer / Navigation */}
            <div className="bg-slate-50 p-6 md:px-10 border-t border-slate-100 flex items-center justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePrev} 
                disabled={currentStep === 1 || isSubmitting}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Kembali
              </Button>
              
              {currentStep < 4 ? (
                <Button 
                  type="button" 
                  onClick={handleNext} 
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                >
                  Selanjutnya
                </Button>
              ) : (
                <Button 
                  type="submit"
                  variant="primary"
                  className="pulse-glow"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  leftIcon={<CheckCircle2 className="w-5 h-5" />}
                >
                  KIRIM DAFTAR ULANG
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
