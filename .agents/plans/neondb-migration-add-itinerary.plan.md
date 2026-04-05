# Plan: NeonDB Migration + Add to Itinerary Page

## Summary

Migrate the data layer from static JSON files to NeonDB (Vercel Postgres) using an environment-aware repository strategy — JSON files remain active for local development, NeonDB activates in production when `DATABASE_URL` is present. Alongside this, add an `/add` page where users can create new itinerary days by entering a date, title, events, and a Google Maps link; the server parses the Maps URL to extract coordinates and place name automatically, updating `locations`, `itinerary_days`, and `trip.json`'s city list as needed.

## User Story

As a TISM trip planner,
I want to add new itinerary entries via a form that auto-extracts location data from a Google Maps link,
So that the map and itinerary pages stay up-to-date without manually editing JSON files.

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT + NEW_CAPABILITY |
| Complexity | HIGH |
| Touch Points | FULL_STACK |
| Systems Affected | Server repositories, all routes, NeonDB, new Add page, Nav |

---

## UX/UI Spec

### Design Direction

| Decision | Choice | Source |
|----------|--------|--------|
| Colour palette | Existing: #1B4B8A primary, #D4A843 accent. Validation: `emerald-500` success / `red-500` error. Maps-extract: `amber-400` scanning glow | Synthesised |
| Typography | `Playfair Display` for the page heading only; existing body font for labels/inputs | ui-ux-pro-max + bencium |
| Component style | Glassmorphic form card (matches existing map overlay pattern) on frosted background | ui-ux-pro-max |
| Motion / transitions | Framer Motion (already installed). Enter: 300ms `easeOut`. Spring panels: `stiffness:300 damping:30`. Maps scan: looping shimmer 1.2s | Synthesised |
| Layout pattern | Single-column centred card (max-w-2xl) on mobile; two-column on desktop — form left, live preview/extracted card right | bencium |
| Responsive strategy | Mobile-first, two-column kicks in at `lg:` (1024px) | ui-ux-pro-max |
| Signature interaction | Maps URL input has an animated "extraction" state — a scanning shimmer + spinner replaces the icon, then snaps to a populated preview card with a staggered reveal | bencium |

### UI States — Add Itinerary Page

- **Idle**: Empty form, all inputs blank. Maps URL field shows a "Paste a Google Maps link" hint icon.
- **Filling**: Date + title inputs respond with accent-coloured focus rings. Events list shows an animated "+" button for each new entry with a staggered slide-in.
- **Maps Extraction — Loading**: After URL is pasted, a scan shimmer animates across the input border for ~1s. A spinner icon replaces the paste icon. The preview card on the right (desktop) / below (mobile) fades in as a skeleton.
- **Maps Extraction — Success**: Preview card populates with place name, city badge, coordinates, address. Input border turns `emerald-500` briefly with a checkmark flash.
- **Maps Extraction — Error**: Input border turns `red-500`. Inline error below: "Couldn't extract location data — check the link or fill in manually." Manual fields expand.
- **Form Submit — Loading**: "Add to Itinerary" button shows spinner, is disabled.
- **Form Submit — Success**: Framer Motion exit animation slides the card away; toast notification "Day added!". Navigation redirects to `/itinerary`.
- **Form Submit — Error**: Toast error. Fields preserved. First invalid field auto-focused.

### UX Anti-patterns to Avoid (travel itinerary forms)
- Do NOT clear the form on error
- Do NOT validate on every keystroke — validate on blur
- Do NOT use the browser's default date picker without styling it (use a controlled `<input type="date">` with custom Tailwind)
- Do NOT require city selection if it can be inferred from the Maps URL
- Do NOT show all manual location fields upfront — reveal only if extraction fails

---

## NeonDB Schema

```sql
-- Run once to initialise Neon database
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
```

---

## API Contract

| Method | Path | Request Body | Response | Auth |
|--------|------|-------------|----------|------|
| GET | `/api/locations` | — | `Location[]` | No |
| GET | `/api/locations/:id` | — | `Location` | No |
| **POST** | `/api/locations` | `CreateLocationBody` | `Location` | No |
| GET | `/api/itinerary` | — | `ItineraryDay[]` | No |
| **POST** | `/api/itinerary` | `CreateItineraryDayBody` | `ItineraryDay` | No |
| GET | `/api/trip` | — | `TripInfo` | No |
| **PUT** | `/api/trip/cities` | `{ city: string }` | `TripInfo` | No |
| **POST** | `/api/extract-location` | `{ mapsUrl: string }` | `ExtractedLocation` | No |

