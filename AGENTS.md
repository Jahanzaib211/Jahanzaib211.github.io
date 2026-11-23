# Company site framing

Owner: ALI LABS X (PRIVATE) LIMITED. This is the company site, replacing the founder portfolio.

- Jahanzaib Ali Ashraf is Founder and CEO (owner decision). Use Chief Executive in legal papers only once the appointment is filed.
- The form posts to the console, novaops.alilabsx.com/api/public. src/form.json is the offline copy of the form.
- Products, in order: NOVA BOTS, NOVA, LOCO, STORELOOM. Do not claim NOVA or NOVA BOTS is wholly original; upstream notices stay in their repos.
- Do not name other companies as partners or clients. No client numbers or certification claims.
- Company facts must match the SECP documents. The phone number may be shown (owner decision, 24 Nov 2026). No street address on the site.
- Text lives in content/*.mjs (en, ar, ur, zh). scripts/pages.mjs generates the HTML, so never edit generated pages. Rerun scripts/subset-chinese.mjs after changing Chinese text.
- One font family, Alexandria, with a Chinese companion. No colons, slashes, pipes or tag labels in visible copy.
- Products are not advertised as live. Use "Request a private demo" and the product story. Solutions name the problem, never the underlying technology.
- Vite, TypeScript, Three.js, self-hosted fonts, no third-party trackers except Google Analytics G-612W223T3P (owner decision). All analytics runs only after the visitor accepts (src/consent.ts). Never also add GTM-NZKD7T8C; it holds the same stream. Raise the consent version when a service is added. Update the privacy and cookies pages before adding any third-party script, form or cookie. Run `npm test` after `npm run build`.
- `main` publishes to alilabsx.com. Work on a branch; merge only when the owner approves.

## Content
Solution pages come from `content/solutions.mjs`, articles from `content/insights.mjs`, company pages from `content/*.part.html`. After Chinese text changes rerun `scripts/subset-chinese.mjs`. After title changes rerun `scripts/share-images.mjs`. Publish an article only if a likely client would search for it and the facts are checked.
