# Plan: Edit Itinerary Item

## Summary

Add an edit flow for itinerary day cards. Each day card on `/itinerary` gains a hover-reveal gold pill button ("Edit") that navigates to `/edit/:day`. The edit page reuses the `AddItineraryPage` form layout with pre-filled data from the existing day and its primary location. On save, the backend updates both the `ItineraryDay` and `Location` records (and moves the locationId between days if the date changes). This is a full-stack feature touching types, backend routes + repositories, frontend API layer, hooks, a new page, and one new component.

## User Story

As a trip planner
I want to edit an existing itinerary day (its title, date, city, events, and location details)
So that I can correct mistakes or update plans without deleting and re-adding entries

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| Touch Points | FULL_STACK |
| Systems Affected | `server/src/types`, `server/src/repositories`, `server/src/routes`, `client/src/types`, `client/src/api`, `client/src/hooks`, `client/src/messages`, `client/src/components/itinerary`, `client/src/pages`, `client/src/App.tsx` |

---

## UX/UI Spec

### Design Direction

Synthesised from `ui-ux-pro-max` (systematic correctness) + `bencium-innovative-ux-designer` (distinctive execution):

| Decision | Choice |
|----------|--------|
| Edit trigger affordance | Hover-reveal pill button: `PencilLine` icon + "Edit" text, gold accent, top-right of day card header |
| Trigger visibility | CSS `group`/`group-hover:opacity-100` (instant show) + `transition-opacity duration-150` |
| Trigger micro-interaction | Framer Motion `whileHover={{ scale: 1.05 }}` + `whileTap={{ scale: 0.95 }}` |
| Trigger style | `bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 rounded-full px-2.5 py-1 text-xs font-semibold` |
| Navigation pattern | Full page (`/edit/:day`) — not a modal. Spatial continuity: users already know this form from `/add` |
| Page enter motion | `{ opacity: 0, y: 20 } → { opacity: 1, y: 0 }` — matches all other pages |
| Edit mode signal #1 | Form card gains `border-l-2 border-accent` left stripe — subtle "editing" indicator |
| Edit mode signal #2 | Day badge uses `bg-accent text-white` (gold) instead of `bg-primary` (blue) |
| Edit mode signal #3 | Page subtitle: "Update the details below" (vs Add's "Fill in the details below") |
| Edit mode signal #4 | Submit button: "Save Changes" instead of "Add to Itinerary" |
| Component style | Same glassmorphism form card as `AddItineraryPage` (`bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/20`) |
| Responsive | Mobile-first, identical to Add page layout (stacked on mobile, 2-col on lg) |

**Why not a modal?** Modals break navigation (no deep-link, no back button). The edit form has the same complexity as the add form — it warrants a dedicated page.

**Why not an icon on the location row?** Location rows already navigate to the map on click. Two independent tap targets in a row are confusing on mobile. The day-level edit is cleaner.

### UI States to Implement

- **Loading** (pre-fill): Skeleton placeholders in form fields while day + location data loads — use existing `SkeletonLoader` in the form area
- **Ready** (pre-filled): Form is populated and editable
- **Saving**: Submit button disabled + spinner text "Saving…" (mirrors Add page pattern)
- **Success**: Toast "Changes saved!" → navigate to `/itinerary` after 1.2s
- **Error**: Toast with error message (same pattern as Add page)
- **Not found**: If the day param doesn't exist in the itinerary, render `<EmptyState>` with a "Back to Itinerary" link

---

## API Contract

### New Endpoints

| Method | Path | Request Body | Response | Auth |
|--------|------|-------------|----------|------|
| `PUT` | `/api/locations/:id` | `UpdateLocationBody` (full replacement) | `Location` | No |
| `PUT` | `/api/itinerary/:day` | `UpdateItineraryDayBody` (full replacement) | `ItineraryDay` | No |

### Existing Endpoints Used

- `GET /api/itinerary` — fetch all days to find the target day (client already has `useItinerary`)
- `GET /api/locations/:id` — fetch the location to pre-fill form (client already has `useLocation`)

### Request shapes

