import type { TripInfo } from '../types';

const BASE = import.meta.env.VITE_API_URL ?? '';

export async function fetchTrip(): Promise<TripInfo> {
  const res = await fetch(`${BASE}/api/trip`);
  if (!res.ok) throw new Error(`Failed to fetch trip info: ${res.status}`);
  return res.json();
}

export async function addCity(city: string): Promise<void> {
  const res = await fetch(`${BASE}/api/trip/cities`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
    throw new Error(err.error ?? `Failed to add city: ${res.status}`);
  }
}
