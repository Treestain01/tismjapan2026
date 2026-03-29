# TISM Japan 2026 — Server Architecture

> Reference document for the Express/TypeScript API that backs the TISM Japan 2026 trip planner.
> Read this before adding any new endpoint, file, or dependency.

---

## 1. Project Overview

The server is a lightweight, read-only REST API built with **Express 4** and **TypeScript 5** (strict mode). Its sole job is to serve static trip data — locations, itinerary, gallery, budget, and trip metadata — to the React client that lives in the `client/` workspace of the same monorepo.

There is no database, no authentication, and no write operations. All data lives in JSON files under `src/data/`. The architecture is deliberately structured so that adding a database in the future requires changes to exactly one layer and zero other files.

**Tech stack**

| Concern | Library | Version |
|---|---|---|
| HTTP framework | express | ^4.18.2 |
| Security headers | helmet | ^7.1.0 |
| CORS | cors | ^2.8.5 |
| Rate limiting | express-rate-limit | ^7.1.5 |
| Language | TypeScript | ^5.3.2 |
| Dev runner | tsx (watch) | ^4.6.2 |

**Monorepo position**

```
tism-japan-2026/
  client/   ← Vite + React frontend (port 5173)
  server/   ← This package (port 3001)
```

The client calls `http://localhost:3001/api/...` in development. The `CORS_ORIGIN` environment variable controls which origins are allowed in production.

---

## 2. Directory Structure

```
server/
  src/
    data/               # Static JSON data files — the source of truth
    repositories/       # Data-access layer — the only layer that touches data files
    routes/             # HTTP layer — receives requests, calls repositories, sends responses
    types/
      index.ts          # ALL TypeScript interfaces and type aliases — defined once, used everywhere
    index.ts            # App entry point — middleware stack and route registration
  dist/                 # Compiled output (git-ignored, produced by `pnpm run build`)
  package.json
  tsconfig.json
  ARCHITECTURE.md       # This file
```

### What belongs where — strict rules

| Directory | Only contains | Never contains |
|---|---|---|
| `src/data/` | `.json` files matching the interfaces in `src/types/index.ts` | TypeScript, logic, anything executable |
| `src/repositories/` | `[resource].repository.ts` files that import JSON and export typed accessor methods | `req`, `res`, `next`, HTTP status codes, business logic |
| `src/routes/` | `[resource].route.ts` files that call repository methods and return HTTP responses | Direct JSON imports, business logic, data transformation |
| `src/types/` | `index.ts` with all `interface` and `type` declarations | Everything else |

---

## 3. Architecture: The Three Layers

The server enforces a strict three-layer architecture. Every request travels the same path:

```
HTTP request
    ↓
src/routes/[resource].route.ts       ← Layer 1: HTTP
    ↓
src/repositories/[resource].repository.ts  ← Layer 2: Data access
    ↓
src/data/[resource].json             ← Layer 3: Data (today JSON, tomorrow a DB)
    ↓
HTTP response
```

This separation exists so that each layer can change independently. Routes change when the API contract changes. Repositories change when the data source changes. Data changes when the content changes. None of these events should ripple into the other layers.

---

### Layer 1 — Routes (`src/routes/`)

**Sole responsibility:** Receive an HTTP request. Call a repository method. Return an HTTP response.

That is the entire job of a route handler. Nothing else belongs here.

**Rules:**

- Must import from `../repositories/[resource].repository` — never from `../data/`
- Must NOT transform, filter, sort, or compute data — that is the repository's or a future service layer's job
- Must NOT contain `if/else` logic beyond a null check for 404 responses
- Returns `404 { error: string }` when a resource is not found — this is the only expected error case for a read-only API
- Does not need `try/catch` — JSON reads cannot throw at runtime (data is loaded at startup)
- No trailing slash on registered paths
- File naming: `[resource].route.ts`

**Example — the complete locations route:**

```typescript
// src/routes/locations.route.ts
import { Router } from 'express';
import { locationsRepository } from '../repositories/locations.repository';

const router = Router();

router.get('/', (_req, res) => {
  res.json(locationsRepository.findAll());
});

router.get('/:id', (req, res) => {
  const location = locationsRepository.findById(req.params.id);
  if (!location) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  res.json(location);
});

export default router;
```

Note `_req` (underscore prefix) on handlers that do not use the request object — this satisfies the TypeScript `noUnusedLocals` rule without disabling it.

---

### Layer 2 — Repositories (`src/repositories/`)

