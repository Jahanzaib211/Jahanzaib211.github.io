# alilabsx.com

[![Check site](https://github.com/Jahanzaib211/Jahanzaib211.github.io/actions/workflows/check.yml/badge.svg)](https://github.com/Jahanzaib211/Jahanzaib211.github.io/actions/workflows/check.yml)
[![Publish site](https://github.com/Jahanzaib211/Jahanzaib211.github.io/actions/workflows/pages.yml/badge.svg?branch=main)](https://github.com/Jahanzaib211/Jahanzaib211.github.io/actions/workflows/pages.yml)

The website of ALI LABS X (PRIVATE) LIMITED, in English, Arabic, Urdu and Chinese. A static site built with Vite, TypeScript and Three.js, hosted on GitHub Pages behind Cloudflare.

## Run it

Needs Node 24.

```bash
npm ci
npm run dev       # generates the pages, then starts the dev server
npm run build     # generates the pages, checks types, builds dist
CHROME=/path/to/chrome npm test   # browser checks on dist, nothing is sent
```

Without `CHROME`, the tests use an installed Google Chrome. `npm run ci` runs what GitHub runs, and `npm run ci:all` adds Firefox and WebKit.

## Documents

- [Architecture](docs/ARCHITECTURE.md)
- [Operations, publishing and undo](docs/OPERATIONS.md)
- [Analytics and privacy](docs/PRIVACY.md)
- [Changes](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)

## How it is put together

| Path | What it holds |
|---|---|
| `content/en.mjs`, `ar.mjs`, `ur.mjs`, `zh.mjs` | Main text in each language |
| `content/solutions.mjs`, `insights.mjs` | Solution pages and articles |
| `content/*.part.html`, `pages-i18n.mjs` | Company and policy pages, English and translated |
| `content/consent.mjs`, `icons.mjs` | Cookie choice text, icons |
| `scripts/pages.mjs` | Writes every HTML page, the sitemap, the feed and `llms.txt` |
| `src/scene.ts`, `models.ts` | The 3D models |
| `src/backdrop.ts` | The background |
| `src/lead.ts` | The discovery form |
| `src/consent.ts` | Cookie choice and analytics |
| `tests/site.test.mjs` | Browser checks |

Generated pages are committed. Change `content` or `scripts/pages.mjs`, never the HTML.

## Privacy and security

- Analytics runs only after a visitor accepts. Update the policy pages in all four languages and raise the consent version before adding a service.
- Every page carries a content security policy. Add a new host there before using it.
- The form posts to the company console. If it cannot be reached, the visitor is offered email.

Report a weakness as described in [SECURITY.md](SECURITY.md).

## Publishing

Work on a branch and open a pull request. `Check site` must pass. Merging to `main` publishes the site.

## Rights

The ALI LABS X name, logo and original content belong to ALI LABS X (PRIVATE) LIMITED or its licensors. Fonts and icons keep their own licences in `public/assets`.