### New Request/Response Types

```typescript
// CreateLocationBody
{
  id: string;           // generated: "{city-prefix}-{timestamp}"
  name: string;
  category: LocationCategory;
  coordinates: { lng: number; lat: number };
  city: string;
  summary: string;
  description: string;
  address: string;
  openingHours?: string;
  estimatedCost?: string;
  itineraryDays: number[];
  imageUrls: string[];
  externalLinks: { label: string; url: string }[];
}

// CreateItineraryDayBody
{
  day: number;
  date: string;           // ISO: "2026-11-28"
  city: string;
  title: string;
  locationIds: string[];
  events?: { time: string; label: string }[];
}

// ExtractedLocation (response from /api/extract-location)
{
  name: string;           // parsed from URL path
  coordinates: { lng: number; lat: number };  // parsed from @lat,lng
  mapsUrl: string;        // the original (or resolved) URL
  address: string;        // best-effort from URL
}
```

---

## Patterns to Follow

### React Component (source: `client/src/components/home/HeroSection.tsx`)
```tsx
// Framer Motion staggered entrance, all strings from messages, navigate via useNavigate
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { addMessages } from '../../messages/add.messages';

// Animate each section with initial/animate/transition
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
```

### Hook Pattern (source: `client/src/hooks/useLocations.ts`)
```typescript
// useState + useEffect with cancellation token
// Returns { data, isLoading, error }
export function useCreateItinerary() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (payload: CreateItineraryPayload) => {
    setIsLoading(true);
    // ...
    setIsLoading(false);
  };

  return { create, isLoading, error };
}
```

### API Call Pattern (source: `client/src/api/locations.api.ts`)
```typescript
const BASE = import.meta.env.VITE_API_URL ?? '';

export async function createLocation(body: CreateLocationBody): Promise<Location> {
  const res = await fetch(`${BASE}/api/locations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to create location: ${res.status}`);
  return res.json();
}
```

### Backend Route Pattern (source: `server/src/routes/locations.route.ts`)
```typescript
import { Router } from 'express';
const router = Router();

router.post('/', async (req, res) => {
  const body = req.body as CreateLocationBody;
  // validate required fields
  if (!body.name || !body.city || !body.coordinates) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  const location = await locationsRepository.create(body);
  res.status(201).json(location);
});
```

### Repository Pattern (env-aware switching)
```typescript
// Check DATABASE_URL at runtime — not at import time
// This is the key pattern for env-based switching

export const locationsRepository = {
  findAll: async (): Promise<Location[]> => {
    if (process.env.DATABASE_URL) {
      return neonFindAllLocations();
    }
    return locationsData as Location[];
  },
  create: async (location: CreateLocationBody): Promise<Location> => {
    if (process.env.DATABASE_URL) {
      return neonCreateLocation(location);
    }
    return jsonCreateLocation(location);
  },
};
```

---

## Files to Change

### Backend

| File | Action | Purpose |
|------|--------|---------|
| `server/package.json` | UPDATE | Add `@neondatabase/serverless` dependency |
| `server/src/db/client.ts` | CREATE | NeonDB SQL client, exported as `sql` |
| `server/src/db/schema.sql` | CREATE | DDL for all tables (run once manually in Neon console) |
| `server/src/db/seed.ts` | CREATE | One-time script to seed Neon from JSON files |
| `server/src/repositories/locations.repository.ts` | UPDATE | Add `create()`, env-aware switching (JSON vs Neon) |
| `server/src/repositories/itinerary.repository.ts` | UPDATE | Add `create()`, `findByDay()`, env-aware switching |
| `server/src/repositories/trip.repository.ts` | UPDATE | Add `addCity()`, env-aware switching |
| `server/src/services/mapsExtract.service.ts` | CREATE | Parse Google Maps URLs (coordinates, place name) |
| `server/src/routes/locations.route.ts` | UPDATE | Add `POST /` handler |
| `server/src/routes/itinerary.route.ts` | UPDATE | Add `POST /` handler |
| `server/src/routes/trip.route.ts` | UPDATE | Add `PUT /cities` handler |
| `server/src/routes/extract.route.ts` | CREATE | `POST /api/extract-location` |
| `server/src/app.ts` | UPDATE | Register `extract` router |
| `server/src/types/index.ts` | UPDATE | Add `CreateLocationBody`, `CreateItineraryDayBody`, `ExtractedLocation` |

