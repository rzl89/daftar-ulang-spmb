import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { Upload, FileText, CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight, Clock, Loader2 } from "lucide-react";
import { Button, Card, CardContent, Input, Select, Stepper } from "@/components/ui";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useSettingsStore } from "@/store/useSettingsStore";

// ─── Types ──────────────────────────────────────────────────────────────────
interface FormQuestion {
  id: number;
  section: string;
  fieldName: string;
  label: string;
  fieldType: string;
  placeholder: string | null;
  options: string[] | null;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
}

// Map sections to step indices
const SECTION_STEP_MAP: Record<string, number> = {
  dataPribadi: 1,
  dataOrangTua: 2,
  akademik: 3,
  dokumen: 4,
};

const STEP_TITLES = [
  "Data Pribadi",
  "Data Orang Tua",
  "Data Akademik",
  "Upload & Konfirmasi",
];

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
  const [missingDocs, setMissingDocs] = useState<string[]>([]);

  // Dynamic form questions from API
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [sekolahList, setSekolahList] = useState<string[]>([]);
  const [verifiedStudent, setVerifiedStudent] = useState<Record<string, any> | null>(null);

  const { register, handleSubmit, trigger, getValues, setError, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {} as Record<string, any>,
  });

  // ─── Fetch form questions & jurusan on mount ────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/api/form-questions').then(r => r.json()),
      fetch('/api/jurusan').then(r => r.json()),
      fetch('/api/sekolah-asal').then(r => r.json()),
    ]).then(([q, j, s]) => {
      setQuestions(Array.isArray(q) ? q : []);
      setJurusanList(Array.isArray(j) ? j : []);
      setSekolahList(Array.isArray(s) ? s : []);
      setIsLoadingQuestions(false);
    }).catch(err => {
      console.error('Failed to load form config:', err);
      toast.error('Gagal memuat konfigurasi form');
      setIsLoadingQuestions(false);
    });
  }, []);

  // ─── Group questions by step ──────────────────────────────────────────────
  const questionsByStep = useMemo(() => {
    const map: Record<number, FormQuestion[]> = { 1: [], 2: [], 3: [], 4: [] };
    questions.forEach(q => {
      const step = SECTION_STEP_MAP[q.section];
      if (step && map[step]) {
        map[step].push(q);
      }
    });
    // Sort each group by sortOrder
    Object.values(map).forEach(arr => arr.sort((a, b) => a.sortOrder - b.sortOrder));
    return map;
  }, [questions]);

  // ─── Build per-step field names for validation ──────────────────────────────
  const getFieldNamesForStep = (step: number): string[] => {
    return (questionsByStep[step] || []).map(q => q.fieldName);
  };

  // ─── Validate dynamically ─────────────────────────────────────────────────
  const validateStep = (step: number): { valid: boolean; firstError?: string } => {
    // Step 4 (Dokumen) uses custom state and native HTML validation, not react-hook-form
    if (step === 4) return { valid: true };

    const stepQuestions = questionsByStep[step] || [];
    for (const q of stepQuestions) {
      if (!q.isRequired) continue;
      // Skip hidden fields (asalSekolah is auto-populated)
      if (q.fieldName === 'asalSekolah') continue;
      const val = getValues(q.fieldName);
      if (val === undefined || val === null || val === '') {
        setError(q.fieldName, { type: 'required', message: `${q.label} wajib diisi` });
        return { valid: false, firstError: q.fieldName };
      }
      // Phone number validation
      if (q.fieldType === 'tel' && val) {
        if (!/^\d{10,15}$/.test(val)) {
          setError(q.fieldName, { type: 'pattern', message: `${q.label} harus berupa 10-15 digit angka` });
          return { valid: false, firstError: q.fieldName };
        }
      }
      // NISN validation
      if (q.fieldName === 'nisn' && val) {
        if (!/^\d{10}$/.test(val)) {
          setError(q.fieldName, { type: 'pattern', message: 'NISN harus tepat 10 digit angka' });
          return { valid: false, firstError: q.fieldName };
        }
      }
    }

    // Special: Check jurusan 1 !== jurusan 2
    if (step === 3) {
      const j1 = getValues('pilihanJurusan1');
      const j2 = getValues('pilihanJurusan2');
      if (j1 && j2 && j1 === j2) {
        setError('pilihanJurusan2', { type: 'manual', message: 'Jurusan Pilihan 1 dan 2 tidak boleh sama' });
        return { valid: false, firstError: 'pilihanJurusan2' };
      }
    }

    return { valid: true };
  };

  // ─── Navigation ───────────────────────────────────────────────────────────
  const handleNext = async () => {
    const { valid } = validateStep(currentStep);
    if (!valid) {
      toast.error('Mohon lengkapi semua kolom yang wajib diisi.');
      return;
    }

    // Special: Verify NISN on step 1
    if (currentStep === 1) {
      setIsSubmitting(true);
      try {
        const nisn = getValues('nisn');
        const tanggalLahir = getValues('tanggalLahir');
        const namaLengkap = getValues('namaLengkap');
        const tempatLahir = getValues('tempatLahir');
        const jenisKelamin = getValues('jenisKelamin');
        
        const res = await fetch('/api/verifikasi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nisn, tanggalLahir, namaLengkap, tempatLahir, jenisKelamin })
        });
        const result = await res.json();
        setIsSubmitting(false);
        
        if (!res.ok) {
          toast.error(result.message || "Verifikasi gagal. Periksa kembali data Anda.");
          if (result.field) {
            setError(result.field, { type: "server", message: result.message });
          } else if (result.message?.includes("Tanggal lahir")) {
            setError("tanggalLahir", { type: "server", message: "Tanggal lahir tidak sesuai dengan data kelulusan" });
          } else {
            setError("nisn", { type: "server", message: "Data NISN tidak ditemukan atau Anda tidak terdaftar" });
          }
          return;
        }

        // Store verified student data (for auto-populating asalSekolah etc.)
        if (result.data) {
          setVerifiedStudent(result.data);
        }
      } catch (error) {
        setIsSubmitting(false);
        toast.error("Gagal memverifikasi data. Periksa koneksi Anda.");
        return;
      }
    }

    setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const onSubmitForm = async () => {
    // Validate last step too
    const { valid } = validateStep(currentStep);
    if (!valid) return;

    // Check required documents
    const unselected = Object.entries(files)
      .filter(([_, file]) => file === null)
      .map(([name]) => name);
      
    if (unselected.length > 0) {
      setMissingDocs(unselected);
      toast.error(`Mohon unggah semua dokumen yang diwajibkan (${unselected[0]}).`);
      return;
    }
    
    setMissingDocs([]);
    setIsSubmitting(true);
    setUploadProgress(10);
    
    try {
      // 1. Upload files to Cloudinary
      const dokumen: Record<string, string> = {};
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
      const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY || '';

      const signRes = await fetch('/api/cloudinary/sign');
      if (!signRes.ok) throw new Error("Gagal mengambil signature upload");
      const { timestamp, signature } = await signRes.json();

      const totalFiles = Object.keys(files).length;
      let uploadedCount = 0;

      for (const [docName, file] of Object.entries(files)) {
        if (!file) continue;

        const formData = new window.FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) throw new Error(`Gagal mengunggah ${docName}`);
        
        const uploadData = await uploadRes.json();
        
        let schemaKey = docName;
        if (docName === "Surat Keterangan Lulus (SKL)") schemaKey = "ijazahUrl";
        else if (docName === "Kartu Keluarga (KK)") schemaKey = "kartuKeluargaUrl";
        else if (docName === "Akta Kelahiran") schemaKey = "aktaKelahiranUrl";
        
        dokumen[schemaKey] = uploadData.secure_url;
        
        uploadedCount++;
        setUploadProgress(10 + Math.round((uploadedCount / totalFiles) * 70));
      }

      // 2. Build payload from dynamic form values
      const allValues = getValues();
      
      // Map known core fields to the fixed schema
      const payload = {
        dataPribadi: {
          nisn: allValues.nisn || '',
          namaLengkap: allValues.namaLengkap || '',
          tempatLahir: allValues.tempatLahir || '',
          tanggalLahir: allValues.tanggalLahir || '',
          jenisKelamin: allValues.jenisKelamin || 'L',
          agama: allValues.agama || 'Islam',
          alamat: allValues.alamatLengkap || allValues.alamat || '',
        },
        dataOrtu: {
          namaAyah: allValues.namaOrangTua || allValues.namaAyah || '',
          pekerjaanAyah: allValues.pekerjaanOrangTua || allValues.pekerjaanAyah || '',
          namaIbu: allValues.namaibu || allValues.namaIbu || '',
          pekerjaanIbu: allValues.pekerjaaibu || allValues.pekerjaanIbu || '',
          noTelpOrtu: allValues.noTelpOrangTua || allValues.noTelpOrtu || allValues.notelpibu || '',
        },
        dataAkademik: {
          asalSekolah: verifiedStudent?.asalSekolah || allValues.asalSekolah || '',
          jurusanPilihan1: allValues.pilihanJurusan1 || '',
          jurusanPilihan2: allValues.pilihanJurusan2 || '',
        },
        dokumen,
        // Store ALL dynamic field values for future flexibility
        dynamicData: allValues,
      };
      
      setUploadProgress(90);
      
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      setUploadProgress(100);
      setIsSubmitting(false);

      if (!res.ok) {
        toast.error(result.message || "Terjadi kesalahan saat mengirim data.");
        return;
      }

      toast.success("Daftar ulang berhasil! Mengarahkan ke halaman bukti...");
      navigate(`/bukti-daftar-ulang?nisn=${result.nisn}`, { state: { registration: result } });
    } catch (err: any) {
      setIsSubmitting(false);
      toast.error(err?.message || "Gagal mengirim data pendaftaran.");
    }
  };

  // ─── File Handling ────────────────────────────────────────────────────────
  const handleFileChange = (docName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error(`Format file ${docName} tidak didukung. Harap unggah PDF, JPG, atau PNG.`);
        return;
      }
      
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

  // ─── Registration open check ──────────────────────────────────────────────
  const getSetting = useSettingsStore(s => s.getSetting);
  const isRegistrationOpen = getSetting('is_registration_open');
  const deadline = getSetting('registration_deadline');
  const isPastDeadline = deadline ? new Date() > new Date(deadline) : false;
  const isClosed = isRegistrationOpen === 'false' || isPastDeadline;

  if (isClosed) {
    return (
      <div className="w-full min-h-screen pt-32 pb-12 px-4 md:px-8 xl:max-w-6xl mx-auto flex items-center justify-center">
        <Card className="shadow-xl shadow-slate-200/50 border-0 max-w-lg w-full text-center">
          <CardContent>
            <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mt-6 mb-2">Pendaftaran Ditutup</h1>
            <p className="text-slate-500 mb-4">
              {isPastDeadline
                ? 'Batas waktu daftar ulang telah berakhir. Silakan hubungi panitia untuk informasi lebih lanjut.'
                : 'Pendaftaran sedang ditutup sementara oleh admin. Silakan cek kembali nanti.'}
            </p>
            {deadline && (
              <p className="text-sm text-slate-400">
                Deadline: {new Date(deadline).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Loading state ────────────────────────────────────────────────────────
  if (isLoadingQuestions) {
    return (
      <div className="w-full min-h-screen pt-32 pb-12 px-4 md:px-8 xl:max-w-6xl mx-auto flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-slate-500 text-sm">Memuat formulir pendaftaran...</p>
        </div>
      </div>
    );
  }

  // ─── Dynamic Field Renderer ───────────────────────────────────────────────
  const renderField = (q: FormQuestion) => {
    const fieldError = (errors as any)[q.fieldName];
    const errorMsg = fieldError?.message as string | undefined;

    // Skip: asalSekolah is auto-populated from passed_students data
    if (q.fieldName === 'asalSekolah') return null;

    // Special: Jurusan fields use the jurusan API data
    if (q.fieldName === 'pilihanJurusan1' || q.fieldName === 'pilihanJurusan2') {
      return (
        <Select
          key={q.id}
          label={q.label}
          options={jurusanOptions}
          {...register(q.fieldName)}
          error={errorMsg}
          required={q.isRequired}
        />
      );
    }

    switch (q.fieldType) {
      case 'select': {
        const opts = [
          { value: '', label: `-- Pilih ${q.label} --` },
          ...(q.options || []).map(o => ({ value: o, label: o }))
        ];
        return (
          <Select
            key={q.id}
            label={q.label}
            options={opts}
            {...register(q.fieldName)}
            error={errorMsg}
            required={q.isRequired}
          />
        );
      }

      case 'radio': {
        return (
          <div key={q.id} className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              {q.label} {q.isRequired && <span className="text-destructive">*</span>}
            </label>
            <div className="flex flex-wrap gap-4">
              {(q.options || []).map(opt => {
                // Map display labels to stored values for jenisKelamin
                let storeValue = opt;
                if (q.fieldName === 'jenisKelamin') {
                  if (opt === 'Laki-laki') storeValue = 'L';
                  else if (opt === 'Perempuan') storeValue = 'P';
                }
                return (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                    <input
                      type="radio"
                      value={storeValue}
                      {...register(q.fieldName)}
                      className="w-4 h-4 text-primary focus:ring-primary border-slate-300"
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
            {errorMsg && <p className="text-xs text-destructive font-medium">{errorMsg}</p>}
          </div>
        );
      }

      case 'textarea':
        return (
          <div key={q.id} className="md:col-span-2 space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              {q.label} {q.isRequired && <span className="text-destructive">*</span>}
            </label>
            <textarea 
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm focus:outline-none transition-all ${errorMsg ? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/10' : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10'}`}
              rows={3}
              placeholder={q.placeholder || ''}
              {...register(q.fieldName)}
            />
            {errorMsg && <p className="text-xs text-destructive font-medium">{errorMsg}</p>}
          </div>
        );

      case 'date':
        return (
          <Input
            key={q.id}
            type="date"
            label={q.label}
            {...register(q.fieldName)}
            error={errorMsg}
            required={q.isRequired}
          />
        );

      case 'number':
        return (
          <Input
            key={q.id}
            type="number"
            label={q.label}
            placeholder={q.placeholder || ''}
            {...register(q.fieldName)}
            error={errorMsg}
            required={q.isRequired}
          />
        );

      case 'email':
        return (
          <Input
            key={q.id}
            type="email"
            label={q.label}
            placeholder={q.placeholder || ''}
            {...register(q.fieldName)}
            error={errorMsg}
            required={q.isRequired}
          />
        );

      case 'tel':
        return (
          <Input
            key={q.id}
            type="tel"
            label={q.label}
            placeholder={q.placeholder || '08xxxxxxxxxx'}
            {...register(q.fieldName)}
            error={errorMsg}
            required={q.isRequired}
          />
        );

      case 'text':
      default:
        return (
          <Input
            key={q.id}
            label={q.label}
            placeholder={q.placeholder || ''}
            {...register(q.fieldName)}
            error={errorMsg}
            required={q.isRequired}
            list={q.fieldName === 'asalSekolah' ? 'sekolah-saran' : undefined}
          />
        );
    }
  };

  return (
    <div className="w-full min-h-screen pt-32 pb-12 px-4 md:px-8 xl:max-w-6xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Formulir Daftar Ulang</h1>
        <p className="text-slate-500">Lengkapi data di bawah ini dengan informasi yang valid dan benar.</p>
      </div>

      <div className="mb-10 px-2 md:px-10">
        <Stepper steps={STEP_TITLES} currentStep={currentStep} />
      </div>

      <Card className="shadow-xl shadow-slate-200/50 border-0 overflow-hidden">
        <CardContent className="p-0">
          <form onSubmit={(e) => { 
            e.preventDefault(); 
            if (currentStep === 4) onSubmitForm(); 
            else handleNext(); 
          }}>
            <div className="p-6 md:p-10 min-h-[400px]">
              <div>
                {/* ─── Step 1: Data Pribadi ───────────────────────── */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-800 border-b pb-2 mb-6">1. Data Pribadi Calon Siswa</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(questionsByStep[1] || []).map(q => renderField(q))}
                    </div>
                  </div>
                )}

                {/* ─── Step 2: Data Orang Tua ─────────────────────── */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-800 border-b pb-2 mb-6">2. Data Orang Tua / Wali</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(questionsByStep[2] || []).map(q => renderField(q))}
                    </div>
                  </div>
                )}

                {/* ─── Step 3: Data Akademik ──────────────────────── */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-800 border-b pb-2 mb-6">3. Data Akademik & Pilihan Jurusan</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(questionsByStep[3] || []).map(q => renderField(q))}
                    </div>
                  </div>
                )}

                {/* ─── Step 4: Upload & Konfirmasi ────────────────── */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-800 border-b pb-2 mb-6">4. Upload Berkas & Konfirmasi</h2>
                    <p className="text-sm text-slate-500 mb-4">Pilih dokumen pendaftaran (PDF/JPG maksimal 2MB per file).</p>
                    
                    <div className="space-y-4 mb-8">
                      {["Surat Keterangan Lulus (SKL)", "Kartu Keluarga (KK)", "Akta Kelahiran"].map((doc) => {
                        const isMissing = missingDocs.includes(doc);
                        return (
                          <div key={doc}>
                            <div className={`border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white shadow-sm transition-colors ${isMissing ? 'border-destructive bg-destructive/5' : 'border-slate-200'}`}>
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isMissing ? 'bg-destructive/10 text-destructive' : 'bg-slate-50 text-slate-400'}`}>
                                  <FileText className={`w-5 h-5 ${files[doc] ? 'text-success' : ''}`} />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-slate-800 text-sm">{doc} <span className="text-destructive">*</span></h4>
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
                                  onChange={(e) => {
                                    handleFileChange(doc, e);
                                    if (e.target.files && e.target.files[0]) {
                                      setMissingDocs(prev => prev.filter(d => d !== doc));
                                    }
                                  }}
                                  className="hidden"
                                />
                                <Button 
                                  type="button" 
                                  variant={files[doc] ? "ghost" : (isMissing ? "danger" : "outline")} 
                                  size="sm" 
                                  leftIcon={<Upload className="w-4 h-4" />}
                                  onClick={() => document.getElementById(`file-upload-${doc}`)?.click()}
                                >
                                  {files[doc] ? "Ubah File" : "Pilih File"}
                                </Button>
                              </div>
                            </div>
                            {isMissing && (
                              <p className="text-xs text-destructive font-medium mt-1.5 ml-1">Dokumen ini wajib diunggah.</p>
                            )}
                          </div>
                        );
                      })}
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
                          <div 
                            className="h-full bg-primary transition-all duration-300 ease-in-out" 
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
