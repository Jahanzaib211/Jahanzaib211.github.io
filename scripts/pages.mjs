// Builds every page in every language from content/*.mjs
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
const L = ['en', 'ar', 'ur', 'zh'], T = {}
for (const l of L) T[l] = (await import(`../content/${l}.mjs`)).default
const P = ['nova-bots', 'nova', 'loco', 'storeloom'], N = { 'nova-bots': 'NOVA BOTS', nova: 'NOVA', loco: 'LOCO', storeloom: 'STORELOOM' }
const CODE = { 'nova-bots': 'https://github.com/Ali-Labs-X/nova-bots', nova: 'https://github.com/Ali-Labs-X/nova', loco: 'https://github.com/Ali-Labs-X/loco' }
const root = l => (l === 'en' ? '/' : `/${l}/`), H = 'https://alilabsx.com', mail = s => `mailto:Jahanzaib@alilabsx.com?subject=${encodeURIComponent(s)}`
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: 'ALI LABS X', legalName: 'ALI LABS X (PRIVATE) LIMITED', url: H + '/', logo: H + '/brand/alx-mark.svg', email: 'Jahanzaib@alilabsx.com', foundingDate: '2026-11-18', founder: { '@type': 'Person', name: 'Jahanzaib Ali Ashraf', jobTitle: 'Founder and CEO', sameAs: ['https://www.linkedin.com/in/jahanzaib-ali-labsx', 'https://github.com/Jahanzaib211'] }, address: { '@type': 'PostalAddress', addressLocality: 'Lahore', addressRegion: 'Punjab', addressCountry: 'PK' } })
function page(l, path, title, desc, main, { alt = true, home = false, noindex = false } = {}) {
  const t = T[l], r = root(l), url = H + r + path, other = x => root(x) + (alt ? path : '')
  return `<!doctype html>
<html lang="${l === 'zh' ? 'zh-Hans' : l}" dir="${t.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
${alt && !noindex ? L.map(x => `<link rel="alternate" hreflang="${x === 'zh' ? 'zh-Hans' : x}" href="${H}${other(x)}">`).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${H}${other('en')}">` : ''}
<meta name="theme-color" content="#050a16">
<link rel="icon" type="image/svg+xml" href="/brand/alx-icon.svg">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ALI LABS X">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${H}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
${noindex ? '' : `<script type="application/json" id="lead-text">${JSON.stringify({ ...Object.fromEntries(Object.entries(t.lead).filter(([, v]) => typeof v === 'string')), name: t.name }).replace(/</g, '\\u003c')}</script>\n`}${home ? `<script type="application/ld+json">${ld}</script>\n<script type="application/json" id="i18n">${JSON.stringify({ js: t.js, inf: t.inf, ask: t.solAsk }).replace(/</g, '\\u003c')}</script>\n` : ''}<link rel="stylesheet" href="/src/style.css">
<script type="module" src="/src/main.ts"></script>
</head>
<body>
<a class="skip" href="#main">${t.skip}</a>
<header><div class="wrap">
<a class="logo" href="${r}"><img src="/brand/alx-mark.svg" alt="" width="62" height="28"><span dir="ltr">ALI LABS X<small>(PRIVATE) LIMITED</small></span></a>
<button class="menu" aria-expanded="false" aria-controls="nav" data-open="${t.menu}" data-close="${t.close}">${t.menu}</button>
<nav id="nav" aria-label="${t.menu}">${['solutions', 'services', 'products', 'approach', 'company'].map((k, i) => `<a href="${r}#${k}">${t.nav[i]}</a>`).join('')}<details class="lang"><summary aria-label="${t.lang}">${t.name}</summary><div>${L.map(x => `<a href="${other(x)}" lang="${x}" dir="${T[x].dir}"${x === l ? ' aria-current="true"' : ''}>${T[x].name}</a>`).join('')}</div></details><a class="btn" href="${mail('Project enquiry')}" data-lead="">${t.contact}</a></nav>
</div></header>
${main}
<footer><div class="wrap"><div><span dir="ltr">&copy; 2026 ALI LABS X (PRIVATE) LIMITED</span><br>${t.ft}</div>
<nav aria-label="${t.nav[4]}"><a href="/privacy.html" lang="en">${t.priv}</a><a href="/terms.html" lang="en">${t.terms}</a><a href="https://github.com/Ali-Labs-X">GitHub</a><a href="https://www.linkedin.com/in/jahanzaib-ali-labsx">LinkedIn</a></nav></div></footer>
</body>
</html>
`
}
const demo = (k, t) => {
  const j = t.js
  if (k === 'nova-bots') return `<div id="bots-demo" class="demo"><p class="do">${j.send}</p><div class="opts">${j.jobs.map((x, i) => `<button type="button" data-job="${i}" aria-pressed="false">${x[0]}</button>`).join('')}</div><div class="squad" aria-hidden="true">${j.roles.map(x => `<span class="bot">${x}</span>`).join('')}</div><ol aria-live="polite"></ol></div>`
  if (k === 'nova') return `<div id="nova-demo" class="demo"><p class="do">${j.inspect}</p><div role="tablist" aria-label="NOVA" class="tabs">${j.tabs.map((x, i) => `<button type="button" role="tab" id="t-${i}" aria-controls="nova-pane">${x}</button>`).join('')}</div><div role="tabpanel" id="nova-pane" tabindex="0"></div></div>`
  if (k === 'loco') return `<div id="loco-demo" class="demo"><label class="do" for="vram">${j.vram} <output dir="ltr">12 GB</output></label><input id="vram" type="range" min="6" max="24" step="2" value="12"><div class="meter"><div class="fill"></div></div><div class="opts">${j.models.map((x, i) => `<button type="button" data-i="${i}" data-gb="${[4.5, 9, 18, 1][i]}" aria-pressed="false">${x}<small dir="ltr">${[4.5, 9, 18, 1][i]} GB</small></button>`).join('')}</div><p class="say" aria-live="polite">${j.load}</p></div>`
  return `<div id="store-demo" class="demo"><p class="do">${j.shop}</p><div class="opts">${j.blocks.map((x, i) => `<button type="button" data-add="${i}">${x}</button>`).join('')}</div><div class="hues">${['#0268f4', '#0b7a5b', '#7a3ef0'].map((c, i) => `<button type="button" data-hue="${c}" aria-pressed="${!i}" aria-label="${j.hues[i]}" style="background:${c}"></button>`).join('')}</div><div class="shop"></div></div>`
}
for (const l of L) {
  const t = T[l], r = root(l), dir = '.' + r; mkdirSync(dir + 'products', { recursive: true })
  const scene = (id, form, side, inner, cls = '') => `<section ${id ? `id="${id}" ` : ''}class="scene ${side < 0 ? 'right ' : ''}${cls}" data-form="${form}" data-side="${side}"><div class="wrap">${inner}</div></section>\n`
  let m = `<canvas id="world" aria-hidden="true"></canvas>
