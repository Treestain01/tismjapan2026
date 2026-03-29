# Plan: TISM Japan 2026 — Full-Stack Travel Itinerary Website

## Summary

A full-stack travel itinerary website for a group trip to Kyushu, Japan in late November 2026. The site centres on an interactive Mapbox map of Kyushu with categorised, icon-coded pins for 20+ locations across Fukuoka, Nagasaki, and Kagoshima. Supporting pages include a home/landing page with hero, trip overview, and countdown timer; an itinerary day-by-day view; a gallery stub; and a budget tracker stub. The design blends modern travel aesthetics with subtle Japanese minimalism, supports both dark and light modes, and is built mobile-first with equal desktop quality. All static UI text lives in `*.messages.ts` files for future i18n; all dynamic content is served from an Express JSON API. The architecture is explicitly designed to have the JSON data layer swapped for a database with minimal refactoring.

## User Story

As a member of the TISM group
I want to explore an interactive map of our Kyushu itinerary and view full details on each location
So that I can plan, reference, and share our Japan 2026 trip with the group

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | HIGH |
| Touch Points | FULL_STACK |
| Systems Affected | Frontend (Vite + React), Backend (Express), Deployment (Vercel + Railway) |

---

## Answers Summary (User Decisions)

| Question | Decision |
|----------|----------|
| Map library | Mapbox GL JS |
| Frontend | Vite + React + TypeScript + Tailwind CSS |
| Backend | Express + TypeScript |
| Package manager | pnpm |
| Nav pages | Home, Map, Itinerary, Gallery, Budget |
| Home content | Hero, Trip Overview, Countdown Timer |
| Pin popup fields | Photos, Notes, Address/Hours, Links, Itinerary Day, Cost, Category |
| Pin style | Colour-coded icons (SVG per category) |
| Cities | Fukuoka, Nagasaki, Kagoshima (~22 mock locations) |
| Auth | Public (no auth) |
| Deployment | Vercel (frontend) + Railway (backend) |
| Theme | Dark + Light mode toggle |
| Aesthetic | Modern + Japanese touches |
| Mobile | Equal priority (desktop + mobile) |
| Departure date | ~November 28, 2026 (placeholder, adjustable) |

---

## UX/UI Spec

### Design Direction

| Decision | Choice |
|----------|--------|
| **Colour palette (dark)** | Background `#0D1117`, Surface `#161B27`, Primary `#1B4B8A` (Japan blue / indigo), Accent `#D4A843` (warm gold), Text `#E8E6E3`, Muted `#8B98A8` |
| **Colour palette (light)** | Background `#F7F3EE` (warm paper), Surface `#FFFFFF`, Primary `#1B4B8A`, Accent `#B8860B` (dark gold), Text `#1C1917`, Muted `#6B7280` |
| **Semantic tokens** | `--color-primary`, `--color-accent`, `--color-bg`, `--color-surface`, `--color-text`, `--color-muted`, `--color-error`, `--color-success` |
| **Typography** | Heading: `Inter` 600–700, Body: `Inter` 400, Label: `Inter` 500. Scale: 12 / 14 / 16 / 18 / 24 / 32 / 48px |
| **Component style** | Glassmorphism for map overlays and popups (`backdrop-filter: blur(16px)`, `rgba` backgrounds). Flat minimal for navigation and content pages. |
| **Motion** | Framer Motion. Enter: `ease-out 250ms`. Exit: `ease-in 150ms`. Map panel slide: `spring(stiffness:300, damping:30)`. Respect `prefers-reduced-motion`. |
| **Layout** | Full-screen map on map page. Max-width `max-w-7xl` on content pages. Mobile-first breakpoints: 375 / 768 / 1024 / 1440px. |
| **Responsive strategy** | Equal priority. Mobile: bottom-safe-area aware, hamburger nav drawer. Desktop: horizontal top navbar. |

### Navigation Design

- **Desktop**: Fixed top navbar, glassmorphism on scroll (`backdrop-blur-md bg-bg/80`). Left: TISM Japan 2026 wordmark. Right: Nav links + theme toggle (sun/moon).
- **Mobile**: Hamburger icon → slide-in drawer from right with nav items stacked vertically.
- **Active state**: Subtle gold underline indicator + slightly brighter text weight.
- **Z-index**: Navbar `z-40`, map popups `z-30`, modals `z-50`.

### Pin Category Colours & Icons (Lucide SVG)

| Category | Colour | Icon |
|----------|--------|------|
| Attraction | `#4A90D9` (blue) | `Landmark` |
| Restaurant | `#E85D4A` (coral red) | `Utensils` |
| Accommodation | `#7B68EE` (purple) | `BedDouble` |
| Shopping | `#F97316` (orange) | `ShoppingBag` |
| Transport | `#10B981` (green) | `Train` |

### UI States to Implement

| State | Implementation |
|-------|---------------|
| **Map loading** | Skeleton shimmer over map container until Mapbox tiles load |
| **Pin hover** | Glassmorphic tooltip: `LocationHoverTooltip` — title + 1-line summary, appears 200ms after hover |
| **Pin selected (click)** | `LocationPanel` slides in from right (desktop) or up from bottom (mobile). Framer Motion spring. |
| **Panel loading** | Skeleton rows inside `LocationPanel` while data resolves |
| **Panel error** | Inline error message with retry button |
| **Countdown** | Live timer updating every second; if departed, shows "We're in Japan!" |
| **Empty gallery** | Illustrated empty state: "Photos coming soon 📸" placeholder card |
| **Empty budget** | Illustrated empty state with "Budget planning coming soon" |
| **Theme toggle** | Instant class swap on `<html>`, persisted to `localStorage`, animated sun↔moon icon |

