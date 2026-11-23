// Discovery form. Briefs go to the lead engine through the console; if it does not answer, the visitor's email app is used.
import bundled from './form.json'
type T = Record<string, any>
type Lang = 'en' | 'ar' | 'ur' | 'zh'
type Opt = { id: string; label: Record<Lang, string> }
type Form = { version: number; steps: { title: Record<Lang, string>; hint: Record<Lang, string> }[]; questions: Record<string, Record<Lang, string>> } & Record<'problems' | 'impacts' | 'sizes' | 'places' | 'routes' | 'timing' | 'budgets' | 'roles', Opt[]>
const L: T = JSON.parse(document.getElementById('lead-text')?.textContent ?? '{}')
const lang = (document.documentElement.lang.slice(0, 2) as Lang) in { en: 1, ar: 1, ur: 1, zh: 1 } ? (document.documentElement.lang.slice(0, 2) as Lang) : 'en'
const API = (import.meta.env.VITE_LEAD_API as string | undefined) ?? 'https://novaops.alilabsx.com/api/public'
let form0 = bundled as unknown as Form, key = '', opened = 0
const valid = (f: any): f is Form => Array.isArray(f?.steps) && f.steps.length === 5 && ['problems', 'impacts', 'sizes', 'places', 'routes', 'timing', 'budgets', 'roles'].every(g => Array.isArray(f[g]) && f[g].length > 1 && f[g].every((o: any) => typeof o?.id === 'string' && typeof o?.label?.[lang] === 'string')) && typeof f.questions?.story?.[lang] === 'string'
// The live form is used when it answers quickly; otherwise the copy shipped with the site.
const ready = fetch(`${API}/form`, { signal: AbortSignal.timeout(2500) }).then(r => r.json()).then(f => { if (valid(f)) form0 = f }).catch(() => {})
const t = (l: Record<Lang, string>) => l[lang] || l.en, Q = (k: string) => t(form0.questions[k])
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
let box: HTMLDialogElement | null = null, step = 0, ctx = '', from: HTMLElement | null = null

