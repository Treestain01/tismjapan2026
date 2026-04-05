import type { Location, CreateLocationBody, UpdateLocationBody } from '../types';

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

export async function createLocation(body: CreateLocationBody): Promise<Location> {
  const res = await fetch(`${BASE}/api/locations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to create location: ${res.status}`);
  return res.json() as Promise<Location>;
}

export async function updateLocation(id: string, body: UpdateLocationBody): Promise<Location> {
  const res = await fetch(`${BASE}/api/locations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to update location: ${res.status}`);
  return res.json() as Promise<Location>;
}
