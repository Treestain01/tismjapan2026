import type { GalleryImage } from '../types';

const BASE = import.meta.env.VITE_API_URL ?? '';

export async function fetchGallery(): Promise<GalleryImage[]> {
  const res = await fetch(`${BASE}/api/gallery`);
  if (!res.ok) throw new Error(`Failed to fetch gallery: ${res.status}`);
  return res.json();
}
