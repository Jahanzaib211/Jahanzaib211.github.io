// Builds every page in every language from content/*.mjs
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import SOL, { SLUGS, UI } from '../content/solutions.mjs'
import INS from '../content/insights.mjs'
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
const L = ['en', 'ar', 'ur', 'zh'], T = {}
for (const l of L) T[l] = (await import(`../content/${l}.mjs`)).default
const P = ['nova-bots', 'nova', 'loco', 'storeloom'], N = { 'nova-bots': 'NOVA BOTS', nova: 'NOVA', loco: 'LOCO', storeloom: 'STORELOOM' }
const CODE = { 'nova-bots': 'https://github.com/Ali-Labs-X/nova-bots', nova: 'https://github.com/Ali-Labs-X/nova', loco: 'https://github.com/Ali-Labs-X/loco' }
const root = l => (l === 'en' ? '/' : `/${l}/`), H = 'https://alilabsx.com', mail = s => `mailto:Jahanzaib@alilabsx.com?subject=${encodeURIComponent(s)}`
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const ORG = { '@type': 'Organization', '@id': H + '/#org', name: 'ALI LABS X', legalName: 'ALI LABS X (PRIVATE) LIMITED', url: H + '/', logo: H + '/brand/alx-mark.svg', email: 'Jahanzaib@alilabsx.com', telephone: '+923066422442', contactPoint: { '@type': 'ContactPoint', contactType: 'sales', telephone: '+923066422442', email: 'Jahanzaib@alilabsx.com', availableLanguage: ['en', 'ar', 'ur', 'zh'] }, sameAs: ['https://github.com/Ali-Labs-X'], foundingDate: '2026-11-18', founder: { '@type': 'Person', name: 'Jahanzaib Ali Ashraf', jobTitle: 'Founder and CEO', sameAs: ['https://www.linkedin.com/in/jahanzaib-ali-labsx', 'https://github.com/Jahanzaib211'] }, address: { '@type': 'PostalAddress', addressLocality: 'Lahore', addressRegion: 'Punjab', addressCountry: 'PK' } }
const ORGS = { en: 'Home', ar: 'الرئيسية', ur: 'صفحہ اول', zh: '首页' }
const graph = (l, url, title, desc, crumbs, extra) => JSON.stringify({ '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebSite', '@id': H + '/#site', url: H + '/', name: 'ALI LABS X', publisher: { '@id': H + '/#org' }, inLanguage: ['en', 'ar', 'ur', 'zh-Hans'] }, { '@type': 'WebPage', '@id': url, url, name: title, description: desc, inLanguage: l === 'zh' ? 'zh-Hans' : l, isPartOf: { '@id': H + '/#site' }, about: { '@id': H + '/#org' } }, ...extra, ...(crumbs.length > 1 ? [{ '@type': 'BreadcrumbList', itemListElement: crumbs.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) }] : [])] }).replace(/</g, '\\u003c')
function page(l, path, title, desc, main, { alt = true, extra = [], crumb = [], img = '', home = false, d3 = false, noindex = false, here = '' } = {}) {
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
<link rel="alternate" type="application/rss+xml" title="ALI LABS X Insights" href="/feed.xml">
<meta name="theme-color" content="#050a16">
<link rel="icon" type="image/svg+xml" href="/brand/alx-icon.svg">
<link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ALI LABS X">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="${{ en: 'en_US', ar: 'ar_AR', ur: 'ur_PK', zh: 'zh_CN' }[l]}">
<meta property="og:image" content="${H}/${img && existsSync(`public/og/${img}`) ? `og/${img}` : 'og-image.png'}">
<meta property="og:image:alt" content="ALI LABS X">
<link rel="manifest" href="/site.webmanifest">
<meta name="twitter:card" content="summary_large_image">
${noindex ? '' : `<script type="application/json" id="lead-text">${JSON.stringify({ ...Object.fromEntries(Object.entries(t.lead).filter(([k, v]) => typeof v === 'string' || ['tips', 'more', 'nextP'].includes(k))), name: t.name }).replace(/</g, '\\u003c')}</script>\n`}${noindex ? '' : `<script type="application/ld+json">${graph(l, url, title, desc, [[ORGS[l], H + r], ...(path.startsWith('products/') && path !== 'products/' ? [[t.nav[2], H + r + 'products/']] : []), ...crumb, ...(path ? [[title, url]] : [])], extra)}</script>\n`}${d3 ? `<script type="application/json" id="i18n">${JSON.stringify({ js: t.js, inf: t.inf, ask: t.solAsk }).replace(/</g, '\\u003c')}</script>\n` : ''}${[l === 'zh' ? 'alx-chinese' : 0, t.dir === 'rtl' ? 'alexandria-arabic' : 0, 'alexandria-latin'].filter(Boolean).map(f => `<link rel="preload" href="/assets/fonts/${f}.woff2" as="font" type="font/woff2" crossorigin>`).join('\n')}
<link rel="stylesheet" href="/src/style.css">
<script type="module" src="/src/main.ts"></script>
</head>
<body>
<a class="skip" href="#main">${t.skip}</a>
<header><div class="wrap">
<a class="logo" href="${r}"><img src="/brand/alx-mark.svg" alt="" width="62" height="28"><span dir="ltr">ALI LABS X<small>(PRIVATE) LIMITED</small></span></a>
<button class="menu" aria-expanded="false" aria-controls="nav" data-open="${t.menu}" data-close="${t.close}">${t.menu}</button>
<nav id="nav" aria-label="${t.menu}">${['solutions', 'services', 'products', 'approach', 'company'].map((k, i) => `<a href="${r}${k}/"${here === k ? ' aria-current="page"' : ''}>${t.nav[i]}</a>`).join('')}${l === 'en' ? `<a href="/insights/"${here === 'insights' ? ' aria-current="page"' : ''}>Insights</a>` : ''}<details class="lang"><summary aria-label="${t.lang}">${t.name}</summary><div>${L.map(x => `<a href="${other(x)}" lang="${x}" dir="${T[x].dir}"${x === l ? ' aria-current="true"' : ''}>${T[x].name}</a>`).join('')}</div></details><a class="btn" href="${mail('Project enquiry')}" data-lead="">${t.contact}</a></nav>
</div></header>
${main}
<footer>${noindex ? '' : `<div class="wrap f-map"><nav aria-label="${t.nav[0]}"><b>${t.nav[0]}</b>${t.sol.map((x, i) => `<a href="${r}solutions/${SLUGS[i]}/">${x[1]}</a>`).join('')}</nav><nav aria-label="${t.nav[2]}"><b>${t.nav[2]}</b>${P.map(k => `<a dir="ltr" href="${r}products/${k}.html">${N[k]}</a>`).join('')}<b>${t.nav[4]}</b><a href="${r}company/">${t.founder.th}</a>${['enterprise', 'careers', 'contact'].map((k, i) => `<a href="/${k}/">${t.foot[i]}</a>`).join('')}<a href="/insights/">${UI[l].ins}</a></nav></div>`}<div class="wrap"><div><span dir="ltr">&copy; 2026 ALI LABS X (PRIVATE) LIMITED</span><br>${t.ft}</div>
<nav aria-label="${t.foot[5]}"><a href="/privacy.html">${t.priv}</a><a href="/terms.html">${t.terms}</a><a href="/cookies/">${t.foot[4]}</a><a href="/security/">${t.foot[3]}</a><a href="https://github.com/Ali-Labs-X">GitHub</a><a href="https://www.linkedin.com/in/jahanzaib-ali-labsx">LinkedIn</a></nav></div></footer>
${noindex ? '' : `<a class="wa" href="${WA(t)}" target="_blank" rel="noopener" aria-label="${t.wa}">${WI}</a>`}
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
const WA = t => `https://wa.me/923066422442?text=${encodeURIComponent(t.waHi)}`
const WI = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4a12 12 0 0 0-10.300 18.200L4 28l6-1.600A12 12 0 1 0 16 4Zm-4.500 6.500c.5 0 .8.100 1 .6l1 2.300c.1.300 0 .6-.2.800l-1 1.200c1 1.900 2.500 3.200 4.500 4l1.100-1.300c.2-.3.500-.4.9-.2l2.300 1.100c.4.200.6.500.5.900-.2 1.700-1.700 2.800-3.300 2.600-4.800-.7-8.400-4.200-9.200-8.700-.2-1.700.9-3.200 2.400-3.300Z" fill="currentColor"/></svg>'
// One drawing per problem, in the order of content sol
const ICON = [
  '<path d="M4 6h14v9H10l-4 4v-4H4zM14 18v3h8l4 4v-4h2v-9h-6"/>', '<path d="M5 7h22v20H5zM5 13h22M11 4v6M21 4v6M12 20l3 3 6-6"/>', '<path d="M16 8c-3-2-7-2-11-1v18c4-1 8-1 11 1 3-2 7-2 11-1V7c-4-1-8-1-11 1zM16 8v18"/>', '<path d="M4 8h9l3 4h12v14H4zM13 19h6M16 16v6"/>', '<circle cx="12" cy="11" r="5"/><path d="M3 27c0-6 4-9 9-9s9 3 9 9M21 7a5 5 0 0 1 0 8M24 19c3 1 5 4 5 8"/>', '<path d="M5 18v-3a11 11 0 0 1 22 0v3M5 17h5v8H5zM22 17h5v8h-5zM24 25c0 3-3 4-7 4"/>', '<path d="M4 5h7v22H4zM13 5h7v14h-7zM22 5h7v9h-7z"/>', '<path d="M4 27h24M7 27V17M14 27V10M21 27v-7M27 27V5"/>', '<path d="M26 12A11 11 0 0 0 6 11M6 20a11 11 0 0 0 20 1M26 5v7h-7M6 27v-7h7"/>', '<path d="M3 9h17v14H3zM20 14l9-5v14l-9-5"/>', '<circle cx="11" cy="16" r="6"/><path d="M17 16h12v5M24 16v4"/>', '<path d="M16 3l11 4v8c0 7-5 12-11 14C10 27 5 22 5 15V7zM16 10l1.500 4.500L22 16l-4.500 1.500L16 22l-1.500-4.500L10 16l4.500-1.500z"/>', '<path d="M4 12l3-8h18l3 8M4 12c0 4 6 4 6 0 0 4 6 4 6 0 0 4 6 4 6 0 0 4 6 4 6 0M6 16v12h20V16M13 28v-8h6v8"/>', '<path d="M3 17h6l3-9 6 17 4-12 2 4h5"/>']
for (const l of L) {
  const t = T[l], r = root(l), dir = '.' + r; mkdirSync(dir + 'products', { recursive: true })
  const scene = (id, form, side, inner, cls = '') => `<section ${id ? `id="${id}" ` : ''}class="scene ${side < 0 ? 'right ' : ''}${cls}" data-form="${form}" data-side="${side}"><div class="wrap">${inner}</div></section>\n`
  const fo = t.founder, ORDER = ['nova-bots', 'nova', 'loco', 'storeloom']
  const open = '<canvas id="world" aria-hidden="true"></canvas>\n<main id="main">\n'
  const close = scene('contact', 'logo', 0, `<h2>${t.enH}</h2><p class="lead">${t.enP}</p><div class="row mid"><a class="btn" href="${mail('Project enquiry')}" data-lead="">${t.lead.open}</a><a class="link" dir="ltr" href="mailto:Jahanzaib@alilabsx.com">Jahanzaib@alilabsx.com</a></div><a class="wa-line" href="${WA(t)}" target="_blank" rel="noopener">${WI}<span>${t.wa}</span><b dir="ltr">+92 306 6422442</b></a>`, 'end') + '</main>'
  const at5 = ['solutions', 'services', 'products', 'approach', 'company']
  const put = (k, title, desc, m, extra = []) => { mkdirSync(`${dir}${k}`, { recursive: true }); writeFileSync(`${dir}${k}/index.html`, page(l, `${k}/`, t.seo.ti[at5.indexOf(k) + 1], desc, open + m + close, { d3: true, here: k, img: `${l}-${k}.jpg`, extra })) }
  const two = `<section class="light solid"><div class="wrap two">${t.two.map(x => `<div><h2>${x[0]}</h2><p>${x[1]}</p></div>`).join('')}</div></section>\n`
  const hero = (form, h, d, go, label) => `<section class="hero" data-form="${form}" data-side="1"><div class="wrap"><div class="h-text"><h1>${h}</h1><p>${d}</p><div class="row"><a class="btn" href="${mail('Project enquiry')}" data-lead="">${t.start}</a><a class="link" href="${go}">${label}</a></div></div></div></section>\n`
  // Home
  let m = `<section class="hero" data-form="logo" data-side="1"><div class="wrap"><img class="flat" src="/brand/alx-mark.svg" alt="" width="1452" height="665"><h1>${t.h1}</h1><p>${t.hero}</p><div class="row"><a class="btn" href="${mail('Project enquiry')}" data-lead="">${t.start}</a><a class="link" href="${r}solutions/">${t.disc}</a></div></div></section>\n`
  t.story.forEach((s, i) => { m += scene('', ['build', 'own', 'innovate'][i], i === 1 ? -1 : 1, `<div class="say-big"><h2>${s[0]}</h2><p>${s[1]}</p></div>`) })
  m += `<section class="dark solid ways"><div class="wrap"><ul>${[['solutions', t.solP], ['services', t.two[1][1]], ['products', t.prP], ['approach', t.apH], ['company', fo.ch]].map(([k, d], i) => `<li><a href="${r}${k}/"><b>${t.nav[['solutions', 'services', 'products', 'approach', 'company'].indexOf(k)]}</b><span>${d}</span></a></li>`).join('')}</ul></div></section>\n`
  writeFileSync(dir + 'index.html', page(l, '', t.seo.ti[0], t.desc, open + m + close, { home: true, d3: true, img: `${l}-home.jpg` }))
  // Solutions
  put('solutions', t.nav[0], t.seo.de[0], hero('onprem', t.solH, t.two[0][1], '#solutions', t.more) + scene('solutions', 'desk', 1.3, `<div class="panel wide"><h2>${t.solP}</h2><fieldset class="sols"><legend class="vh">${t.nav[0]}</legend>${t.sol.map((s, i) => `<label class="sol"${i ? '' : ' data-pin'}><input type="radio" name="sol" value="${i}" data-m="${mail(T.en.sol[i][1])}" data-u="${r}solutions/${SLUGS[i]}/"${i ? '' : ' checked'}><span><svg viewBox="0 0 32 32" aria-hidden="true">${ICON[i]}</svg><em>${s[0]}</em><b>${s[1]}</b></span></label>`).join('')}</fieldset><div class="sol-go"><a id="sol-read" class="link" href="${r}solutions/${SLUGS[0]}/">${UI[l].read}</a><a id="sol-ask" class="btn" data-lead="sol" href="${mail(T.en.sol[0][1])}">${t.solAsk}</a></div></div>`) + two)
  // Services
  put('services', t.nav[1], t.seo.de[1], hero('innovate', t.seo.sv, t.coP, '#services', t.more) + `<section id="services" class="dark solid"><div class="wrap"><div class="services">${t.svc.map(x => `<div><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join('')}</div></div></section>\n` + two, t.svc.map(x => ({ '@type': 'Service', name: x[0], description: x[1], provider: { '@id': H + '/#org' } })))
  // Products
  put('products', t.nav[2], t.prP, hero('marks', t.prH, t.prP, '#nova-bots', t.more) + P.map((k, i) => scene(k, ['bots', 'nova', 'loco', 'storeloom'][i], i % 2 ? 1 : -1, `<div class="panel"><h2 class="p-name"><img src="/brand/${k}-mark.svg" alt="" width="54" height="54"><span dir="ltr">${N[k]}</span></h2><p>${t.p[k]}</p>${demo(k, t)}<div class="row"><a class="btn" href="${mail(N[k] + ' private demo request')}" data-lead="${N[k]} private demo">${t.demo}</a><a class="link" href="${r}products/${k}.html">${t.tale}</a></div></div>`)).join(''))
  // Approach
  put('approach', t.nav[3], `${t.story[0][1]} ${t.infP}`, hero('build', t.apH, t.story[0][1], '#approach', t.more) + `<section id="approach" class="dark solid"><div class="wrap"><ol class="steps">${t.ap.map(x => `<li><b>${x[0]}</b>${x[1]}</li>`).join('')}</ol></div></section>\n` + scene('infrastructure', 'onprem', -1, `<div class="panel"><h2>${t.infH}</h2><p>${t.infP}</p><fieldset class="seg"><legend class="vh">${t.infP}</legend>${['cloud', 'onprem', 'airgap'].map(k => `<label><input type="radio" name="deploy" value="${k}"${k === 'onprem' ? ' checked' : ''}><span>${t.inf[k][0]}</span></label>`).join('')}</fieldset><p id="deploy-out" class="out" aria-live="polite">${t.inf.onprem[1]}</p></div>`))
  // Company
  put('company', t.nav[4], `${t.coP} ${t.ft}`, hero('own', t.coH, t.coP, '#founder', t.more) + scene('founder', 'marks', 1, `<div class="f-col"><h2>${fo.h}</h2><p class="f-lead">${fo.i}</p><ul class="f-q">${fo.q.map(x => `<li>${x}</li>`).join('')}</ul><p>${fo.t}</p><h3>${fo.fh}</h3><ul class="f-p">${ORDER.map((k, i) => `<li data-mark="${i}"><a href="${r}products/${k}.html"><img src="/brand/${k}-mark.svg" alt="" width="40" height="40"><span><b dir="ltr">${N[k]}</b> ${fo.f[i]}</span></a></li>`).join('')}</ul><h3 data-mark="4">${fo.ch}</h3>${fo.c.map(x => `<p>${x}</p>`).join('')}<p><a class="link" href="https://github.com/Ali-Labs-X">${fo.rev}</a></p><p class="f-end">${fo.e} <b>${fo.tell}</b></p><div class="row"><a class="btn" href="${mail('Discovery')}" data-lead="Founder story">${t.lead.open}</a></div><div class="f-sign"><b>${fo.name}</b><span>${fo.role}</span></div></div>`, 'founder') + `<section id="team" class="dark solid"><div class="wrap"><h2>${fo.th}</h2><p class="lead">${fo.tp}</p><ul class="team">${fo.team.map(x => `<li><b>${x[0]}</b><span>${x[1]}</span><p>${x[2]}</p></li>`).join('')}</ul></div></section>\n<section id="company" class="light solid"><div class="wrap company"><div><h2 dir="ltr">ALI LABS X</h2><p class="lead">${t.desc.replace(/^ALI LABS X\s*/, 'ALI LABS X ')}</p></div><dl><div><dt>${t.dl[0]}</dt><dd dir="ltr">ALI LABS X (PRIVATE) LIMITED</dd></div><div><dt>${t.dl[1]}</dt><dd>${t.dv[0]}</dd></div><div><dt>${t.dl[2]}</dt><dd><a href="https://leap.secp.gov.pk/#/verify-company-info/0366968">0366968</a></dd></div><div><dt>${t.dl[3]}</dt><dd>${t.dv[1]}</dd></div><div><dt>${t.dl[4]}</dt><dd>${t.dv[2]}</dd></div><div><dt>${t.em}</dt><dd><a dir="ltr" href="mailto:Jahanzaib@alilabsx.com">Jahanzaib@alilabsx.com</a></dd></div><div><dt>WhatsApp</dt><dd><a dir="ltr" href="${WA(t)}" target="_blank" rel="noopener">+92 306 6422442</a></dd></div></dl></div></section>\n`)
  P.forEach((k, i) => {
    const s = t.st[k], nx = P[(i + 1) % 4], title = t.pt.replace('{n}', N[k])
    writeFileSync(`${dir}products/${k}.html`, page(l, `products/${k}.html`, title, `${s[0]} ${t.p[k]}`, `<canvas id="world" aria-hidden="true"></canvas>
<main id="main"><article class="wrap story-page" data-product="${['bots', 'nova', 'loco', 'storeloom'][i]}"><div class="story-col">
<section class="story-top" data-form="${['bots', 'nova', 'loco', 'storeloom'][i]}" data-side="1"><img src="/brand/${k}-mark.svg" alt="" width="256" height="256"><h1 dir="ltr">${N[k]}</h1><p>${s[0]}</p></section>
${[0, 1, 2].map(n => `<section class="chapter" data-ch="${n}"><h2>${t.ch[n]}</h2><p>${s[n + 1]}</p></section>`).join('\n')}
<section class="chapter" data-ch="3"><h2>${t.ch[3]}</h2><ul>${s[4].map(x => `<li>${x}</li>`).join('')}</ul>${CODE[k] ? `<p><a class="link" href="${CODE[k]}">${t.src}</a></p>` : ''}</section>
<div class="next"><a class="btn" href="${mail(N[k] + ' private demo request')}" data-lead="${N[k]} private demo">${t.demo}</a><a class="link" href="${r}products/${nx}.html">${t.next.replace('{n}', N[nx])}</a></div></div></article></main>`, { d3: true, here: 'products', img: `${l}-${k}.jpg`, extra: CODE[k] ? [{ '@type': 'SoftwareSourceCode', name: N[k], description: t.p[k], codeRepository: CODE[k], author: { '@id': H + '/#org' } }] : [] }))
  })
  // One page for each problem
  SLUGS.forEach((k, i) => {
    const s = SOL[l][i], u = UI[l], path = `solutions/${k}/`, rel = [1, 5, 9].map(n => (i + n) % 14)
    mkdirSync(dir + path, { recursive: true })
    writeFileSync(`${dir}${path}index.html`, page(l, path, `${s[0]}${l === 'zh' ? '，' : l === 'en' ? ', ' : '، '}ALI LABS X`, `${s[0]}${t.dir === 'rtl' && l === 'ur' ? '۔' : l === 'zh' ? '。' : '.'} ${s[3]}`, `<canvas id="world" aria-hidden="true"></canvas>
<main id="main"><article class="wrap story-page" data-product="desk" data-screen="${i}"><div class="story-col">
<section class="story-top sol-top" data-form="desk" data-side="1"><p class="back"><a href="${r}solutions/">${t.nav[0]}</a></p><h1>${s[0]}</h1><p>${t.sol[i][0]}${l === 'zh' || l === 'ur' ? '。'.replace('。', l === 'ur' ? '۔' : '。') : '.'}</p><div class="row"><a class="btn" href="${mail(T.en.sol[i][1])}" data-lead="sol" data-sol="${i}">${t.solAsk}</a></div></section>
<section class="chapter" data-ch="0"><h2>${u.h[0]}</h2><p>${s[1]}</p></section>
<section class="chapter" data-ch="1"><h2>${u.h[1]}</h2><ul>${s[2].map(x => `<li>${x}</li>`).join('')}</ul></section>
<section class="chapter" data-ch="2"><h2>${u.h[2]}</h2><p>${s[3]}</p></section>
<section class="chapter" data-ch="3"><h2>${u.h[3]}</h2>${['cloud', 'onprem', 'airgap'].map(x => `<h3>${t.inf[x][0]}</h3><p>${t.inf[x][1]}</p>`).join('')}</section>
<section class="chapter" data-ch="4"><h2>${u.rel}</h2><ul class="rel">${rel.map(n => `<li><a href="${r}solutions/${SLUGS[n]}/">${t.sol[n][0]}</a></li>`).join('')}</ul></section>
<div class="next"><a class="btn" href="${mail(T.en.sol[i][1])}" data-lead="sol" data-sol="${i}">${t.solAsk}</a><a class="link" href="${WA(t)}" target="_blank" rel="noopener">${t.wa}</a></div></div></article></main>`, { d3: true, here: 'solutions', img: `${l}-${k}.jpg`, crumb: [[t.nav[0], H + r + 'solutions/']], extra: [{ '@type': 'Service', name: s[0], description: s[3], serviceType: t.sol[i][1], provider: { '@id': H + '/#org' } }] }))
  })
}
// Company pages, English only
const INFO = { enterprise: ['Enterprise software partner, agreements and security, ALI LABS X', 'How ALI LABS X works with enterprise teams, including agreements, security review, deployment choices and supplier details.'], careers: ['Careers at ALI LABS X', 'Open roles at ALI LABS X and how to introduce yourself to the engineering team.'], contact: ['Contact ALI LABS X', 'Reach ALI LABS X by discovery form, WhatsApp or email to discuss software, private AI and infrastructure.'], security: ['Security at ALI LABS X', 'How this website and your enquiry are protected, and how to report a security concern to ALI LABS X.'], cookies: ['Cookies, ALI LABS X', 'This website sets no cookies. See what is kept in your browser and which services deliver the site.'] }
for (const k in INFO) { mkdirSync(k, { recursive: true }); writeFileSync(`${k}/index.html`, page('en', `${k}/`, ...INFO[k], `<main id="main">${readFileSync(`content/${k}.part.html`, 'utf8')}</main>`, { alt: false })) }
// Articles, English only
const body = b => b.map(([k, v]) => k === 'l' ? `<ul>${v.map(x => `<li>${x}</li>`).join('')}</ul>` : k === 'h' ? `<h2>${v}</h2>` : `<p>${v}</p>`).join('\n'), E0 = T.en
const long = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const WORK = { loco: ['LOCO', '/products/loco.html'], nova: ['NOVA', '/products/nova.html'], 'nova-bots': ['NOVA BOTS', '/products/nova-bots.html'] }
const ask = `<aside class="ask"><h2>Working on this now?</h2><p>Tell us what is happening. We read every brief ourselves and reply with questions or a first view.</p><div class="row"><a class="btn" href="${mail('Project enquiry')}" data-lead="Insight">${E0.lead.open}</a><a class="link" href="${WA(E0)}" target="_blank" rel="noopener">${E0.wa}</a></div></aside>`
mkdirSync('insights', { recursive: true })
writeFileSync('insights/index.html', page('en', 'insights/', 'Insights on owning software and private AI, ALI LABS X', 'Practical guides on software cost, build or buy, private AI, security, hosting and ownership, written by the engineers at ALI LABS X.', `<main id="main"><div class="wrap insights"><h1>Insights</h1><p class="lead">Practical answers to the questions people ask before they commit to a system.</p><ul class="posts">${INS.map(a => `<li><a href="/insights/${a.slug}/"><h2>${a.title}</h2><p>${a.desc}</p></a></li>`).join('')}</ul></div></main>`, { alt: false, here: 'insights' }))
INS.forEach((a, i) => {
  const path = `insights/${a.slug}/`, more = [1, 4, 7].map(n => INS[(i + n) % INS.length]), w = WORK[a.work]
  mkdirSync(path, { recursive: true })
  writeFileSync(path + 'index.html', page('en', path, a.title, a.desc, `<main id="main"><article class="wrap post"><p class="back"><a href="/insights/">Insights</a></p><h1>${a.title}</h1><p class="by">ALI LABS X engineering, <time datetime="${a.date}">${long(a.date)}</time></p>
${body(a.body)}
${w ? `<p class="from">This comes from our own work on <a href="${w[1]}">${w[0]}</a>.</p>` : ''}
${ask}
<nav class="also" aria-label="Related"><h2>Related problems</h2><ul>${a.sol.map(n => `<li><a href="/solutions/${SLUGS[n]}/">${E0.sol[n][0]}</a></li>`).join('')}</ul><h2>Read next</h2><ul>${more.map(x => `<li><a href="/insights/${x.slug}/">${x.title}</a></li>`).join('')}</ul></nav></article></main>`, { alt: false, here: 'insights', img: `en-${a.slug}.jpg`, crumb: [['Insights', H + '/insights/']], extra: [{ '@type': 'BlogPosting', headline: a.title, description: a.desc, datePublished: a.date, dateModified: a.date, inLanguage: 'en', image: `${H}/og/en-${a.slug}.jpg`, author: { '@id': H + '/#org' }, publisher: { '@id': H + '/#org' }, mainEntityOfPage: H + '/' + path }] }))
})
writeFileSync('public/feed.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>ALI LABS X Insights</title><link>${H}/insights/</link><description>Guides on owning software and private AI</description><language>en</language>${INS.map(a => `<item><title>${esc(a.title)}</title><link>${H}/insights/${a.slug}/</link><guid>${H}/insights/${a.slug}/</guid><pubDate>${new Date(a.date).toUTCString()}</pubDate><description>${esc(a.desc)}</description></item>`).join('')}</channel></rss>\n`)
for (const [f, title] of [['privacy', 'Privacy policy'], ['terms', 'Terms of use'], ['404', 'Page not found']])
  writeFileSync(f + '.html', page('en', f + '.html', `${title}, ALI LABS X`, `${title} of ALI LABS X.`, `<main id="main">${readFileSync(`content/${f}.part.html`, 'utf8')}</main>`, { alt: false, noindex: f === '404' }))
const KEYS = ['', 'solutions/', 'services/', 'products/', 'approach/', 'company/', ...P.map(k => `products/${k}.html`), ...SLUGS.map(k => `solutions/${k}/`)], DAY = new Date().toISOString().slice(0, 10)
const last = f => { try { return execSync(`git log -1 --format=%cs -- "${f}"`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || DAY } catch { return DAY } }, fileOf = u => (u.replace(/^\//, '') + (u.endsWith('/') ? 'index.html' : ''))
const alts = p => L.map(x => `<xhtml:link rel="alternate" hreflang="${x === 'zh' ? 'zh-Hans' : x}" href="${H}${root(x)}${p}"/>`).join('') + `<xhtml:link rel="alternate" hreflang="x-default" href="${H}/${p}"/>`
writeFileSync('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${L.flatMap(l => KEYS.map(p => `  <url><loc>${H}${root(l)}${p}</loc><lastmod>${last(fileOf(root(l) + p))}</lastmod>${alts(p)}</url>`)).concat([...Object.keys(INFO).map(k => k + '/'), 'insights/', ...INS.map(a => `insights/${a.slug}/`), 'privacy.html', 'terms.html'].map(p => `  <url><loc>${H}/${p}</loc><lastmod>${last(fileOf('/' + p))}</lastmod></url>`)).join('\n')}\n</urlset>\n`)
// For AI assistants and other automated readers
const E = T.en, NAV = ['solutions', 'services', 'products', 'approach', 'company']
const agents = `# ALI LABS X

> ${E.desc}

ALI LABS X (PRIVATE) LIMITED is registered with the Securities and Exchange Commission of Pakistan, number 0366968, incorporated 18 November 2026, located in Lahore, Pakistan.

## Pages

${NAV.map((k, i) => `- [${E.nav[i]}](${H}/${k}/): ${[E.solP, E.two[1][1], E.prP, E.apH, E.founder.ch][i]}`).join('\n')}

## Products

Demonstrations are private and by request.

${P.map(k => `- [${N[k]}](${H}/products/${k}.html): ${E.p[k]}`).join('\n')}

## Services

${E.svc.map(x => `- ${x[0]}: ${x[1]}`).join('\n')}

## Problems we solve

${E.sol.map((x, i) => `- [${x[1]}](${H}/solutions/${SLUGS[i]}/): ${x[0]}`).join('\n')}

## Insights

${INS.map(a => `- [${a.title}](${H}/insights/${a.slug}/): ${a.desc}`).join('\n')}

## Contact

- Email: Jahanzaib@alilabsx.com
- WhatsApp: +92 306 6422442
- Discovery form: the "${E.lead.open}" button on any page

Prices are not published. Please do not submit the form on behalf of a person without their request.

## Languages

${L.map(l => `- [${T[l].name}](${H}${root(l)})`).join('\n')}

## Policies

- [Privacy](${H}/privacy.html)
- [Terms](${H}/terms.html)
`
for (const f of ['llms.txt', 'agents.txt']) writeFileSync('public/' + f, agents)
