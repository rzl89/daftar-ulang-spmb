export const SCHOOL = {
  name: "NAMA SEKOLAH",
  fullName: "Nama Lengkap Sekolah",
  tagline: "Tagline Sekolah",
  address: "Alamat Sekolah",
  phone: "(021) 12345678",
  email: "email@sekolah.sch.id",
  website: "www.sekolah.sch.id",
  year: "YYYY/YYYY",
} as const;

// Registration deadline: 7 days from today
export const getRegistrationDeadline = (): Date => {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);
  deadline.setHours(23, 59, 59, 999);
  return deadline;
};

export const REGISTRATION_DEADLINE = getRegistrationDeadline();

export const NAV_LINKS = [
  { label: "Beranda", path: "/" },
  { label: "Cek Kelulusan", path: "/verifikasi" },
  { label: "Daftar Ulang", path: "/daftar-ulang" },
] as const;

export const JURUSAN = [
  { code: "JURUSAN1", name: "Nama Jurusan 1" },
  { code: "JURUSAN2", name: "Nama Jurusan 2" },
] as const;

export const REQUIRED_DOCUMENTS = [
  "Fotocopy Ijazah / SKL (dilegalisir)",
  "Fotocopy SKHUN (dilegalisir)",
  "Fotocopy Kartu Keluarga",
  "Fotocopy Akta Kelahiran",
  "Fotocopy KTP Orang Tua/Wali",
  "Pas Foto 3x4 (4 lembar, latar merah)",
  "Surat Keterangan Sehat dari Dokter",
  "Fotocopy Rapor Semester 1-5",
] as const;

export const SOCIAL_LINKS = [
  { name: "Instagram", url: "https://instagram.com/sekolah", icon: "instagram" },
  { name: "Facebook", url: "https://facebook.com/sekolah", icon: "facebook" },
  { name: "YouTube", url: "https://youtube.com/@sekolah", icon: "youtube" },
] as const;