### Frontend

| File | Action | Purpose |
|------|--------|---------|
| `client/src/types/index.ts` | UPDATE | Mirror server new types |
| `client/src/api/locations.api.ts` | UPDATE | Add `createLocation()` |
| `client/src/api/itinerary.api.ts` | UPDATE | Add `createItineraryDay()` |
| `client/src/api/extract.api.ts` | CREATE | `extractLocation(mapsUrl)` |
| `client/src/hooks/useExtractLocation.ts` | CREATE | Manages extraction state machine (idle/loading/success/error) |
| `client/src/hooks/useCreateItinerary.ts` | CREATE | Orchestrates create location + create day + add city |
| `client/src/messages/add.messages.ts` | CREATE | All UI strings for the Add page |
| `client/src/components/add/MapsUrlInput.tsx` | CREATE | Special URL input with extraction animation |
| `client/src/components/add/ExtractedLocationCard.tsx` | CREATE | Preview card showing extracted data |
| `client/src/components/add/EventsList.tsx` | CREATE | Dynamic event list with add/remove animations |
| `client/src/pages/AddItineraryPage.tsx` | CREATE | Main page orchestrating all sub-components |
| `client/src/App.tsx` | UPDATE | Add `/add` route |
| `client/src/components/navigation/Navbar.tsx` | UPDATE | Add "Add" nav item (or "+" icon button) |
| `client/src/messages/common.messages.ts` | UPDATE | Add nav label for "Add" |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

---

### Task 1: NeonDB Package + Client

- **Files**: `server/package.json`, `server/src/db/client.ts`, `server/src/db/schema.sql`
- **Layer**: Backend
- **Action**: CREATE

**`server/src/db/client.ts`**:
```typescript
import { neon } from '@neondatabase/serverless';

// sql is only called when DATABASE_URL is set — guard at call site
export const sql = process.env.DATABASE_URL
  ? neon(process.env.DATABASE_URL)
  : null;
```

**`server/src/db/schema.sql`**: The DDL block from the Schema section above. This file is documentation / run manually in the Neon console or via a one-time migration script.

**Install**: `pnpm --filter server add @neondatabase/serverless`

- **Validate**: `pnpm --filter server run typecheck`

---

### Task 2: Shared Types — New Interfaces

- **Files**: `server/src/types/index.ts`, `client/src/types/index.ts`
- **Layer**: Both (duplicate, as per project convention)
- **Action**: UPDATE

Add to both files:

```typescript
export interface CreateLocationBody {
  id: string;
  name: string;
  category: LocationCategory;
  coordinates: { lng: number; lat: number };
  city: string;
  summary: string;
  description: string;
  address: string;
  openingHours?: string | null;
  estimatedCost?: string | null;
  itineraryDays: number[];
  imageUrls: string[];
  externalLinks: { label: string; url: string }[];
}

export interface CreateItineraryDayBody {
  day: number;
  date: string;
  city: string;
  title: string;
  locationIds: string[];
  events?: { time: string; label: string }[];
}

export interface ExtractedLocation {
  name: string;
  coordinates: { lng: number; lat: number };
  mapsUrl: string;
  address: string;
}

export interface AddItineraryPayload {
  day: CreateItineraryDayBody;
  location: CreateLocationBody;
}
```

- **Validate**: `pnpm --filter client run typecheck && pnpm --filter server run typecheck`

---

### Task 3: Maps Extraction Service

- **File**: `server/src/services/mapsExtract.service.ts`
- **Layer**: Backend
- **Action**: CREATE

Parse Google Maps URLs to extract:
1. Coordinates: from `/@{lat},{lng}` pattern
2. Place name: from `/maps/place/{Name}/` path segment (URL-decoded)
3. Address: best-effort from URL params (`q=` or place name)
4. Handle short URLs (`goo.gl/maps/`, `maps.app.goo.gl/`): follow redirect with `fetch()` to resolve the canonical URL, then parse

