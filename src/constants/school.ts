export const SCHOOL = {
  name: "SMKN 5 KOTA SERANG",
  fullName: "SMK Negeri 5 Kota Serang",
  tagline: "Disiplin, Cerdas dan Terampil",
  address: "Jl. Raya Gunungsari, Cilowong, Kec. Taktakan, Kota Serang, Banten",
  phone: "0254 7919331",
  email: "infosmkn5@gmail.com",
  website: "www.smkn5kotaserang.sch.id",
  year: "2025/2026",
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
  { code: "TJKT", name: "Teknik Jaringan Komputer dan Telekomunikasi" },
  { code: "PPLG", name: "Pengembangan Perangkat Lunak dan Gim" },
  { code: "DKV", name: "Desain Komunikasi Visual" },
  { code: "AKL", name: "Akuntansi dan Keuangan Lembaga" },
  { code: "MP", name: "Manajemen Perkantoran" },
  { code: "BDP", name: "Bisnis Daring dan Pemasaran" },
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
  { name: "Instagram", url: "https://instagram.com/smkn5kotaserang", icon: "instagram" },
  { name: "Facebook", url: "https://facebook.com/smkn5kotaserang", icon: "facebook" },
  { name: "YouTube", url: "https://youtube.com/@smkn5kotaserang", icon: "youtube" },
] as const;
