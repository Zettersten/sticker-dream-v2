# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Runtime

**Always use Bun** — never Node.js, npm, pnpm, npx, or Vite.

| Task | Command |
|------|---------|
| Install deps | `bun install` |
| Dev server (HMR) | `bun dev` |
| Production server | `bun start` |
| Production build | `bun run build` |
| Run tests | `bun test` |
| Run a single test file | `bun test src/path/to/file.test.ts` |

## Architecture

This is a full-stack app where **Bun acts as both the server and the bundler** — there is no separate build tool like Vite or Webpack.

### Server (`src/index.ts`)

Uses `Bun.serve()` with inline route definitions. All API routes live here alongside the catch-all `"/*"` that serves the HTML. Route handlers return `Response` objects directly — there is no Express or middleware layer.

### Frontend (`src/index.html` → `src/frontend.tsx` → `src/App.tsx`)

`src/index.html` imports `src/frontend.tsx` via a `<script type="module">` tag. Bun's bundler automatically transpiles and bundles TSX/CSS/SVG at request time in development. `src/frontend.tsx` is the React entry point; it uses `import.meta.hot` for HMR state persistence.

### Styling

Tailwind v4 via `bun-plugin-tailwind`. In dev, the plugin is loaded through `bunfig.toml` (`[serve.static]`). The production build (`build.ts`) applies the same plugin via `Bun.build()`.

### Environment Variables

Bun auto-loads `.env` — do not use `dotenv`. Only variables prefixed `BUN_PUBLIC_*` are exposed to browser code (configured in `bunfig.toml`).

### Production Build

`build.ts` scans all `src/**/*.html` entrypoints, runs `Bun.build()` with Tailwind, minification, and source maps, and outputs to `dist/`.

## Key Conventions

- **API routes**: Add new routes in `src/index.ts` as entries in the `routes` object.
- **Path alias**: `@/*` resolves to `./src/*` (configured in `tsconfig.json`).
- **Bun API preferences**: `Bun.serve()` over Express, `bun:sqlite` over better-sqlite3, `Bun.redis` over ioredis, `Bun.sql` over pg, `Bun.file` over `fs.readFile/writeFile`, `Bun.$` over execa.
- **Tests**: Use `bun:test` (`import { test, expect } from "bun:test"`), not Jest or Vitest.
