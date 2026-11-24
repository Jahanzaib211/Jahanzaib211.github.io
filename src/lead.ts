// Discovery form. Briefs go to the lead engine through the console; if it does not answer, the visitor's email app is used.
import bundled from './form.json'
import { toast, clearToasts } from './toast'
import { formOpened } from './assist'
import { track } from './consent'
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
  `<div class="two-col">${inp('name', 'name', 'text', 'name')}${inp('email', 'email', 'email', 'email')}${inp('company', 'company', 'text', 'organization')}${inp('country', 'country', 'text', 'country-name')}</div><div class="q" data-need="consent"><label class="ok-line"><input type="checkbox" name="consent"><span>${esc(Q('consent'))} <a href="${document.querySelector<HTMLAnchorElement>('footer a[href$="privacy.html"]')!.pathname}" target="_blank" rel="noopener">${document.querySelector('footer a[href$="privacy.html"]')?.textContent ?? ''}</a></span></label></div><input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:0;width:1px;height:1px;opacity:0;padding:0;border:0">`,
]
const LAST = 5
const g1 = (k: string) => ({ problem: 'problems', size: 'sizes', place: 'places', route: 'routes', timing: 'timing', budget: 'budgets', role: 'roles' } as Record<string, string>)[k] as 'sizes'
const answer = (k: string) => { const d = data(); if (k === 'impacts') return d.getAll(k).map(v => form0.impacts.find(o => o.id === v)).filter(Boolean).map(o => t(o!.label)).join(', '); const v = String(d.get(k) ?? '').trim(); return g1(k) ? t(form0[g1(k)].find(o => o.id === v)?.label ?? ({ en: '', ar: '', ur: '', zh: '' })) : v }
const ROWS: [string, number][] = [['problem', 0], ['story', 1], ['impacts', 1], ['size', 2], ['place', 2], ['route', 2], ['timing', 3], ['budget', 3], ['role', 3], ['name', 4], ['email', 4], ['company', 4], ['country', 4]]
const qKey: Record<string, string> = { size: 'sizes', place: 'places', route: 'routes', budget: 'budgets', role: 'roles' }
const label = (k: string) => (k === 'problem' ? t(form0.steps[0].title) : Q(qKey[k] ?? k))
let far = 0
function make() {
  far = 0; box = document.createElement('dialog'); box.className = 'lead-box'
  const titles = [...form0.steps.map(s => t(s.title)), L.rev]
  box.innerHTML = `<div class="lead-grid"><aside class="lead-side"><img src="/brand/alx-mark.svg" alt="" width="92" height="42"><ol class="lead-steps">${titles.map((x, i) => `<li><button type="button" data-go="${i}"><i aria-hidden="true">${i + 1}</i><span>${esc(x)}</span></button></li>`).join('')}</ol><p class="lead-tip"></p><div class="lead-sum"><b>${esc(L.brief)}</b><ul></ul></div></aside>
<form method="dialog" novalidate><div class="lead-top"><p class="where" aria-live="polite"></p><button type="button" class="lead-x">${esc(L.close)}</button></div><div class="lead-bar"><i></i></div>${STEPS().map((b, i) => `<fieldset data-step="${i}"><legend id="lead-t${i}" tabindex="-1">${esc(titles[i])}</legend><p class="hint">${esc(t(form0.steps[i].hint))}</p>${b}</fieldset>`).join('')}<fieldset data-step="5"><legend id="lead-t5" tabindex="-1">${esc(L.rev)}</legend><p class="hint">${esc(L.revH)}</p><dl class="lead-review"></dl></fieldset><p class="err" role="alert"></p><div class="lead-nav"><button type="button" class="back">${esc(L.back)}</button><button type="submit" class="btn"></button></div></form></div>`
  document.body.append(box)
  const f = box.querySelector('form')!, story = box.querySelector<HTMLTextAreaElement>('#l-story')!
  const meter = document.createElement('div'); meter.className = 'lead-meter'; meter.innerHTML = '<i><b></b></i><span></span>'; story.after(meter)
  const grow = () => { const n = story.value.trim().length, k = n < 40 ? 0 : n < 110 ? 1 : 2; meter.dataset.k = String(k); meter.querySelector<HTMLElement>('b')!.style.width = `${Math.min(100, n / 1.6)}%`; meter.querySelector('span')!.textContent = n ? L.more[k] : '' }
  story.addEventListener('input', grow); grow()
  box.querySelector('.lead-x')!.addEventListener('click', () => box!.close())
  box.querySelector('.back')!.addEventListener('click', () => { step--; draw() })
  box.addEventListener('click', e => { const b = (e.target as HTMLElement).closest<HTMLElement>('[data-go]'); if (b && +b.dataset.go! <= far && !box!.querySelector('.lead-done')) { step = +b.dataset.go!; draw() } })
  // Choosing with a pointer moves on by itself when the step has one question
  let pointer = false; f.addEventListener('pointerdown', () => { pointer = true }); f.addEventListener('keydown', () => { pointer = false })
  f.addEventListener('change', e => {
    const i = e.target as HTMLInputElement, need = i.closest<HTMLElement>('[data-need]'); need?.classList.remove('bad'); box!.querySelector('.err')!.textContent = ''; summary()
    if (i.name === 'problem' && pointer && step === 0) setTimeout(() => { if (step === 0 && box!.open) advance() }, 260)
    else if (i.type === 'radio' && pointer) { const all = [...box!.querySelectorAll<HTMLElement>(`fieldset[data-step="${step}"] [data-need]`)], n = all[all.indexOf(need!) + 1]; if (n) n.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' }) }
  })
  f.addEventListener('input', e => { (e.target as HTMLElement).closest('[data-need]')?.classList.remove('bad'); summary() })
  for (const n of ['input', 'change']) f.addEventListener(n, e => (e.target as HTMLElement).closest('[data-need]')?.querySelectorAll('[aria-invalid]').forEach(x => x.removeAttribute('aria-invalid')))
  f.addEventListener('focusout', e => { const i = e.target as HTMLInputElement; if (i.name === 'email' && i.value && !mailOk(i.value)) { i.closest('[data-need]')!.classList.add('bad'); box!.querySelector('.err')!.textContent = L.mailErr } })
  box.addEventListener('close', () => { document.documentElement.style.overflow = ''; (from?.isConnected ? from : document.querySelector<HTMLElement>('header [data-lead]'))?.focus(); if (!box!.querySelector('.lead-done') && far > 0) toast({ text: L.tKeep, action: { label: L.next, run: () => { void openLead(ctx, null, from!, true) } }, ms: 6500 }) })
  f.addEventListener('submit', e => { e.preventDefault(); advance() })
}
const form = () => box!.querySelector('form')!, data = () => new FormData(form()), mailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
function advance() {
  if (!check()) return
  if (step === LAST) { void finish(); return }
  step++; const fresh = step > far; far = Math.max(far, step); draw(); if (fresh) track('form_step'); if (fresh) toast({ kind: 'ok', text: L['t' + step], ms: 2600 })
}
function summary() {
  const ul = box!.querySelector('.lead-sum ul')!, items = ROWS.slice(0, 9).map(([k]) => answer(k)).filter(Boolean)
  ul.replaceChildren(...(items.length ? items : [L.empty]).map(x => Object.assign(document.createElement('li'), { textContent: x.length > 64 ? x.slice(0, 62) + '…' : x, dir: 'auto' })))
}
function draw() {
  box!.querySelectorAll<HTMLElement>('fieldset').forEach((s, i) => { s.hidden = i !== step })
  if (step === LAST) box!.querySelector('.lead-review')!.innerHTML = ROWS.map(([k, n]) => `<div><dt>${esc(label(k))}</dt><dd dir="auto">${esc(answer(k))}</dd><button type="button" data-go="${n}" aria-label="${esc(`${L.edit} ${label(k)}`)}">${esc(L.edit)}</button></div>`).join('')
  box!.querySelector('.where')!.textContent = L.step.replace('{a}', step + 1).replace('{b}', LAST + 1)
  box!.querySelector<HTMLElement>('.lead-bar i')!.style.width = `${((step + 1) / (LAST + 1)) * 100}%`
  box!.querySelector('.lead-tip')!.textContent = L.tips[step]
  box!.querySelectorAll<HTMLButtonElement>('.lead-steps button').forEach((b, i) => { b.disabled = i > far; b.parentElement!.className = i === step ? 'now' : i < far ? 'did' : ''; i === step ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current') })
  box!.querySelector<HTMLElement>('.back')!.style.visibility = step ? 'visible' : 'hidden'
  box!.querySelector('.lead-nav .btn')!.textContent = step < LAST ? L.next : L.send; box!.querySelector('.err')!.textContent = ''
  box!.setAttribute('aria-labelledby', `lead-t${step}`); box!.scrollTop = 0; form().scrollTop = 0; box!.querySelector<HTMLElement>(`#lead-t${step}`)!.focus({ preventScroll: true }); summary()
}
function check() {
  const d = data(), err = box!.querySelector('.err')!; let first: HTMLElement | null = null, msg = ''
  for (const el of box!.querySelectorAll<HTMLElement>(`fieldset[data-step="${step}"] [data-need]`)) {
    const n = el.dataset.need!, v = String(d.get(n) ?? '').trim(), mail = n === 'email' && !!v && !mailOk(v), bad = !v || mail || (n === 'story' && v.length < 12)
    el.classList.toggle('bad', bad); el.querySelectorAll('input,textarea').forEach(x => x.setAttribute('aria-invalid', String(bad))); if (bad && !first) { first = el; msg = mail ? L.mailErr : L.need }
  }
  err.textContent = msg; if (first) { (first.querySelector<HTMLElement>('input,textarea'))!.focus({ preventScroll: true }); first.scrollIntoView({ block: 'nearest' }) }
  return !first
}
function brief(d: FormData) {
  const s = (k: string) => String(d.get(k) ?? '').trim(), en = (g: 'problems' | 'sizes' | 'places' | 'routes' | 'timing' | 'budgets' | 'roles', k: string) => form0[g].find(o => o.id === s(k))?.label.en ?? ''
  const rows: [string, string][] = [['Request', ctx || 'Discovery'], ['Problem', en('problems', 'problem')], ['In their words', s('story')], ['Affects', d.getAll('impacts').map(i => form0.impacts.find(o => o.id === i)?.label.en).join(', ')], ['Users', en('sizes', 'size')], ['Runs at', en('places', 'place')], ['Route', en('routes', 'route')], ['Needed', en('timing', 'timing')], ['Budget', en('budgets', 'budget')], ['Role', en('roles', 'role')], ['Name', s('name')], ['Email', s('email')], ['Company', s('company')], ['Country', s('country')], ['Language', L.name]]
  return rows.map(r => `${r[0]}\n${r[1]}`).join('\n\n')
}
async function finish() {
  const d = data(), s = (k: string) => String(d.get(k) ?? '').trim(), btn = box!.querySelector<HTMLButtonElement>('.lead-nav .btn')!, text = brief(d)
  const payload = { idempotencyKey: key, formVersion: form0.version, language: lang, request: ctx.slice(0, 80), problem: s('problem'), story: s('story'), impacts: d.getAll('impacts').map(String), size: s('size'), place: s('place'), route: s('route'), timing: s('timing'), budget: s('budget'), role: s('role'), name: s('name'), email: s('email'), company: s('company'), country: s('country'), consent: true, elapsedMs: Math.round(performance.now() - opened), website: s('website') }
  btn.disabled = true; btn.textContent = L.sending; let ref = ''
  try { const r = await fetch(`${API}/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(12000) }); if (r.ok) ref = String((await r.json()).reference ?? '') } catch { /* offered by email below */ }
  btn.disabled = false; btn.textContent = L.send
  if (ref) track('form_sent')
  toast(ref ? { kind: 'ok', text: L.tSent } : { kind: 'warn', text: L.tFail, ms: 7000 })
  const href = `mailto:Jahanzaib@alilabsx.com?subject=${encodeURIComponent('Discovery brief, ' + s('company'))}&body=${encodeURIComponent(text)}`
  const v = document.createElement('div'); v.className = ref ? 'lead-done sent' : 'lead-done'
  const short = ref.replace(/-[ABC]\d+-/, '-')
  v.innerHTML = `<h2 tabindex="-1">${esc(ref ? L.sent : L.done)}</h2><p>${esc(ref ? L.sentP : L.fail)}</p>${ref ? `<div class="ref"><span>${esc(L.refT)}</span><b dir="ltr">${esc(short)}</b><button type="button" class="lead-x copyref">${esc(L.copyRef)}</button></div><h3>${esc(L.nextH)}</h3><ol class="lead-next">${L.nextP.map((x: string) => `<li>${esc(x)}</li>`).join('')}</ol><button type="button" class="btn fin">${esc(L.back2)}</button>` : ''}`
  v.querySelector('.copyref')?.addEventListener('click', () => void navigator.clipboard?.writeText(short).then(() => toast({ kind: 'ok', text: L.tCopy, ms: 2000 })))
  v.querySelector('.fin')?.addEventListener('click', () => box!.close())
  if (!ref) { const p = document.createElement('pre'); p.dir = 'ltr'; p.textContent = text; const r = document.createElement('div'); r.className = 'row'; r.innerHTML = `<a class="btn" href="${esc(href)}">${esc(L.mail)}</a><button type="button" class="lead-x copy">${esc(L.copy)}</button><button type="button" class="lead-x again">${esc(L.back)}</button>`; v.append(p, r); r.querySelector('.again')!.addEventListener('click', () => { reopen(); draw() }); r.querySelector('.copy')!.addEventListener('click', async e => { const c = e.currentTarget as HTMLElement; try { await navigator.clipboard.writeText(text); c.textContent = L.copied; toast({ kind: 'ok', text: L.tCopy, ms: 2000 }) } catch { getSelection()?.selectAllChildren(p) } }) }
  const f = form(); box!.classList.add('finished'); if (ref) f.querySelectorAll('fieldset,.lead-nav,.err,.lead-bar').forEach(e => e.remove()); f.querySelector('.where')!.textContent = ''; f.append(v); v.querySelector<HTMLElement>('h2')!.focus()
}
// A brief that could not be sent stays in the form, with the same key, so it can be sent again
function reopen() { box!.querySelector('.lead-done')?.remove(); box!.classList.remove('finished') }
export async function openLead(context: string, solution: number | null, opener: HTMLElement, resume = false) {
  await Promise.race([ready, new Promise(r => setTimeout(r, 900))])
  if (!box || box.querySelector('.lead-done.sent')) { box?.remove(); try { make() } catch (e) { box?.remove(); box = null; throw e } key = crypto.randomUUID(); opened = performance.now(); step = 0 }
  if (box!.open) return
  reopen()
  ctx = context; from = opener; formOpened(); track('form_open'); clearToasts()
  if (solution !== null) { const i = box!.querySelector<HTMLInputElement>(`[name=problem][value="${bundled.problems[solution]?.id}"]`); if (i) { i.checked = true; far = Math.max(far, 1); step = 1 } } else if (!resume && !far) step = 0
  box!.showModal(); document.documentElement.style.overflow = 'hidden'; draw()
}
