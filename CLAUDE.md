# TISM Japan 2026 — Monorepo

This is a pnpm monorepo. `client/` is the Vite + React frontend; `server/` is the Express API.

See `client/CLAUDE.md` and `server/CLAUDE.md` for per-package architecture and rules.

## Dev commands (run from repo root)

```bash
pnpm --filter client dev    # Vite dev server on :5173
pnpm --filter server dev    # Express watch mode on :3001
```

## Key rules

- Never share code directly between `client/` and `server/` — types are intentionally duplicated in each package's `src/types/index.ts`
- All commits must pass `pnpm --filter client run typecheck` and `pnpm --filter server run typecheck`
