# Company site framing

Owner: ALI LABS X (PRIVATE) LIMITED. This is the company site, replacing the founder portfolio.

- Founder: Jahanzaib Ali Ashraf, Founder & Systems Engineer. Do not say CEO until the appointment is on file.
- Products, in order: NOVA BOTS, NOVA, LOCO, STORELOOM. Do not claim NOVA or NOVA BOTS is wholly original; upstream notices stay in their repos.
- Do not name other companies as partners or clients. No client numbers or certification claims.
- Company facts must match the SECP documents. No phone or street address on the site.
- Text lives in content/*.mjs (en, ar, ur, zh). scripts/pages.mjs generates the HTML, so never edit generated pages. Rerun scripts/subset-chinese.mjs after changing Chinese text.
- One font family, Alexandria, with a Chinese companion. No colons, slashes, pipes or tag labels in visible copy.
- Products are not advertised as live. Use "Request a private demo" and the product story. Solutions name the problem, never the underlying technology.
- Vite, TypeScript, Three.js, self-hosted fonts, no trackers. Update privacy.html before adding any third-party script, form or cookie.
- `main` publishes to alilabsx.com. Work on a branch; merge only when the owner approves.