```ts
// PUT /api/locations/:id
interface UpdateLocationBody {
  name: string
  category: LocationCategory
  coordinates: { lng: number; lat: number }
  city: string
  summary: string
  description: string
  address: string
  openingHours?: string | null
  estimatedCost?: string | null
  itineraryDays: number[]
  imageUrls: string[]
  externalLinks: { label: string; url: string }[]
}

// PUT /api/itinerary/:day
interface UpdateItineraryDayBody {
  date: string
  city: string
  title: string
  locationIds: string[]
  events?: { time: string; label: string }[]
}
```

### Day-change logic (client-side, in `useUpdateItinerary`)

When `newDay !== oldDay` after a date change:

1. `PUT /api/locations/:id` → update `itineraryDays` from `[oldDay]` to `[newDay]`
2. `PUT /api/itinerary/:oldDay` → remove locationId from old day's `locationIds`
3. `POST /api/itinerary` → create or append to new day (existing `createItineraryDay` handles both cases)

---

## Patterns to Follow

### React Component
```tsx
// SOURCE: client/src/pages/AddItineraryPage.tsx:42-151
// Pattern: form state via useState<FormState>, toast via setTimeout, navigate on success
export function EditItineraryPage() {
  const { day: dayParam } = useParams<{ day: string }>();
  // ...same state shape as AddItineraryPage
}
```

### API Hook (mutation)
```ts
// SOURCE: client/src/hooks/useCreateItinerary.ts:1-30
// Pattern: { submit, isLoading, error } shape, sequential awaits with idempotency
export function useUpdateItinerary() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (payload: UpdateItineraryPayload) => { ... };
  return { submit, isLoading, error };
}
```

### Backend Route (PUT)
```ts
// SOURCE: server/src/routes/locations.route.ts:32-58 (POST pattern to mirror)
router.put('/:id', async (req, res, next) => {
  try {
    const location = await locationsRepository.findById(req.params.id);
    if (!location) { res.status(404).json({ error: 'Location not found' }); return; }
    // validate body
    const updated = await locationsRepository.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) { next(err); }
});
```

### Repository Update Method
```ts
// SOURCE: server/src/repositories/locations.repository.ts:60-94 (create to mirror)
// Pattern: JSON path — read all, splice in updated record, writeFileSync
// SQL path — UPDATE query with named columns
async function jsonUpdate(id: string, body: UpdateLocationBody): Promise<Location> {
  const all = await jsonFindAll();
  const idx = all.findIndex(l => l.id === id);
  if (idx === -1) throw new Error(`Location ${id} not found`);
  all[idx] = { ...all[idx], ...body };
  writeFileSync(JSON_PATH, JSON.stringify(all, null, 2));
  return all[idx];
}
```

### Edit Trigger Button
```tsx
// SOURCE: client/src/pages/ItineraryPage.tsx:93-111 (day card header to modify)
// Pattern: group + group-hover + Framer Motion whileHover/whileTap
<div className="rounded-2xl bg-surface border border-bg overflow-hidden group">
  <div className="p-4 border-b border-bg flex items-center justify-between">
    <div>...</div>
    <div className="flex items-center gap-3">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate(`/edit/${day.day}`)}
        aria-label={editMessages.editDayAriaLabel}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150
                   flex items-center gap-1.5 px-2.5 py-1 rounded-full
                   bg-accent/10 text-accent border border-accent/20
                   hover:bg-accent/20 text-xs font-semibold cursor-pointer"
      >
        <PencilLine size={12} />
        {editMessages.editButtonLabel}
      </motion.button>
      <div className="text-right">...</div>
    </div>
  </div>
</div>
```

---

## Files to Change

