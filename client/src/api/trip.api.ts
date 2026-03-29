import type { TripInfo } from '../types';

const BASE = import.meta.env.VITE_API_URL ?? '';

export async function fetchTrip(): Promise<TripInfo> {
  const res = await fetch(`${BASE}/api/trip`);
  if (!res.ok) throw new Error(`Failed to fetch trip info: ${res.status}`);
  return res.json();
}
