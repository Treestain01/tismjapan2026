import type { ItineraryDay } from '../types';

const BASE = import.meta.env.VITE_API_URL ?? '';

export async function fetchItinerary(): Promise<ItineraryDay[]> {
  const res = await fetch(`${BASE}/api/itinerary`);
  if (!res.ok) throw new Error(`Failed to fetch itinerary: ${res.status}`);
  return res.json();
}
