// Asks before counting anything. The answer is a cookie of this site; Google's cookies exist only after Accept.
// Design follows Storeloom's cookie consent and first-party analytics plugins.
const C = JSON.parse(document.getElementById('consent-text')?.textContent ?? 'null') as Record<string, string> | null
const API = (import.meta.env.VITE_LEAD_API as string | undefined) ?? 'https://novaops.alilabsx.com/api/public', NAME = 'alx_consent', V = '2', GA = 'G-612W223T3P'
const read = () => document.cookie.match(/(?:^|; )alx_consent=2\.(yes|no)(?:;|$)/)?.[1] as 'yes' | 'no' | undefined
const signal = () => (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
const write = (v: string) => { document.cookie = `${NAME}=${V}.${v}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}` }
let box: HTMLElement | null = null
const allowed = () => read() === 'yes' && !signal()

// Google Analytics loads once, only after Accept. Its linked Tag Manager container must not be added as well: it holds the same stream and would count twice.
type Tag = Window & { dataLayer?: unknown[] } & Record<string, unknown>
const w = window as unknown as Tag
function gtag(..._: unknown[]) { (w.dataLayer ??= []).push(arguments) }
let google = false
function startGoogle() {
  w[`ga-disable-${GA}`] = false
  if (google) return
  google = true
  // No advertising, and no personal details from the page or the form
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' })
  gtag('js', new Date())
  gtag('config', GA, { allow_google_signals: false, allow_ad_personalization_signals: false, page_location: location.origin + location.pathname, cookie_expires: 15552000, cookie_flags: 'SameSite=Lax;Secure' })
  const s = document.createElement('script'); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${GA}`; document.head.append(s)
}
function stopGoogle() {
  w[`ga-disable-${GA}`] = true
  const host = location.hostname.replace(/^www\./, '')
  for (const c of document.cookie.split('; ')) { const n = c.split('=')[0]; if (/^_g(a|id|at)/.test(n)) for (const d of ['', `; Domain=${host}`, `; Domain=.${host}`]) document.cookie = `${n}=; Path=/; Max-Age=0${d}` }
}

export function track(event: string) {
  if (!allowed()) return
  startGoogle()
  if (event !== 'page_view') gtag('event', event === 'form_sent' ? 'generate_lead' : event)
  let source = ''; try { if (event === 'page_view' && document.referrer) { const h = new URL(document.referrer).hostname.replace(/^www\./, ''); if (h !== location.hostname.replace(/^www\./, '')) source = h.slice(0, 80) } } catch { /* odd referrer */ }
  const path = location.pathname.slice(0, 120), language = document.documentElement.lang.slice(0, 2)
  void fetch(`${API}/hit`, { method: 'POST', keepalive: true, credentials: 'omit', referrerPolicy: 'origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event, path, source, language, device: matchMedia('(max-width:900px)').matches ? 'phone' : 'desktop' }) }).catch(() => {})
}
function show(focus: boolean) {
  if (!C || box) return
  const from = document.activeElement as HTMLElement | null
  box = document.createElement('section'); box.className = 'consent'; box.setAttribute('aria-labelledby', 'consent-h')
  box.innerHTML = `<h2 id="consent-h" tabindex="-1">${C.title}</h2><p>${C.text} <a href="${document.querySelector<HTMLAnchorElement>('.logo')!.pathname}cookies/">${C.more}</a></p><div class="consent-b"><button type="button" data-v="no">${C.no}</button><button type="button" data-v="yes">${C.yes}</button></div>`
  box.addEventListener('click', e => {
    const v = (e.target as HTMLElement).closest<HTMLElement>('[data-v]')?.dataset.v; if (!v) return
    const was = read(); write(v); box!.remove(); box = null; document.documentElement.classList.remove('asking'); if (focus) from?.focus()
    if (v === 'no') stopGoogle(); else if (was !== 'yes') track('page_view')
  })
  // Right after the skip link, so the keyboard reaches the choice before the page
  const skip = document.querySelector('.skip'); if (skip) skip.after(box); else document.body.prepend(box); document.documentElement.classList.add('asking'); if (focus) box.querySelector<HTMLElement>('h2')!.focus()
}
export function startConsent() {
  document.addEventListener('click', e => {
    const t = e.target as HTMLElement; if (t.closest('[data-consent]')) { show(true); return }
    const a = t.closest<HTMLAnchorElement>('a[href]'); if (!a) return
    if (a.hostname === 'wa.me') track('whatsapp'); else if (a.protocol === 'mailto:' && a.dataset.lead === undefined) track('email'); else if (/^https?:$/.test(a.protocol) && a.hostname !== location.hostname) track('outbound')
  })
  if (!read() && !signal()) show(false)
  track('page_view')
  addEventListener('pageshow', e => { if (!e.persisted) return; if (read() && box) { box.remove(); box = null; document.documentElement.classList.remove('asking') } track('page_view') })
  const end = document.querySelector('.post .ask, .next'); if (end) { const o = new IntersectionObserver(x => { if (x[0].isIntersecting) { o.disconnect(); track('read_end') } }); o.observe(end) }
  const used = new Set<string>(); document.addEventListener('click', e => { const d = (e.target as HTMLElement).closest('.demo'); if (d && !used.has(d.id) && (e.target as HTMLElement).closest('button')) { used.add(d.id); track('demo_used') } })
}