| File | Layer | Action | Purpose |
|------|-------|--------|---------|
| `server/src/types/index.ts` | Backend | UPDATE | Add `UpdateLocationBody`, `UpdateItineraryDayBody` |
| `server/src/repositories/locations.repository.ts` | Backend | UPDATE | Add `update(id, body)` method |
| `server/src/repositories/itinerary.repository.ts` | Backend | UPDATE | Add `update(day, body)` method |
| `server/src/routes/locations.route.ts` | Backend | UPDATE | Add `PUT /:id` handler |
| `server/src/routes/itinerary.route.ts` | Backend | UPDATE | Add `PUT /:day` handler |
| `client/src/types/index.ts` | Frontend | UPDATE | Mirror `UpdateLocationBody`, `UpdateItineraryDayBody`, add `UpdateItineraryPayload` |
| `client/src/messages/edit.messages.ts` | Frontend | CREATE | All edit-page strings |
| `client/src/api/locations.api.ts` | Frontend | UPDATE | Add `updateLocation(id, body)` |
| `client/src/api/itinerary.api.ts` | Frontend | UPDATE | Add `updateItineraryDay(day, body)` |
| `client/src/hooks/useUpdateItinerary.ts` | Frontend | CREATE | Coordinates update API calls + day-change logic |
| `client/src/pages/EditItineraryPage.tsx` | Frontend | CREATE | Edit form page (reuses AddItineraryPage structure) |
| `client/src/pages/ItineraryPage.tsx` | Frontend | UPDATE | Add group class + edit trigger button to day card headers |
| `client/src/App.tsx` | Frontend | UPDATE | Register `/edit/:day` route |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

---

### Task 1: Shared Types — Server

**File**: `server/src/types/index.ts`
**Layer**: Backend
**Action**: UPDATE

Add after the existing `CreateLocationBody` and `CreateItineraryDayBody` interfaces:

```ts
export interface UpdateLocationBody {
  name: string
  category: LocationCategory
  coordinates: { lng: number; lat: number }
  city: string
  summary: string
  description: string
  address: string
  openingHours?: string | null
  estimatedCost?: string | null
  itineraryDays: number[]
  imageUrls: string[]
  externalLinks: { label: string; url: string }[]
}

export interface UpdateItineraryDayBody {
  date: string
  city: string
  title: string
  locationIds: string[]
  events?: { time: string; label: string }[]
}
```

**Validate**: `pnpm --filter server run typecheck`

---

### Task 2: Locations Repository — Add `update`

**File**: `server/src/repositories/locations.repository.ts`
**Layer**: Backend
**Action**: UPDATE

Add import for `UpdateLocationBody` from types.

Add JSON helper function `jsonUpdate` following the same pattern as `jsonCreate` (read all → find index → splice → writeFileSync):

```ts
async function jsonUpdate(id: string, body: UpdateLocationBody): Promise<Location> {
  const all = await jsonFindAll();
  const idx = all.findIndex(l => l.id === id);
  if (idx === -1) throw new Error(`Location ${id} not found`);
  const updated: Location = {
    id,
    name: body.name,
    category: body.category,
    coordinates: body.coordinates,
    city: body.city as Location['city'],
    summary: body.summary,
    description: body.description,
    address: body.address,
    openingHours: body.openingHours ?? null,
    estimatedCost: body.estimatedCost ?? null,
    itineraryDays: body.itineraryDays,
    imageUrls: body.imageUrls,
    externalLinks: body.externalLinks,
  };
  all[idx] = updated;
  writeFileSync(JSON_PATH, JSON.stringify(all, null, 2));
  return updated;
}
```

Add `update` method to the exported `locationsRepository` object:

```ts
update: async (id: string, body: UpdateLocationBody): Promise<Location> => {
  if (sql) {
    await sql`
      UPDATE locations SET
        name = ${body.name}, category = ${body.category},
        lng = ${body.coordinates.lng}, lat = ${body.coordinates.lat},
        city = ${body.city}, summary = ${body.summary},
        description = ${body.description}, address = ${body.address},
        opening_hours = ${body.openingHours ?? null},
        estimated_cost = ${body.estimatedCost ?? null},
        itinerary_days = ${body.itineraryDays},
        image_urls = ${body.imageUrls},
        external_links = ${JSON.stringify(body.externalLinks)}
      WHERE id = ${id}
    `;
    const rows = await sql`SELECT * FROM locations WHERE id = ${id}`;
    const r = rows as unknown as Record<string, unknown>[];
    if (!r[0]) throw new Error(`Location ${id} not found`);
    return rowToLocation(r[0]);
  }
  return jsonUpdate(id, body);
},
```

