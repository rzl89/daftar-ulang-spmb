import { useState, useEffect } from 'react';

type ContentMap = Record<string, string>;

// Cache sederhana di memory agar tidak fetch ulang per komponen
const cache: Record<string, ContentMap> = {};

/**
 * Hook untuk mengambil konten halaman dinamis dari database.
 * Admin dapat mengubah teks dari panel Kelola Konten.
 *
 * @param page - Nama halaman: 'beranda' | 'verifikasi' | 'daftar-ulang' | 'bukti'
 * @param fallbacks - Objek fallback teks default jika API gagal atau data belum ada
 */
export function usePageContent(page: string, fallbacks?: ContentMap) {
  const [content, setContent] = useState<ContentMap>(cache[page] || fallbacks || {});
  const [isLoading, setIsLoading] = useState(!cache[page]);

  useEffect(() => {
    if (cache[page]) {
      setContent(cache[page]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch(`/api/page-contents?page=${encodeURIComponent(page)}`)
      .then(r => r.json())
      .then((data: ContentMap) => {
        // Merge fallback dengan data dari DB (DB override fallback)
        const merged = { ...(fallbacks || {}), ...data };
        cache[page] = merged;
        setContent(merged);
      })
      .catch(() => {
        // Gunakan fallback jika ada error
        if (fallbacks) setContent(fallbacks);
      })
      .finally(() => setIsLoading(false));
  }, [page]);

  /**
   * Ambil nilai konten berdasarkan key section.
   * @param key - section key, contoh: 'hero_title'
   * @param fallback - nilai default jika section tidak ditemukan
   */
  const get = (key: string, fallback = '') => content[key] ?? fallback;

  return { content, get, isLoading };
}

/** Invalidate cache untuk halaman tertentu (digunakan setelah save di admin) */
export function invalidatePageContentCache(page?: string) {
  if (page) {
    delete cache[page];
  } else {
    Object.keys(cache).forEach(k => delete cache[k]);
  }
}