---

## API Contract

| Method | Path | Request | Response | Auth |
|--------|------|---------|----------|------|
| `GET` | `/api/locations` | — | `Location[]` | No |
| `GET` | `/api/locations/:id` | — | `Location` | No |
| `GET` | `/api/itinerary` | — | `ItineraryDay[]` | No |
| `GET` | `/api/gallery` | — | `GalleryImage[]` | No |
| `GET` | `/api/budget` | — | `BudgetSummary` | No |
| `GET` | `/api/trip` | — | `TripInfo` | No |

---

## Mock Data Specification (22 Locations)

### Fukuoka (9 locations)

| # | Name | Category | Day | Est. Cost |
|---|------|----------|-----|-----------|
| 1 | Ichiran Ramen Honten (Fukuoka) | Restaurant | Day 2 | ¥1,200 |
| 2 | Fukuoka Castle Ruins (Maizuru Park) | Attraction | Day 2 | Free |
| 3 | Ohori Park | Attraction | Day 2 | Free |
| 4 | Kushida Shrine | Attraction | Day 3 | Free |
| 5 | Canal City Hakata | Shopping | Day 3 | Varies |
| 6 | Nakasu Yatai Food Stalls | Restaurant | Day 3 | ¥3,000 |
| 7 | Yanagibashi Rengo Market | Restaurant | Day 2 | ¥800 |
| 8 | Hakata Station | Transport | Day 1 | — |
| 9 | Hotel Forza Hakata (mock) | Accommodation | Days 1–3 | ¥12,000/night |

### Nagasaki (7 locations)

| # | Name | Category | Day | Est. Cost |
|---|------|----------|-----|-----------|
| 10 | Glover Garden | Attraction | Day 5 | ¥620 |
| 11 | Nagasaki Peace Memorial Park | Attraction | Day 5 | Free |
| 12 | Dejima Wharf | Attraction | Day 5 | Free |
| 13 | Meganebashi (Spectacles Bridge) | Attraction | Day 6 | Free |
| 14 | Nagasaki Chinatown (Shinchi) | Restaurant | Day 5 | ¥2,000 |
| 15 | Mt. Inasa Observatory | Attraction | Day 6 | ¥520 |
| 16 | ANA Crowne Plaza Nagasaki (mock) | Accommodation | Days 4–6 | ¥15,000/night |

### Kagoshima (6 locations)

| # | Name | Category | Day | Est. Cost |
|---|------|----------|-----|-----------|
| 17 | Sakurajima Ferry + Volcanic Trail | Attraction | Day 8 | ¥160 |
| 18 | Sengan-en Garden | Attraction | Day 8 | ¥1,000 |
| 19 | Tenmonkan Shopping Street | Shopping | Day 9 | Varies |
| 20 | Shiroyama Observatory | Attraction | Day 8 | Free |
| 21 | Kumasotei (Satsuma cuisine) | Restaurant | Day 9 | ¥4,000 |
| 22 | JR Kagoshima-Chuo Station | Transport | Day 7 | — |

---

## Architecture Map

### Monorepo Structure

```
tism-japan-2026/
├── client/                          # Vite + React + TypeScript
│   ├── public/
│   │   └── japan-hero.jpg           # Mock hero image
│   ├── src/
│   │   ├── api/                     # API client layer (all fetch calls)
│   │   │   ├── locations.api.ts
│   │   │   ├── itinerary.api.ts
│   │   │   ├── gallery.api.ts
│   │   │   ├── budget.api.ts
│   │   │   └── trip.api.ts
│   │   ├── components/
│   │   │   ├── navigation/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   └── MobileDrawer.tsx
│   │   │   ├── map/
│   │   │   │   ├── MapView.tsx
│   │   │   │   ├── LocationPin.tsx
│   │   │   │   ├── LocationHoverTooltip.tsx
│   │   │   │   └── LocationPanel.tsx
│   │   │   ├── home/
│   │   │   │   ├── HeroSection.tsx
│   │   │   │   ├── TripOverview.tsx
│   │   │   │   └── CountdownTimer.tsx
│   │   │   └── ui/
│   │   │       ├── ThemeToggle.tsx
│   │   │       ├── Badge.tsx
│   │   │       ├── SkeletonLoader.tsx
│   │   │       └── EmptyState.tsx
│   │   ├── hooks/
│   │   │   ├── useLocations.ts      # Fetches + caches locations
│   │   │   ├── useLocation.ts       # Single location by id
│   │   │   ├── useItinerary.ts
│   │   │   └── useTrip.ts
│   │   ├── messages/                # i18n-ready static text (NO hardcoded UI strings)
│   │   │   ├── common.messages.ts
│   │   │   ├── home.messages.ts
│   │   │   ├── map.messages.ts
│   │   │   ├── itinerary.messages.ts
│   │   │   ├── gallery.messages.ts
│   │   │   └── budget.messages.ts
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── MapPage.tsx
│   │   │   ├── ItineraryPage.tsx
│   │   │   ├── GalleryPage.tsx
│   │   │   └── BudgetPage.tsx
│   │   ├── store/                   # Zustand stores
│   │   │   ├── map.store.ts         # selectedLocationId, hoveredLocationId, viewport
│   │   │   └── theme.store.ts       # theme: 'dark' | 'light', toggle()
│   │   ├── types/
│   │   │   └── index.ts             # All shared TS types (mirrors server/types)
│   │   ├── utils/
│   │   │   └── categoryConfig.ts    # Pin colours + Lucide icons per category
│   │   ├── App.tsx                  # Router setup
│   │   └── main.tsx
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── package.json
│
├── server/                          # Express + TypeScript
│   ├── src/
│   │   ├── data/                    # JSON mock data (swapped for DB later)
│   │   │   ├── locations.json
│   │   │   ├── itinerary.json
│   │   │   ├── gallery.json
│   │   │   ├── budget.json
│   │   │   └── trip.json
│   │   ├── repositories/            # Data access layer (swap JSON→DB here only)
│   │   │   ├── locations.repository.ts
│   │   │   ├── itinerary.repository.ts
│   │   │   ├── gallery.repository.ts
│   │   │   ├── budget.repository.ts
│   │   │   └── trip.repository.ts
│   │   ├── routes/
│   │   │   ├── locations.route.ts
│   │   │   ├── itinerary.route.ts
│   │   │   ├── gallery.route.ts
│   │   │   ├── budget.route.ts
│   │   │   └── trip.route.ts
│   │   ├── types/
│   │   │   └── index.ts             # Same types as client/src/types/index.ts
│   │   └── index.ts                 # Express app + CORS + routes
│   ├── tsconfig.json
│   └── package.json
│
└── pnpm-workspace.yaml
```