```typescript
// Key regex patterns:
// Coordinates: /@(-?\d+\.\d+),(-?\d+\.\d+)/
// Place name: /\/maps\/place\/([^/]+)\//

export async function extractFromMapsUrl(rawUrl: string): Promise<ExtractedLocation>
```

- Handle `ENOTFOUND` and non-200 redirect responses gracefully — throw `Error('Could not resolve Maps URL')`
- Validate extracted `lat`/`lng` are finite numbers in valid ranges (lat: -90–90, lng: -180–180)
- **Validate**: `pnpm --filter server run typecheck`

---

### Task 4: Repository Layer — Write Operations + Env Switching

- **Files**: All 3 repositories
- **Layer**: Backend
- **Action**: UPDATE

Each repository becomes `async` and checks `process.env.DATABASE_URL` to switch data source:

**`locations.repository.ts`** — add `create()`:
```typescript
import { sql } from '../db/client';
import locationsData from '../data/locations.json';

// JSON write helper — appends to the JSON file (local dev only)
async function jsonCreate(location: Location): Promise<Location> {
  const fs = await import('fs/promises');
  const path = await import('path');
  const filePath = path.join(__dirname, '../data/locations.json');
  const existing = JSON.parse(await fs.readFile(filePath, 'utf-8')) as Location[];
  existing.push(location);
  await fs.writeFile(filePath, JSON.stringify(existing, null, 2));
  return location;
}

export const locationsRepository = {
  findAll: async (): Promise<Location[]> => {
    if (sql) {
      const rows = await sql`SELECT * FROM locations ORDER BY id`;
      return rows.map(rowToLocation);
    }
    return locationsData as Location[];
  },
  findById: async (id: string): Promise<Location | undefined> => {
    if (sql) {
      const rows = await sql`SELECT * FROM locations WHERE id = ${id}`;
      return rows[0] ? rowToLocation(rows[0]) : undefined;
    }
    return (locationsData as Location[]).find(l => l.id === id);
  },
  create: async (location: Location): Promise<Location> => {
    if (sql) {
      await sql`INSERT INTO locations (...) VALUES (...)`;
      return location;
    }
    return jsonCreate(location);
  },
};
```

**`itinerary.repository.ts`** — add `create()`, `findByDay()`:
- Same pattern: async, sql-check, JSON fallback
- `findByDay(day: number)` for checking if a day already exists before inserting

**`trip.repository.ts`** — add `addCity(city: string)`:
- If city not already in `cities[]`, append it and persist

> **IMPORTANT**: Since routes currently call repositories synchronously, update all route handlers to `await` repository calls after this task.

- **Validate**: `pnpm --filter server run typecheck`

---

### Task 5: Update Existing Routes to Async

- **Files**: All existing route files
- **Layer**: Backend
- **Action**: UPDATE

Make all route handlers `async` and `await` repository calls (since Task 4 makes repositories async):

```typescript
// Before
router.get('/', (_req, res) => {
  res.json(locationsRepository.findAll());
});

// After
router.get('/', async (_req, res) => {
  res.json(await locationsRepository.findAll());
});
```

- **Validate**: `pnpm --filter server run build`

---

### Task 6: New Backend Routes

- **Files**: `server/src/routes/locations.route.ts`, `server/src/routes/itinerary.route.ts`, `server/src/routes/trip.route.ts`, `server/src/routes/extract.route.ts`, `server/src/app.ts`
- **Layer**: Backend
- **Action**: UPDATE + CREATE

**POST `/api/locations`**:
```typescript
router.post('/', async (req, res) => {
  const body = req.body as CreateLocationBody;
  if (!body.name || !body.city || !body.coordinates?.lng || !body.coordinates?.lat) {
    res.status(400).json({ error: 'Missing required fields: name, city, coordinates' });
    return;
  }
  const id = body.id || `${body.city.toLowerCase().slice(0,3)}-${Date.now()}`;
  const location: Location = { ...body, id, itineraryDays: body.itineraryDays ?? [], imageUrls: [], externalLinks: body.externalLinks ?? [] };
  const created = await locationsRepository.create(location);
  res.status(201).json(created);
});
```

