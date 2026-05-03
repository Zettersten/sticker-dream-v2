# Sticker Dream

A voice-powered kids coloring page creator. Hold a button, speak an idea, and the app generates a printable black-and-white coloring page — then sends it straight to a connected USB thermal label printer.

## How it works

1. **Hold SPEAK** for at least 4 seconds and describe what you want (e.g. *"a dinosaur eating pizza"*)
2. **Release** — audio is sent to [Fish Audio](https://fish.audio) for speech-to-text
3. Each word floats across the screen lyrics-style so you can review what was heard
4. A **3-second countdown** gives you a chance to cancel; otherwise the text is sent to [fal.ai](https://fal.ai) to generate a 9×16 black-and-white coloring page
5. The image appears fullscreen and is **automatically printed** to any paired WebUSB thermal label printer (optimised for the Phomemo PM-241 at 203 DPI, 4"×6" labels)

Saying *stop*, *cancel*, *abort*, *forget it*, or similar at any point resets the app.

## Tech stack

| Layer | Technology |
|---|---|
| Runtime & bundler | [Bun](https://bun.sh) |
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Fonts | Fredoka One + Nunito (Google Fonts) |
| Speech-to-text | [Fish Audio ASR](https://docs.fish.audio) |
| Image generation | [fal.ai](https://fal.ai) — FLUX.1 Dev (`portrait_16_9`, PNG) |
| Text measurement | [@chenglou/pretext](https://github.com/chenglou/pretext) |
| Printing | WebUSB → TSPL (Phomemo PM-241 / compatible thermal label printers) |
| Design system | [DESIGN.md](./DESIGN.md) (Google Stitch spec) |

## Prerequisites

- [Bun](https://bun.sh) v1.3 or later
- A [Fish Audio](https://fish.audio) account and API key
- A [fal.ai](https://fal.ai) account and API key
- Chrome or Edge (WebUSB is not supported in Firefox or Safari)
- *(Optional)* A Phomemo PM-241 or compatible 4"×6" USB thermal label printer

## Getting started

**1. Clone and install**

```bash
git clone https://github.com/Zettersten/sticker-dream-v2.git
cd sticker-dream-v2
bun install
```

**2. Set up environment variables**

```bash
cp .env.example .env
```

Open `.env` and fill in your keys:

```env
FISHAUDIO_API_KEY=your_fish_audio_key_here
FALAI_API_KEY=your_fal_ai_key_here
```

**3. Start the dev server**

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in Chrome or Edge.

## Scripts

| Command | Description |
|---|---|
| `bun dev` | Start dev server with HMR |
| `bun start` | Start production server |
| `bun run build` | Build to `dist/` |
| `bun run check` | Typecheck + lint + format check (run before committing) |
| `bun run typecheck` | TypeScript type check only |
| `bun run lint` | ESLint |
| `bun run lint:fix` | ESLint with auto-fix |
| `bun run format` | Prettier (writes files) |
| `bun run format:check` | Prettier (check only) |

## Printer setup

The app uses the [WebUSB API](https://developer.mozilla.org/en-US/docs/Web/API/WebUSB_API) to communicate directly with the printer — no drivers needed in the browser. Print data is encoded as **TSPL** (TSC Standard Label Language) at 812×1218 pixels (4"×6" at 203 DPI).

1. Connect the Phomemo PM-241 (or compatible printer) via USB
2. When the generated image appears, tap **Connect Printer** and select the device from the browser's USB picker
3. The printer is remembered for future sessions
4. Print jobs fire automatically each time a new image is generated

> **Note:** WebUSB requires a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) — `localhost` works in development. For production, deploy behind HTTPS.
