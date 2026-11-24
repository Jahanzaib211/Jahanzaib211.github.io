# Architecture

## From text to page
`scripts/pages.mjs` reads `content/` and writes every HTML page, the sitemap, the feed, `llms.txt` and `agents.txt`. Vite then bundles `src/` into `dist/`. There is no server and no client router. Each page is a full document that works without JavaScript, except the form and demonstrations.

## What runs in the browser
| File | Loaded | Does |
|---|---|---|
| `src/main.ts` | always | Menu, language list, frame protection, recovery after a release |
| `src/consent.ts` | always | Cookie choice, then first-party counts and Google Analytics |
| `src/backdrop.ts` | when idle | Background, WebGL 1, half size, 30 frames a second. Still for reduced motion, data saving or a slow device |
| `src/scene.ts`, `models.ts` | after load, pages with a model | Three.js models pinned to the text |
| `src/demos.ts` | pages with a demonstration | Product demonstrations |
| `src/lead.ts` | on first click | Discovery form |

Both WebGL surfaces recover when the browser takes the graphics away, including while the page waits behind Back.

## Other systems
The form and first-party counts go to `novaops.alilabsx.com/api/public`, the company console, which passes them to the private lead engine. If the console does not answer, the form offers email. `src/form.json` is the offline copy of the form.

## Languages
English at the root, then `/ar/`, `/ur/` and `/zh/`. Articles are English only. Chinese uses a subset font. New characters need `scripts/subset-chinese.mjs` or an addition to the `alx-chinese-more` files.