**Sole responsibility:** Provide typed access to data. Currently reads JSON. In the future, runs DB queries.

This is the **only layer that changes** when a database replaces the JSON files.

**Rules:**

- Imports JSON data files directly (`import data from '../data/[resource].json'`)
- Exports a named const object `[resource]Repository` — not a class, not a default export
- Every method has an explicit return type using interfaces from `src/types/index.ts`
- Must NOT import from `express` or reference `req`, `res`, or `next`
- Must NOT be called from anywhere except route files
- Uses the TypeScript cast pattern `data as Type` because `resolveJsonModule` infers JSON as a literal type, not the broader interface
- File naming: `[resource].repository.ts`

**Example — the locations repository:**

```typescript
// src/repositories/locations.repository.ts
import locationsData from '../data/locations.json';
import type { Location } from '../types';

export const locationsRepository = {
  findAll: (): Location[] => locationsData as Location[],
  findById: (id: string): Location | undefined =>
    (locationsData as Location[]).find(l => l.id === id),
};
```

**Why the cast?** TypeScript infers the JSON import as a deeply literal type (e.g. `{ id: "fuk-001", ... }[]`). Casting to `Location[]` widens it to the interface, which is what the route layer and clients expect.

**Repository method naming convention**

| Pattern | Used for |
|---|---|
| `findAll()` | Returns all records as an array |
| `findById(id)` | Returns one record or `undefined` |
| `get()` | Returns a single object (not a collection) |

---

### Layer 3 — Data (`src/data/`)

**Currently:** Static `.json` files loaded at process startup via TypeScript's `resolveJsonModule`.

**Future:** Replaced by database queries inside the repository layer. The JSON files can serve as seed data.

**Rules:**

- Every JSON file must exactly match the corresponding TypeScript interface in `src/types/index.ts`
- JSON files are internal data — treat as trusted. No sanitisation is needed at the route layer
- Never import JSON files from routes — always go through the repository
- Array resources (locations, itinerary, gallery) are JSON arrays: `[...]`
- Singleton resources (budget, trip) are JSON objects: `{...}`

**Current data files:**

| File | Type | Shape |
|---|---|---|
| `locations.json` | Array | `Location[]` |
| `itinerary.json` | Array | `ItineraryDay[]` |
| `gallery.json` | Array | `GalleryImage[]` |
| `budget.json` | Object | `BudgetSummary` |
| `trip.json` | Object | `TripInfo` |

---

## 4. TypeScript Standards

TypeScript is configured with `"strict": true`. This is non-negotiable.

**Key `tsconfig.json` settings and their implications:**

| Setting | Value | Implication |
|---|---|---|
| `strict` | `true` | Enables all strict checks — no implicit `any`, strict null checks, etc. |
| `resolveJsonModule` | `true` | Allows `import data from './data/foo.json'` — TypeScript types the import |
| `target` | `ES2020` | Modern JS output — async/await, optional chaining, nullish coalescing |
| `module` | `CommonJS` | Node.js `require`-style modules in output |
| `outDir` | `./dist` | Compiled output directory |

**Rules:**

- No `any` types — ever. If you are tempted to use `any`, use `unknown` and narrow it, or define a proper interface
- All repository method return types must be explicitly annotated (not inferred from JSON)
- Use `interface` for data shapes (objects with named fields)
- Use `type` for unions, aliases, and computed types
- All interfaces and types go in `src/types/index.ts` — never define them inline in route or repository files

**How to add a new type:**

```typescript
// src/types/index.ts  — add your interface here

export interface Accommodation {
  id: string;
  name: string;
  city: 'Fukuoka' | 'Nagasaki' | 'Kagoshima';
  pricePerNightJPY: number;
}
```

Then import it where needed:

```typescript
import type { Accommodation } from '../types';
```

The `import type` syntax is preferred for types — it is stripped at compile time and produces no runtime cost.

---

## 5. API Contract Standards

### Response conventions

| Scenario | HTTP status | Response body |
|---|---|---|
| Successful collection | 200 | JSON array — `[...]` — never `null` |
| Successful single resource | 200 | JSON object — `{...}` |
| Resource not found | 404 | `{ "error": "Resource not found" }` |
| Unmatched route | 404 | `{ "error": "Not found" }` |

**No envelope wrapper.** Responses are the data directly — not `{ data: [...] }`, not `{ success: true, result: {...} }`. The client receives the array or object as the top-level JSON value.

