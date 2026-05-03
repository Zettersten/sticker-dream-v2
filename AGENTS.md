# AGENTS.md

This file provides guidance to AI agents (Warp, Claude Code, Cursor, etc.) when working with code in this repository.

## Project

**Sticker Dream** — a voice-powered kids coloring page creator. The user holds a SPEAK button, describes an idea, and the app generates a black-and-white coloring page via AI and auto-prints it to a USB thermal label printer.

Full flow: hold SPEAK (4s min) → Fish Audio STT → lyrics-style word preview + 3s cancel window → fal.ai FLUX image generation → display + WebUSB TSPL print.

## Runtime

**Always use Bun** — never Node.js, npm, pnpm, npx, or Vite.

| Task | Command |
|------|---------|
| Install deps | `bun install` |
| Dev server (HMR) | `bun dev` |
| Production server | `bun start` |
| Production build | `bun run build` |
| Typecheck | `bun run typecheck` |
| Lint | `bun run lint` |
| Lint + fix | `bun run lint:fix` |
| Format | `bun run format` |
| All checks | `bun run check` |
| Run tests | `bun test` |

**Always run `bun run check` before committing.** It runs typecheck → lint → format check in sequence.

## Environment Variables

Bun auto-loads `.env` — do not use `dotenv`. Copy `.env.example` to get started.

| Variable | Used by |
|---|---|
| `FISHAUDIO_API_KEY` | `/api/stt` — Fish Audio ASR |
| `FALAI_API_KEY` | `/api/generate` — fal.ai image generation |

API keys must stay **server-side only**. Never expose them to browser code or prefix with `BUN_PUBLIC_`.

## Architecture

Full-stack app where Bun is both the server and bundler. No Express, no Vite, no Webpack.

### Server (`src/index.ts`)

Two API routes served alongside the HTML catch-all:

| Route | Method | Purpose |
|---|---|---|
| `/api/stt` | POST | Receives `multipart/form-data` audio blob, proxies to Fish Audio `/v1/asr`, returns `{ text }` |
| `/api/generate` | POST | Receives `{ text }`, builds a kids coloring page prompt, calls `fal.subscribe("fal-ai/flux/dev")`, returns `{ imageUrl }` |

Route handlers return `Response` objects directly. `fal` is configured server-side via `fal.config({ credentials: process.env.FALAI_API_KEY })`.

### Frontend components

| File | Role |
|---|---|
| `src/App.tsx` | Top-level state machine: `idle → processing → reviewing → generating → result` |
| `src/SpeakButton.tsx` | Hold-to-speak (4s min), cancel mode with SVG countdown ring |
| `src/WordDisplay.tsx` | Lyrics-style word animator; uses `@chenglou/pretext` to scale oversized words |
| `src/GeneratedImage.tsx` | Fullscreen image reveal; auto-triggers WebUSB print on mount |
| `src/usePrinter.ts` | WebUSB hook — connects, sends TSPL print jobs, tracks `idle/connected/printing/error` |
| `src/webusb.d.ts` | WebUSB type declarations (not yet in standard TS DOM lib) |

### App state machine

```
idle → (hold SPEAK 4s+) → processing → (STT result) → reviewing → (3s countdown) → generating → result
         ↑                         ↓ cancel word detected                         ↑
         └───────────────────────────────── Cancel? clicked ──────────────────────────┘
```

### Styling

Tailwind v4 via `bun-plugin-tailwind`. Design tokens are in `DESIGN.md` (Google Stitch spec). Theme name: **Cotton Candy Arcade**.

- Primary: `#FF69B4` (Bubble Pink)
- Secondary: `#FFE066` (Sunshine Yellow)
- Surface: `#FFF0F7` (Marshmallow Pink)
- All shapes: `border-radius: 9999px` or `40px` minimum— no sharp corners
- Shadows: hard-offset sticker style (`0 8px 0 #FFCC00, 0 12px 0 #C13B7E`) — never blur-based
- Fonts: Fredoka One (display), Nunito (body) — minimum weight 700

### Printing

`usePrinter.ts` builds TSPL print jobs for the **Phomemo PM-241** (and compatible 4×6" thermal label printers):
- 203 DPI → 812×1218 px canvas
- Image drawn letterboxed, thresholded to 1-bit monochrome
- Wrapped in `SIZE / GAP / DENSITY / SPEED / CLS / BITMAP / PRINT` commands
- Sent via `device.transferOut()` on the bulk OUT USB endpoint

## Code conventions

- **No mocking** — no mock data, no fake API responses, no environment flags for mocking
- **API routes**: add to the `routes` object in `src/index.ts`
- **Path alias**: `@/*` → `./src/*` (tsconfig.json)
- **Type imports**: use `import type` for type-only imports (`@typescript-eslint/consistent-type-imports` is enforced)
- **No `console.log`** in browser code; `console.warn`/`console.error` are allowed
- **Bun APIs**: `Bun.serve()` over Express, `Bun.file` over `fs`, `Bun.$` over execa
- **Tests**: `bun:test`, not Jest or Vitest
- **Formatting**: Prettier owns all formatting — do not manually adjust whitespace or trailing commas
