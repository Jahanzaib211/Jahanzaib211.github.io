// Browser checks on the built site. Run "npm run build" first. Other hosts are blocked and nothing is sent.
import { test as run, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync, globSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join, resolve } from 'node:path'
import * as engines from 'playwright-core'
const ENGINE = process.env.BROWSER ?? 'chromium', [PART, PARTS] = (process.env.SHARD ?? '0/1').split('/').map(Number)
let nth = 0
// gl: the check needs WebGL. It is skipped only in a browser that has none, and never in Chromium
let webgl = true
const test = (name, fn, gl) => { if (nth++ % PARTS === PART) run(name, t => gl && !webgl ? t.skip('this browser has no WebGL') : fn(t)) }
const DIST = resolve(process.env.DIST ?? 'dist'), TYPE = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
let server, base, browser, missing = ''
const LANGS = ['', 'ar/', 'ur/', 'zh/']
const PAGES = globSync('**/*.html', { cwd: DIST }).filter(f => !f.startsWith('google'))
before(async () => {
  server = createServer((q, r) => {
    if (q.url === '/frame') { r.writeHead(200, { 'content-type': 'text/html' }); return r.end(`<iframe src="${base}" width="900" height="600"></iframe>`) }
    let f = join(DIST, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html')
    if (!existsSync(f) || (missing && f.includes(missing))) { r.writeHead(404, { 'content-type': 'text/html' }); return r.end(readFileSync(join(DIST, '404.html'))) }
    r.writeHead(200, { 'content-type': TYPE[extname(f)] ?? 'application/octet-stream' }); r.end(readFileSync(f))
  }).listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r)); base = `http://127.0.0.1:${server.address().port}/`
  // A test must never open the mail app or any other program on this computer
  const stub = mkdtempSync(join(tmpdir(), 'no-open-')); writeFileSync(join(stub, 'xdg-open'), '#!/bin/sh\nexit 0\n', { mode: 0o755 })
  browser = await engines[ENGINE].launch({ env: { ...process.env, PATH: `${stub}:${process.env.PATH}` }, ...(ENGINE === 'chromium' ? { ...(process.env.CHROME ? { executablePath: process.env.CHROME } : { channel: 'chrome' }), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } : {}) })
  const p = await browser.newPage(); webgl = await p.evaluate(() => !!document.createElement('canvas').getContext('webgl2')); await p.close()
  if (!webgl && ENGINE === 'chromium') throw new Error('Chromium must have WebGL, or the checks of the models would not run')
})
const answer = async (p, v) => { await p.locator(`.consent [data-v=${v}]`).click() }
after(async () => { await browser?.close(); server?.closeAllConnections(); server?.close() })
async function open(path, { w = 1440, h = 900, ...o } = {}) {
  const { ask, ...rest } = o, c = await browser.newContext({ viewport: { width: w, height: h }, ...rest })
  await c.route(u => u.hostname !== '127.0.0.1', r => r.abort())
  const p = await c.newPage(); p.errors = []; p.on('pageerror', e => p.errors.push(e.message)); if (o.ask !== true) await c.addCookies([{ name: 'alx_consent', value: '2.no', url: base }]); await p.goto(base + path); return p
}
const ready = p => p.waitForFunction(() => document.documentElement.classList.contains('ready'), null, { timeout: 20000 })

