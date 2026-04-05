CREATE TABLE IF NOT EXISTS locations (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL CHECK (category IN ('attraction','restaurant','accommodation','shopping','transport')),
  lng           DOUBLE PRECISION NOT NULL,
  lat           DOUBLE PRECISION NOT NULL,
  city          TEXT NOT NULL,
  summary       TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  address       TEXT NOT NULL DEFAULT '',
  opening_hours TEXT,
  estimated_cost TEXT,
  itinerary_days INTEGER[] NOT NULL DEFAULT '{}',
  image_urls    TEXT[] NOT NULL DEFAULT '{}',
  external_links JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS itinerary_days (
  day           INTEGER PRIMARY KEY,
  date          TEXT NOT NULL,
  city          TEXT NOT NULL,
  title         TEXT NOT NULL,
  location_ids  TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS itinerary_events (
  id         SERIAL PRIMARY KEY,
  day        INTEGER NOT NULL REFERENCES itinerary_days(day) ON DELETE CASCADE,
  time       TEXT NOT NULL,
  label      TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS trip_info (
  id              INTEGER PRIMARY KEY DEFAULT 1,
  title           TEXT NOT NULL,
  departure_date  TEXT NOT NULL,
  return_date     TEXT NOT NULL,
  description     TEXT NOT NULL,
  cities          TEXT[] NOT NULL DEFAULT '{}'
);
