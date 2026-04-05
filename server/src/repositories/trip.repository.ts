import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { sql } from '../db/client';
import type { TripInfo } from '../types';

const JSON_PATH = join(__dirname, '../data/trip.json');

function rowToTripInfo(row: Record<string, unknown>): TripInfo {
  return {
    title: row.title as string,
    departureDate: row.departure_date as string,
    returnDate: row.return_date as string,
    description: row.description as string,
    cities: row.cities as string[],
  };
}

async function jsonGet(): Promise<TripInfo> {
  return JSON.parse(readFileSync(JSON_PATH, 'utf-8')) as TripInfo;
}

async function jsonAddCity(city: string): Promise<TripInfo> {
  const trip = await jsonGet();
  if (!trip.cities.includes(city)) {
    trip.cities.push(city);
    writeFileSync(JSON_PATH, JSON.stringify(trip, null, 2));
  }
  return trip;
}

export const tripRepository = {
  get: async (): Promise<TripInfo> => {
    if (sql) {
      const rows = await sql`SELECT * FROM trip_info WHERE id = 1`;
      const r = rows as unknown as Record<string, unknown>[];
      if (!r[0]) throw new Error('Trip info not found');
      return rowToTripInfo(r[0]);
    }
    return jsonGet();
  },

  addCity: async (city: string): Promise<TripInfo> => {
    if (sql) {
      const rows = await sql`SELECT * FROM trip_info WHERE id = 1`;
      const r = rows as unknown as Record<string, unknown>[];
      if (!r[0]) throw new Error('Trip info not found');
      const current = rowToTripInfo(r[0]);
      if (!current.cities.includes(city)) {
        await sql`UPDATE trip_info SET cities = array_append(cities, ${city}) WHERE id = 1`;
        current.cities.push(city);
      }
      return current;
    }
    return jsonAddCity(city);
  },
};