**POST `/api/itinerary`**:
- Check if day already exists; return 409 Conflict if so
- Create the day entry
- Also update the location's `itineraryDays` array (via `locationsRepository.addDay(locationId, day)`)

**PUT `/api/trip/cities`**:
```typescript
router.put('/cities', async (req, res) => {
  const { city } = req.body as { city: string };
  if (!city) { res.status(400).json({ error: 'city required' }); return; }
  const updated = await tripRepository.addCity(city);
  res.json(updated);
});
```

**POST `/api/extract-location`** (`extract.route.ts`):
```typescript
router.post('/', async (req, res) => {
  const { mapsUrl } = req.body as { mapsUrl: string };
  if (!mapsUrl) { res.status(400).json({ error: 'mapsUrl required' }); return; }
  try {
    const extracted = await extractFromMapsUrl(mapsUrl);
    res.json(extracted);
  } catch (e) {
    res.status(422).json({ error: (e as Error).message });
  }
});
```

Register in `app.ts`:
```typescript
import extractRouter from './routes/extract.route';
app.use('/api/extract-location', extractRouter);
```

- **Security**: Validate `mapsUrl` is a valid URL string. Reject non-`maps.google.com` / `goo.gl` / `maps.app.goo.gl` origins.
- **Validate**: `pnpm --filter server run build`

---

### Task 7: NeonDB Seed Script

- **File**: `server/src/db/seed.ts`
- **Layer**: Backend
- **Action**: CREATE

One-time script that reads all JSON files and inserts into Neon. Run once after creating the Neon database.

```typescript
// Usage: DATABASE_URL=... npx ts-node src/db/seed.ts
// Idempotent: uses INSERT ... ON CONFLICT DO NOTHING
```

Add to `server/package.json` scripts: `"db:seed": "ts-node src/db/seed.ts"`

- **Validate**: Manual run against Neon test database

---

### Task 8: Frontend API Layer

- **Files**: `client/src/api/locations.api.ts`, `client/src/api/itinerary.api.ts`, `client/src/api/extract.api.ts`
- **Layer**: Frontend
- **Action**: UPDATE + CREATE

**`extract.api.ts`** (new):
```typescript
import type { ExtractedLocation } from '../types';

const BASE = import.meta.env.VITE_API_URL ?? '';

export async function extractLocation(mapsUrl: string): Promise<ExtractedLocation> {
  const res = await fetch(`${BASE}/api/extract-location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mapsUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Extraction failed' }));
    throw new Error(err.error ?? 'Extraction failed');
  }
  return res.json();
}
```

**Add to `locations.api.ts`**:
```typescript
export async function createLocation(body: CreateLocationBody): Promise<Location> {
  const res = await fetch(`${BASE}/api/locations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to create location: ${res.status}`);
  return res.json();
}
```

**Add to `itinerary.api.ts`**:
```typescript
export async function createItineraryDay(body: CreateItineraryDayBody): Promise<ItineraryDay> {
  const res = await fetch(`${BASE}/api/itinerary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to create itinerary day: ${res.status}`);
  return res.json();
}
```

- **Validate**: `pnpm --filter client run typecheck`

---

### Task 9: Frontend Hooks

- **Files**: `client/src/hooks/useExtractLocation.ts`, `client/src/hooks/useCreateItinerary.ts`
- **Layer**: Frontend
- **Action**: CREATE

**`useExtractLocation.ts`**:
```typescript
type ExtractionState = 'idle' | 'loading' | 'success' | 'error';

