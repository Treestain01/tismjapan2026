import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { sql } from '../db/client';
import type { ItineraryDay, CreateItineraryDayBody, UpdateItineraryDayBody } from '../types';

const JSON_PATH = join(__dirname, '../data/itinerary.json');

function rowToItineraryDay(
  dayRow: Record<string, unknown>,
  eventRows: Record<string, unknown>[],
): ItineraryDay {
  const events = eventRows.map(e => ({
    time: e.time as string,
    label: e.label as string,
  }));
  const result: ItineraryDay = {
    day: dayRow.day as number,
    date: dayRow.date as string,
    city: dayRow.city as string,
    title: dayRow.title as string,
    locationIds: dayRow.location_ids as string[],
  };
  if (events.length > 0) {
    result.events = events;
  }
  return result;
}

async function jsonFindAll(): Promise<ItineraryDay[]> {
  return JSON.parse(readFileSync(JSON_PATH, 'utf-8')) as ItineraryDay[];
}

async function jsonFindByDay(day: number): Promise<ItineraryDay | undefined> {
  const all = await jsonFindAll();
  return all.find(d => d.day === day);
}

async function jsonUpdateDay(day: number, body: UpdateItineraryDayBody): Promise<ItineraryDay> {
  const all = await jsonFindAll();
  const idx = all.findIndex(d => d.day === day);
  if (idx === -1) throw new Error(`Day ${day} not found`);
  const updated: ItineraryDay = {
    day,
    date: body.date,
    city: body.city,
    title: body.title,
    locationIds: body.locationIds,
  };
  if (body.events && body.events.length > 0) {
    updated.events = body.events;
  }
  all[idx] = updated;
  writeFileSync(JSON_PATH, JSON.stringify(all, null, 2));
  return updated;
}

async function jsonCreate(body: CreateItineraryDayBody): Promise<ItineraryDay> {
  const all = await jsonFindAll();
  const newDay: ItineraryDay = {
    day: body.day,
    date: body.date,
    city: body.city,
    title: body.title,
    locationIds: body.locationIds ?? [],
  };
  if (body.events && body.events.length > 0) {
    newDay.events = body.events;
  }
  all.push(newDay);
  writeFileSync(JSON_PATH, JSON.stringify(all, null, 2));
  return newDay;
}

async function jsonAddLocation(
  day: number,
  locationIds: string[],
  events: { time: string; label: string }[],
): Promise<ItineraryDay> {
  const all = await jsonFindAll();
  const idx = all.findIndex(d => d.day === day);
  if (idx === -1) throw new Error(`Day ${day} not found`);
  all[idx] = {
    ...all[idx],
    locationIds: [...all[idx].locationIds, ...locationIds],
    events: [...(all[idx].events ?? []), ...events],
  };
  writeFileSync(JSON_PATH, JSON.stringify(all, null, 2));
  return all[idx];
}

