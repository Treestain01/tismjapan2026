import type { ItineraryDay, CreateItineraryDayBody, UpdateItineraryDayBody } from '../types';

const BASE = import.meta.env.VITE_API_URL ?? '';

export async function fetchItinerary(): Promise<ItineraryDay[]> {
  const res = await fetch(`${BASE}/api/itinerary`);
  if (!res.ok) throw new Error(`Failed to fetch itinerary: ${res.status}`);
  return res.json();
}

export async function createItineraryDay(body: CreateItineraryDayBody): Promise<ItineraryDay> {
  const res = await fetch(`${BASE}/api/itinerary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
    throw new Error(err.error ?? `Failed to create itinerary day: ${res.status}`);
  }
  return res.json() as Promise<ItineraryDay>;
}

export async function updateItineraryDay(day: number, body: UpdateItineraryDayBody): Promise<ItineraryDay> {
  const res = await fetch(`${BASE}/api/itinerary/${day}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
    throw new Error(err.error ?? `Failed to update itinerary day: ${res.status}`);
  }
  return res.json() as Promise<ItineraryDay>;
}
