import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { sql } from '../db/client';
import type { Location, CreateLocationBody } from '../types';

const JSON_PATH = join(__dirname, '../data/locations.json');

function rowToLocation(row: Record<string, unknown>): Location {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as Location['category'],
    coordinates: { lng: row.lng as number, lat: row.lat as number },
    city: row.city as Location['city'],
    summary: row.summary as string,
    description: row.description as string,
    address: row.address as string,
    openingHours: row.opening_hours as string | null,
    estimatedCost: row.estimated_cost as string | null,
    itineraryDays: row.itinerary_days as number[],
    imageUrls: row.image_urls as string[],
    externalLinks: row.external_links as { label: string; url: string }[],
  };
}

async function jsonFindAll(): Promise<Location[]> {
  return JSON.parse(readFileSync(JSON_PATH, 'utf-8')) as Location[];
}

async function jsonFindById(id: string): Promise<Location | undefined> {
  const all = await jsonFindAll();
  return all.find(l => l.id === id);
}

async function jsonCreate(location: Location): Promise<Location> {
  const all = await jsonFindAll();
  all.push(location);
  writeFileSync(JSON_PATH, JSON.stringify(all, null, 2));
  return location;
}

export const locationsRepository = {
  findAll: async (): Promise<Location[]> => {
    if (sql) {
      const rows = await sql`SELECT * FROM locations ORDER BY id`;
      return (rows as unknown as Record<string, unknown>[]).map(rowToLocation);
    }
    return jsonFindAll();
  },

  findById: async (id: string): Promise<Location | undefined> => {
    if (sql) {
      const rows = await sql`SELECT * FROM locations WHERE id = ${id}`;
      const r = rows as unknown as Record<string, unknown>[];
      return r[0] ? rowToLocation(r[0]) : undefined;
    }
    return jsonFindById(id);
  },

  create: async (body: CreateLocationBody): Promise<Location> => {
    const location: Location = {
      id: body.id,
      name: body.name,
      category: body.category,
      coordinates: body.coordinates,
      city: body.city as Location['city'],
      summary: body.summary ?? '',
      description: body.description ?? '',
      address: body.address ?? '',
      openingHours: body.openingHours ?? null,
      estimatedCost: body.estimatedCost ?? null,
      itineraryDays: body.itineraryDays ?? [],
      imageUrls: body.imageUrls ?? [],
      externalLinks: body.externalLinks ?? [],
    };

    if (sql) {
      await sql`
        INSERT INTO locations (
          id, name, category, lng, lat, city, summary, description, address,
          opening_hours, estimated_cost, itinerary_days, image_urls, external_links
        ) VALUES (
          ${location.id}, ${location.name}, ${location.category},
          ${location.coordinates.lng}, ${location.coordinates.lat},
          ${location.city}, ${location.summary}, ${location.description},
          ${location.address}, ${location.openingHours}, ${location.estimatedCost},
          ${location.itineraryDays}, ${location.imageUrls},
          ${JSON.stringify(location.externalLinks)}
        )
      `;
      return location;
    }
    return jsonCreate(location);
  },
};