<main id="main">
<section class="hero" data-form="logo" data-side="1"><div class="wrap"><img class="flat" src="/brand/alx-mark.svg" alt="" width="1452" height="665"><h1>${t.h1}</h1><p>${t.hero}</p><div class="row"><a class="btn" href="${mail('Project enquiry')}" data-lead="">${t.start}</a><a class="link" href="#solutions">${t.disc}</a></div></div></section>
`
  t.story.forEach((s, i) => { m += scene('', ['build', 'own', 'innovate'][i], i === 1 ? -1 : 1, `<div class="say-big"><h2>${s[0]}</h2><p>${s[1]}</p></div>`) })
  m += scene('solutions', 'desk', 1.3, `<div class="panel wide"><h2>${t.solH}</h2><p>${t.solP}</p><fieldset class="sols"><legend class="vh">${t.nav[0]}</legend>${t.sol.map((s, i) => `<label><input type="radio" name="sol" value="${i}" data-m="${mail(T.en.sol[i][1])}"${i ? '' : ' checked'}><span><small>${s[0]}</small><b>${s[1]}</b></span></label>`).join('')}</fieldset><a id="sol-ask" class="btn" data-lead="sol" href="${mail(T.en.sol[0][1])}">${t.solAsk}</a></div>`)
  m += `<section class="light solid"><div class="wrap two">${t.two.map(x => `<div><h2>${x[0]}</h2><p>${x[1]}</p></div>`).join('')}</div></section>