### Key Architecture Decisions

**Repository Pattern on Backend**: All JSON file reads happen in `*.repository.ts` files — not in routes. When a database is added, only these files change. Routes and frontend API calls remain identical.

**Messages Files Pattern**: Every static string rendered in the UI must be imported from a `*.messages.ts` file. Format:
```ts
// map.messages.ts
export const mapMessages = {
  pageTitle: 'Explore Kyushu',
  pinTooltipCta: 'Click to learn more',
  panelCloseLabel: 'Close location details',
} as const;
```

**API Client Layer**: All `fetch` calls are isolated in `client/src/api/*.api.ts`. Components never call `fetch` directly. Hooks call the API layer. This makes future auth headers, error interceptors, or base URL changes a single-file change.

**Zustand Stores**: Two stores only.
- `map.store.ts`: `selectedLocationId: string | null`, `hoveredLocationId: string | null`
- `theme.store.ts`: `theme: 'dark' | 'light'`, `toggle()`, persisted to `localStorage`

**Deployment**:
- Frontend → Vercel (standard Vite deploy). Env var: `VITE_API_URL=https://your-backend.railway.app`
- Backend → Railway (Express server). CORS configured to allow Vercel domain + localhost.
- Mapbox token stored in `VITE_MAPBOX_TOKEN` env var on Vercel (never committed to git).

---

## Shared TypeScript Types

```ts
// types/index.ts (identical in client and server)

export type LocationCategory =
  | 'attraction'
  | 'restaurant'
  | 'accommodation'
  | 'shopping'
  | 'transport';

export interface Location {
  id: string;
  name: string;
  category: LocationCategory;
  coordinates: { lng: number; lat: number };
  city: 'Fukuoka' | 'Nagasaki' | 'Kagoshima';
  summary: string;              // 1-2 sentence hover tooltip
  description: string;          // Full notes for panel
  address: string;
  openingHours: string | null;
  estimatedCost: string | null;
  itineraryDays: number[];      // e.g. [2, 3]
  imageUrls: string[];
  externalLinks: { label: string; url: string }[];
}

export interface ItineraryDay {
  day: number;
  date: string;                 // ISO date string
  city: string;
  title: string;
  locationIds: string[];
}

export interface GalleryImage {
  id: string;
  url: string;
  caption: string;
  locationId: string | null;
}

export interface BudgetSummary {
  totalEstimatedJPY: number;
  breakdown: { category: LocationCategory; totalJPY: number }[];
}

export interface TripInfo {
  title: string;
  departureDate: string;        // ISO date: '2026-11-28'
  returnDate: string;
  description: string;
  cities: string[];
}
```

---

## Security Checklist

- [x] No user inputs (public read-only site, no forms)
- [x] Mapbox token in env var, never in source code
- [x] CORS: explicitly whitelist Vercel domain, no wildcard in production
- [x] No secrets or credentials in JSON mock data
- [x] Rate limiting: `express-rate-limit` on all API routes (100 req/15min)
- [x] Helmet.js for security headers on Express
- [x] External links open with `rel="noopener noreferrer"`

---

## Risk Register

| Risk | Mitigation |
|------|------------|
| Mapbox free tier limits | Mapbox free tier gives 50k map loads/month — more than sufficient for a private group site |
| `backdrop-filter` not supported in older browsers | Add `-webkit-backdrop-filter` prefix; graceful fallback to solid `bg-surface/90` |
| Railway free tier sleeping | Railway's free tier may cold-start. Add a loading skeleton on API calls with generous timeout |
| Mobile map performance | Use Mapbox's `optimizeSpeed: true` option; limit active markers to visible viewport |
| Future database migration | Repository pattern isolates data layer; migration touches only `*.repository.ts` files |
| Messages file discipline | ESLint rule or code review to catch any string literals in JSX outside messages files |

---

## Files to Create

### Shared / Root

| File | Action | Purpose |
|------|--------|---------|
| `pnpm-workspace.yaml` | CREATE | Monorepo workspace config |
| `.gitignore` | CREATE | Ignore node_modules, .env files |
| `.env.example` | CREATE | Document required env vars |

