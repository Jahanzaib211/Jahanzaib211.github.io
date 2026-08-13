# Portfolio reframe: drop solo-builder, position as Founder & Lead Platform Engineer (AliLabsX / Apex Global Tech Solution)

## Goal
Replace the "I build production-grade systems solo" / "Full-stack, solo-built" framing on `jahanzaib211.github.io` with a real, evidence-based title and story that reflects the actual scope of work in `/home/jahanzaib/Desktop/APEX GLOBAL` (Apex Global Tech Solution) and `/home/jahanzaib/alilabsx-stream` (AliLabsX engineering reference build). Final wording is locked.

## Final locked copy

- **Hero eyebrow** (replaces the level 0 / hero boot lines implicitly — leave boot animation; this is the visible `id="heroSub"`): see block A below.
- **Hero sub** (in `index.html:99`): see block A below.
- **About section copy + chips** (in `index.html:111-129`): see block B below.
- **Projects section**: keep Nova, Forge Studio, Genesis X, Ali Kernel, fox-hosting. Re-label each `pod-tag` so they read as AliLabsX products, not five random projects. Leave structure as-is; only touch the labels/anchors that need correction.
- **Add "Partners / Affiliations" panel** between the About section (`level-about`) and the Skills section (`level-skills`): see block C below. Lists AliLabsX (`alilabsx.com`) as the engineering arm and Apex Global Tech Solution (`apexglobaltech.com`) as the corporate company it ships under. Both are real entities in your repo; both already use the same domain stack this portfolio runs on.
- **New `.kilo/agents/AGENTS.md`** so future sessions read the canonical framing on entry.

### Block A — Hero (index.html:99)
Replace line 99:
```
    <p class="hero-sub" id="heroSub">I build the infrastructure behind AI agents — from the agent runtime and LLM gateway down to the hosting layer it all runs on.</p>
```
with:
```
    <p class="hero-sub" id="heroSub">Founder &amp; Lead Platform Engineer · AliLabsX · Apex Global Tech Solution.<br/>I build and run the production platforms behind a global SaaS and technology company — the corporate site, AI agent platform, hosting &amp; billing stack, fintech platform and the Kubernetes, observability and security substrate underneath. AliLabsX is the engineering arm; Apex Global Tech Solution is the company it ships under.</p>
```
Also update `<meta name="description">` (line 7), `og:description` (line 13) and `twitter:description` (line 20) so search and socials carry the new framing. The title tag (line 6) is fine; keep "Jahanzaib Ali — AliLabsX".

JSON-LD Person block (lines 30-46) stays as-is, but add `affiliation`:
```
"affiliation": [
  { "@type": "Organization", "name": "AliLabsX", "url": "https://www.alilabsx.com" },
  { "@type": "Organization", "name": "Apex Global Tech Solution", "url": "https://apexglobaltech.com" }
],
"jobTitle": "Founder & Lead Platform Engineer",
```

### Block B — About (index.html:111-129)
Replace lines 111-129:
```
      <p class="about-text">
        I build production-grade systems solo — end to end. That means the AI
        agent runtime and its orchestration layer, the LLM gateway it talks
        to, the database and infra underneath, and the hosting stack that
        keeps it all online. Not prototypes — systems with admin control
        planes, observability, budgets, and audit trails from day one.
        <br><br>
        My work spans autonomous computer-use agents, self-hosted LLM
        routing and proxy infrastructure, fintech platforms handling real
        transactions, and the hosting/licensing systems underneath. Python
        and Rust on the backend, Next.js and NestJS on the front, Postgres
        and Docker everywhere in between.
      </p>
      <div class="about-chips">
        <span class="chip">Full-stack, solo-built</span>
        <span class="chip">AI agent infrastructure</span>
        <span class="chip">Self-hosted LLM systems</span>
        <span class="chip">Production, not demos</span>
      </div>
```
with:
```
      <p class="about-text">
        I lead engineering at <strong>AliLabsX</strong>, the team behind
        <strong>Apex Global Tech Solution</strong>. Across both: the public
        SaaS site and the private operations console, an AI agent platform
        with 35k+ lines of original engineering, a self-hosted hosting and
        licensing platform, a multi-service fintech stack, and the
        k3s + Terraform + Prometheus + Loki + SOPS / Cosign stack that
        runs it. Nine capability areas — SaaS development, AI, cloud,
        cybersecurity, managed IT, DevOps, digital transformation, software
        development, consulting — delivered as eight productized modules
        with test-gated, fixed-scope, fixed-fee releases. The same
        engineering I ship to clients is the engineering I run for our own
        products.
      </p>
      <div class="about-chips">
        <span class="chip">Founder &amp; Lead Platform Engineer</span>
        <span class="chip">Apex Agent Platform</span>
        <span class="chip">Self-hosted LLM &amp; AI infra</span>
        <span class="chip">Production SaaS, not demos</span>
        <span class="chip">Security &amp; compliance by design</span>
      </div>
```

