# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Node.js (`C:\Program Files\nodejs\`) is not on the system PATH by default. Prefix all npm commands accordingly, or add it to PATH first.

```bash
# Dev server (http://localhost:5173)
"C:\Program Files\nodejs\npm.cmd" run dev

# Production build (outputs to dist/)
"C:\Program Files\nodejs\npm.cmd" run build

# Preview production build
"C:\Program Files\nodejs\npm.cmd" run preview
```

First-time setup on this machine requires approving the esbuild post-install script:
```bash
"C:\Program Files\nodejs\npm.cmd" install
"C:\Program Files\nodejs\npm.cmd" approve-scripts esbuild
```

There is no test suite and no lint script configured.

## Architecture

**Stack:** React 18 + Vite + TypeScript + Tailwind CSS. TanStack Query for server state. Zustand for client state. Framer Motion for page transitions. Three.js + GSAP for the 3D background.

**Backend:** All API calls go through `src/lib/api.ts`, which creates a single Axios instance pointing at `VITE_API_URL` (defaults to `http://localhost:5001/api`). The interceptor attaches the `admin_token` cookie as a Bearer token on every request and redirects to `/login` on 401. All domain-specific API functions are exported from that same file (`authApi`, `bookingsApi`, `providersApi`, etc.).

**Auth flow:** Phone-number OTP login. On success the backend sets an `admin_token` cookie. `DashboardLayout` reads that cookie on mount and redirects to `/login` if absent. Auth user state is held in `src/store/auth.store.ts` (Zustand).

**Three.js background (`VectrBackground`):** A single Three.js scene is mounted once in `App.tsx` and never unmounts — it persists across all route changes. It renders a snake-model glowing tube along a `CatmullRomCurve3` path. Mode switching (`login` vs `ambient`) is controlled via `VectrContext`; `VectrRouteSync` (inside `BrowserRouter`) calls `setMode` on route changes. The `login` mode is more intense/focused; `ambient` is dimmer and slower for dashboard pages.

**Layout:** All protected pages use `DashboardLayout` (`src/components/layout/DashboardLayout.tsx`), which renders the `Sidebar` and a sticky header. The layout background is `transparent` — the Three.js canvas behind it shows through.

**Path alias:** `@` resolves to `src/`. Use `@/components/...`, `@/pages/...`, etc.

**Types:** Shared domain types (enums, entity interfaces, `ApiResponse<T>`, `PaginatedResponse<T>`) live in `src/types/index.ts`.

**UI components:** Reusable components in `src/components/ui/` (Button, Badge, DataTable, Pagination, StatsCard, ConfirmModal). Visual effect components in `src/components/effects/` (ShinyText, GlowCard, AnimatedCounter, etc.). Pages wrap content in `DashboardLayout` and use these primitives directly — no component library.