export const itineraryRepository = {
  findAll: async (): Promise<ItineraryDay[]> => {
    if (sql) {
      // Two queries instead of N+1: all days, then all events grouped client-side
      const [dayRows, evtRows] = await Promise.all([
        sql`SELECT * FROM itinerary_days ORDER BY day`,
        sql`SELECT * FROM itinerary_events ORDER BY day, sort_order`,
      ]);
      const days = dayRows as unknown as Record<string, unknown>[];
      const evts = evtRows as unknown as Record<string, unknown>[];
      // Group events by day
      const eventsByDay = new Map<number, Record<string, unknown>[]>();
      for (const evt of evts) {
        const day = evt.day as number;
        const group = eventsByDay.get(day) ?? [];
        group.push(evt);
        eventsByDay.set(day, group);
      }
      return days.map(d =>
        rowToItineraryDay(d, eventsByDay.get(d.day as number) ?? []),
      );
    }
    return jsonFindAll();
  },

  findByDay: async (day: number): Promise<ItineraryDay | undefined> => {
    if (sql) {
      const dayRows = await sql`SELECT * FROM itinerary_days WHERE day = ${day}`;
      const days = dayRows as unknown as Record<string, unknown>[];
      if (!days[0]) return undefined;
      const evtRows = await sql`
        SELECT * FROM itinerary_events WHERE day = ${day} ORDER BY sort_order
      `;
      return rowToItineraryDay(days[0], evtRows as unknown as Record<string, unknown>[]);
    }
    return jsonFindByDay(day);
  },

  addLocation: async (
    day: number,
    locationIds: string[],
    events: { time: string; label: string }[],
  ): Promise<ItineraryDay> => {
    if (sql) {
      await sql`BEGIN`;
      try {
        await sql`
          UPDATE itinerary_days
          SET location_ids = array_cat(location_ids, ${locationIds}::text[])
          WHERE day = ${day}
        `;
        // Append new events after existing ones — find current max sort_order
        const countRows = await sql`
          SELECT COALESCE(MAX(sort_order), -1) AS max_order
          FROM itinerary_events WHERE day = ${day}
        `;
        let nextOrder = ((countRows as unknown as { max_order: number }[])[0]?.max_order ?? -1) + 1;
        for (const evt of events) {
          await sql`
            INSERT INTO itinerary_events (day, time, label, sort_order)
            VALUES (${day}, ${evt.time}, ${evt.label}, ${nextOrder++})
          `;
        }
        await sql`COMMIT`;
      } catch (err) {
        await sql`ROLLBACK`;
        throw err;
      }
      const evtRows = await sql`
        SELECT * FROM itinerary_events WHERE day = ${day} ORDER BY sort_order
      `;
      const dayRows = await sql`SELECT * FROM itinerary_days WHERE day = ${day}`;
      const days = dayRows as unknown as Record<string, unknown>[];
      return rowToItineraryDay(days[0], evtRows as unknown as Record<string, unknown>[]);
    }
    return jsonAddLocation(day, locationIds, events);
  },

  update: async (day: number, body: UpdateItineraryDayBody): Promise<ItineraryDay> => {
    if (sql) {
      await sql`BEGIN`;
      try {
        await sql`
          UPDATE itinerary_days
          SET date = ${body.date}, city = ${body.city}, title = ${body.title},
              location_ids = ${body.locationIds}::text[]
          WHERE day = ${day}
        `;
        await sql`DELETE FROM itinerary_events WHERE day = ${day}`;
        const events = body.events ?? [];
        for (let i = 0; i < events.length; i++) {
          await sql`
            INSERT INTO itinerary_events (day, time, label, sort_order)
            VALUES (${day}, ${events[i].time}, ${events[i].label}, ${i})
          `;
        }
        await sql`COMMIT`;
      } catch (err) {
        await sql`ROLLBACK`;
        throw err;
      }
      const dayRows = await sql`SELECT * FROM itinerary_days WHERE day = ${day}`;
      const evtRows = await sql`SELECT * FROM itinerary_events WHERE day = ${day} ORDER BY sort_order`;
      const days = dayRows as unknown as Record<string, unknown>[];
      return rowToItineraryDay(days[0], evtRows as unknown as Record<string, unknown>[]);
    }
    return jsonUpdateDay(day, body);
  },

  create: async (body: CreateItineraryDayBody): Promise<ItineraryDay> => {
    if (sql) {
      // Wrap day + events inserts in a transaction to prevent partial writes
      await sql`BEGIN`;
      try {
        await sql`
          INSERT INTO itinerary_days (day, date, city, title, location_ids)
          VALUES (${body.day}, ${body.date}, ${body.city}, ${body.title}, ${body.locationIds ?? []})
        `;
        const events = body.events ?? [];
        for (let i = 0; i < events.length; i++) {
          const evt = events[i];
          await sql`
            INSERT INTO itinerary_events (day, time, label, sort_order)
            VALUES (${body.day}, ${evt.time}, ${evt.label}, ${i})
          `;
        }
        await sql`COMMIT`;
      } catch (err) {
        await sql`ROLLBACK`;
        throw err;
      }
      const result: ItineraryDay = {
        day: body.day,
        date: body.date,
        city: body.city,
        title: body.title,
        locationIds: body.locationIds ?? [],
      };
      if (body.events && body.events.length > 0) {
        result.events = body.events;
      }
      return result;
    }
    return jsonCreate(body);
  },
};