### Block C — New "Partners" section (insert after index.html:131)
Insert immediately after `</section>` for `#level-about` (line 131) and before the `#level-skills` `<section>` (line 133). Mirror the existing `level` + `panel` markup so it inherits the existing styles without any CSS changes. Level numbering bumps Skills from `data-level="2"` to `data-level="3"`, Activity from `3` to `4`, Projects from `4` to `5`, Credentials from `5` to `6`, Contact from `6` to `7`. Update HUD menu (`index.html:84-90`) to insert `Partners` at `01`.
```
  <section class="level align-right" id="level-partners" data-level="2" data-level-name="PARTNERS">
    <div class="level-inner panel">
      <span class="eyebrow">$ ls ~/companies</span>
      <h2 class="level-title">Partners &amp; affiliations</h2>
      <div class="case-block">
        <span class="case-label">AliLabsX</span>
        <p>
          <a href="https://www.alilabsx.com" target="_blank" rel="noopener">alilabsx.com</a> ·
          the engineering arm. Hosts Nova, Forge Studio, Genesis X, Ali
          Kernel, fox-hosting and the <code>alilabsx-stream</code>
          productized reference build (eight independently purchasable
          modules — architecture, k3s migration, gateway, CI/CD,
          observability, security, addons, runbooks).
        </p>
      </div>
      <div class="case-block">
        <span class="case-label">Apex Global Tech Solution</span>
        <p>
          <a href="https://apexglobaltech.com" target="_blank" rel="noopener">apexglobaltech.com</a> ·
          the corporate face. Global SaaS and technology company — public
          site, internal admin console, nine solution areas, six industries,
          credibility-audited claims. AliLabsX is the engineering delivery
          partner; the commercial commitment is Apex's.
        </p>
      </div>
      <div class="tags">
        <span class="tag">Same codebase, same stack, two brands</span>
        <span class="tag">k3s · Terraform · SOPS</span>
        <span class="tag">Prometheus · Loki · Falco</span>
        <span class="tag">Cosign-signed images</span>
      </div>
    </div>
  </section>
```
After insertion, shift the existing `data-level` values on `#level-skills`, `#level-activity`, `#level-projects`, `#level-credentials`, `#level-contact` up by 1 (2→3, 3→4, 4→5, 5→6, 6→7) so the HUD progress and `data-level-name` numbering stay sequential. Update the HUD menu `index.html:84-90` to insert `<a href="#level-partners"><span class="num">02</span> Partners</a>` after the About row and bump subsequent `num` values by 1 (03 Skills, 04 Activity, 05 Projects, 06 Credentials, 07 Contact).

### Block D — Boot lines (script.js:58-65)
Update the `bootLines` array to reflect the new positioning. The first three lines establish identity:
```
const bootLines = [
  '$ ssh operator@alilabsx.com',
  'Connected.',
  '$ whoami',
  'Jahanzaib Ali — Founder & Lead Platform Engineer',
  '$ alilabsx status',
  'apex platform online · 9 capability areas · 8 modules shipped',
];
```

### Block E — Misc cleanup (no copy change)
- `script.js:38` levels array also iterates `.project-pod` elements; it reads `data-level` / `data-level-name` so the level-number shift above keeps it working — verify by reading `script.js:36-53` after the edit.
- `script.js:184-196` agent core fades on level 0 (BOOT); unaffected.
- `script.js:251-413` certificate slab reads from `certSection` (the Credentials DOM node) so the new Partners section does not interfere.

### Block F — Documentation
Create `/home/jahanzaib/Jahanzaib211.github.io/.kilo/agents/AGENTS.md` so future sessions / contributors read the canonical framing on entry. Contents:
```
# Portfolio framing — canonical

Owner: Jahanzaib Ali
Title: **Founder & Lead Platform Engineer · AliLabsX · Apex Global Tech Solution**

Two related entities, one engineer:
- **AliLabsX** (`alilabsx.com`) — engineering arm. Nova, Forge Studio, Genesis X, Ali Kernel, fox-hosting, `alilabsx-stream` modular reference build.
- **Apex Global Tech Solution** (`apexglobaltech.com`) — corporate face. Public SaaS site, admin console, nine solution areas.

Hero sub, About copy, JSON-LD affiliation and boot lines all use this framing. Do not reintroduce "solo builder" or "solo-built" copy — it understates the scope and the partner relationship.
```

## Files to edit
- `index.html` (lines 7, 13, 20, 30-46, 84-90, 99, 111-131, 133-339 — see blocks A, B, C; also renumber `data-level` on Skills/Activity/Projects/Credentials/Contact)
- `script.js` (lines 58-65 — block D)
- New `.kilo/agents/AGENTS.md` (block F)

## Verification
1. `cd /home/jahanzaib/Jahanzaib211.github.io && python3 -c "import html.parser, sys; html.parser.HTMLParser().feed(open('index.html').read())"` — must parse without errors.
2. Manual scroll: BOOT → About → **Partners** (new) → Skills → Activity → Projects → Credentials → Contact. HUD level tag should read `LVL 02 · PARTNERS` when the new section is on screen.
3. Search for the strings "solo" and "solo-built" in `index.html` and `script.js`; both should return zero matches.
4. JSON-LD validates via Google Rich Results Test (run after deploy).
5. OpenGraph crawler (e.g. opengraph.xyz) shows the new `description`.
6. Boot sequence types the new line 4 verbatim.

## Out of scope
- No copy changes on the existing project pods (Nova, Forge Studio, Genesis X, Ali Kernel, fox-hosting). Their `pod-tag` numbers stay in their current order.
- No changes to `style.css`, `404.html`, `og-image.png`, or the Three.js scene.
- No new dependencies.
- No commits / pushes unless explicitly requested.