export function useExtractLocation() {
  const [state, setState] = useState<ExtractionState>('idle');
  const [data, setData] = useState<ExtractedLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extract = async (mapsUrl: string) => {
    setState('loading');
    setError(null);
    try {
      const result = await extractLocation(mapsUrl);
      setData(result);
      setState('success');
    } catch (e) {
      setError((e as Error).message);
      setState('error');
    }
  };

  const reset = () => { setState('idle'); setData(null); setError(null); };

  return { state, data, error, extract, reset };
}
```

**`useCreateItinerary.ts`**:
Orchestrates the full creation flow:
1. POST `/api/locations` (create location)
2. POST `/api/itinerary` (create itinerary day with locationId)
3. PUT `/api/trip/cities` (add city if new)

```typescript
export function useCreateItinerary() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (payload: AddItineraryPayload): Promise<void> => { ... };

  return { submit, isLoading, error };
}
```

- **Validate**: `pnpm --filter client run typecheck`

---

### Task 10: Messages File

- **File**: `client/src/messages/add.messages.ts`
- **Layer**: Frontend
- **Action**: CREATE

```typescript
export const addMessages = {
  pageTitle: 'Add to Itinerary',
  pageSubtitle: 'Plan your next stop',
  dateLabel: 'Date of visit',
  datePlaceholder: '',
  titleLabel: 'Location title',
  titlePlaceholder: 'e.g. Hakata Station',
  eventsLabel: 'Events & activities',
  eventsAddButton: 'Add event',
  eventsTimePlaceholder: '14:00',
  eventsLabelPlaceholder: 'e.g. Check-in at hotel',
  eventsRemove: 'Remove event',
  mapsUrlLabel: 'Google Maps link',
  mapsUrlPlaceholder: 'Paste a Google Maps link…',
  mapsUrlHint: 'We\'ll extract coordinates, place name and address automatically.',
  mapsUrlExtracting: 'Extracting location data…',
  mapsUrlSuccess: 'Location data extracted',
  mapsUrlError: 'Couldn\'t extract location — check the link.',
  cityLabel: 'City',
  cityPlaceholder: 'Select or enter a city',
  categoryLabel: 'Category',
  submitButton: 'Add to Itinerary',
  submitting: 'Saving…',
  successToast: 'Day added to your itinerary!',
  errorToast: 'Something went wrong. Please try again.',
  previewTitle: 'Location preview',
  previewNoData: 'Paste a Google Maps link to preview location data.',
} as const;
```

- **Validate**: `pnpm --filter client run typecheck`

---

### Task 11: UI Components

> **Design guidance synthesis applied here:**
>
> **ui-ux-pro-max guidance:**
> - Form inputs: visible label above every input (`label` with `for`), validate on blur not keystroke
> - Error messages inline below the field (`text-sm text-red-500 mt-1`)
> - Multi-step disclosure: reveal manual location fields only if extraction fails
> - Submit button: disabled + spinner during async, clear success state after
> - Touch targets ≥44px on all inputs and buttons
> - Focus rings: `focus:ring-2 focus:ring-primary/50` (Japan blue at 50%)
>
> **bencium-innovative-ux-designer guidance:**
> - `MapsUrlInput`: the border itself animates — a scanning shimmer (CSS `@keyframes scan`) sweeps across the input border during extraction. The icon inside transitions: link icon → spinner → check / x.
> - `EventsList`: each event row enters with `motion.div` `initial={{ opacity:0, x:-16 }}` and exits with `AnimatePresence`. The "add event" button has a `+` that rotates 90° on hover.
> - `ExtractedLocationCard`: on desktop, occupies the right half of a two-column layout. On success it "snaps in" with `scale: 0.95 → 1` + `opacity: 0 → 1` at 300ms. Uses the glassmorphism pattern (same as `LocationPanel.tsx`).
> - Page heading uses `Playfair Display` to echo the premium Japanese travel feel — a single serif heading "Add to Itinerary" over the page.

**`MapsUrlInput.tsx`** — key behaviours:
- `onPaste` / `onChange` debounce (300ms) triggers `extract()`
- Border class: `idle → ring-border` | `loading → ring-amber-400 animate-pulse` | `success → ring-emerald-500` | `error → ring-red-500`
- Inline icon slot: `Link` icon (idle) → `Loader2 animate-spin` (loading) → `Check` (success) → `X` (error)
- On error: smooth `AnimatePresence` reveal of inline error text + "Fill in manually" expansion

**`EventsList.tsx`** — key behaviours:
- State: `events: { id: string; time: string; label: string }[]`
- `AnimatePresence` wraps each `motion.div` row
- Enter: `x: -16, opacity: 0` → `x: 0, opacity: 1` (200ms)
- Exit: `x: 16, opacity: 0` (150ms) — exits faster than enters
- Time input + label input side by side; remove button on right with `aria-label="Remove event"`
- "Add event" button: `+` icon rotates 90° on hover (`transition: transform 200ms`)

**`ExtractedLocationCard.tsx`** — key behaviours:
- Glassmorphic card matching `LocationPanel.tsx` style
- Skeleton state while loading (3 shimmer lines)
- Success state: place name (bold), coordinates (monospace, small), city badge (existing `Badge` component), address
- If city is in `trip.cities`: shows "Existing city" badge. If new: shows "New city — will be added" badge in amber.

- **Validate**: `pnpm --filter client run typecheck && pnpm --filter client run build`

---

### Task 12: AddItineraryPage

- **File**: `client/src/pages/AddItineraryPage.tsx`
- **Layer**: Frontend
- **Action**: CREATE

Layout:
```
<main max-w-6xl mx-auto px-4 py-12>
  <motion.h1>           // "Add to Itinerary" — Playfair Display, stagger in
  <motion.p>            // subtitle
  <div lg:grid lg:grid-cols-2 lg:gap-12>
    <form>              // left column (full width on mobile)
      DateInput
      TitleInput
      CitySelect        // dropdown + "other" text fallback
      CategorySelect    // LocationCategory
      MapsUrlInput      // the special one
      EventsList
      SubmitButton
    </form>
    <aside>             // right column (hidden on mobile until extraction success)
      ExtractedLocationCard
    </aside>
  </div>