### Client

| File | Action | Purpose |
|------|--------|---------|
| `client/package.json` | CREATE | Frontend dependencies |
| `client/vite.config.ts` | CREATE | Vite config with proxy to backend in dev |
| `client/tailwind.config.ts` | CREATE | Tailwind config with design tokens |
| `client/src/types/index.ts` | CREATE | Shared TypeScript types |
| `client/src/messages/common.messages.ts` | CREATE | Shared UI strings |
| `client/src/messages/home.messages.ts` | CREATE | Home page strings |
| `client/src/messages/map.messages.ts` | CREATE | Map page strings |
| `client/src/messages/itinerary.messages.ts` | CREATE | Itinerary page strings |
| `client/src/messages/gallery.messages.ts` | CREATE | Gallery page strings |
| `client/src/messages/budget.messages.ts` | CREATE | Budget page strings |
| `client/src/store/theme.store.ts` | CREATE | Zustand theme store with localStorage persistence |
| `client/src/store/map.store.ts` | CREATE | Zustand map selection store |
| `client/src/utils/categoryConfig.ts` | CREATE | Pin colour + icon mapping per category |
| `client/src/api/locations.api.ts` | CREATE | Locations API client |
| `client/src/api/itinerary.api.ts` | CREATE | Itinerary API client |
| `client/src/api/gallery.api.ts` | CREATE | Gallery API client |
| `client/src/api/budget.api.ts` | CREATE | Budget API client |
| `client/src/api/trip.api.ts` | CREATE | Trip info API client |
| `client/src/hooks/useLocations.ts` | CREATE | Fetch + cache all locations |
| `client/src/hooks/useLocation.ts` | CREATE | Fetch single location by id |
| `client/src/hooks/useItinerary.ts` | CREATE | Fetch itinerary days |
| `client/src/hooks/useTrip.ts` | CREATE | Fetch trip metadata |
| `client/src/components/ui/ThemeToggle.tsx` | CREATE | Sun/moon toggle button |
| `client/src/components/ui/Badge.tsx` | CREATE | Category/day badge chip |
| `client/src/components/ui/SkeletonLoader.tsx` | CREATE | Shimmer skeleton |
| `client/src/components/ui/EmptyState.tsx` | CREATE | Illustrated empty state component |
| `client/src/components/navigation/Navbar.tsx` | CREATE | Top navigation bar |
| `client/src/components/navigation/MobileDrawer.tsx` | CREATE | Mobile slide-in nav drawer |
| `client/src/components/map/MapView.tsx` | CREATE | Mapbox GL map container |
| `client/src/components/map/LocationPin.tsx` | CREATE | Custom map marker with category icon |
| `client/src/components/map/LocationHoverTooltip.tsx` | CREATE | Glassmorphic hover tooltip |
| `client/src/components/map/LocationPanel.tsx` | CREATE | Full location detail slide-in panel |
| `client/src/components/home/HeroSection.tsx` | CREATE | Full-screen hero with CTA |
| `client/src/components/home/TripOverview.tsx` | CREATE | Trip dates + description section |
| `client/src/components/home/CountdownTimer.tsx` | CREATE | Live countdown to departure |
| `client/src/pages/HomePage.tsx` | CREATE | Home page composition |
| `client/src/pages/MapPage.tsx` | CREATE | Map page — full screen |
| `client/src/pages/ItineraryPage.tsx` | CREATE | Day-by-day list view |
| `client/src/pages/GalleryPage.tsx` | CREATE | Gallery stub with empty state |
| `client/src/pages/BudgetPage.tsx` | CREATE | Budget stub with empty state |
| `client/src/App.tsx` | CREATE | React Router v6 routes |
| `client/src/main.tsx` | CREATE | Vite entry point |
| `client/index.html` | CREATE | HTML shell |

### Server

| File | Action | Purpose |
|------|--------|---------|
| `server/package.json` | CREATE | Backend dependencies |
| `server/tsconfig.json` | CREATE | TypeScript config |
| `server/src/types/index.ts` | CREATE | Shared TypeScript types (mirrors client) |
| `server/src/data/locations.json` | CREATE | 22 mock location records |
| `server/src/data/itinerary.json` | CREATE | 9-day mock itinerary |
| `server/src/data/gallery.json` | CREATE | Empty gallery stub |
| `server/src/data/budget.json` | CREATE | Mock budget summary |
| `server/src/data/trip.json` | CREATE | Trip metadata (title, dates, description) |
| `server/src/repositories/locations.repository.ts` | CREATE | Read locations from JSON (swap for DB later) |
| `server/src/repositories/itinerary.repository.ts` | CREATE | Read itinerary from JSON |
| `server/src/repositories/gallery.repository.ts` | CREATE | Read gallery from JSON |
| `server/src/repositories/budget.repository.ts` | CREATE | Read budget from JSON |
| `server/src/repositories/trip.repository.ts` | CREATE | Read trip info from JSON |
| `server/src/routes/locations.route.ts` | CREATE | GET /api/locations, GET /api/locations/:id |
| `server/src/routes/itinerary.route.ts` | CREATE | GET /api/itinerary |
| `server/src/routes/gallery.route.ts` | CREATE | GET /api/gallery |
| `server/src/routes/budget.route.ts` | CREATE | GET /api/budget |
| `server/src/routes/trip.route.ts` | CREATE | GET /api/trip |
| `server/src/index.ts` | CREATE | Express app, CORS, Helmet, rate limit, routes |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

---

