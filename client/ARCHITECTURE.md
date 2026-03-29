# ARCHITECTURE.md — TISM Japan 2026 Client

> **UX/UI quality is the top priority in this codebase.** Every architectural decision — the token-based design system, the strict no-hardcoded-strings rule, the Framer Motion conventions, the glassmorphism overlay pattern — exists to protect a consistent, polished visual and interaction experience. When in doubt, make the UI better.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Directory Structure](#2-directory-structure)
3. [Design System & Visual Standards](#3-design-system--visual-standards)
4. [Component Architecture](#4-component-architecture)
5. [State Management](#5-state-management)
6. [Data Fetching](#6-data-fetching)
7. [Static Text & i18n](#7-static-text--i18n)
8. [TypeScript Standards](#8-typescript-standards)
9. [Adding a New Feature — Step-by-Step Checklist](#9-adding-a-new-feature--step-by-step-checklist)
10. [Adding a New UI Component — Rules & Checklist](#10-adding-a-new-ui-component--rules--checklist)
11. [UX & Motion Principles](#11-ux--motion-principles)
12. [Security Standards](#12-security-standards)
13. [What NOT to Do](#13-what-not-to-do)

---

## 1. Project Overview

**TISM Japan 2026** is a private trip-planning web app for a group travelling through Kyushu, Japan in 2026. It gives travellers a single place to explore an interactive map of all planned locations, browse the day-by-day itinerary, track estimated costs with live AUD conversion, and (eventually) view a trip gallery.

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 (with `React.StrictMode`) |
| Build | Vite 5 + TypeScript 5 (`tsc && vite build`) |
| Routing | React Router DOM v6 |
| Styling | Tailwind CSS v3 with CSS variable tokens |
| Animation | Framer Motion v11 |
| State | Zustand v4 (with `persist` middleware for theme) |
| Map | Mapbox GL JS v3 via `react-map-gl` v7 |
| Icons | Lucide React |
| Currency | Frankfurter API (ECB rates, free, no key required) |
| Fonts | Inter (Google Fonts, weights 300–700) |

### Purpose

The app is read-only from the user's perspective — there is no auth, no user-generated content, and no write operations to the backend. All data flows from a backend API (`VITE_API_URL`) into the frontend via a strict `api → hook → component` pipeline.

---

## 2. Directory Structure

```
src/
├── main.tsx                  # ReactDOM entry point — mounts <App /> in StrictMode
├── App.tsx                   # Router shell — BrowserRouter + Navbar + <Routes>
├── index.css                 # CSS custom properties (design tokens), Tailwind directives, font import
│
├── types/
│   └── index.ts              # ALL shared TypeScript types and interfaces.
│                             # Rule: if more than one file uses a type, it lives here.
│
├── api/                      # Pure async fetch functions — no React, no hooks, no state.
│   ├── locations.api.ts      # fetchLocations(), fetchLocation(id)
│   ├── currency.api.ts       # fetchJPYtoAUD() — calls Frankfurter external API
│   ├── itinerary.api.ts      # fetchItinerary()
│   ├── budget.api.ts         # fetchBudget()
│   ├── trip.api.ts           # fetchTrip()
│   └── gallery.api.ts        # fetchGallery()
│                             # Rule: one file per backend domain. Named [domain].api.ts.
│                             # Never import React or call useState/useEffect here.
│
├── hooks/                    # Custom React hooks — bridge between api/ and components.
│   ├── useLocations.ts       # → { data: Location[] | null, isLoading, error }
│   ├── useLocation.ts        # → { data: Location | null, isLoading, error } (single)
│   ├── useCurrencyRate.ts    # → { rate, isLoading, rateDate } — includes sessionStorage cache
│   ├── useItinerary.ts       # → { data: ItineraryDay[] | null, isLoading, error }
│   ├── useBudget.ts          # → { data: BudgetSummary | null, isLoading, error }
│   └── useTrip.ts            # → { data: TripInfo | null, isLoading, error }
│                             # Rule: named use[Domain].ts. Always returns { data, isLoading, error }.
│
├── store/                    # Zustand stores — only for cross-component shared UI state.
│   ├── theme.store.ts        # { theme, toggle } — persisted to localStorage via Zustand persist
│   └── map.store.ts          # { selectedLocationId, hoveredLocationId, setters }
│                             # Rule: server data does NOT live in stores (use hooks instead).
│
├── messages/                 # All user-visible strings. Zero hardcoded strings in JSX.
│   ├── common.messages.ts    # Shared strings: nav labels, "Loading...", "Close", etc.
│   ├── home.messages.ts      # Strings for HomePage and its components
│   ├── map.messages.ts       # Strings for MapPage and its components
│   ├── itinerary.messages.ts # Strings for ItineraryPage
│   ├── budget.messages.ts    # Strings for BudgetPage
│   └── gallery.messages.ts   # Strings for GalleryPage
│                             # Rule: named [domain].messages.ts. Export a single `as const` object.
│
├── utils/                    # Pure utility functions and static configuration — no React.
│   ├── categoryConfig.ts     # Maps LocationCategory → { colour, Icon, label }
│   └── currency.ts           # parseJPY(), formatAUD(), formatAUDTotal()
│                             # Rule: no side effects, no imports from React or stores.
│
├── components/
│   ├── ui/                   # Tier 1 — Reusable UI primitives. Domain-agnostic.
│   │   ├── Badge.tsx          # Category and day badges with colour prop
│   │   ├── SkeletonLoader.tsx # Animated loading placeholder (animate-pulse)
│   │   ├── EmptyState.tsx     # Full-page empty state with title + description
│   │   └── ThemeToggle.tsx    # Sun/Moon icon button wired to useThemeStore
│   │
│   ├── navigation/           # Tier 2 — Navigation feature components.
│   │   ├── Navbar.tsx         # Fixed top nav with scroll-aware glassmorphism + mobile hamburger
│   │   └── MobileDrawer.tsx   # Right-slide mobile nav drawer with spring animation + Escape key
│   │
│   ├── map/                  # Tier 2 — Map feature components.
│   │   ├── MapView.tsx        # Root map container — owns Map, pins, panel, loading/error states
│   │   ├── LocationPin.tsx    # Mapbox Marker + hover tooltip logic + selected ring
│   │   ├── LocationHoverTooltip.tsx  # Glassmorphic tooltip shown on pin hover
│   │   └── LocationPanel.tsx  # Slide-in panel (desktop right, mobile bottom sheet) with details
│   │
│   └── home/                 # Tier 2 — Home page feature components.
│       ├── HeroSection.tsx    # Full-viewport hero with background image, staggered text, CTA
│       ├── CountdownTimer.tsx # Live countdown to departure with flip animation per unit
│       └── TripOverview.tsx   # Stats grid: destination, duration, cities
│
└── pages/                    # Tier 3 — Page components. Compose feature components. Thin.
    ├── HomePage.tsx           # <HeroSection /> + <TripOverview /> + <CountdownTimer />
    ├── MapPage.tsx            # <MapView /> — single component render
    ├── ItineraryPage.tsx      # Data-fetching page; renders day cards with location rows
    ├── BudgetPage.tsx         # Budget summary with live AUD conversion, category breakdown
    └── GalleryPage.tsx        # Placeholder using <EmptyState />
```

---

## 3. Design System & Visual Standards

This is the highest-priority section. Violating these rules degrades the visual consistency of the app.

### 3.1 Colour Tokens

All colours are defined as CSS custom properties in `src/index.css` and mapped to Tailwind utility names in `tailwind.config.ts`. **Never use a raw hex value in a Tailwind className.**

| Token | Tailwind Class | Light Mode | Dark Mode | Purpose |
|---|---|---|---|---|
| `--color-bg` | `bg-bg`, `text-bg` | `#F7F3EE` | `#0D1117` | Page background |
| `--color-surface` | `bg-surface`, `text-surface` | `#FFFFFF` | `#161B27` | Cards, panels, drawers |
| `--color-primary` | `bg-primary`, `text-primary` | `#1B4B8A` | `#1B4B8A` | Links, primary actions |
| `--color-accent` | `bg-accent`, `text-accent` | `#B8860B` | `#D4A843` | Highlights, active nav, CTAs |
| `--color-text` | `text-text-base` | `#1C1917` | `#E8E6E3` | Body text |
| `--color-muted` | `text-muted` | `#6B7280` | `#8B98A8` | Secondary text, icons at rest |
| `--color-error` | `text-error` | `#DC2626` | `#EF4444` | Error messages |
| `--color-success` | `text-success` | `#16A34A` | `#22C55E` | "Free" cost label |

**How to use in JSX:**

```tsx
// Correct — uses the token
<p className="text-text-base">Body copy</p>
<p className="text-muted">Secondary info</p>
<div className="bg-surface border border-bg">Card</div>

// Wrong — raw hex, breaks dark mode
<p style={{ color: '#1C1917' }}>Body copy</p>
<p className="text-[#6B7280]">Secondary info</p>
```

The sole exception is `categoryConfig.ts`, where pin colours (`#4A90D9`, `#E85D4A`, etc.) are intentionally raw hex values applied via `style={{ backgroundColor: cfg.colour }}`. These are data-driven category colours, not theme colours, and they are consistent across light/dark mode.

### 3.2 Typography Scale

Font family: **Inter** (loaded from Google Fonts at weights 300, 400, 500, 600, 700). Configured as the default `sans` in Tailwind.

| Usage | Classes |
|---|---|
| Page heading (h1) | `text-4xl font-bold` |
| Section heading (h2) | `text-3xl font-bold` |
| Card heading (h2) | `text-lg font-bold` |
| Sub-section label | `text-xs font-semibold uppercase tracking-wider` |
| Body / description | `text-sm leading-relaxed` |
| Secondary / meta | `text-xs text-muted` |
| Hero title | `text-5xl md:text-7xl font-bold tracking-tight leading-none` |
| Wordmark / nav | `text-lg font-semibold tracking-tight` |
| Overline / eyebrow | `text-sm font-medium tracking-[0.3em] uppercase` |
| Countdown numerals | `text-3xl md:text-4xl font-bold tabular-nums` |

Monetary values always use `tabular-nums` so digits stay aligned when values update.

### 3.3 Spacing System

Tailwind's default 4px base unit is used throughout. All spacing should snap to the 4px/8px rhythm:

- `p-2` = 8px, `p-4` = 16px, `p-6` = 24px, `p-8` = 32px, `py-10` = 40px, `py-20` = 80px
- `gap-1` = 4px, `gap-2` = 8px, `gap-4` = 16px, `gap-6` = 24px
- Section vertical padding: `py-20` (80px) for major sections
- Card internal padding: `p-4` (16px) standard, `p-6` (24px) for stat cards
- Border radius: `rounded-lg` for buttons/inputs, `rounded-xl` for overlays/tooltips, `rounded-2xl` for cards/panels, `rounded-full` for badges and pins

### 3.4 Component Style Philosophy

**Two visual modes coexist:**

1. **Glassmorphism** — for overlapping/floating UI over a map or image:
   - `backdrop-blur-md bg-white/10 dark:bg-black/40 border border-white/20 rounded-xl shadow-xl`
   - Used in: `LocationHoverTooltip`, scroll-aware `Navbar`, mobile backdrop
   - The navbar gains glass when scrolled: `backdrop-blur-md bg-bg/80 border-b border-surface/50 shadow-sm`

2. **Flat minimal** — for content areas (cards, panels, list rows):
   - `bg-surface border border-bg rounded-2xl`
   - Used in: `TripOverview` stat cards, `LocationPanel`, `ItineraryPage` day cards, `BudgetPage` category sections, `CountdownTimer` unit boxes

Never apply glassmorphism to content cards — it makes text harder to read and looks wrong in a flat layout context.

### 3.5 Motion & Animation Rules

All animation uses **Framer Motion**. Do not use CSS `@keyframes` or raw CSS transitions for enter/exit animations.

**Standard enter animation (content blocks, hero text):**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
/>
```

**Staggered hero entrance (HeroSection pattern):**
```tsx
// Each child adds delay: 0, 0.1, 0.3 seconds
transition={{ duration: 0.6 }}
transition={{ duration: 0.7, delay: 0.1 }}
transition={{ duration: 0.6, delay: 0.3 }}
```

**Spring panels and drawers** (LocationPanel, MobileDrawer — any panel that slides in):
```tsx
transition={{ type: 'spring', stiffness: 300, damping: 30 }}
```

**Flip animation for countdown digits** (AnimatePresence `mode="wait"`):
```tsx
<AnimatePresence mode="wait">
  <motion.span
    key={value}
    initial={{ y: -20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 20, opacity: 0 }}
    transition={{ duration: 0.2 }}
  />
</AnimatePresence>
```

**Pin hover micro-interaction:**
```tsx
<motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} />
```

**Tooltip entrance** (fast, 150ms):
```tsx
transition={{ duration: 0.15 }}
```

**Colour/opacity transitions on interactive elements** — always use Tailwind:
```
transition-colors duration-150
transition-all duration-300   // for the navbar scroll state
```

Framer Motion automatically respects `prefers-reduced-motion` via its internal media query check — no manual override is required.

### 3.6 Dark/Light Mode Strategy

- Tailwind is configured with `darkMode: 'class'` in `tailwind.config.ts`
- Dark mode is toggled by adding/removing the `dark` class on `document.documentElement`
- Default theme is **dark** — new sessions get dark mode unless the user has previously selected light
- Theme preference is persisted in `localStorage` under the key `tism-theme` via Zustand `persist` middleware
- On module load, `theme.store.ts` immediately applies the correct class to `<html>` before any React render — this prevents a flash of the wrong theme

**Never use Tailwind's `dark:` variant to apply raw hex colours.** Use it only to switch between token-based classes:
```tsx
// Correct
<div className="bg-surface dark:bg-white/10" />

// Wrong
<div className="bg-white dark:bg-[#161B27]" />
```

### 3.7 Responsive Breakpoints

Mobile-first. Tailwind's default breakpoints apply:

| Prefix | Min width | Usage |
|---|---|---|
| (none) | 0px | Mobile base |
| `sm:` | 640px | Small tablet adjustments |
| `md:` | 768px | Desktop layout switch (nav, panels) |
| `lg:` | 1024px | Max-width container padding |

Key responsive patterns in this codebase:
- Navigation: hamburger menu on mobile (`md:hidden`), desktop links hidden on mobile (`hidden md:flex`)
- `LocationPanel`: right-side drawer on `md:`, bottom sheet on mobile
- Page containers: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` (nav, hero), `max-w-4xl` (itinerary), `max-w-3xl` (budget)
- Hero font: `text-5xl md:text-7xl`
- Countdown units: `w-20 h-20 md:w-24 md:h-24`

### 3.8 Accessibility Baseline

- **Contrast**: The token palette is designed for WCAG AA contrast. `text-text-base` on `bg-surface` meets the threshold in both modes.
- **Focus rings**: Tailwind's default focus-visible ring is not removed. Never add `outline-none` without a replacement focus style.
- **aria-labels**: Every icon-only button must have `aria-label` sourced from a messages file. See `ThemeToggle`, `MobileDrawer` close button, `LocationPin`.
- **Keyboard navigation**: Escape closes `MobileDrawer` and `LocationPanel` (both implement a `keydown` event listener that is cleaned up on unmount).
- **Decorative images**: `aria-hidden="true"` on the hero background image; the hero has no `alt` text because the image is presentational.
- **Touch targets**: All interactive elements use at minimum `p-2` padding, resulting in a ≥40px target. Pins are `w-9 h-9` (36px) — the minimum acceptable; do not make pins smaller.
- **Semantic HTML**: Pages use `<main>`, sections use `<section>` where appropriate, headings follow a logical `h1 → h2 → h3` hierarchy. Panels have `role="dialog"` and `aria-label`.
- **`tabular-nums`**: Applied to all monetary and countdown values so numbers stay aligned during updates.

### 3.9 Pin Category Colours and Icons

Defined in `src/utils/categoryConfig.ts`. These colours are fixed across both themes.

| Category | Colour | Icon (Lucide) | Label |
|---|---|---|---|
| `attraction` | `#4A90D9` (blue) | `Landmark` | Attraction |
| `restaurant` | `#E85D4A` (red) | `Utensils` | Restaurant |
| `accommodation` | `#7B68EE` (purple) | `BedDouble` | Accommodation |
| `shopping` | `#F97316` (orange) | `ShoppingBag` | Shopping |
| `transport` | `#10B981` (green) | `Train` | Transport |

The selected pin shows a glowing ring: `box-shadow: 0 0 0 3px {colour}60, 0 4px 12px rgba(0,0,0,0.4)`. The `60` is hex alpha (37.5% opacity) for a soft halo effect.

Day badge colour is always `#1B4B8A` (the `primary` token value), regardless of theme.

---

## 4. Component Architecture

### 4.1 The Three Tiers

```
Tier 1: UI Primitives (src/components/ui/)
  ↓
Tier 2: Feature Components (src/components/[domain]/)
  ↓
Tier 3: Pages (src/pages/)
```

**Tier 1 — UI Primitives** are small, reusable, and completely domain-agnostic. They know nothing about `Location`, `ItineraryDay`, or any business concept. They accept only generic props (strings, numbers, classNames). Examples: `Badge`, `SkeletonLoader`, `EmptyState`, `ThemeToggle`.

**Tier 2 — Feature Components** are domain-aware. They may call hooks, read from stores, import messages files, and compose Tier 1 primitives. They are grouped by domain in `components/[domain]/`. Examples: `MapView`, `LocationPanel`, `HeroSection`, `CountdownTimer`.

**Tier 3 — Pages** are thin orchestration layers. They import feature components and lay them out. They should have almost no logic of their own — just composition. If a page file is getting long, the logic should be extracted into a Tier 2 component. A page registers exactly one route in `App.tsx`. Examples: `HomePage`, `MapPage`, `ItineraryPage`.

### 4.2 UI Primitive vs Feature Component

Add to `src/components/ui/` when ALL of these are true:
- It has no knowledge of this app's data types (`Location`, `ItineraryDay`, etc.)
- It could plausibly be dropped into a completely different project
- Its props are generic (strings, booleans, numbers, optional `className`)

Add to `src/components/[domain]/` when ANY of these are true:
- It imports a type from `src/types/`
- It calls a hook from `src/hooks/`
- It reads from a Zustand store
- It imports from `src/messages/`

### 4.3 Props API Design Rules

- **Minimal props**: pass only what the component actually uses. If you're drilling many props, reconsider the split.
- **Prefer callbacks over state lifting**: pass `onClose: () => void`, not `setOpen: (v: boolean) => void`
- **Avoid boolean flags that change the component's nature**: use `variant` prop or separate components instead
- **Composition over configuration**: if a component needs to render wildly different content based on a prop, split it. `LocationPanel` splits `PanelContent` into a private sub-component to avoid prop explosion.
- **`className` passthrough**: UI primitives accept an optional `className?: string` so callers can adjust sizing contextually (see `SkeletonLoader`).

### 4.4 When to Split vs Keep Together

Split when:
- A sub-section has its own data dependency (its own hook call)
- A section would benefit from independent Framer Motion animation
- A logical piece of UI appears in more than one place
- A file exceeds ~150 lines (rule of thumb, not hard limit)

Keep together when:
- The UI is tightly coupled and splitting would require excessive prop drilling
- The sub-component would only ever be used in one place and adds no clarity

`LocationPanel` demonstrates this: `PanelContent` is a private sub-component (not exported) because it handles the scrollable content section and would have needed 4+ props passed down — but it only makes sense within `LocationPanel`.

### 4.5 Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Component files | PascalCase | `LocationPanel.tsx` |
| Non-component files | camelCase with domain suffix | `locations.api.ts`, `map.store.ts` |
| Hook files | camelCase with `use` prefix | `useLocations.ts` |
| Message files | camelCase with `.messages.ts` | `map.messages.ts` |
| Exported components | Named exports, PascalCase | `export function LocationPanel()` |
| Types | PascalCase interface or type alias | `interface Location`, `type LocationCategory` |
| Store hooks | `use[Domain]Store` | `useThemeStore`, `useMapStore` |

---

## 5. State Management

### 5.1 What Lives Where

| Type of state | Where it lives |
|---|---|
| Theme (dark/light) | `useThemeStore` (Zustand, persisted to `localStorage`) |
| Map selected/hovered pin | `useMapStore` (Zustand, ephemeral) |
| Server data (locations, itinerary, etc.) | Custom hooks (`useLocations`, etc.) — local `useState` inside the hook |
| Derived values from server data | Computed inline in the component or page — never stored |
| UI toggle local to one component | `useState` inside that component |

### 5.2 When to Add a Zustand Store

Add a store when state must be **shared between components that have no parent-child relationship**. The two existing stores demonstrate this:

- `useThemeStore`: The toggle button lives in `Navbar`/`ThemeToggle`, but `MapView` also needs the theme to pick the Mapbox map style. They share no ancestor, so a store is correct.
- `useMapStore`: `LocationPin` sets the selected location, but `MapView` reads it to render `LocationPanel`, and `ItineraryPage` sets it programmatically when navigating from a day entry. A store is correct.

**Do not add a store** for server data. Server data lives in hooks, not stores, because hooks handle loading/error states and cancellation automatically.

### 5.3 Store Shape Conventions

Each store file exports a single `use[Domain]Store` hook. The store interface has:
- State fields (plain values: strings, numbers, booleans, `null`)
- Action functions (`toggle`, `set[Field]`, etc.)

Keep stores flat — no nested objects inside a store.

```ts
// Good store shape
interface MapStore {
  selectedLocationId: string | null;
  hoveredLocationId: string | null;
  setSelectedLocation: (id: string | null) => void;
  setHoveredLocation: (id: string | null) => void;
}

// Bad — nested objects add complexity with no benefit
interface MapStore {
  selection: {
    locationId: string | null;
    source: 'pin' | 'list' | null;
  };
}
```

### 5.4 How Theme State is Applied to the DOM

`theme.store.ts` does two things:

1. **On toggle**: the `toggle` action directly calls `document.documentElement.classList.add('dark')` or `.remove('dark')`. This is intentional — Zustand's store update and the DOM mutation happen in the same synchronous call, preventing any flash.

2. **On initial load** (module-level code at the bottom of `theme.store.ts`): reads `localStorage`, parses the Zustand `persist` shape (`{ state: { theme } }`), and applies the class before React renders. This runs before `main.tsx` mounts the app.

```ts
// theme.store.ts — module-level init runs synchronously at import time
const storedTheme = localStorage.getItem('tism-theme');
if (storedTheme) {
  const parsed = JSON.parse(storedTheme);
  if (parsed?.state?.theme === 'dark') {
    document.documentElement.classList.add('dark');
  }
} else {
  document.documentElement.classList.add('dark'); // default dark
}
```

### 5.5 Map Store Pattern

`useMapStore` tracks two IDs: `selectedLocationId` (panel open) and `hoveredLocationId` (tooltip visible). Both are `string | null`. Setting `selectedLocationId` is done from two places:

- `LocationPin.handleClick` — user clicks a pin on the map
- `ItineraryPage.handleLocationClick` / `BudgetPage.handleViewMap` — user clicks a location in a list, which sets the ID and navigates to `/map`

This cross-page communication via Zustand is intentional. The map page reads the selected ID on mount and shows the panel immediately.

---

## 6. Data Fetching

### 6.1 The Three-Layer Pipeline

```
src/api/[domain].api.ts
    ↓  (async function, plain fetch, throws on error)
src/hooks/use[Domain].ts
    ↓  (useState + useEffect + cancelled flag, returns { data, isLoading, error })
src/components/ or src/pages/
    ↓  (renders loading/error/data states)
```

**No component or page ever calls `fetch()` directly.** All network access goes through `src/api/`.

### 6.2 API Client Layer Rules

- One file per backend domain, named `[domain].api.ts`
- Uses `import.meta.env.VITE_API_URL` as the base URL (falls back to `''` for same-origin requests)
- Throws `Error` on non-OK responses with the status code in the message
- Typed return values — every function has an explicit TypeScript return type
- No React imports, no hooks, no state

```ts
// src/api/locations.api.ts — the pattern
const BASE = import.meta.env.VITE_API_URL ?? '';

export async function fetchLocations(): Promise<Location[]> {
  const res = await fetch(`${BASE}/api/locations`);
  if (!res.ok) throw new Error(`Failed to fetch locations: ${res.status}`);
  return res.json();
}
```

### 6.3 Custom Hook Pattern

Every data-fetching hook follows this identical structure:

```ts
export function useLocations() {
  const [data, setData] = useState<Location[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;           // prevents state update after unmount
    setIsLoading(true);
    fetchLocations()
      .then(d => { if (!cancelled) setData(d); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };  // cleanup
  }, []);

  return { data, isLoading, error };
}
```

The `cancelled` flag prevents React's "can't perform state update on unmounted component" warning and avoids stale state races when a component unmounts before a fetch completes.

### 6.4 The `{ data, isLoading, error }` Return Shape

Every hook returns exactly this shape. Components handle all three cases:

```tsx
const { data: locations, isLoading, error } = useLocations();

if (isLoading) return <SkeletonLoader ... />;
if (error) return <p className="text-error">{commonMessages.error}</p>;
if (!locations) return null;
// render data
```

`data` starts as `null` and remains `null` on error. It is never `undefined`.

### 6.5 Caching — sessionStorage Pattern

`useCurrencyRate` demonstrates the only caching pattern in the codebase:

- Cache key: `tism-jpy-aud-rate`
- TTL: 1 hour (3,600,000ms)
- Storage: `sessionStorage` (cleared when the browser tab closes — appropriate for exchange rates)
- Structure: `{ rate: number, fetchedAt: number }`
- On init: `useState` initialiser calls `getCachedRate()` synchronously — if valid, `isLoading` starts as `false`
- On fetch: after a successful fetch, `setCachedRate` writes to sessionStorage; errors silently fail (rate display is hidden, not broken)

Only cache values that are: non-sensitive, expensive to refetch, and acceptable to serve slightly stale. Do not cache user data or auth tokens in `sessionStorage`.

### 6.6 External APIs

| API | Purpose | Key required | Used in |
|---|---|---|---|
| Backend (`VITE_API_URL`) | All app data | No (same-origin or env var) | All `api/*.api.ts` except currency |
| Frankfurter (ECB) | JPY→AUD exchange rate | No | `src/api/currency.api.ts` |
| Mapbox GL | Interactive map tiles | Yes (`VITE_MAPBOX_TOKEN`) | `src/components/map/MapView.tsx` |

The Mapbox token is read inside `MapView.tsx` as `import.meta.env.VITE_MAPBOX_TOKEN`. If missing, the component renders an error message — it does not crash.

---

## 7. Static Text & i18n

### 7.1 The Absolute Rule

**Zero hardcoded strings in JSX.** Every user-visible string — labels, headings, button text, error messages, placeholders, aria-labels — must be imported from a messages file.

This is non-negotiable. It:
- Makes every string discoverable and auditable in one place per domain
- Provides a clean migration path to runtime i18n (replace the `as const` object with an i18n lookup)
- Prevents typos from being silently scattered across the codebase

### 7.2 File Naming and Structure

Files are named `[domain].messages.ts` and live in `src/messages/`.

```ts
// src/messages/map.messages.ts
export const mapMessages = {
  pageTitle: 'Explore Kyushu',
  hoverCta: 'Click for more details',
  panelClose: 'Close',
  panelAddress: 'Address',
  // ...
} as const;
```

The `as const` assertion makes the object readonly and narrows all string values to their literal types — this enables TypeScript to catch typos in message key names.

### 7.3 How to Add a New Domain's Messages

1. Create `src/messages/[newdomain].messages.ts`
2. Export a single `as const` object named `[newdomain]Messages`
3. Import it by name in every component that needs those strings

```ts
// src/messages/packing.messages.ts
export const packingMessages = {
  pageTitle: 'Packing List',
  emptyTitle: 'Nothing packed yet',
  // ...
} as const;
```

Never re-export message keys from `common.messages.ts` — keep `commonMessages` only for strings that genuinely appear across multiple domains (nav labels, "Loading...", "Close", generic error).

### 7.4 Future i18n Migration Path

When/if the app needs multiple languages:

1. Replace `as const` objects with a function call: `t('map.pageTitle')`
2. Install `react-i18next` or similar
3. The JSON translation files map 1:1 to the existing message keys
4. Component code changes are minimal because all string imports are already centralised

The messages layer exists precisely to make this migration cheap.

---

## 8. TypeScript Standards

### 8.1 Strict Mode

The project uses `tsc && vite build` — TypeScript must pass before a build succeeds. The `typecheck` script (`tsc --noEmit`) is the source of truth. All strict mode checks are enabled.

### 8.2 No `any` Policy

**`any` is forbidden.** If you don't know the type:
- Use `unknown` and narrow it with a type guard
- Use a proper interface that matches the API response shape
- Use a generic if the type is genuinely variable

`currency.api.ts` shows how to handle an external API response — define a local interface for the response shape:

```ts
interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

const data: FrankfurterResponse = await res.json();
```

### 8.3 Interface vs Type Alias

| Use `interface` | Use `type` |
|---|---|
| Object shapes (API responses, component props, store shape) | Union types, intersection types, utility types |
| When the shape may be extended | When the alias is a computed or mapped type |

```ts
// interface for object shapes
interface Location { id: string; name: string; ... }
interface MapStore { selectedLocationId: string | null; ... }

// type for unions
type LocationCategory = 'attraction' | 'restaurant' | 'accommodation' | 'shopping' | 'transport';
```

### 8.4 Shared Types Location

All types used by more than one file live in `src/types/index.ts`. This is the single source of truth for:
- Domain entity shapes (`Location`, `ItineraryDay`, `GalleryImage`, `BudgetSummary`, `TripInfo`)
- Union types (`LocationCategory`)

Local-only types (component props interfaces, internal hook state) stay in the file that defines them and are not exported unless needed elsewhere.

### 8.5 Nullable and Optional Fields

- Use `T | null` for values that are explicitly absent (e.g., `selectedLocationId: string | null`)
- Use `T | undefined` / optional `?` only for truly optional props
- Use `string | null` for fields that the API may return as null (e.g., `openingHours: string | null`)
- Check for null with early returns or conditional rendering, never with `!` (non-null assertion) unless TypeScript genuinely cannot narrow it

```ts
// Good — explicit null check
const jpyValue = parseJPY(location.estimatedCost);
const audDisplay = rate && jpyValue !== null ? formatAUD(jpyValue, rate) : null;

// Bad — assumes non-null
const audDisplay = formatAUD(parseJPY(location.estimatedCost)!, rate!);
```

---

## 9. Adding a New Feature — Step-by-Step Checklist

Follow this checklist **in order** when building any new feature. Skipping steps creates debt that is expensive to fix.

1. **Define types in `src/types/index.ts` first**
   - Add the entity interface(s) your feature needs
   - Add any union type variants (e.g., a new status type)
   - Commit the types before writing any other code — this makes API and component contracts clear

2. **Add API function(s) in `src/api/`**
   - Create `src/api/[domain].api.ts` if the domain is new
   - Write one exported async function per endpoint
   - Use explicit TypeScript return types matching your new interfaces
   - Throw `Error` on non-OK responses

3. **Add messages in `src/messages/`**
   - Create `src/messages/[domain].messages.ts` if the domain is new
   - Define every string your new UI will display
   - Use `as const` — no exceptions

4. **Add a custom hook in `src/hooks/`**
   - Create `src/hooks/use[Domain].ts`
   - Follow the `useState + useEffect + cancelled flag + cleanup` pattern exactly
   - Return `{ data, isLoading, error }` (or `{ rate, isLoading, rateDate }` for non-entity data)

5. **Build UI primitives if needed**
   - Ask: could this component exist in a completely different app with no changes?
   - If yes → add to `src/components/ui/`
   - If no (it knows about `Location`, `ItineraryDay`, etc.) → it is a feature component, not a primitive
   - Never create a custom shimmer div — use `<SkeletonLoader className="w-full h-24" />`

6. **Build feature component(s) in `src/components/[domain]/`**
   - Import messages, hooks, and types — never `fetch()` directly
   - Handle all three states: loading (SkeletonLoader), error (`text-error`), and data
   - Handle the empty state with `<EmptyState />` or an inline message from your messages file
   - Apply Framer Motion for enter/exit animations following the motion rules in section 11
   - Support dark mode via Tailwind tokens only

7. **Add/update the page in `src/pages/`**
   - Keep the page thin — it composes feature components, it does not contain logic
   - Apply standard page layout: `<main className="pt-20 min-h-dvh">` (the `pt-20` clears the fixed navbar)
   - Use a max-width container: `max-w-4xl mx-auto px-4 sm:px-6 py-10`

8. **Register the route in `App.tsx`**
   - Add `<Route path="/[path]" element={<YourPage />} />` inside `<Routes>`
   - Add the nav link to the `navLinks` array in `Navbar.tsx`
   - Add the label to `commonMessages` in `src/messages/common.messages.ts`

9. **Validate before committing**
   - Run `npm run typecheck` — must pass with zero errors
   - Run `npm run build` — must succeed
   - Open the feature in the browser in **light mode** — check colours, layout, contrast
   - Open in **dark mode** — check colours, contrast, no raw hex values leaking through
   - Resize to mobile — check responsive layout, touch target sizes, drawer behaviour
   - Press Escape on any open panel/drawer — it must close

---

## 10. Adding a New UI Component — Rules & Checklist

When building any new component, work through this checklist:

- **Strings**: Every string comes from a messages file. Zero exceptions. Not even "Loading..." inline.

  ```tsx
  // Correct
  import { commonMessages } from '../../messages/common.messages';
  <p>{commonMessages.loading}</p>

  // Wrong
  <p>Loading...</p>
  ```

- **Loading state**: Use `<SkeletonLoader className="w-full h-[size]" />` — never write a custom shimmer `div`. `SkeletonLoader` uses `animate-pulse` and `aria-hidden="true"` consistently.

- **Error state**: Render `<p className="text-error">{commonMessages.error}</p>` or a domain-specific error message. Always use the `text-error` token.

- **Empty state**: Use `<EmptyState title={...} description={...} />` for full-page empty, or an inline `<p className="text-muted text-sm">` for small empty sections.

- **Dark mode**: Use Tailwind token classes exclusively. Never write `text-gray-800 dark:text-gray-100` — use `text-text-base`. Never write `bg-white dark:bg-zinc-900` — use `bg-surface`.

- **Framer Motion**: Wrap meaningful UI reveals in `motion.*`. Use `AnimatePresence` for any element that conditionally renders. Follow the duration and spring values in section 11.

  ```tsx
  // Panels/drawers — spring
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}

  // Content entering — ease-out
  transition={{ duration: 0.3 }}  // Framer defaults to ease-out

  // Tooltips — fast ease
  transition={{ duration: 0.15 }}
  ```

- **Icons**: Use Lucide React exclusively. Import from `lucide-react`. Never use emoji as icons in interactive elements (using emoji in display content like `countdownDeparted` in a messages value is acceptable, but never as a button icon or interactive affordance).

  ```tsx
  import { X, MapPin, ExternalLink } from 'lucide-react';
  ```

- **Glassmorphism**: Apply only when the component floats over a map or image background. The formula:
  ```
  backdrop-blur-md bg-white/10 dark:bg-black/40 border border-white/20 rounded-xl shadow-xl
  ```
  For content on a standard page background, use `bg-surface border border-bg rounded-2xl` instead.

- **External links**: Always use both attributes — missing either is a security issue:
  ```tsx
  <a href={url} target="_blank" rel="noopener noreferrer">...</a>
  ```

- **Touch targets**: Minimum 44×44px for any tap target. Achieve this with padding, not raw width/height:
  ```tsx
  <button className="p-2.5 rounded-lg ...">  // 10px padding + icon = ~42px — acceptable
  <button className="p-3 rounded-lg ...">    // 12px padding + icon = ~44px — ideal
  ```

- **Keyboard accessibility**:
  - Escape must close panels, modals, and drawers — add a `keydown` listener in `useEffect` with cleanup
  - Tab order must be logical — don't use `tabIndex` with positive values
  - Icon-only buttons must have `aria-label` — source it from a messages file

- **`aria-label` sourcing example**:
  ```tsx
  // Correct — aria-label from messages file
  import { commonMessages } from '../../messages/common.messages';
  <button aria-label={commonMessages.close} onClick={onClose}>
    <X size={18} />
  </button>

  // Wrong — hardcoded string
  <button aria-label="Close" onClick={onClose}>
    <X size={18} />
  </button>
  ```

---

## 11. UX & Motion Principles

This section is a **design contract** for the app. Motion and interaction patterns must be consistent across the entire UI — inconsistency undermines polish.

### Motion Must Convey Meaning

Every animation communicates something:
- A page element sliding in from the side → it came from somewhere, it can go back
- A tooltip fading in quickly → contextual, temporary, non-blocking
- Countdown digits flipping vertically → time is passing, numbers are counting down
- A pin scaling on hover → "this is interactive, you can click it"

If an animation would be identical with or without it, it's decoration. Decoration gets cut.

### Timing Reference

| Situation | Duration | Easing | Notes |
|---|---|---|---|
| Content block enter | 200–300ms | `easeOut` | Standard `framer-motion` default |
| Content block exit | 150ms | `easeIn` | Faster than enter — exit is less important than enter |
| Tooltip/overlay enter | 150ms | `easeOut` | Fast — don't interrupt the user |
| Panel/drawer enter | Spring | `stiffness: 300, damping: 30` | Feels physical and snappy |
| Panel/drawer exit | Spring | same config | Consistent with enter |
| Countdown digit flip | 200ms | default | Quick enough to feel live |
| Navbar scroll transition | 300ms | `transition-all duration-300` (CSS) | Slow enough to not be jarring |
| Colour/hover transitions | 150ms | `transition-colors duration-150` (CSS) | Applied to all interactive elements |
| Hero stagger | 600–700ms | `easeOut` | Slow, cinematic — only for hero entrance |

### Hover States

Every interactive element must have **visible hover feedback**:

```tsx
// Nav links
hover:text-text-base

// Buttons / icon buttons
hover:text-text-base hover:bg-surface transition-colors duration-150

// Location rows in lists
hover:bg-bg transition-colors

// External links
group-hover:underline
```

A flat element with no hover state looks broken and non-interactive. This is a quality bar, not optional.

### Loading States

- **Skeleton loaders** for content that will replace them (lists, cards, map overlay): use `<SkeletonLoader />`
- **Spinner** only for discrete actions (form submit, button click) — there are no forms currently, but this is the rule when they exist
- Never show a blank white area while content loads — always show a skeleton

### Map Interaction Specifics

- **Pin hover → tooltip**: shown immediately (no artificial delay — the `useState(false)` toggle is synchronous). Hidden when pin is selected (`!isSelected` guard).
- **Pin click → panel**: `setSelectedLocation(location.id)` triggers `LocationPanel` to render, which uses a spring animation (`stiffness: 300, damping: 30`)
- **Map click → deselect**: `handleMapClick` on the `<Map>` component calls `setSelectedLocation(null)`, closing the panel
- **Mobile panel**: bottom sheet (`y: '100%' → 0`) with the same spring config as the desktop side panel
- **Pin selected ring**: `box-shadow` glow using the category colour at 37.5% opacity (`colour + '60'`)

### Page Transitions

Page transitions are not yet implemented. When added, use `AnimatePresence` at the `<Routes>` level with a standard `opacity: 0 → 1` enter at 200ms. Do not use slide transitions at the page level — reserve slides for panels and drawers.

---

## 12. Security Standards

### Mapbox Token

The Mapbox access token is read from `import.meta.env.VITE_MAPBOX_TOKEN` inside `MapView.tsx`. It must:
- Never be committed to source control
- Always be set in `.env.local` (which is gitignored by Vite)
- Never appear as a hardcoded string anywhere in `src/`

If `VITE_MAPBOX_TOKEN` is `undefined`, `MapView` renders a safe error message — it does not crash or expose any configuration detail.

### External Links

All external links must have both `target="_blank"` and `rel="noopener noreferrer"`:
- `noopener` prevents the opened page from accessing `window.opener` (a clickjacking vector)
- `noreferrer` prevents the referrer header from leaking the app URL

```tsx
// Correct — both attributes always together
<a href={link.url} target="_blank" rel="noopener noreferrer">

// Wrong — missing rel
<a href={link.url} target="_blank">
```

### API Response Handling

- **Never use `dangerouslySetInnerHTML`** with API response data. All API strings are rendered as React text nodes (which are XSS-safe by default).
- Validate the shape of external API responses before use. `currency.api.ts` does this:
  ```ts
  const rate = data.rates['AUD'];
  if (!rate) throw new Error('AUD rate not found in response');
  ```
- Do not render raw API error messages directly to users — use generic messages from `commonMessages.error`.

### sessionStorage

`sessionStorage` is used only for the cached exchange rate (`tism-jpy-aud-rate`). Rules:
- Only cache non-sensitive, non-personal, non-auth data
- Always wrap `sessionStorage` access in try/catch (it can throw in restricted browser environments — see `useCurrencyRate.ts`)
- Clear on session end is the desired behaviour for rate data — `sessionStorage` is correct here, not `localStorage`

### CORS

The frontend never sets `Access-Control-Allow-*` headers — that is the backend's responsibility. If a CORS error appears, fix it in the server, not the client. Never use a proxy workaround that leaks credentials.

### Environment Variables

Vite exposes only env vars prefixed with `VITE_` to the client bundle. Never prefix a secret with `VITE_` if it must remain server-side — it will be included in the built JavaScript.

---

## 13. What NOT to Do

A short, sharp list of anti-patterns that are explicitly forbidden in this codebase. Each item has a one-line reason.

| Anti-pattern | Why it's forbidden |
|---|---|
| Hardcoded strings in JSX: `<p>Loading...</p>` | Breaks the i18n migration path, strings become undiscoverable |
| Raw hex in Tailwind className: `text-[#1C1917]` | Breaks dark mode, bypasses the token system |
| `any` TypeScript type | Defeats type safety; use `unknown` + narrowing |
| `fetch()` inside a React component or page | Violates the api → hook → component pipeline; no cancellation |
| Emoji as UI icons: `<button>✕</button>` | Not accessible, not scalable — use Lucide icons |
| `dangerouslySetInnerHTML` | XSS vector; never render raw API strings as HTML |
| `style={{ color: '#hex' }}` for theme colours | Bypasses CSS variables and breaks dark mode |
| Skipping `aria-label` on icon-only buttons | Screen reader users get no affordance for the button's purpose |
| `target="_blank"` without `rel="noopener noreferrer"` | Security vulnerability (reverse tabnapping) |
| Custom shimmer divs for loading: `animate-pulse bg-gray-200` | Use `<SkeletonLoader />` for consistency |
| Zustand store for server data | Hooks already handle loading/error/data; stores are for UI state |
| `localStorage` for exchange rates or non-preferences | Rates should expire when the session ends; use `sessionStorage` |
| Adding a store without asking "do two unrelated components need this?" | Stores add global complexity; local `useState` is cheaper |
| `tabIndex` with positive values | Breaks the natural tab order and is an accessibility failure |
| Positive values on `tabIndex` | Same as above — include once for emphasis |
| Skipping `npm run typecheck` before committing | TypeScript errors discovered late are expensive to fix |
| Skipping visual check in both themes | Dark mode regressions are invisible if only tested in one mode |