<section id="services" class="dark solid"><div class="wrap"><h2>${t.svcH}</h2><div class="services">${t.svc.map(x => `<div><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join('')}</div></div></section>
`
  m += scene('infrastructure', 'onprem', 1, `<div class="panel"><h2>${t.infH}</h2><p>${t.infP}</p><fieldset class="seg"><legend class="vh">${t.infP}</legend>${['cloud', 'onprem', 'airgap'].map(k => `<label><input type="radio" name="deploy" value="${k}"${k === 'onprem' ? ' checked' : ''}><span>${t.inf[k][0]}</span></label>`).join('')}</fieldset><p id="deploy-out" class="out" aria-live="polite">${t.inf.onprem[1]}</p></div>`)
  m += `<section id="products" class="intro"><div class="wrap"><h2>${t.prH}</h2><p class="lead">${t.prP}</p></div></section>\n`
  P.forEach((k, i) => { m += scene(k, ['bots', 'nova', 'loco', 'storeloom'][i], i % 2 ? 1 : -1, `<div class="panel"><h3><img src="/brand/${k}-mark.svg" alt="" width="54" height="54"><span dir="ltr">${N[k]}</span></h3><p>${t.p[k]}</p>${demo(k, t)}<div class="row"><a class="btn" href="${mail(N[k] + ' private demo request')}" data-lead="${N[k]} private demo">${t.demo}</a><a class="link" href="${r}products/${k}.html">${t.tale}</a></div></div>`) })
  m += `<section id="approach" class="dark solid"><div class="wrap"><h2>${t.apH}</h2><ol class="steps">${t.ap.map(x => `<li><b>${x[0]}</b>${x[1]}</li>`).join('')}</ol></div></section>
`
  const fo = t.founder, ORDER = ['nova-bots', 'nova', 'loco', 'storeloom']
  m += scene('founder', 'marks', 1, `<div class="f-col"><h2>${fo.h}</h2><p class="f-lead">${fo.i}</p><ul class="f-q">${fo.q.map(x => `<li>${x}</li>`).join('')}</ul><p>${fo.t}</p><h3>${fo.fh}</h3><ul class="f-p">${ORDER.map((k, i) => `<li data-mark="${i}"><a href="${r}products/${k}.html"><img src="/brand/${k}-mark.svg" alt="" width="40" height="40"><span><b dir="ltr">${N[k]}</b> ${fo.f[i]}</span></a></li>`).join('')}</ul><h3 data-mark="4">${fo.ch}</h3>${fo.c.map(x => `<p>${x}</p>`).join('')}<p><a class="link" href="https://github.com/Ali-Labs-X">${fo.rev}</a></p><p class="f-end">${fo.e} <b>${fo.tell}</b></p><div class="row"><a class="btn" href="${mail('Discovery')}" data-lead="Founder story">${t.lead.open}</a></div><div class="f-sign"><b>${fo.name}</b><span>${fo.role}</span></div></div>`, 'founder')
  m += `<section id="team" class="dark solid"><div class="wrap"><h2>${fo.th}</h2><p class="lead">${fo.tp}</p><ul class="team">${fo.team.map(x => `<li><b>${x[0]}</b><span>${x[1]}</span><p>${x[2]}</p></li>`).join('')}</ul></div></section>
<section id="company" class="light solid"><div class="wrap company"><div><h2>${t.coH}</h2><p class="lead">${t.coP}</p></div><dl><div><dt>${t.dl[0]}</dt><dd dir="ltr">ALI LABS X (PRIVATE) LIMITED</dd></div><div><dt>${t.dl[1]}</dt><dd>${t.dv[0]}</dd></div><div><dt>${t.dl[2]}</dt><dd><a href="https://leap.secp.gov.pk/#/verify-company-info/0366968">0366968</a></dd></div><div><dt>${t.dl[3]}</dt><dd>${t.dv[1]}</dd></div><div><dt>${t.dl[4]}</dt><dd>${t.dv[2]}</dd></div></dl></div></section>
`
  m += scene('contact', 'logo', 0, `<h2>${t.enH}</h2><p class="lead">${t.enP}</p><div class="row mid"><a class="btn" href="${mail('Project enquiry')}" data-lead="">${t.lead.open}</a><a class="link" dir="ltr" href="mailto:Jahanzaib@alilabsx.com">Jahanzaib@alilabsx.com</a></div>`, 'end') + '</main>'
  writeFileSync(dir + 'index.html', page(l, '', t.title, t.desc, m, { home: true }))
  P.forEach((k, i) => {
    const s = t.st[k], nx = P[(i + 1) % 4], title = t.pt.replace('{n}', N[k])
    writeFileSync(`${dir}products/${k}.html`, page(l, `products/${k}.html`, title, s[0], `<canvas id="world" aria-hidden="true"></canvas>
<main id="main"><article class="wrap story-page" data-product="${['bots', 'nova', 'loco', 'storeloom'][i]}"><div class="story-col">
<section class="story-top" data-form="${['bots', 'nova', 'loco', 'storeloom'][i]}" data-side="1"><img src="/brand/${k}-mark.svg" alt="" width="256" height="256"><h1 dir="ltr">${N[k]}</h1><p>${s[0]}</p></section>
${[0, 1, 2].map(n => `<section class="chapter" data-ch="${n}"><h2>${t.ch[n]}</h2><p>${s[n + 1]}</p></section>`).join('\n')}
<section class="chapter" data-ch="3"><h2>${t.ch[3]}</h2><ul>${s[4].map(x => `<li>${x}</li>`).join('')}</ul>${CODE[k] ? `<p><a class="link" href="${CODE[k]}">${t.src}</a></p>` : ''}</section>
<div class="next"><a class="btn" href="${mail(N[k] + ' private demo request')}" data-lead="${N[k]} private demo">${t.demo}</a><a class="link" href="${r}products/${nx}.html">${t.next.replace('{n}', N[nx])}</a></div></div></article></main>`))
  })
}
for (const [f, title] of [['privacy', 'Privacy policy'], ['terms', 'Terms of use'], ['404', 'Page not found']])
  writeFileSync(f + '.html', page('en', f + '.html', `${title}, ALI LABS X`, `${title} of ALI LABS X.`, `<main id="main">${readFileSync(`content/${f}.part.html`, 'utf8')}</main>`, { alt: false, noindex: f === '404' }))
const urls = L.flatMap(l => ['', ...P.map(k => `products/${k}.html`)].map(p => root(l) + p)).concat('/privacy.html', '/terms.html')
writeFileSync('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${H}${u}</loc></url>`).join('\n')}\n</urlset>\n`)