</main>
```

**Form state** (controlled):
```typescript
interface FormState {
  day: number;
  date: string;
  title: string;
  city: string;
  category: LocationCategory;
  mapsUrl: string;
  events: { id: string; time: string; label: string }[];
}
```

**Day number auto-computation**: derive from `date` against trip departure date (Nov 20, 2026 = Day 1). Display computed day number next to date input as a badge: "Day 9".

**Submission flow**:
1. Validate form (all required fields present, at least one locationId or mapsUrl that extracted successfully)
2. Generate `location.id` = `${city.slice(0,3).toLowerCase()}-${Date.now()}`
3. Call `useCreateItinerary().submit(payload)`
4. On success: toast + navigate to `/itinerary`
5. On error: toast + auto-focus first invalid field

- **Validate**: `pnpm --filter client run typecheck && pnpm --filter client run build`

---

### Task 13: Routing + Nav

- **Files**: `client/src/App.tsx`, `client/src/components/navigation/Navbar.tsx`, `client/src/messages/common.messages.ts`
- **Layer**: Frontend
- **Action**: UPDATE

**`App.tsx`**: Add `<Route path="/add" element={<AddItineraryPage />} />`

**`Navbar.tsx`**: Add an "Add" nav item. Recommended: a `+` icon button with `aria-label="Add to itinerary"` that stands apart from the main nav links — visually distinct (gold accent button, rounded, smaller). Place it at the far right of the nav.

**`common.messages.ts`**: Add `navAdd: 'Add'` and `navAddAriaLabel: 'Add to itinerary'`.

- **Validate**: `pnpm --filter client run build`

---

## Validation Commands

```bash
# Type check both layers
pnpm --filter client run typecheck
pnpm --filter server run typecheck

# Build both
pnpm --filter client run build
pnpm --filter server run build

# Dev servers (run separately)
pnpm --filter client dev   # :5173
pnpm --filter server dev   # :3001