### Task 1: Project Scaffolding & Monorepo Setup

- **Files**: `pnpm-workspace.yaml`, `.gitignore`, `.env.example`, `client/package.json`, `client/vite.config.ts`, `client/index.html`, `client/src/main.tsx`, `server/package.json`, `server/tsconfig.json`
- **Layer**: Both
- **Action**: CREATE
- **Implement**:
  - `pnpm-workspace.yaml` declares `client` and `server` packages
  - `client/package.json`: dependencies — `react`, `react-dom`, `react-router-dom`, `mapbox-gl`, `react-map-gl`, `zustand`, `framer-motion`, `lucide-react`, `tailwindcss`, `typescript`, `vite`, `@vitejs/plugin-react`
  - `server/package.json`: dependencies — `express`, `cors`, `helmet`, `express-rate-limit`, `typescript`, `ts-node`, `tsx`, `@types/express`, `@types/cors`, `@types/node`
  - `client/vite.config.ts`: configure `server.proxy` to forward `/api` to `localhost:3001` in dev
  - `.env.example`: document `VITE_MAPBOX_TOKEN`, `VITE_API_URL`, `PORT`, `CORS_ORIGIN`
  - Initialise Tailwind CSS config in `client/`
- **Validate**: `pnpm install` runs without errors across workspace

---

### Task 2: Shared TypeScript Types

- **Files**: `client/src/types/index.ts`, `server/src/types/index.ts`
- **Layer**: Shared
- **Action**: CREATE
- **Implement**: All types from the "Shared TypeScript Types" section above. Both files are identical — no import dependency between packages (keeps it simple before a shared package is warranted).
- **Types to define**: `LocationCategory`, `Location`, `ItineraryDay`, `GalleryImage`, `BudgetSummary`, `TripInfo`
- **Validate**: `pnpm --filter client run typecheck`

---

### Task 3: Tailwind Design Tokens & Global Styles

- **Files**: `client/tailwind.config.ts`, `client/src/index.css`
- **Layer**: Frontend
- **Action**: CREATE
- **Implement**:
  - Extend Tailwind theme with semantic colour tokens mapped to CSS variables
  - CSS variables defined in `:root` (light) and `.dark` (dark mode via `class` strategy):
    ```css
    :root {
      --color-bg: #F7F3EE;
      --color-surface: #FFFFFF;
      --color-primary: #1B4B8A;
      --color-accent: #B8860B;
      --color-text: #1C1917;
      --color-muted: #6B7280;
    }
    .dark {
      --color-bg: #0D1117;
      --color-surface: #161B27;
      --color-primary: #1B4B8A;
      --color-accent: #D4A843;
      --color-text: #E8E6E3;
      --color-muted: #8B98A8;
    }
    ```
  - Tailwind config maps these: `bg: { bg: 'var(--color-bg)', surface: 'var(--color-surface)' }` etc.
  - Import Inter from Google Fonts in `index.css`
  - Dark mode strategy: `darkMode: 'class'` in tailwind config
- **Validate**: `pnpm --filter client run build`

---

### Task 4: Messages Files (All Static Text)

- **Files**: All `client/src/messages/*.messages.ts`
- **Layer**: Frontend
- **Action**: CREATE
- **Implement**:
  ```ts
  // common.messages.ts
  export const commonMessages = {
    appTitle: 'TISM Japan 2026',
    navHome: 'Home',
    navMap: 'Map',
    navItinerary: 'Itinerary',
    navGallery: 'Gallery',
    navBudget: 'Budget',
    themeToggleLight: 'Switch to light mode',
    themeToggleDark: 'Switch to dark mode',
    loading: 'Loading...',
    error: 'Something went wrong',
    retry: 'Try again',
  } as const;

  // home.messages.ts
  export const homeMessages = {
    heroTitle: 'TISM Japan 2026',
    heroSubtitle: 'Kyushu Awaits',
    heroCta: 'Explore the Map',
    overviewTitle: 'The Journey',
    overviewDestination: 'Kyushu, Japan',
    countdownTitle: 'Departure In',
    countdownDays: 'Days',
    countdownHours: 'Hours',
    countdownMinutes: 'Minutes',
    countdownSeconds: 'Seconds',
    countdownDeparted: "We're in Japan!",
  } as const;

  // map.messages.ts
  export const mapMessages = {
    pageTitle: 'Explore Kyushu',
    hoverCta: 'Click for more details',
    panelClose: 'Close',
    panelAddress: 'Address',
    panelHours: 'Opening Hours',
    panelCost: 'Estimated Cost',
    panelDays: 'Visiting on',
    panelLinks: 'Links',
    panelNotes: 'Our Notes',
    loadingLocations: 'Loading locations...',
  } as const;

  // itinerary.messages.ts, gallery.messages.ts, budget.messages.ts — similar pattern
  ```
- **Rule**: No string literals in JSX. Always import from messages file.
- **Validate**: `pnpm --filter client run typecheck`

---

### Task 5: Zustand Stores

- **Files**: `client/src/store/theme.store.ts`, `client/src/store/map.store.ts`
- **Layer**: Frontend
- **Action**: CREATE
- **Implement**:
  ```ts
  // theme.store.ts
  interface ThemeStore {
    theme: 'dark' | 'light';
    toggle: () => void;
  }
  // Persist to localStorage; apply class to document.documentElement on init + toggle

  // map.store.ts
  interface MapStore {
    selectedLocationId: string | null;
    hoveredLocationId: string | null;
    setSelectedLocation: (id: string | null) => void;
    setHoveredLocation: (id: string | null) => void;
  }
  ```