**Validate**: `pnpm --filter server run typecheck`

---

### Task 3: Itinerary Repository — Add `update`

**File**: `server/src/repositories/itinerary.repository.ts`
**Layer**: Backend
**Action**: UPDATE

Add import for `UpdateItineraryDayBody` from types.

Add JSON helper function `jsonUpdate` (read all → find index → replace → writeFileSync):

```ts
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
```

Add `update` method to the exported `itineraryRepository` object:

```ts
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
      // Replace all events: delete then re-insert
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
```

**Validate**: `pnpm --filter server run typecheck`

---

### Task 4: Backend Routes — Add PUT handlers

**File**: `server/src/routes/locations.route.ts`
**Layer**: Backend
**Action**: UPDATE

Add `import type { UpdateLocationBody } from '../types';` to the existing import.

Add `PUT /:id` after the existing `POST /` handler:

```ts
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await locationsRepository.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }
    const body = req.body as UpdateLocationBody;
    if (!body.name || !body.category || body.coordinates?.lng == null || body.coordinates?.lat == null || !body.city) {
      res.status(400).json({ error: 'Missing required fields: name, category, coordinates, city' });
      return;
    }
    const updated = await locationsRepository.update(req.params.id, body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
```

**File**: `server/src/routes/itinerary.route.ts`
Add `import type { UpdateItineraryDayBody } from '../types';` to the existing import.

Add `PUT /:day` after the existing `POST /` handler:

```ts
router.put('/:day', async (req, res, next) => {
  try {
    const day = parseInt(req.params.day, 10);
    if (isNaN(day)) {
      res.status(400).json({ error: 'Day must be a number' });
      return;
    }
    const existing = await itineraryRepository.findByDay(day);
    if (!existing) {
      res.status(404).json({ error: `Day ${day} not found` });
      return;
    }
    const body = req.body as UpdateItineraryDayBody;
    if (!body.date || !body.city || !body.title) {
      res.status(400).json({ error: 'Missing required fields: date, city, title' });
      return;
    }
    const updated = await itineraryRepository.update(day, body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
```

**Validate**: `pnpm --filter server run typecheck && pnpm --filter server run build`

---

### Task 5: Shared Types — Client

**File**: `client/src/types/index.ts`
**Layer**: Frontend
**Action**: UPDATE

Mirror the server types. Add after existing `AddItineraryPayload`:

```ts
export interface UpdateLocationBody {
  name: string
  category: LocationCategory
  coordinates: { lng: number; lat: number }
  city: string
  summary: string
  description: string
  address: string
  openingHours?: string | null
  estimatedCost?: string | null
  itineraryDays: number[]
  imageUrls: string[]
  externalLinks: { label: string; url: string }[]
}

export interface UpdateItineraryDayBody {
  date: string
  city: string
  title: string
  locationIds: string[]
  events?: { time: string; label: string }[]
}

export interface UpdateItineraryPayload {
  locationId: string
  oldDay: number
  newDay: number
  location: UpdateLocationBody
  day: UpdateItineraryDayBody
  oldDayLocationIds: string[]  // the old day's full locationIds list (for removal)
}
```

**Validate**: `pnpm --filter client run typecheck`

---

### Task 6: Messages File

**File**: `client/src/messages/edit.messages.ts`
**Layer**: Frontend
**Action**: CREATE

```ts
export const editMessages = {
  // Page
  pageTitle: 'Edit Itinerary',
  pageSubtitle: 'Update the details below.',

  // Edit trigger (on ItineraryPage day cards)
  editButtonLabel: 'Edit',
  editDayAriaLabel: 'Edit this itinerary day',

  // Form mode indicator
  editingBadgePrefix: 'Editing Day',

  // Submit
  submitButton: 'Save Changes',
  submitting: 'Saving…',

  // Toast
  successToast: 'Changes saved!',
  errorToast: 'Something went wrong. Please try again.',

  // Validation (reuses add.messages for field errors — no new ones needed)

  // Not found state
  notFoundTitle: 'Day not found',
  notFoundDescription: 'This itinerary day does not exist.',
  backToItinerary: 'Back to Itinerary',
} as const;
```