**Collections always return arrays.** If `gallery.json` is empty, `GET /api/gallery` returns `[]`, not `null` or `404`. An empty gallery is valid data, not an error.

**Error shape is always `{ error: string }`.** Never expose stack traces, file paths, internal identifiers, or error constructor names. The error message should be human-readable but reveal nothing about internal implementation.

### Endpoint table

| Method | Path | Success response | Not-found response |
|---|---|---|---|
| GET | `/api/locations` | `Location[]` | — |
| GET | `/api/locations/:id` | `Location` | `404 { error: "Location not found" }` |
| GET | `/api/itinerary` | `ItineraryDay[]` | — |
| GET | `/api/gallery` | `GalleryImage[]` | — |
| GET | `/api/budget` | `BudgetSummary` | — |
| GET | `/api/trip` | `TripInfo` | — |

**HTTP methods:** GET only. This is a read-only public API. No POST, PUT, PATCH, or DELETE endpoints exist.

**No trailing slashes.** Routes are registered as `/api/locations`, not `/api/locations/`. Express will handle trailing slashes via the `strict` router option if needed, but do not add them.

---

## 6. Security Standards

### Helmet

Helmet is applied as the first middleware in `src/index.ts`. It sets a suite of HTTP security headers (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, etc.) on every response.

**Never remove Helmet. Never call `app.use(helmet())` after any route registration.** Order matters — see Section 9.

### CORS

```typescript
// src/index.ts
const corsOrigin = process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'];
app.use(cors({ origin: corsOrigin }));
```

`CORS_ORIGIN` is read from the environment and split on commas, allowing multiple origins. The default `http://localhost:5173` is the Vite dev server — safe for local development only.

**Never hardcode origins. Never use `*` in production.** A wildcard CORS policy allows any website on the internet to make requests to this API from a visitor's browser.

### Rate limiting

```typescript
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
```

100 requests per 15-minute window, applied globally to all routes. This protects against trivial scraping and denial-of-service. It is applied after Helmet and CORS but before route handlers.

### Environment variables

Never put secrets (API keys, database passwords, tokens) in source code. Use `.env` files locally (git-ignored) and environment injection in production.

### Input validation

There is currently no user-supplied input — this is a read-only GET API. The only variable input is the `:id` parameter in `GET /api/locations/:id`, which is passed directly to `Array.find()` against static data. No injection is possible.