test('every page in every language links to Insights in its header', () => {
  const bad = PAGES.filter(f => !(readFileSync(join(DIST, f), 'utf8').match(/<nav id="nav"[\s\S]*?<\/nav>/)?.[0] ?? '').includes('href="/insights/"'))
  assert.ok(PAGES.length > 100); assert.deepEqual(bad, [])
})
test('the Insights link stays through pages, Back and language changes', async () => {
  const p = await open('insights/'), seen = () => p.locator('header nav a[href="/insights/"]').isVisible()
  assert.ok(await seen())
  for (const x of ['products/', 'company/']) { await p.locator(`header nav a[href="/${x}"]`).click(); await p.waitForURL('**/' + x); assert.ok(await seen(), x) }
  await p.goBack(); assert.ok(await seen(), 'back')
  for (const l of ['ar', 'ur', 'zh']) { await p.locator('.lang summary').click(); await p.locator(`.lang a[lang="${l}"]`).click(); await p.waitForURL(`**/${l}/**`); assert.ok(await seen(), l) }
  await p.context().close()
})
test('the header fits and nothing scrolls sideways', async () => {
  const bad = []
  for (const w of [390, 768, 901, 1024, 1080, 1440, 1920]) for (const l of LANGS) {
    const p = await open(l + 'solutions/', { w })
    const x = await p.evaluate(() => { const k = [...document.querySelectorAll('header nav > *')].filter(e => e.offsetParent), y = k.map(e => { const b = e.getBoundingClientRect(); return (b.top + b.bottom) / 2 }); return { over: document.documentElement.scrollWidth - innerWidth, spread: k.length ? Math.max(...y) - Math.min(...y) : 0, wrap: k.some(e => e.tagName === 'A' && e.getBoundingClientRect().height > 64), out: k.some(e => { const b = e.getBoundingClientRect(); return b.left < -1 || b.right > innerWidth + 1 }), meet: (() => { const a = document.querySelector('.logo').getBoundingClientRect(), b = document.getElementById('nav').getBoundingClientRect(); return b.width > 0 && innerWidth > 900 && a.left < b.right && b.left < a.right })() } })
    if (x.over > 0 || x.out || x.meet || x.wrap || (w > 900 && x.spread > 8)) bad.push([w, l, x]); await p.context().close()
  }
  assert.deepEqual(bad, [])
})
test('the model returns after the browser takes the graphics away, also through Back', async () => {
  const p = await open('products/'); await ready(p)
  await p.evaluate(() => { const x = document.getElementById('world').getContext('webgl2').getExtension('WEBGL_lose_context'); x.loseContext(); setTimeout(() => x.restoreContext(), 300) })
  await p.waitForTimeout(1200)
  const ok = () => p.evaluate(() => !document.documentElement.classList.contains('no3d') && getComputedStyle(document.getElementById('world')).display !== 'none' && !document.getElementById('world').getContext('webgl2').isContextLost())
  assert.ok(await ok(), 'after restore')
  await p.locator('header nav a[href="/insights/"]').click(); await p.waitForURL('**/insights/'); await p.goBack(); await p.waitForTimeout(2500); assert.ok(await ok(), 'after Back'); assert.deepEqual(p.errors, []); await p.context().close()
}, true)
test('without graphics every main page still shows the mark and no empty band', async () => {
  for (const x of ['', 'products/', 'services/', 'company/']) {
    const p = await open(x, { w: 390, h: 844 }); await ready(p); await p.evaluate(() => document.getElementById('world').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()); await p.waitForTimeout(300)
    assert.ok(await p.locator('.flat').isVisible(), x); const top = await p.evaluate(() => document.querySelector('.flat').getBoundingClientRect().top - document.querySelector('header').getBoundingClientRect().bottom); assert.ok(top < 140, `${x} ${top}`); await p.context().close()
  }
}, true)
const pick = async (p, q) => { const i = p.locator(q).first(); await i.locator('xpath=..').locator('span').evaluate(e => e.scrollIntoView({ block: 'center', behavior: 'instant' })); await i.locator('xpath=..').locator('span').click(); assert.ok(await i.isChecked(), q) }
const toStep = async (p, n) => {
  await p.locator('[data-lead=""]').first().evaluate(e => e.click()); await p.locator('.lead-box[open]').waitFor()
  const next = () => p.locator('.lead-nav .btn').click()
  await pick(p, '[name=problem]'); if (await p.locator('[data-step="0"]').isVisible()) await next()
  await p.locator('[data-step="1"]').waitFor(); if (n === 1) return
  await p.fill('#l-story', 'A long enough description of the problem.'); await pick(p, '[name=impacts]'); await next(); await p.locator('[data-step="2"]').waitFor(); if (n === 2) return
  for (const k of ['size', 'place', 'route']) await pick(p, `[name=${k}]`); await next(); await p.locator('[data-step="3"]').waitFor(); if (n === 3) return
  for (const k of ['timing', 'budget', 'role']) await pick(p, `[name=${k}]`); await next(); await p.locator('[data-step="4"]').waitFor(); if (n === 4) return
  for (const [k, v] of [['name', 'Test'], ['email', 'a@example.com'], ['company', 'Test'], ['country', 'Test']]) await p.fill(`#l-${k}`, v); await p.locator('[name=consent]').check(); await next(); await p.locator('[data-step="5"]').waitFor()
}
test('choosing answers never moves the form header or close button away', async () => {
  const bad = []
  for (const [w, h] of [[390, 667], [844, 390], [1024, 600], [1366, 640]]) for (const s of [2, 3]) {
    const p = await open('products/', { w, h }); await toStep(p, s)
    const chips = p.locator(`[data-step="${s}"] .ch span`), n = await chips.count()
    for (const i of [0, Math.floor(n / 2), n - 1]) { await chips.nth(i).click(); await p.keyboard.press('ArrowUp'); await p.waitForTimeout(350) }
    const x = await p.evaluate(() => ({ box: document.querySelector('.lead-box').scrollTop, grid: Math.round(document.querySelector('.lead-grid').getBoundingClientRect().top - document.querySelector('.lead-box').getBoundingClientRect().top) }))
    if (x.box || Math.abs(x.grid) > 1) bad.push([w, h, s, x]); await p.context().close()
  }
  assert.deepEqual(bad, [])
})
test('a brief that could not be sent stays and can be sent again', async () => {
  const p = await open('products/'), keys = []
  await p.context().route('**/api/public/leads', r => { keys.push(r.request().postDataJSON()?.idempotencyKey); return r.abort() })
  await toStep(p, 5); await p.locator('.lead-nav .btn').click(); await p.locator('.lead-done').waitFor()
  await p.locator('.lead-done .again').click(); assert.ok(await p.locator('[data-step="5"]').isVisible())
  await p.locator('.lead-nav .btn').click(); await p.locator('.lead-done').waitFor()
  await p.locator('.lead-x').first().click(); await p.locator('header [data-lead]').click(); await p.locator('.lead-box[open]').waitFor()
  assert.equal(await p.locator('#l-story').inputValue(), 'A long enough description of the problem.'); assert.equal(new Set(keys).size, 1); assert.equal(keys.length, 2); await p.context().close()
})
test('a later step cannot be reached or sent past an answer that was taken back', async () => {
  const p = await open('products/'); let sends = 0; await p.context().route('**/api/public/leads', r => { sends++; return r.abort() })
  await toStep(p, 5); const to = n => p.locator(`.lead-steps [data-go="${n}"]`).click()
  await to(4); await p.locator('[name=consent]').uncheck(); await to(5); assert.ok(await p.locator('[data-step="4"]').isVisible(), 'consent')
  await p.locator('[name=consent]').check(); await p.fill('#l-email', 'broken'); await to(5); assert.ok(await p.locator('[data-step="4"]').isVisible(), 'email')
  await p.fill('#l-email', 'a@example.com'); await to(1); await p.fill('#l-story', ''); await to(5); assert.ok(await p.locator('[data-step="1"]').isVisible(), 'story'); assert.equal(sends, 0); await p.context().close()
})
test('a brief changed after a failed send gets a new key', async () => {
  const p = await open('products/'), keys = []; await p.context().route('**/api/public/leads', r => { if (r.request().method() === 'POST') keys.push(r.request().postDataJSON().idempotencyKey); return r.abort() })
  await toStep(p, 5); const send = async () => { await p.locator('.lead-nav .btn').click(); await p.locator('.lead-done').waitFor() }
  await send(); await p.locator('.lead-done .again').click(); await p.locator('.lead-steps [data-go="1"]').click(); await p.fill('#l-story', 'A corrected description of the problem.'); await p.locator('.lead-steps [data-go="5"]').click(); await send()
  assert.equal(keys.length, 2); assert.notEqual(keys[0], keys[1]); await p.context().close()
})
test('Contact us works on the not found page and never locks scrolling', async () => {
  const p = await open('404.html')
  for (let i = 0; i < 2; i++) { await p.locator('header [data-lead]').click(); await p.locator('.lead-box[open]').waitFor({ timeout: 5000 }); await p.locator('.lead-x').first().click(); await p.waitForFunction(() => document.documentElement.style.overflow === '', null, { timeout: 5000 }) }
  assert.deepEqual(p.errors, []); await p.context().close()
})
test('keyboard focus is visible on main buttons', async () => {
  const p = await open('services/'), b = p.locator('header .btn'); const a = await b.screenshot(); await p.locator('.lang summary').focus(); await p.keyboard.press('Tab'); assert.ok(await b.evaluate(e => e === document.activeElement)); const c = await b.screenshot(); assert.notDeepEqual(a, c); await p.context().close()
})
test('the keyboard reaches the privacy choice right after the skip link', async () => {
  const p = await open('services/', { ask: true }); assert.ok(await p.evaluate(() => document.querySelector('.skip').nextElementSibling.matches('.consent'))); await p.context().close()
})
test('a wrong answer points to its message', async () => {
  const p = await open('products/'); await toStep(p, 1); await p.locator('.lead-nav .btn').click(); const s = p.locator('#l-story'); assert.equal(await s.getAttribute('aria-describedby'), 'lead-err'); assert.ok(await p.locator('#lead-err').textContent()); await s.fill('Now it is answered well.'); assert.equal(await s.getAttribute('aria-describedby'), null); await p.context().close()
})
test('the language menu is closed when Back returns to the page', async () => {
  const p = await open('services/'); await p.locator('.lang summary').click(); await p.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))); assert.equal(await p.locator('details.lang').evaluate(e => e.open), false); await p.context().close()
})
test('a restored deployment choice matches its explanation', async () => {
  const p = await open('approach/'); await p.evaluate(() => { document.querySelector('[value=airgap]').checked = true; dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })) })
  assert.equal(await p.locator('#deploy-out').innerHTML(), await p.evaluate(() => JSON.parse(document.getElementById('i18n').textContent).inf.airgap[1])); await p.context().close()
})
test('with reduced motion the model follows a choice', async () => {
  const p = await open('products/', { reducedMotion: 'reduce' }); await ready(p); await p.locator('#nova').scrollIntoViewIfNeeded(); await p.waitForTimeout(2500)
  const n = await p.evaluate(async () => { const g = document.getElementById('world').getContext('webgl2'); let f = new Set(), o = g.drawElements.bind(g), q = 0; g.drawElements = (...a) => { f.add(performance.now() | 0); q++; return o(...a) }; document.getElementById('t-2').click(); const t = performance.now(); let ticks = 0, seen = 0; while (performance.now() - t < 1500) { const b = q; await new Promise(requestAnimationFrame); ticks++; if (q > b) seen++ } return seen })
  assert.ok(n > 3, `frames ${n}`); await p.context().close()
}, true)
test('a missing file after a release reloads once, not forever', async () => {
  const p = await open(''); await ready(p); let loads = 0; p.on('load', () => loads++)
  missing = globSync('assets/lead-*.js', { cwd: DIST })[0]
  try { await Promise.all([p.waitForEvent('load', { timeout: 15000 }), p.locator('header [data-lead]').click()]); await p.waitForTimeout(1500); assert.equal(loads, 1); await p.locator('header [data-lead]').click(); await p.waitForURL('**/contact/') } finally { missing = '' }
  await p.context().close()
}, true)
test('no cookies, no local storage and no third party requests', async () => {
  const bad = []
  for (const x of ['', 'insights/', 'ar/', 'contact/', 'privacy.html']) { const c = await browser.newContext(), p = await c.newPage(); await c.route(u => u.hostname !== '127.0.0.1', r => { bad.push(r.request().url()); return r.abort() }); await p.goto(base + x); await p.waitForTimeout(800); if ((await c.cookies()).length || await p.evaluate(() => localStorage.length)) bad.push(x); await c.close() }
  assert.deepEqual(bad, [])
})
const hits = async p => { const h = []; await p.context().route('**/api/public/hit', r => { if (r.request().method() === 'POST') h.push(r.request().postDataJSON()); return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type' } }) }); return h }
test('nothing is counted before a choice or after Reject, and the choice is kept', async () => {
  const p = await open('insights/', { ask: true }), h = await hits(p); await p.waitForTimeout(600); assert.equal(h.length, 0); assert.equal((await p.context().cookies()).length, 0)
  const [a, b] = await p.locator('.consent-b button').all(), x = await a.boundingBox(), y = await b.boundingBox(); assert.equal(x.width, y.width); assert.equal(x.height, y.height)
  await answer(p, 'no'); await p.locator('header nav a[href="/products/"]').click(); await p.waitForURL('**/products/'); await p.waitForTimeout(600); assert.equal(h.length, 0); assert.equal(await p.locator('.consent').count(), 0)
  const c = await p.context().cookies(); assert.deepEqual([c.length, c[0].name, c[0].value, c[0].sameSite], [1, 'alx_consent', '2.no', 'Lax']); await p.context().close()
})
test('Accept counts visits without personal data and can be withdrawn', async () => {
  const p = await open('insights/', { ask: true }), h = await hits(p); await answer(p, 'yes'); await p.waitForTimeout(500); assert.equal(h.length, 1); assert.deepEqual(Object.keys(h[0]).sort(), ['device', 'event', 'language', 'path', 'source']); assert.equal(h[0].path, '/insights/')
  await p.locator('header nav a[href="/company/"]').click(); await p.waitForURL('**/company/'); await p.waitForTimeout(500); assert.equal(h.length, 2)
  await p.locator('header [data-lead]').click(); await p.locator('.lead-box[open]').waitFor(); assert.equal(h.at(-1).event, 'form_open'); assert.ok(!h.some(x => x.event === 'email')); await p.locator('.lead-x').first().click()
  const n = h.length; await p.locator('footer [data-consent]').click(); await answer(p, 'no'); await p.reload(); await p.waitForTimeout(600); assert.equal(h.length, n); await p.context().close()
})
test('Google loads only after Accept, once, and never after Reject', async () => {
  const p = await open('insights/', { ask: true }); await hits(p); const g = []; p.on('request', r => { if (/google/.test(new URL(r.url()).hostname)) g.push(r.url()) })
  await p.reload(); await p.waitForTimeout(600); assert.equal(g.length, 0)
  await answer(p, 'yes'); await p.waitForTimeout(600); assert.deepEqual(g, ['https://www.googletagmanager.com/gtag/js?id=G-612W223T3P'])
  const c = await p.evaluate(() => window.dataLayer.map(x => [...x])); assert.equal(c[0][0], 'consent'); assert.deepEqual([c[0][2].ad_storage, c[0][2].ad_user_data, c[0][2].ad_personalization], ['denied', 'denied', 'denied']); assert.equal(c.filter(x => x[0] === 'config').length, 1)
  await p.evaluate(() => { document.cookie = '_ga=x; Path=/'; document.cookie = '_ga_612W223T3P=x; Path=/' })
  await p.locator('footer [data-consent]').click(); await answer(p, 'no'); assert.deepEqual((await p.context().cookies()).map(x => x.name), ['alx_consent']); const n = g.length; await p.reload(); await p.waitForTimeout(600); assert.equal(g.length, n); await p.context().close()
})
test('a browser privacy signal is a rejection', async () => {
  const c = await browser.newContext(); await c.addInitScript(() => Object.defineProperty(navigator, 'globalPrivacyControl', { value: true })); await c.route(u => u.hostname !== '127.0.0.1', r => r.abort()); const p = await c.newPage(), h = await hits(p); await p.goto(base); await p.waitForTimeout(600); assert.equal(await p.locator('.consent').count(), 0); assert.equal(h.length, 0); await c.close()
})
test('the choice is offered in every language and fits small screens', async () => {
  for (const l of LANGS) { const p = await open(l + 'services/', { ask: true, w: 360, h: 640 }), b = await p.locator('.consent').boundingBox(); assert.ok(b.x >= 0 && b.x + b.width <= 360 && b.y >= 0 && b.y + b.height <= 640, l + JSON.stringify(b)); await p.context().close() }
})
test('the consent bar never covers the main button of a page', async () => {
  const bad = []
  for (const x of ['', 'services/', 'products/', 'ar/', 'ur/company/', 'zh/']) { const p = await open(x, { ask: true }); const b = await p.locator('.hero .btn').boundingBox(), c = await p.locator('.consent').boundingBox(); if (b.y + b.height > c.y) bad.push([x, b.y + b.height, c.y]); await p.context().close() }
  assert.deepEqual(bad, [])
})
for (const flat of [false, true]) test(`on a phone ${flat ? 'without 3D ' : ''}the privacy choice leaves the words and the main button free`, async () => {
  const bad = []
  for (const [w, h] of [[360, 640], [360, 740], [390, 844], [412, 915]]) for (const x of ['', 'services/', 'solutions/', 'products/', 'products/nova.html', 'solutions/team-chat/', 'ar/', 'ar/services/', 'ur/', 'ur/company/', 'zh/']) {
    const c = await browser.newContext({ viewport: { width: w, height: h } }); if (flat) await c.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null }); await c.route(u => u.hostname !== '127.0.0.1', r => r.abort()); const p = await c.newPage(); await p.goto(base + x); await p.locator('.consent').waitFor(); if (flat) await p.waitForFunction(() => document.documentElement.classList.contains('no3d'))
    const r = await p.evaluate(() => { const b = e => document.querySelector(e).getBoundingClientRect(), k = b('.consent'); return { title: b('h1').top - k.bottom, button: b('main .btn').top - k.bottom, top: k.top - b('header').bottom } }); if (r.title < 0 || r.button < 0 || r.top < 0) bad.push([w, h, x, r]); await c.close()
  }
  assert.deepEqual(bad, [])
})
test('a not found page speaks the language of its address', async () => {
  for (const [l, dir] of [['ar', 'rtl'], ['ur', 'rtl'], ['zh', '']]) { const p = await open(`${l}/nothing-here`); assert.equal(await p.locator('[data-404]:visible').count(), 1); assert.equal(await p.locator('[data-404]:visible').getAttribute('lang'), l); assert.equal(await p.locator('[data-404]:visible').evaluate(e => e.dir), dir); await p.context().close() }
})
test('leaving with an unfinished brief is asked about first', async () => {
  const p = await open('products/'); let asked = 0; p.on('dialog', d => { asked++; d.accept() }); await toStep(p, 2); await p.reload(); assert.equal(asked, 1); await p.reload(); assert.equal(asked, 1); await p.context().close()
})
test('the background moves, and is a still picture when less motion is asked for', async () => {
  for (const [m, moves] of [['no-preference', true], ['reduce', false]]) { const p = await open('insights/', { reducedMotion: m }); await p.locator('.bg.on').waitFor({ state: 'attached', timeout: 8000 }); await p.waitForTimeout(1500); const n = () => p.evaluate(() => Number(document.querySelector('.bg canvas').dataset.frames)), a = await n(); await p.waitForTimeout(1200); assert.equal(await n() > a, moves, m); assert.deepEqual(p.errors, []); await p.context().close() }
}, true)
test('the background recovers when the browser takes the graphics away', async () => {
  const p = await open('contact/'); await p.locator('.bg.on').waitFor({ state: 'attached' }); await p.evaluate(() => { const x = document.querySelector('.bg canvas').getContext('webgl').getExtension('WEBGL_lose_context'); x.loseContext(); setTimeout(() => x.restoreContext(), 300) }); await p.waitForTimeout(150); await p.locator('.bg.on').waitFor({ state: 'attached', timeout: 4000 }); assert.deepEqual(p.errors, []); await p.context().close()
}, true)
test('email links are marked so the network does not rewrite them', () => {
  for (const f of PAGES) { const h = readFileSync(join(DIST, f), 'utf8'), a = h.indexOf('<!--email_off-->'), b = h.indexOf('<!--/email_off-->'); assert.ok(a > 0 && b > h.lastIndexOf('mailto:'), f); assert.ok(h.indexOf('mailto:') > a, f) }
})
test('the security policy blocks nothing the site uses', async () => {
  const bad = []
  for (const x of ['', 'products/', 'ur/contact/', 'zh/cookies/', 'insights/', 'solutions/', '404.html']) { const p = await open(x); p.on('console', m => /Content Security Policy/i.test(m.text()) && bad.push([x, m.text().slice(0, 140)])); await p.reload(); await p.waitForTimeout(1500); await p.locator('header [data-lead]').evaluate(e => e.click()); await p.locator('.lead-box[open]').waitFor(); await p.context().close() }
  assert.deepEqual(bad, [])
})
test('company and policy pages exist in every language with the same parts as English', () => {
  const read = f => readFileSync(join(DIST, f), 'utf8'), main = h => h.match(/<main[\s\S]*?<\/main>/)[0], count = (h, r) => (h.match(r) ?? []).length
  for (const f of ['enterprise/index.html', 'careers/index.html', 'contact/index.html', 'security/index.html', 'cookies/index.html', 'privacy.html', 'terms.html']) {
    const en = main(read(f)), nums = h => [...new Set(h.replace(/<[^>]+>/g, ' ').match(/\d{2,}/g) ?? [])].sort().join()
    for (const l of ['ar', 'ur', 'zh']) { const h = read(`${l}/${f}`), m = main(h); for (const r of [/<h2/g, /<li/g, /<p[ >]/g, /<a /g, /data-consent/g]) assert.equal(count(m, r), count(en, r), `${l}/${f} ${r}`); assert.equal(nums(m).replace(/^11,|,11(?=,|$)/, ''), nums(en), `${l}/${f} numbers`); assert.ok(h.includes('hreflang="en" href="https://alilabsx.com/' + f.replace('index.html', ''))); assert.ok(read(f).includes(`href="https://alilabsx.com/${l}/`)) }
  }
})
test('another site cannot show the page in a frame', async () => {
  const c = await browser.newContext(); await c.route(u => !['127.0.0.1', 'localhost'].includes(u.hostname), r => r.abort())
  const p = await c.newPage(); await p.goto(base.replace('127.0.0.1', 'localhost') + 'frame'); let f; for (let i = 0; i < 40 && !f; i++) { f = p.frames().find(x => x.url().startsWith(base)); if (!f) await p.waitForTimeout(100) } assert.ok(f, p.frames().map(x => x.url()).join()); await f.waitForFunction(() => document.documentElement.classList.contains('framed'), null, { timeout: 8000 }); assert.equal(await f.evaluate(() => getComputedStyle(document.body).display), 'none'); await c.close()
})
test('without 3D the main button is free and the mark sits beside the words', async () => {
  const bad = []
  for (const [w, h] of [[1440, 900], [1280, 720], [1024, 768]]) for (const x of ['', 'services/', 'ar/', 'ur/company/', 'zh/']) {
    const c = await browser.newContext({ viewport: { width: w, height: h } }); await c.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (k, ...a) { return /webgl/.test(k) ? null : g.call(this, k, ...a) } }); await c.route(u => u.hostname !== '127.0.0.1', r => r.abort())
    const p = await c.newPage(); await p.goto(base + x); await p.waitForFunction(() => document.documentElement.classList.contains('no3d')); await p.locator('.consent').waitFor()
    const r = await p.evaluate(() => { const b = e => document.querySelector(e).getBoundingClientRect(), f = b('.flat'), h = b('h1'), t = document.createRange(); t.selectNodeContents(document.querySelector('h1')); const q = t.getBoundingClientRect(); return { free: b('.hero .btn').bottom <= b('.consent').top, apart: f.left >= q.right - 1 || f.right <= q.left + 1, seen: f.width > 100 } })
    if (!r.free || !r.apart || !r.seen) bad.push([w, x, r]); await c.close()
  }
  assert.deepEqual(bad, [])
})
test('every internal link and file exists', () => {
  const bad = new Set(); let n = 0
  for (const f of PAGES) for (const m of readFileSync(join(DIST, f), 'utf8').matchAll(/\s(?:href|src|data-u)="(\/[^"]*)"/g)) { n++; const path = decodeURIComponent(m[1].split(/[?#]/)[0]), file = join(DIST, path.endsWith('/') ? path + 'index.html' : path); if (!existsSync(file) || statSync(file).isDirectory()) bad.add(`${f} ${path}`) }
  assert.ok(n > 5000); assert.deepEqual([...bad], [])
})
test('the client space is linked everywhere, private, and never counts a visit', async () => {
  const h = readFileSync(join(DIST, 'client/index.html'), 'utf8'); assert.match(h, /noindex, nofollow/); assert.ok(!h.includes('google')); assert.ok(!readFileSync(join(DIST, 'sitemap.xml'), 'utf8').includes('/client/'))
  for (const f of PAGES) assert.equal((readFileSync(join(DIST, f), 'utf8').match(/href="\/client\/"/g) ?? []).length, 2, f)
  const c = await browser.newContext(), p = await c.newPage(), calls = [], errors = []; p.on('pageerror', e => errors.push(e.message))
  await c.addCookies([{ name: 'alx_consent', value: '2.yes', url: base }])
  await c.route(u => u.hostname !== '127.0.0.1', r => { calls.push(r.request().method() + ' ' + new URL(r.request().url()).pathname); const o = { 'access-control-allow-origin': base.replace(/\/$/, ''), 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'content-type, x-csrf' }; return r.request().method() === 'OPTIONS' ? r.fulfill({ status: 204, headers: o }) : r.fulfill({ status: 401, headers: o, contentType: 'application/json', body: '{"code":"signed_out","message":"Please sign in."}' }) })
  await p.goto(base + 'client/'); await p.getByRole('heading', { name: 'Client sign in' }).waitFor(); await p.waitForTimeout(800)
  assert.deepEqual([...new Set(calls)], ['GET /api/public/client/me']); assert.equal(await p.locator('.consent').count(), 0)
  await p.goto(base); await p.goto(base + 'client/#/join/' + 'a'.repeat(43)); await p.getByRole('heading', { name: 'Welcome' }).waitFor(); assert.equal(await p.evaluate(() => location.hash), '')
  await p.setViewportSize({ width: 360, height: 640 }); assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); assert.deepEqual(errors, []); await c.close()
})