**Validate**: `pnpm --filter client run typecheck`

---

### Task 7: API Layer — Update Functions

**File**: `client/src/api/locations.api.ts`
**Layer**: Frontend
**Action**: UPDATE

Add import for `UpdateLocationBody`. Add after `createLocation`:

```ts
export async function updateLocation(id: string, body: UpdateLocationBody): Promise<Location> {
  const res = await fetch(`${BASE}/api/locations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to update location: ${res.status}`);
  return res.json();
}
```

**File**: `client/src/api/itinerary.api.ts`
Add import for `UpdateItineraryDayBody`. Add after `createItineraryDay`:

```ts
export async function updateItineraryDay(day: number, body: UpdateItineraryDayBody): Promise<ItineraryDay> {
  const res = await fetch(`${BASE}/api/itinerary/${day}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to update itinerary day: ${res.status}`);
  return res.json();
}
```

**Validate**: `pnpm --filter client run typecheck`

---

### Task 8: Hook — `useUpdateItinerary`

**File**: `client/src/hooks/useUpdateItinerary.ts`
**Layer**: Frontend
**Action**: CREATE

```ts
import { useState } from 'react';
import { updateLocation } from '../api/locations.api';
import { updateItineraryDay, createItineraryDay } from '../api/itinerary.api';
import type { UpdateItineraryPayload } from '../types';

export function useUpdateItinerary() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (payload: UpdateItineraryPayload): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      // Always update the location record
      await updateLocation(payload.locationId, payload.location);

      if (payload.oldDay === payload.newDay) {
        // Same day — update in place
        await updateItineraryDay(payload.oldDay, payload.day);
      } else {
        // Date changed — move locationId from old day to new day
        const oldDayUpdated: import('../types').UpdateItineraryDayBody = {
          date: payload.day.date,   // NOTE: old day keeps its original date (the move is the locationId removal)
          city: payload.day.city,
          title: payload.day.title,
          locationIds: payload.oldDayLocationIds.filter(id => id !== payload.locationId),
          events: [],
        };
        // We need the old day's original date/city/title — pass via payload
        // See note in EditItineraryPage: oldDayData is passed through the payload
        await updateItineraryDay(payload.oldDay, {
          ...oldDayUpdated,
          date: payload.oldDayDate,
          city: payload.oldDayCity,
          title: payload.oldDayTitle,
        });
        // Create or append to new day
        await createItineraryDay({
          day: payload.newDay,
          date: payload.day.date,
          city: payload.day.city,
          title: payload.day.title,
          locationIds: [payload.locationId],
          events: payload.day.events,
        });
      }
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return { submit, isLoading, error };
}
```

**Note on payload shape**: The `UpdateItineraryPayload` type needs three additional fields for the old day data when moving. Update the type in `client/src/types/index.ts` to add `oldDayDate: string`, `oldDayCity: string`, `oldDayTitle: string` to `UpdateItineraryPayload`.

**Validate**: `pnpm --filter client run typecheck`

---

### Task 9: Edit Page — `EditItineraryPage`

**File**: `client/src/pages/EditItineraryPage.tsx`
**Layer**: Frontend
**Action**: CREATE

Closely follows `AddItineraryPage.tsx`. Key differences:

1. **Receives** `useParams<{ day: string }>()` — parses day number
2. **Fetches** `useItinerary()` to find the target day + `useLocation(locationId)` for location data
3. **Pre-fills** form state once both data sources load (using `useEffect` with a `[dayData, locationData]` dependency)
4. **Shows loading state** (skeleton) while data is fetching
5. **Shows not-found state** if day doesn't exist (`EmptyState` with back link)
6. **Uses** `useUpdateItinerary` hook instead of `useCreateItinerary`
7. **Imports** `editMessages` instead of `addMessages` (for distinct labels)
8. **Edit mode indicators**:
   - Form card: add `border-l-4 border-accent` to existing glassmorphism classes
   - Day badge in the date row: `bg-accent text-white` pill showing "Editing Day X"
   - Submit button text: `editMessages.submitButton` ("Save Changes")