**When adding POST or PUT endpoints:** use [Zod](https://zod.dev) to parse and validate request bodies before passing them to any repository method. Never pass `req.body` directly to a data layer.

### Error messages

Route handlers must not forward error details to clients. The only acceptable error shape is:

```json
{ "error": "Human-readable description" }
```

Not acceptable:
```json
{ "error": "ENOENT: no such file or directory, open 'src/data/locations.json'" }
{ "stack": "TypeError: Cannot read properties of undefined..." }
```

---

## 7. Adding a New Resource — Step-by-Step Checklist

Follow this checklist exactly when adding a new data resource (e.g. `accommodation`, `transport`). Do not skip steps.

1. **Add TypeScript interface to `src/types/index.ts`**

   ```typescript
   export interface Accommodation {
     id: string;
     name: string;
     // ...
   }
   ```

2. **Create `src/data/[resource].json`** — shape must exactly match the interface

   ```json
   [
     { "id": "acc-001", "name": "Hotel Forza Hakata" }
   ]
   ```

3. **Create `src/repositories/[resource].repository.ts`**

   ```typescript
   import accommodationData from '../data/accommodation.json';
   import type { Accommodation } from '../types';

   export const accommodationRepository = {
     findAll: (): Accommodation[] => accommodationData as Accommodation[],
     findById: (id: string): Accommodation | undefined =>
       (accommodationData as Accommodation[]).find(a => a.id === id),
   };
   ```

4. **Create `src/routes/[resource].route.ts`**

   ```typescript
   import { Router } from 'express';
   import { accommodationRepository } from '../repositories/accommodation.repository';

   const router = Router();

   router.get('/', (_req, res) => {
     res.json(accommodationRepository.findAll());
   });

   router.get('/:id', (req, res) => {
     const item = accommodationRepository.findById(req.params.id);
     if (!item) {
       res.status(404).json({ error: 'Accommodation not found' });
       return;
     }
     res.json(item);
   });

   export default router;
   ```

5. **Register the route in `src/index.ts`**

   ```typescript
   import accommodationRouter from './routes/accommodation.route';
   // ...
   app.use('/api/accommodation', accommodationRouter);
   ```

   Add the import with the other router imports at the top. Add the `app.use` line with the other route registrations, before the 404 catch-all handler.

6. **Run `pnpm run typecheck`** — must pass with zero errors

7. **Run `pnpm run build`** — must succeed

8. **Manual test:**

   ```bash
   curl http://localhost:3001/api/accommodation
   curl http://localhost:3001/api/accommodation/acc-001
   curl http://localhost:3001/api/accommodation/does-not-exist
   ```

   Expected: array, object, `404 { error: "..." }` respectively.

9. **Mirror the interface in the client**

   Add the same interface to `client/src/types/index.ts` so the frontend is typed against the same shape.

10. **Add the fetch function in the client**

    Create or update `client/src/api/accommodation.api.ts` to add the fetch function for the new endpoint.

---

## 8. Database Migration Guide

The architecture is explicitly designed so that a future database migration touches the minimum possible surface area.

### What changes

**Only `src/repositories/*.repository.ts` files change.** Every other file stays identical.

Before (JSON):
```typescript
// src/repositories/locations.repository.ts
import locationsData from '../data/locations.json';
import type { Location } from '../types';

export const locationsRepository = {
  findAll: (): Location[] => locationsData as Location[],
  findById: (id: string): Location | undefined =>
    (locationsData as Location[]).find(l => l.id === id),
};
```

After (Prisma, for example):
```typescript
// src/repositories/locations.repository.ts
import { prisma } from '../db/client';
import type { Location } from '../types';

export const locationsRepository = {
  findAll: (): Promise<Location[]> => prisma.location.findMany(),
  findById: (id: string): Promise<Location | undefined> =>
    prisma.location.findUnique({ where: { id } }) ?? undefined,
};
```

The method names (`findAll`, `findById`, `get`) and return types (`Location[]`, `Location | undefined`) stay the same. Routes call the same methods. The client sees the same JSON. Only the implementation changes.

Note that repository methods would become `async` — routes would need `await` added, but their structure remains identical.

### What does NOT change

- `src/routes/` — unchanged
- `src/types/index.ts` — unchanged
- `src/index.ts` — unchanged (except adding a DB connection call at startup if needed)
- Client code — unchanged

### What to do with `src/data/`

Keep the JSON files as seed data. Use them to populate the database on first run. Archive them once the database is seeded and stable.

### Recommended next steps for DB migration

1. Add `src/db/` directory with:
   - `client.ts` — Prisma client singleton
   - `schema.prisma` — schema mirroring `src/types/index.ts`
   - `seed.ts` — reads JSON files and inserts into DB
2. Add Prisma as a dependency: `pnpm add prisma @prisma/client`
3. Use PostgreSQL — it maps cleanly to the object/array shapes already defined
4. Update repositories one at a time — start with the simplest (e.g. `trip`, `budget`)
5. Run `pnpm run typecheck` after each repository change

---

## 9. Middleware Architecture

The middleware stack in `src/index.ts` is applied in this exact order:

```typescript
app.use(helmet());                                           // 1. Security headers
app.use(cors({ origin: corsOrigin }));                      // 2. CORS policy
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })); // 3. Rate limiting
app.use(express.json());                                     // 4. Body parsing

app.use('/api/locations', locationsRouter);                  // 5. Route handlers
app.use('/api/itinerary', itineraryRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/budget', budgetRouter);
app.use('/api/trip', tripRouter);

app.use((_req, res) => {                                     // 6. 404 catch-all
  res.status(404).json({ error: 'Not found' });
});
```

### Why order matters

**Helmet must be first.** Security headers must be set on every response, including error responses from later middleware. Placing Helmet after route handlers means any response that short-circuits before reaching Helmet would be sent without security headers.

**CORS before rate limiter.** A rate-limited request (429) still needs CORS headers, otherwise the browser will report a CORS error instead of the actual 429. Placing CORS early ensures all responses carry the correct `Access-Control-Allow-Origin` header.

**Rate limiter before routes.** Throttled requests must be rejected before any route handler runs. Placing rate limiting after routes would mean every request, including blocked ones, would hit the route logic before being rejected.

**`express.json()` before routes.** Body parsing must happen before route handlers try to read `req.body`. Since this API is currently GET-only, this is precautionary — it is required the moment any POST or PUT endpoint is added.

**404 catch-all last.** Express matches middleware in registration order. The catch-all must come after all route registrations — if it were registered first, it would intercept all requests before any route had a chance to handle them.

### What breaks if middleware is reordered

| Swap | Consequence |
|---|---|
| Helmet after routes | Some responses sent without security headers |
| CORS after rate limiter | Browser shows CORS error on 429 responses |
| Rate limiter after routes | Routes execute before throttle check — no protection |
| 404 handler before routes | Every request returns 404 — no routes reachable |

---

## 10. Environment Variables

| Variable | Purpose | Default | Required in production |
|---|---|---|---|
| `PORT` | Port the Express server listens on | `3001` | No — defaults to 3001 |
| `CORS_ORIGIN` | Comma-separated list of allowed origins | `http://localhost:5173` | Yes — set to your deployed frontend URL |

**`CORS_ORIGIN` accepts multiple origins:**

```
CORS_ORIGIN=https://tism-japan.example.com,https://www.tism-japan.example.com
```

**`.env.example`** (check this file into source control, never `.env` itself):

```
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

**Rules:**

- Never commit `.env` files — add to `.gitignore`
- Always commit `.env.example` with placeholder values
- Any new environment variable must be added to `.env.example` before the PR is merged
- Never hardcode values that should come from environment variables

---

## 11. Development Scripts

All scripts are run from the `server/` directory with `pnpm run [script]`.

| Script | Command | Purpose |
|---|---|---|
| `dev` | `tsx watch src/index.ts` | Start the server in watch mode. `tsx` transpiles TypeScript directly — no build step. Automatically restarts on any file change in `src/`. Use this for all local development. |
| `build` | `tsc` | Compile TypeScript to `dist/` using the settings in `tsconfig.json`. Run this to verify the project compiles cleanly before merging. |
| `start` | `node dist/index.js` | Run the compiled output. Used in production or to test the built artifact locally. Requires `pnpm run build` first. |
| `typecheck` | `tsc --noEmit` | Type-check the entire project without producing any output files. Faster than `build`. Run this after every change to catch type errors early. |

**Development workflow:**

```bash
# Terminal 1 — start the server in watch mode
cd server && pnpm run dev

# Terminal 2 — type-check after making changes
cd server && pnpm run typecheck

# Before merging — verify the build compiles
cd server && pnpm run build
```

---

## 12. What NOT to Do

These are explicit anti-patterns. Each one has been ruled out for a specific reason.

**Do not import JSON directly from routes.**
```typescript
// BAD — route directly importing data
import locations from '../data/locations.json';
```
This bypasses the repository layer and makes a future database migration require changes to route files, which should never change when the data source changes.

**Do not use `any` TypeScript types.**
```typescript
// BAD
const data: any = locationsData;
```
`any` disables type checking entirely. Use the cast pattern (`data as Location[]`) or define a proper interface.

**Do not put business logic in routes.**
```typescript
// BAD — filtering/transforming in the route
router.get('/', (_req, res) => {
  const attractions = locationsData.filter(l => l.category === 'attraction');
  res.json(attractions);
});
```
Routes call repositories and return responses. If you need filtered data, add a method to the repository (`findByCategory(category: LocationCategory)`).

**Do not hardcode CORS origins.**
```typescript
// BAD
app.use(cors({ origin: 'https://tism-japan.example.com' }));
```
Origins vary between environments. Use `process.env.CORS_ORIGIN` so the same code runs in development and production without modification.

**Do not use `console.log` in production code.**
`console.log` writes unstructured output with no log level, timestamp, or correlation ID. It is acceptable in `dev` mode via `tsx watch`, but remove it before merging. Use structured logging (e.g. `pino`) if server-side logging is needed.

**Do not expose stack traces or internal paths in error responses.**
```typescript
// BAD
res.status(500).json({ error: err.stack });
res.status(500).json({ error: err.message });
```
This reveals implementation details. Always return `{ error: 'Human-readable message' }`.

**Do not use `*` as a CORS wildcard in production.**
`cors({ origin: '*' })` allows any website to make cross-origin requests to this API. Use explicit origin allowlists in production.

**Do not remove or bypass Helmet.**
Security headers are mandatory. Removing Helmet to "simplify" a response is not acceptable — it exposes users to clickjacking, MIME sniffing, and other browser-level attacks.

**Do not add new environment variables without updating `.env.example`.**
`.env.example` is the contract between the codebase and the person deploying it. An undocumented environment variable causes silent misconfiguration.

**Do not bypass the repository layer to read data directly.**
Every route must go through a repository, even if the repository currently has one line. This rule exists to keep the migration path to a database clean.
