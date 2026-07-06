/**
 * Navigation links — these are route-based and do not change from admin.
 * All other school constants (name, address, jurusan, documents, social)
 * are now fetched dynamically from the database via useSettingsStore,
 * useSocialMediaStore, and the /api/* endpoints.
 */
export const NAV_LINKS = [
  { label: "Beranda", path: "/" },
  { label: "Cek Kelulusan", path: "/verifikasi" },
  { label: "Daftar Ulang", path: "/daftar-ulang" },
] as const;