9. **On submit**: builds `UpdateItineraryPayload` including `oldDay`, `newDay`, `oldDayLocationIds`, and the three old day fields (`oldDayDate`, `oldDayCity`, `oldDayTitle`)
10. **Pre-fill maps URL**: use the existing Google Maps link from `location.externalLinks` — set the `mapsUrl` field and call `extraction.extract()` with it after load to restore the "success" extraction state with the existing coordinates

**Pre-fill extraction state**: The tricky part is that `AddItineraryPage` only submits when `extraction.state === 'success'`. In edit mode, if the URL hasn't changed, we need the extraction to be pre-satisfied. Two approaches:
- Option A (simpler): Skip URL re-extraction. In edit mode, allow submit even if extraction state is 'idle' — treat the existing coordinates from the location as valid. Only re-extract if the URL changes.
- **Use Option A**: Track a `coordinatesSource: 'existing' | 'extracted'` ref. If `coordinatesSource === 'existing'`, use `location.coordinates` directly in the submit payload. If the user changes the maps URL and extraction succeeds, switch to `'extracted'`.

This avoids making an unnecessary network call to extract coordinates that are already stored.

**Validate**: `pnpm --filter client run typecheck && pnpm --filter client run build`

---

### Task 10: ItineraryPage — Add Edit Triggers

**File**: `client/src/pages/ItineraryPage.tsx`
**Layer**: Frontend
**Action**: UPDATE

1. Add imports: `import { useNavigate } from 'react-router-dom'`, `import { motion } from 'framer-motion'`, `import { PencilLine } from 'lucide-react'`, `import { editMessages } from '../messages/edit.messages'`

2. Add `const navigate = useNavigate();` inside `ItineraryPage`

3. Wrap the outer day card `<div>` with `group` class:
   ```tsx
   <div key={day.day} className="rounded-2xl bg-surface border border-bg overflow-hidden group">
   ```

4. Modify the day header `<div>` — add the edit trigger between the title area and the city/date area:
   ```tsx
   <div className="p-4 border-b border-bg flex items-center justify-between">
     <div>
       <span className="text-accent text-sm font-semibold">
         {itineraryMessages.dayLabel} {day.day}
       </span>
       <h2 className="text-text-base font-bold text-lg">{day.title}</h2>
     </div>
     <div className="flex items-center gap-3">
       <motion.button
         whileHover={{ scale: 1.05 }}
         whileTap={{ scale: 0.95 }}
         onClick={() => navigate(`/edit/${day.day}`)}
         aria-label={editMessages.editDayAriaLabel}
         className="opacity-0 group-hover:opacity-100 transition-opacity duration-150
                    flex items-center gap-1.5 px-2.5 py-1 rounded-full
                    bg-accent/10 text-accent border border-accent/20
                    hover:bg-accent/20 text-xs font-semibold cursor-pointer"
       >
         <PencilLine size={12} />
         {editMessages.editButtonLabel}
       </motion.button>
       <div className="text-right">
         <p className="text-muted text-xs">{day.city}</p>
         <p className="text-muted text-xs">
           {new Date(day.date + 'T00:00:00').toLocaleDateString('en-AU', {
             month: 'short', day: 'numeric',
           })}
         </p>
       </div>
     </div>
   </div>
   ```

**Accessibility note**: The edit button is `opacity-0` at rest, which means keyboard users can still tab to it even when invisible. This is correct — `opacity-0` does not remove from tab order. The `aria-label` ensures screen readers announce the button's purpose.

**Validate**: `pnpm --filter client run typecheck && pnpm --filter client run build`

---

### Task 11: Register Route in App.tsx

**File**: `client/src/App.tsx`
**Layer**: Frontend
**Action**: UPDATE

1. Add import: `import { EditItineraryPage } from './pages/EditItineraryPage';`

2. Add route inside `<Routes>`:
   ```tsx
   <Route path="/edit/:day" element={<EditItineraryPage />} />
   ```

   Place after the existing `/add` route.

3. Do NOT add a nav link — the edit page is reached only via the edit trigger on day cards, not from the main nav.

**Validate**: `pnpm --filter client run typecheck && pnpm --filter client run build`

---

## Validation Commands

