---
description: Sticker Dream — voice-to-coloring-page app. Use Bun. Follow project conventions.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: true
---

# Sticker Dream

Voice-powered kids coloring page creator. Hold SPEAK → Fish Audio STT → fal.ai image generation → WebUSB TSPL print to a Phomemo PM-241 thermal label printer.

## Project-specific rules

- Read `DESIGN.md` before making any UI changes. All colors, fonts, shapes, and shadows are defined there.
- The design theme is **Cotton Candy Arcade**: bubble pink (`#FF69B4`), sunshine yellow (`#FFE066`), marshmallow pink surface (`#FFF0F7`). No sharp corners, no blur shadows, no thin fonts.
- `FISHAUDIO_API_KEY` and `FALAI_API_KEY` are server-only env vars. Never reference them in `src/` frontend files.
- The state machine lives in `src/App.tsx`. States: `idle → processing → reviewing → generating → result`.
- Audio capture is in `src/SpeakButton.tsx`. Minimum hold time is 4 seconds (`MIN_RECORD_MS = 4000`).
- Printing is handled by `src/usePrinter.ts` via WebUSB + TSPL. Do not send raw PNG bytes — the printer requires TSPL bitmap commands.
- Run `bun run check` (typecheck + ESLint + Prettier) before finishing any task.
- Use `import type` for type-only imports — enforced by ESLint.
- No `console.log` in browser-side code.

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.
