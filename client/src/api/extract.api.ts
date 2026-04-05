import type { ExtractedLocation } from '../types';

const BASE = import.meta.env.VITE_API_URL ?? '';

export async function extractLocation(mapsUrl: string): Promise<ExtractedLocation> {
  const res = await fetch(`${BASE}/api/extract-location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mapsUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Extraction failed' })) as { error?: string };
    throw new Error(err.error ?? 'Extraction failed');
  }
  return res.json() as Promise<ExtractedLocation>;
}