- **Validate**: `pnpm --filter client run typecheck`

---

### Task 6: `categoryConfig.ts` Utility

- **File**: `client/src/utils/categoryConfig.ts`
- **Layer**: Frontend
- **Action**: CREATE
- **Implement**: Map `LocationCategory` to `{ colour: string, Icon: LucideIcon, label: string }`. Used by `LocationPin`, `Badge`, and `LocationPanel`.
  ```ts
  import { Landmark, Utensils, BedDouble, ShoppingBag, Train } from 'lucide-react';

  export const categoryConfig: Record<LocationCategory, { colour: string; Icon: LucideIcon; label: string }> = {
    attraction:    { colour: '#4A90D9', Icon: Landmark,    label: 'Attraction' },
    restaurant:    { colour: '#E85D4A', Icon: Utensils,    label: 'Restaurant' },
    accommodation: { colour: '#7B68EE', Icon: BedDouble,   label: 'Accommodation' },
    shopping:      { colour: '#F97316', Icon: ShoppingBag, label: 'Shopping' },
    transport:     { colour: '#10B981', Icon: Train,       label: 'Transport' },
  };
  ```
- **Validate**: `pnpm --filter client run typecheck`

---

### Task 7: Backend — JSON Mock Data

- **Files**: All `server/src/data/*.json`
- **Layer**: Backend
- **Action**: CREATE
- **Implement**: Full 22-location dataset per the mock data specification above. Each location record matches the `Location` type exactly. Include realistic coordinates for each location (actual Mapbox-compatible `lng`/`lat` for Fukuoka, Nagasaki, Kagoshima). Trip JSON uses `departureDate: '2026-11-28'`.
- **Key coordinates** (approximate):
  - Fukuoka area: `[130.3960, 33.5902]` ± offset per location
  - Nagasaki area: `[129.8777, 32.7503]` ± offset
  - Kagoshima area: `[130.5580, 31.5966]` ± offset
- **Validate**: JSON is valid, matches TypeScript types

---

### Task 8: Backend — Repository Layer

- **Files**: All `server/src/repositories/*.repository.ts`
- **Layer**: Backend
- **Action**: CREATE
- **Implement**: Each repository reads the corresponding JSON file. Pattern:
  ```ts
  // locations.repository.ts
  import locationsData from '../data/locations.json';
  import type { Location } from '../types';

  export const locationsRepository = {
    findAll: (): Location[] => locationsData as Location[],
    findById: (id: string): Location | undefined =>
      (locationsData as Location[]).find(l => l.id === id),
  };
  ```
- **Database migration note**: When adding a database, replace the JSON import with a DB query here only. All routes remain unchanged.
- **Validate**: `pnpm --filter server run build`

---

### Task 9: Backend — Express App + Routes

- **Files**: `server/src/index.ts`, all `server/src/routes/*.route.ts`
- **Layer**: Backend
- **Action**: CREATE
- **Implement**:
  ```ts
  // index.ts
  import express from 'express';
  import cors from 'cors';
  import helmet from 'helmet';
  import rateLimit from 'express-rate-limit';

  const app = express();
  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:5173' }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
  app.use(express.json());

  // Mount routes
  app.use('/api/locations', locationsRouter);
  app.use('/api/itinerary', itineraryRouter);
  app.use('/api/gallery', galleryRouter);
  app.use('/api/budget', budgetRouter);
  app.use('/api/trip', tripRouter);

  // 404 handler
  app.use((_, res) => res.status(404).json({ error: 'Not found' }));
  ```

  Route pattern for all routes:
  ```ts
  // locations.route.ts
  import { Router } from 'express';
  import { locationsRepository } from '../repositories/locations.repository';

  const router = Router();

  router.get('/', (_, res) => {
    res.json(locationsRepository.findAll());
  });

  router.get('/:id', (req, res) => {
    const location = locationsRepository.findById(req.params.id);
    if (!location) return res.status(404).json({ error: 'Location not found' });
    res.json(location);
  });

  export default router;
  ```
- **Validate**: `pnpm --filter server run build && curl http://localhost:3001/api/locations`

---

### Task 10: Frontend — API Client Layer

- **Files**: All `client/src/api/*.api.ts`
- **Layer**: Frontend
- **Action**: CREATE
- **Implement**: Each file exports typed async functions. Base URL from `import.meta.env.VITE_API_URL`.
  ```ts
  // locations.api.ts
  import type { Location } from '../types';

  const BASE_URL = import.meta.env.VITE_API_URL ?? '';

  export async function fetchLocations(): Promise<Location[]> {
    const res = await fetch(`${BASE_URL}/api/locations`);
    if (!res.ok) throw new Error(`Failed to fetch locations: ${res.status}`);
    return res.json();
  }

  export async function fetchLocation(id: string): Promise<Location> {
    const res = await fetch(`${BASE_URL}/api/locations/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch location: ${res.status}`);
    return res.json();
  }
  ```
- **Validate**: `pnpm --filter client run typecheck`

---

### Task 11: Frontend — Custom Hooks

- **Files**: `client/src/hooks/useLocations.ts`, `useLocation.ts`, `useItinerary.ts`, `useTrip.ts`
- **Layer**: Frontend
- **Action**: CREATE
- **Implement**: Each hook uses `useState` + `useEffect` for async fetching. Returns `{ data, isLoading, error }`.
  ```ts
  // useLocations.ts
  export function useLocations() {
    const [data, setData] = useState<Location[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      fetchLocations()
        .then(setData)
        .catch(e => setError(e.message))
        .finally(() => setIsLoading(false));
    }, []);

    return { data, isLoading, error };
  }
  ```
