import type { Location } from '../types';

const BASE = import.meta.env.VITE_API_URL ?? '';

export async function fetchLocations(): Promise<Location[]> {
  const res = await fetch(`${BASE}/api/locations`);
  if (!res.ok) throw new Error(`Failed to fetch locations: ${res.status}`);
  return res.json();
}

export async function fetchLocation(id: string): Promise<Location> {
  const res = await fetch(`${BASE}/api/locations/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch location: ${res.status}`);
  return res.json();
}
