/**
 * One-time seed script: reads all JSON data files and inserts into NeonDB.
 * Usage: DATABASE_URL="postgresql://..." npx ts-node src/db/seed.ts
 * Safe to re-run: uses INSERT ... ON CONFLICT DO NOTHING
 */
import { neon } from '@neondatabase/serverless';
import locationsData from '../data/locations.json';
import itineraryData from '../data/itinerary.json';
import tripData from '../data/trip.json';
import type { Location, ItineraryDay, TripInfo } from '../types';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function seed() {
  console.log('Seeding locations...');
  for (const loc of locationsData as Location[]) {
    await sql`
      INSERT INTO locations (id, name, category, lng, lat, city, summary, description, address,
        opening_hours, estimated_cost, itinerary_days, image_urls, external_links)
      VALUES (
        ${loc.id}, ${loc.name}, ${loc.category},
        ${loc.coordinates.lng}, ${loc.coordinates.lat},
        ${loc.city}, ${loc.summary}, ${loc.description}, ${loc.address},
        ${loc.openingHours}, ${loc.estimatedCost},
        ${loc.itineraryDays}, ${loc.imageUrls}, ${JSON.stringify(loc.externalLinks)}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }
  console.log(`  Seeded ${(locationsData as Location[]).length} locations`);

  console.log('Seeding itinerary days...');
  for (const day of itineraryData as ItineraryDay[]) {
    await sql`
      INSERT INTO itinerary_days (day, date, city, title, location_ids)
      VALUES (${day.day}, ${day.date}, ${day.city}, ${day.title}, ${day.locationIds})
      ON CONFLICT (day) DO NOTHING
    `;
    if (day.events?.length) {
      for (let i = 0; i < day.events.length; i++) {
        const evt = day.events[i];
        await sql`
          INSERT INTO itinerary_events (day, time, label, sort_order)
          VALUES (${day.day}, ${evt.time}, ${evt.label}, ${i})
          ON CONFLICT DO NOTHING
        `;
      }
    }
  }
  console.log(`  Seeded ${(itineraryData as ItineraryDay[]).length} itinerary days`);

  console.log('Seeding trip info...');
  const trip = tripData as TripInfo;
  await sql`
    INSERT INTO trip_info (id, title, departure_date, return_date, description, cities)
    VALUES (1, ${trip.title}, ${trip.departureDate}, ${trip.returnDate},
            ${trip.description}, ${trip.cities})
    ON CONFLICT (id) DO NOTHING
  `;
  console.log('  Seeded trip info');

  console.log('Seed complete!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
