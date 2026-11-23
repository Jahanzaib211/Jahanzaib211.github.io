// Discovery form. Set VITE_LEAD_ENDPOINT to a form endpoint to receive briefs directly; otherwise the visitor's email app is used.
type T = Record<string, any>
const L: T = JSON.parse(document.getElementById('lead-text')?.textContent ?? '{}'), E: T = L.en
const END = import.meta.env.VITE_LEAD_ENDPOINT as string | undefined
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const FREE = /@(gmail|yahoo|hotmail|outlook|live|icloud|proton|aol|mail|qq|163|126)\./i
let box: HTMLDialogElement | null = null, step = 0, ctx = '', from: HTMLElement | null = null

const chips = (n: string, o: string[], multi = false) => `<div class="ch">${o.map((x, i) => `<label><input type="${multi ? 'checkbox' : 'radio'}" name="${n}" value="${i}"><span>${esc(x)}</span></label>`).join('')}</div>`
const q = (i: number, n: string, body: string) => `<div class="q" data-need="${n}" role="group" aria-labelledby="q-${n}"><span id="q-${n}">${esc(L.q[i])}</span>${body}</div>`
const inp = (i: number, n: string, type: string, auto: string) => `<div class="q" data-need="${n}"><label for="l-${n}">${esc(L.q[i])}</label><input id="l-${n}" type="${type}" name="${n}" autocomplete="${auto}" maxlength="120"${type === 'email' ? ' dir="ltr"' : ''}></div>`
const STEPS = () => [
  `<div class="q" data-need="sol" role="group" aria-label="${esc(L.t[0])}">${chips('sol', [...L.sol, L.other])}</div>`,
  `<div class="q" data-need="story"><label for="l-story">${esc(L.q[0])}</label><textarea id="l-story" name="story" maxlength="900"></textarea></div>${q(1, 'imp', chips('imp', L.imp, true))}`,
  q(2, 'size', chips('size', L.size)) + q(3, 'run', chips('run', L.run)) + q(4, 'route', chips('route', L.route)),
  q(5, 'when', chips('when', L.when)) + q(6, 'money', chips('money', L.money)) + q(7, 'role', chips('role', L.role)),
  `<div class="two-col">${inp(8, 'name', 'text', 'name')}${inp(9, 'email', 'email', 'email')}${inp(10, 'company', 'text', 'organization')}${inp(11, 'country', 'text', 'country-name')}</div><div class="q" data-need="ok"><label class="ok-line"><input type="checkbox" name="ok"><span>${esc(L.q[12])} <a href="/privacy.html" target="_blank" rel="noopener">${document.querySelector('footer nav a')?.textContent ?? ''}</a></span></label></div><input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:0;width:1px;height:1px;opacity:0;padding:0;border:0">`,
]
function make() {
  box = document.createElement('dialog'); box.className = 'lead-box'; box.setAttribute('aria-labelledby', 'lead-t0')
  box.innerHTML = `<form method="dialog" novalidate><div class="lead-top"><p class="where" aria-live="polite"></p><button type="button" class="lead-x">${esc(L.close)}</button></div><div class="lead-bar"><i></i></div>${STEPS().map((b, i) => `<fieldset data-step="${i}"><legend id="lead-t${i}" tabindex="-1">${esc(L.t[i])}</legend><p class="hint">${esc(L.h[i])}</p>${b}</fieldset>`).join('')}<p class="err" role="alert"></p><div class="lead-nav"><button type="button" class="back">${esc(L.back)}</button><button type="submit" class="btn"></button></div></form>`
  document.body.append(box)
  const f = box.querySelector('form')!
  box.querySelector('.lead-x')!.addEventListener('click', () => box!.close())
  box.querySelector('.back')!.addEventListener('click', () => { step--; draw() })
  box.addEventListener('close', () => { document.documentElement.style.overflow = ''; from?.focus() })
  f.addEventListener('submit', e => { e.preventDefault(); if (!check()) return; if (step < 4) { step++; draw() } else void finish() })
}
const form = () => box!.querySelector('form')!, data = () => new FormData(form())
function draw() {
  box!.querySelectorAll<HTMLElement>('fieldset').forEach((s, i) => { s.hidden = i !== step })
  box!.querySelector('.where')!.textContent = L.step.replace('{a}', step + 1).replace('{b}', 5)
  box!.querySelector<HTMLElement>('.lead-bar i')!.style.width = `${(step + 1) * 20}%`
  box!.querySelector<HTMLElement>('.back')!.style.visibility = step ? 'visible' : 'hidden'
  box!.querySelector('.lead-nav .btn')!.textContent = step < 4 ? L.next : L.send; box!.querySelector('.err')!.textContent = ''
  box!.setAttribute('aria-labelledby', `lead-t${step}`); box!.scrollTop = 0; box!.querySelector<HTMLElement>(`#lead-t${step}`)!.focus({ preventScroll: true })
}
function check() {
  const d = data(), err = box!.querySelector('.err')!
  for (const el of box!.querySelectorAll<HTMLElement>(`fieldset[data-step="${step}"] [data-need]`)) {
    const n = el.dataset.need!, v = String(d.get(n) ?? '').trim(), bad = !v || (n === 'story' && v.length < 12), mail = n === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
    if (bad || mail) { const name = el.querySelector('span[id],label')?.textContent?.trim(); err.textContent = `${mail && v ? L.mailErr : L.need} ${step ? name ?? '' : ''}`; const i = el.querySelector<HTMLElement>('input,textarea')!; i.focus(); el.scrollIntoView({ block: 'nearest' }); return false }
  }
  return true
}
// Fit is worked out for the team's reply order. It never blocks a visitor.
function score(d: FormData) {
  const n = (k: string) => Number(d.get(k)); let s = [0, 14, 24, 30, 5][n('money')] + [22, 18, 10, 2][n('when')] + [20, 13, 4][n('role')] + [5, 9, 12, 14][n('size')]
  s += Math.min(6, d.getAll('imp').length * 2) + (FREE.test(String(d.get('email'))) ? 0 : 5) + (String(d.get('story')).trim().length > 80 ? 3 : 0); return s
}
function brief(d: FormData) {
  const g = (k: string, o: string[]) => o[Number(d.get(k))] ?? '', t = (k: string) => String(d.get(k) ?? '').trim(), s = score(d), tier = s >= 68 ? 'A' : s >= 42 ? 'B' : 'C'
  const ref = `ALX ${tier}${s} ${Date.now().toString(36).slice(-5).toUpperCase()}`
  const rows: [string, string][] = [['Reference', ref], ['Request', ctx || 'Discovery'], ['Problem', g('sol', [...E.sol, E.other])], ['In their words', t('story')], ['Affects', d.getAll('imp').map(i => E.imp[Number(i)]).join(', ')], ['Users', g('size', E.size)], ['Runs at', g('run', E.run)], ['Route', g('route', E.route)], ['Needed', g('when', E.when)], ['Budget', g('money', E.money)], ['Role', g('role', E.role)], ['Name', t('name')], ['Email', t('email')], ['Company', t('company')], ['Country', t('country')], ['Language', L.name]]
  return { ref, rows, text: rows.map(r => `${r[0]}\n${r[1]}`).join('\n\n') }
}
async function finish() {
  const d = data(); if (d.get('website')) { box!.close(); return }
  const b = brief(d), href = `mailto:Jahanzaib@alilabsx.com?subject=${encodeURIComponent(`Discovery brief ${b.ref}`)}&body=${encodeURIComponent(b.text)}`
  let sent = false, failed = false; const btn = box!.querySelector<HTMLButtonElement>('.lead-nav .btn')!
  if (END) { btn.disabled = true; try { const r = await fetch(END, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ ...Object.fromEntries(b.rows), _replyto: String(d.get('email')), _subject: `Discovery brief ${b.ref}` }), signal: AbortSignal.timeout(15000) }); sent = r.ok } catch { /* shown below */ } failed = !sent; btn.disabled = false }
  const v = document.createElement('div'); v.className = 'lead-done'
  v.innerHTML = `<h2 tabindex="-1">${esc(sent ? L.sent : L.done)}</h2><p>${esc(sent ? L.sentP : failed ? L.fail : L.doneP)}</p>`
  if (!sent) { const p = document.createElement('pre'); p.dir = 'ltr'; p.textContent = b.text; const r = document.createElement('div'); r.className = 'row'; r.innerHTML = `<a class="btn" href="${esc(href)}">${esc(L.mail)}</a><button type="button" class="lead-x copy">${esc(L.copy)}</button>`; v.append(p, r); r.querySelector('.copy')!.addEventListener('click', async e => { const c = e.currentTarget as HTMLElement; try { await navigator.clipboard.writeText(b.text); c.textContent = L.copied } catch { getSelection()?.selectAllChildren(p) } }) }
  const f = form(); f.querySelectorAll('fieldset,.lead-nav,.err,.lead-bar').forEach(e => e.remove()); f.querySelector('.where')!.textContent = ''; f.append(v); v.querySelector<HTMLElement>('h2')!.focus()
  if (!sent && !failed) location.href = href
}
export function openLead(context: string, solution: number | null, opener: HTMLElement) {
  if (!box || box.querySelector('.lead-done')) { box?.remove(); make() }
  ctx = context; from = opener; step = 0
  if (solution !== null) { const i = box!.querySelector<HTMLInputElement>(`[name=sol][value="${solution}"]`); if (i) { i.checked = true; step = 1 } }
  document.documentElement.style.overflow = 'hidden'; box!.showModal(); draw()
}