```bash
# Type check both packages
pnpm --filter server run typecheck
pnpm --filter client run typecheck

# Build both packages
pnpm --filter server run build
pnpm --filter client run build

# Dev servers (manual test)
pnpm --filter server dev   # :3001
pnpm --filter client dev   # :5173
```

---

## Security Checklist

- [x] All user inputs validated server-side (name, category, coordinates, city checked in both PUT handlers with 400 on missing fields)
- [x] No secrets exposed to client
- [x] No auth required (public site — consistent with existing design)
- [x] No SQL injection — parameterised queries via the `sql` tagged template
- [x] JSON path: `readFileSync`/`writeFileSync` are server-side only, data files are trusted internal data
- [x] CORS controlled by existing middleware — no changes needed
- [x] Rate limiting covers the new PUT endpoints (applied globally before routes)
- [x] Error messages never expose stack traces or file paths — route handlers use `next(err)` → global error middleware

---

## Risk Register

| Risk | Mitigation |
|------|------------|
| Day-change logic leaves orphaned locationId on old day | `useUpdateItinerary` removes locationId from old day before creating/appending to new day; test this flow manually |
| Pre-fill extraction state causes submit block | Option A (coordinatesSource ref) bypasses re-extraction when URL unchanged |
| Multiple locations per day — edit only touches the first | Documented limitation; days with multiple locations are rare in current data. The edit button edits the day-level metadata and its first location. Future iteration could support per-location edit. |
| JSON file corruption on concurrent writes | Acceptable risk for a small private site; write operations are rare and sequential in practice |
| User edits a day that has no locations (`locationIds: []`) | `EditItineraryPage` handles `locationId === undefined` — shows form without location fields, skips location update call |

---

## Acceptance Criteria

### Functional
- [ ] Edit button appears on hover of each day card in `/itinerary`
- [ ] Clicking edit navigates to `/edit/:day` with correct day number in URL
- [ ] Edit form is pre-filled with all fields from the existing day and its primary location
- [ ] Saving with same date updates the day and location in place
- [ ] Saving with different date: locationId removed from old day, added to new day, location's itineraryDays updated
- [ ] Success toast shown, redirect to `/itinerary` after 1.2s
- [ ] Error toast shown on network failure

### UX/UI
- [ ] Edit button is invisible at rest, visible on card hover
- [ ] Edit button has gold accent style matching the `text-accent` / `bg-accent` token
- [ ] Edit form has the left gold border stripe indicating edit mode
- [ ] Day badge in edit form is gold (`bg-accent`) not blue (`bg-primary`)
- [ ] Submit button reads "Save Changes"
- [ ] Loading skeleton shown while day + location data fetches
- [ ] Not-found state shown if day param doesn't exist

### Quality
- [ ] Zero TypeScript `any` — strict mode passes on both packages
- [ ] `pnpm --filter client run typecheck` passes
- [ ] `pnpm --filter server run typecheck` passes
- [ ] Both `pnpm --filter client run build` and `pnpm --filter server run build` succeed
- [ ] All strings in `EditItineraryPage` and edit trigger come from `editMessages` or `addMessages` — zero hardcoded strings
- [ ] Tailwind classes use only design tokens (`text-accent`, `bg-accent`, `text-muted`, etc.) — no raw hex
- [ ] External links in form still use `rel="noopener noreferrer"`

---

## Review Gates (MANDATORY)

After all tasks complete and validation passes, trigger in order:

### 1. UX/UI Review
Invoke `ui-ux-pro-max` + `bencium-innovative-ux-designer` with screenshots of:
- The edit trigger button on the day card (rest and hover states)
- The edit form in pre-filled state
- The edit form in saving state

Ask each skill to evaluate contrast, interaction states, and whether the edit-mode signals are clear.

### 2. QA Review — `superpowers:code-reviewer`
Verify all UI states (loading, pre-filled, saving, success, error, not-found), test the day-change flow end-to-end.

### 3. Principal Engineer Review — `pragmatic-code-reviewer`
Audit the update logic in `useUpdateItinerary`, the repository `update` methods, and the route validation. Check for race conditions in the day-change flow.