- **Note**: Hooks intentionally do not use React Query at this stage to keep dependencies minimal. React Query can be added as a future enhancement.
- **Validate**: `pnpm --filter client run typecheck`

---

### Task 12: UI Primitives

- **Files**: `client/src/components/ui/ThemeToggle.tsx`, `Badge.tsx`, `SkeletonLoader.tsx`, `EmptyState.tsx`
- **Layer**: Frontend
- **Action**: CREATE
- **Implement**:
  - `ThemeToggle`: Animated `Sun`/`Moon` Lucide icons. Calls `theme.store.ts toggle()`. Aria-label from `commonMessages`.
  - `Badge`: Pill chip with configurable `colour` and `label`. Used for category + itinerary day.
  - `SkeletonLoader`: Shimmer div with `animate-pulse` and configurable `width`/`height`. Used in map panel and itinerary.
  - `EmptyState`: Centred illustration placeholder + message. Props: `title`, `description`.
- **Design**: All components use Tailwind tokens, not raw hex values.
- **Validate**: `pnpm --filter client run build`

---

### Task 13: Navigation Components

- **Files**: `client/src/components/navigation/Navbar.tsx`, `MobileDrawer.tsx`
- **Layer**: Frontend
- **Action**: CREATE
- **Implement**:
  - `Navbar`:
    - Fixed top, full width, `z-40`
    - Default: transparent. On scroll (`scrollY > 20`): `backdrop-blur-md bg-bg/80 border-b border-surface`
    - Left: "TISM Japan 2026" wordmark (text, not image) using `font-semibold`
    - Right (desktop, `md:flex hidden`): Nav links + `ThemeToggle`
    - Active link: gold underline (`border-b-2 border-accent`)
    - Right (mobile, `md:hidden`): Hamburger icon → opens `MobileDrawer`
  - `MobileDrawer`:
    - Framer Motion `AnimatePresence` + slide from right (`x: '100%' → x: 0`)
    - Full-height overlay, `bg-surface`, nav links stacked with generous padding
    - Close button top-right
    - `ThemeToggle` at bottom
- **All strings from `commonMessages`**
- **Validate**: `pnpm --filter client run build`

---

### Task 14: Map Components

> **Before implementing**, note these Mapbox + ui-ux-pro-max specific guidelines:
> - Map container must be full viewport height: `h-dvh` (not `h-screen`, avoids mobile bar issues)
> - Custom markers use `Marker` from `react-map-gl`, not default Mapbox pins
> - Hover tooltip: glassmorphism — `backdrop-blur-md bg-surface/20 border border-white/20`
> - Location panel: slide from right on desktop (`translate-x`), slide up from bottom on mobile — Framer Motion spring
> - Map style switches with theme: light → `mapbox://styles/mapbox/light-v11`, dark → `mapbox://styles/mapbox/dark-v11`
> - `prefers-reduced-motion`: skip Framer Motion animations, show/hide instantly

- **Files**: `MapView.tsx`, `LocationPin.tsx`, `LocationHoverTooltip.tsx`, `LocationPanel.tsx`
- **Layer**: Frontend
- **Action**: CREATE

- **`MapView.tsx`**:
  - `react-map-gl` `<Map>` component, full-screen `h-dvh w-full`
  - `mapboxAccessToken` from `import.meta.env.VITE_MAPBOX_TOKEN`
  - Initial viewport: centred on Kyushu `{ lng: 130.35, lat: 32.80, zoom: 7 }`
  - Map style reactive to `theme.store`
  - Renders `<LocationPin>` for each location
  - Renders `<LocationPanel>` when `selectedLocationId` is set

- **`LocationPin.tsx`**:
  - Custom `<Marker>` with category icon from `categoryConfig`
  - Circle background coloured by category
  - `onMouseEnter`: set `hoveredLocationId`, show `<LocationHoverTooltip>`
  - `onMouseLeave`: clear hover after 150ms delay (prevents flicker)
  - `onClick`: set `selectedLocationId`
  - Framer Motion `whileHover={{ scale: 1.2 }}` + `whileTap={{ scale: 0.9 }}`

- **`LocationHoverTooltip.tsx`**:
  - Glassmorphic card: `backdrop-blur-md bg-white/10 dark:bg-black/30 border border-white/20 rounded-xl p-3`
  - Shows `location.name` + `location.summary`
  - Gold accent dot for category colour
  - Appears with Framer Motion `opacity: 0 → 1` 200ms

- **`LocationPanel.tsx`**:
  - Desktop: fixed right panel `w-96 h-full` sliding from `x: '100%'`
  - Mobile: bottom sheet sliding from `y: '100%'`, height `60vh`, with drag-to-dismiss
  - Content sections:
    1. Photo carousel (if `imageUrls.length > 0`) — simple `overflow-x-scroll` strip
    2. `Badge` for category + itinerary day badges
    3. Description / personal notes
    4. Address + opening hours
    5. Estimated cost
    6. External links (open in new tab, `rel="noopener noreferrer"`)
  - Close button top-right, also closes by clicking map outside panel
  - Loading state: `SkeletonLoader` rows
  - **All label strings from `mapMessages`**

- **Validate**: `pnpm --filter client run build`

---

### Task 15: Home Page Components