const chips = (n: string, o: Opt[], multi = false) => `<div class="ch">${o.map(x => `<label><input type="${multi ? 'checkbox' : 'radio'}" name="${n}" value="${esc(x.id)}"><span>${esc(t(x.label))}</span></label>`).join('')}</div>`
const q = (i: string, n: string, body: string) => `<div class="q" data-need="${n}" role="group" aria-labelledby="q-${n}"><span id="q-${n}">${esc(Q(i))}</span>${body}</div>`
const inp = (i: string, n: string, type: string, auto: string) => `<div class="q" data-need="${n}"><label for="l-${n}">${esc(Q(i))}</label><input id="l-${n}" type="${type}" name="${n}" autocomplete="${auto}" maxlength="120"${type === 'email' ? ' dir="ltr"' : ''}></div>`
const STEPS = () => [
  `<div class="q" data-need="problem" role="group" aria-label="${esc(t(form0.steps[0].title))}">${chips('problem', form0.problems)}</div>`,
  `<div class="q" data-need="story"><label for="l-story">${esc(Q('story'))}</label><textarea id="l-story" name="story" maxlength="900"></textarea></div>${q('impacts', 'impacts', chips('impacts', form0.impacts, true))}`,
  q('sizes', 'size', chips('size', form0.sizes)) + q('places', 'place', chips('place', form0.places)) + q('routes', 'route', chips('route', form0.routes)),
  q('timing', 'timing', chips('timing', form0.timing)) + q('budgets', 'budget', chips('budget', form0.budgets)) + q('roles', 'role', chips('role', form0.roles)),
  `<div class="two-col">${inp('name', 'name', 'text', 'name')}${inp('email', 'email', 'email', 'email')}${inp('company', 'company', 'text', 'organization')}${inp('country', 'country', 'text', 'country-name')}</div><div class="q" data-need="consent"><label class="ok-line"><input type="checkbox" name="consent"><span>${esc(Q('consent'))} <a href="/privacy.html" target="_blank" rel="noopener">${document.querySelector('footer nav a')?.textContent ?? ''}</a></span></label></div><input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:0;width:1px;height:1px;opacity:0;padding:0;border:0">`,
]
function make() {
  box = document.createElement('dialog'); box.className = 'lead-box'; box.setAttribute('aria-labelledby', 'lead-t0')
  box.innerHTML = `<form method="dialog" novalidate><div class="lead-top"><p class="where" aria-live="polite"></p><button type="button" class="lead-x">${esc(L.close)}</button></div><div class="lead-bar"><i></i></div>${STEPS().map((b, i) => `<fieldset data-step="${i}"><legend id="lead-t${i}" tabindex="-1">${esc(t(form0.steps[i].title))}</legend><p class="hint">${esc(t(form0.steps[i].hint))}</p>${b}</fieldset>`).join('')}<p class="err" role="alert"></p><div class="lead-nav"><button type="button" class="back">${esc(L.back)}</button><button type="submit" class="btn"></button></div></form>`
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
function brief(d: FormData) {
  const s = (k: string) => String(d.get(k) ?? '').trim(), en = (g: 'problems' | 'sizes' | 'places' | 'routes' | 'timing' | 'budgets' | 'roles', k: string) => form0[g].find(o => o.id === s(k))?.label.en ?? ''
  const rows: [string, string][] = [['Request', ctx || 'Discovery'], ['Problem', en('problems', 'problem')], ['In their words', s('story')], ['Affects', d.getAll('impacts').map(i => form0.impacts.find(o => o.id === i)?.label.en).join(', ')], ['Users', en('sizes', 'size')], ['Runs at', en('places', 'place')], ['Route', en('routes', 'route')], ['Needed', en('timing', 'timing')], ['Budget', en('budgets', 'budget')], ['Role', en('roles', 'role')], ['Name', s('name')], ['Email', s('email')], ['Company', s('company')], ['Country', s('country')], ['Language', L.name]]
  return rows.map(r => `${r[0]}\n${r[1]}`).join('\n\n')
}
async function finish() {
  const d = data(), s = (k: string) => String(d.get(k) ?? '').trim(), btn = box!.querySelector<HTMLButtonElement>('.lead-nav .btn')!, text = brief(d)
  const payload = { idempotencyKey: key, formVersion: form0.version, language: lang, request: ctx.slice(0, 80), problem: s('problem'), story: s('story'), impacts: d.getAll('impacts').map(String), size: s('size'), place: s('place'), route: s('route'), timing: s('timing'), budget: s('budget'), role: s('role'), name: s('name'), email: s('email'), company: s('company'), country: s('country'), consent: true, elapsedMs: Math.round(performance.now() - opened), website: s('website') }
  btn.disabled = true; let ref = ''
  try { const r = await fetch(`${API}/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(12000) }); if (r.ok) ref = String((await r.json()).reference ?? '') } catch { /* offered by email below */ }
  btn.disabled = false
  const href = `mailto:Jahanzaib@alilabsx.com?subject=${encodeURIComponent('Discovery brief, ' + s('company'))}&body=${encodeURIComponent(text)}`
  const v = document.createElement('div'); v.className = 'lead-done'
  v.innerHTML = `<h2 tabindex="-1">${esc(ref ? L.sent : L.done)}</h2><p>${esc(ref ? L.sentP : L.fail)}</p>${ref ? `<p class="ref" dir="ltr">${esc(ref.replace(/-[ABC]\d+-/, '-'))}</p>` : ''}`
  if (!ref) { const p = document.createElement('pre'); p.dir = 'ltr'; p.textContent = text; const r = document.createElement('div'); r.className = 'row'; r.innerHTML = `<a class="btn" href="${esc(href)}">${esc(L.mail)}</a><button type="button" class="lead-x copy">${esc(L.copy)}</button>`; v.append(p, r); r.querySelector('.copy')!.addEventListener('click', async e => { const c = e.currentTarget as HTMLElement; try { await navigator.clipboard.writeText(text); c.textContent = L.copied } catch { getSelection()?.selectAllChildren(p) } }) }
  const f = form(); f.querySelectorAll('fieldset,.lead-nav,.err,.lead-bar').forEach(e => e.remove()); f.querySelector('.where')!.textContent = ''; f.append(v); v.querySelector<HTMLElement>('h2')!.focus()
}
export async function openLead(context: string, solution: number | null, opener: HTMLElement) {
  await Promise.race([ready, new Promise(r => setTimeout(r, 900))])
  if (!box || box.querySelector('.lead-done')) { box?.remove(); make(); key = crypto.randomUUID(); opened = performance.now() }
  ctx = context; from = opener; step = 0
  if (solution !== null) { const i = box!.querySelector<HTMLInputElement>(`[name=problem][value="${bundled.problems[solution]?.id}"]`); if (i) { i.checked = true; step = 1 } }
  document.documentElement.style.overflow = 'hidden'; box!.showModal(); draw()
}