# Seed Neon (run once, requires DATABASE_URL env)
cd server && DATABASE_URL="<neon-url>" pnpm db:seed
```

---

## Environment Variables

### Local (`.env` in server/)
```
PORT=3001
CORS_ORIGIN=http://localhost:5173
# DATABASE_URL intentionally absent → JSON files used
```

### Vercel Production (set in Vercel dashboard)
```
DATABASE_URL=postgresql://...     # from Neon integration (auto-injected by Vercel+Neon)
CORS_ORIGIN=https://your-frontend.vercel.app
```

### Client (`.env` in client/)
```
VITE_API_URL=http://localhost:3001   # local
# VITE_API_URL=                     # production: same-origin via Vercel rewrites
```

---

## Risk Register

| Risk | Mitigation |
|------|------------|
| Google Maps short URLs (`goo.gl`, `maps.app.goo.gl`) may require following redirects | Use `fetch(url, { redirect: 'follow' })` server-side; reject if final URL isn't a maps.google.com hostname |
| Neon connection cold-start latency in serverless | Use `@neondatabase/serverless` HTTP driver (not TCP); it's designed for serverless cold starts |
| JSON write races in local dev (concurrent writes) | Acceptable for local dev only; warn in logs that JSON writes are not concurrent-safe |
| Trip day number collisions (user enters same day twice) | Repo `create()` returns 409 if `day` already exists; surface as form error |
| City not in `trip.cities` creates inconsistency | `addCity()` is idempotent — only appends if not already present |
| Maps URL extraction fails for place URLs without `@lat,lng` | Return 422 with clear message; form reveals manual coordinate inputs as fallback |
| Vercel Railway cross-origin | Ensure `CORS_ORIGIN` on Railway includes the Vercel frontend URL |

---

## Security Checklist

- [x] `mapsUrl` validated: must be a URL, must resolve to `maps.google.com` or a known shortener
- [x] All POST body fields validated server-side before insert
- [x] Parameterised queries only (Neon `sql` template literal — safe from injection)
- [x] No secrets exposed to client — `DATABASE_URL` is server-only
- [x] CORS: no wildcard; `CORS_ORIGIN` env required in production
- [x] Rate limiting already in place (100 req/15min) — applies to new routes automatically
- [x] No user-uploaded content in this feature

---

## Review Gates (MANDATORY — do not skip)

### 1. UX/UI Review — invoke `ui-ux-pro-max` + `bencium-innovative-ux-designer`

Provide both skills with:
- Description of `AddItineraryPage`, `MapsUrlInput`, `ExtractedLocationCard`, `EventsList`
- The design decisions in this plan (palette, typography, glassmorphism, extraction animation)

**`ui-ux-pro-max`** — evaluate:
- Contrast ratios on all input states (idle, focused, error, success)
- Touch targets ≥44px on event row inputs and remove buttons
- Are all 5 UI states implemented (idle, loading, success, error, skeleton)?
- Does the form hold up at 375px mobile?
- Are labels associated with inputs (`for` / `htmlFor`)?

**`bencium-innovative-ux-designer`** — evaluate:
- Does the Maps URL extraction animation feel crafted or generic?
- Does the EventsList entrance/exit feel natural?
- Does the two-column layout feel editorial or like a boring form?
- What would a senior product designer change?

### 2. QA Review — `superpowers:code-reviewer`

- All UI states covered in `AddItineraryPage`
- `useExtractLocation` state machine transitions (idle → loading → success/error → reset)
- `useCreateItinerary` orchestration — does it handle partial failure (location created, day fails)?
- Keyboard navigation through the form

### 3. Principal Engineer Review — `pragmatic-code-reviewer`

- Repository async migration — no synchronous calls left
- NeonDB `sql` null guard — never called when `DATABASE_URL` absent
- JSON write in `jsonCreate` — file path resolution correct (use `__dirname` not `process.cwd()`)
- No `any` types
- `extractFromMapsUrl` — does it handle malformed URLs without throwing unhandled exceptions?

---

## Acceptance Criteria

### Functional
- [ ] Local dev uses JSON files (no `DATABASE_URL` set) — reads AND writes work
- [ ] Vercel production uses NeonDB — all GET routes return Neon data
- [ ] Adding a new day creates: 1 location entry + 1 itinerary day entry + updates trip cities if new
- [ ] Google Maps URL extraction returns coordinates, place name, address for standard long-form URLs
- [ ] Short URL extraction (`goo.gl`, `maps.app.goo.gl`) resolves and extracts successfully
- [ ] If extraction fails, manual fields appear and user can submit without Maps URL

### UX/UI
- [ ] All 5 UI states on `MapsUrlInput` work correctly
- [ ] EventsList add/remove is animated
- [ ] ExtractedLocationCard shows skeleton while loading, populates on success
- [ ] Two-column layout on desktop, single-column on mobile
- [ ] Page heading uses Playfair Display
- [ ] Day number auto-badge appears next to date input

### Quality
- [ ] Zero `any`, strict TypeScript passes
- [ ] Both `typecheck` and `build` pass with no warnings
- [ ] All UI strings in `add.messages.ts` (no hardcoded strings in JSX)
- [ ] Security checklist completed
- [ ] All three review gates passed