- **Files**: `HeroSection.tsx`, `TripOverview.tsx`, `CountdownTimer.tsx`
- **Layer**: Frontend
- **Action**: CREATE

- **`HeroSection.tsx`**:
  - Full-viewport `h-dvh` with dark overlay on background image
  - Centred content: "TISM Japan 2026" (large, `text-5xl md:text-7xl font-bold`), subtitle, CTA button
  - CTA button: gold accent background, navigate to `/map`
  - Subtle parallax scroll effect using `transform: translateY` bound to `scrollY` (respect `prefers-reduced-motion`)

- **`TripOverview.tsx`**:
  - 3-column stat cards: Destination, Duration, Cities
  - Glassmorphic card style
  - Short trip description paragraph

- **`CountdownTimer.tsx`**:
  - `useEffect` with `setInterval(1000)` updating days/hours/minutes/seconds to `2026-11-28`
  - 4 animated number boxes with Framer Motion flip animation on digit change
  - If `Date.now() > departureDate`: display `homeMessages.countdownDeparted`
  - Departure date sourced from `useTrip()` hook (API), not hardcoded

- **All strings from `homeMessages`**
- **Validate**: `pnpm --filter client run build`

---

### Task 16: Pages & Router

- **Files**: All `client/src/pages/*.tsx`, `client/src/App.tsx`
- **Layer**: Frontend
- **Action**: CREATE
- **Implement**:
  - `App.tsx`: React Router v6 `<BrowserRouter>` + `<Routes>`. `<Navbar>` renders on all routes.
    ```
    /          → HomePage
    /map       → MapPage
    /itinerary → ItineraryPage
    /gallery   → GalleryPage
    /budget    → BudgetPage
    ```
  - `MapPage`: renders `<MapView>` with `h-dvh` and `pt-0` (navbar overlays map). Nav is transparent over map.
  - `ItineraryPage`: fetches `useItinerary()`, renders day-by-day cards. Each card lists location names with category badges. Clicking a location navigates to `/map` and opens that pin's panel.
  - `GalleryPage` + `BudgetPage`: render `<EmptyState>` with appropriate messages from their messages files.
  - `HomePage`: composes `<HeroSection>`, `<TripOverview>`, `<CountdownTimer>`.
- **Validate**: `pnpm --filter client run build && pnpm --filter client run lint`

---

### Task 17: Memory — Save Project Context

- **Action**: Save project memory for future sessions covering: stack decisions, departure date, mock data structure, messages files convention, repository pattern.

---

## Validation Commands

```bash
# Install all dependencies
pnpm install

# Type check frontend
pnpm --filter client run typecheck

# Type check backend
pnpm --filter server run typecheck

# Build frontend
pnpm --filter client run build

# Build backend
pnpm --filter server run build

# Lint frontend
pnpm --filter client run lint

# Run backend in dev
pnpm --filter server run dev

# Run frontend in dev (proxies /api to backend)
pnpm --filter client run dev
```

---

## Review Gates (MANDATORY — do not skip)

After all tasks are complete and validation passes:

### 1. UX/UI Design Review — `ui-ux-pro-max`

Invoke `ui-ux-pro-max` and provide screenshots / component descriptions. Ask it to evaluate:
- Map pin hover + click interactions — smooth? Clear affordance?
- Glassmorphism contrast on both dark and light map styles (WCAG AA minimum 4.5:1)
- Mobile bottom sheet usability — drag-to-dismiss, safe area compliance
- Navbar glassmorphism behaviour on scroll
- Countdown timer digit animation
- Responsive layout at 375px / 768px / 1024px / 1440px

### 2. QA Review — `superpowers:code-reviewer`

Verify:
- All UI states covered (loading, error, empty, success) for map and itinerary pages
- Countdown timer edge cases (already departed, T-1 day)
- Map accessible without mouse (keyboard navigation to pins)
- All external links have `rel="noopener noreferrer"`
- No string literals in JSX — all from messages files

### 3. Principal Engineer Review — `pragmatic-code-reviewer`

Audit:
- `VITE_MAPBOX_TOKEN` never in source code
- CORS not using wildcard in production
- Repository pattern correctly isolates data access
- No `any` types in TypeScript
- `useEffect` cleanup (no stale state from unmounted components in hooks)
- Rate limiting and Helmet configured on Express

---

## Acceptance Criteria

### Functional
- [ ] Home page loads with hero, trip overview, and live countdown
- [ ] Map page shows full-screen Kyushu map with 22 category-coded pins
- [ ] Hovering a pin shows glassmorphic tooltip with name + summary
- [ ] Clicking a pin opens location panel with all 7 fields populated
- [ ] Itinerary page shows day-by-day view linked to map locations
- [ ] Gallery and Budget pages show appropriate empty states
- [ ] All API calls go through `client/src/api/` layer
- [ ] No UI strings hardcoded — all from `*.messages.ts` files
- [ ] Dark/light mode toggle works and persists on refresh

### UX/UI
- [ ] All UI states: loading, error, empty, success
- [ ] Glassmorphism contrast passes WCAG AA (4.5:1)
- [ ] Framer Motion transitions on panel open/close
- [ ] Mobile bottom sheet works with drag dismiss
- [ ] Navbar glassmorphism on scroll
- [ ] Map style switches with theme
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375 / 768 / 1024 / 1440px

### Quality
- [ ] TypeScript: zero `any`, strict mode
- [ ] Lint passes
- [ ] Mapbox token in env var only
- [ ] CORS explicitly configured
- [ ] Repository pattern in place for future DB migration
- [ ] All three review gates passed
