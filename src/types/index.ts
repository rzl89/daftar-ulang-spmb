export type RegistrationStatus = "lulus" | "pending" | "ditolak" | "selesai";

export interface Student {
  id: string;
  nisn: string;
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  agama: string;
  alamat: string;
  noTelp: string;
  emailOrtu: string;
  namaAyah: string;
  namaIbu: string;
  pekerjaanAyah: string;
  pekerjaanIbu: string;
  noTelpOrtu: string;
  asalSekolah: string;
  jurusanPilihan1: string;
  jurusanPilihan2: string;
  nilaiRataRata: number;
  status: RegistrationStatus;
  tanggalDaftar: string;
  dokumen: DocumentUpload[];
}

export interface DocumentUpload {
  nama: string;
  status: "uploaded" | "pending" | "rejected";
  url?: string;
}

export interface FormStep {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface RegistrationFormData {
  // Step 1: Data Pribadi
  nisn: string;
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  agama: string;
  alamat: string;
  noTelp: string;

  // Step 2: Data Orang Tua
  namaAyah: string;
  namaIbu: string;
  pekerjaanAyah: string;
  pekerjaanIbu: string;
  noTelpOrtu: string;
  emailOrtu: string;

  // Step 3: Data Akademik
  asalSekolah: string;
  jurusanPilihan1: string;
  jurusanPilihan2: string;
  nilaiRataRata: number;

  // Step 4: Dokumen
  dokumen: File[];
}
