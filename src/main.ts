import './style.css'
import { startAssist } from './assist'
import { startConsent } from './consent'
import { startDemos, attach } from './demos'
const root = document.documentElement; root.classList.add('js')
// Another site must not show this page inside its own and steal clicks. GitHub Pages cannot send the header that stops it
let framed = false; try { framed = window.top !== window.self && window.top!.location.origin !== location.origin } catch { framed = true }
if (framed) { root.classList.add('framed'); document.body.inert = true; addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation() }, true) }
const menu = document.querySelector<HTMLButtonElement>('.menu')!, nav = document.getElementById('nav')!
const set = (o: boolean) => { nav.classList.toggle('open', o); menu.setAttribute('aria-expanded', String(o)); menu.textContent = o ? menu.dataset.close! : menu.dataset.open! }
if (document.getElementById('lead-text')) startAssist()
startConsent()
menu.addEventListener('click', () => set(!nav.classList.contains('open')))
nav.addEventListener('click', e => { if ((e.target as HTMLElement).closest('a')) set(false) })
const lang = document.querySelector<HTMLDetailsElement>('.lang')
document.addEventListener('click', e => { if (lang?.open && !lang.contains(e.target as Node)) lang.open = false })
addEventListener('keydown', e => { if (e.key === 'Escape' && lang?.open) { lang.open = false; lang.querySelector('summary')!.focus() } })
// A page kept by the browser must not come back with its menus open
addEventListener('pagehide', () => { if (lang) lang.open = false; set(false) })
// After a new release an open page can ask for a file that is gone. Load the new page once, never over a form
const home = document.querySelector<HTMLAnchorElement>('.logo')!.pathname
let reloading = false
addEventListener('vite:preloadError', () => {
  try { if (document.querySelector('dialog[open]') || sessionStorage.getItem('alx-reload')) return; sessionStorage.setItem('alx-reload', '1') } catch { return }
  reloading = true; location.reload()
})
// On a phone the WhatsApp button steps aside while reading down the page
const wa = document.querySelector('.wa'); let was0 = scrollY
if (wa) { const step = () => { const y = scrollY, end = document.querySelector('.wa-line')?.getBoundingClientRect().top ?? 1e9; if (Math.abs(y - was0) > 6 || y < 300 || end < innerHeight) { wa.classList.toggle('away', innerWidth <= 900 && (y > was0 || y < 300 || end < innerHeight)); was0 = y } }; addEventListener('scroll', step, { passive: true }); step() }
addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { set(false); menu.focus() } })
const canvas = document.querySelector<HTMLCanvasElement>('#world')
if (canvas) {
  startDemos()
  const off = () => root.classList.add('no3d')
  const gl = (() => { try { const g = document.createElement('canvas').getContext('webgl2'); g?.getExtension('WEBGL_lose_context')?.loseContext(); return !!g } catch { return false } })()
  const start = () => import('./scene').then(m => { attach(m.createWorld(canvas, matchMedia('(prefers-reduced-motion:reduce)').matches)); root.classList.add('ready'); dispatchEvent(new Event('world-ready')) }).catch(off)
  // The words come first. The model follows once the page has settled
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 200)), go = () => setTimeout(idle, innerWidth < 900 ? 500 : 60)
  if (!gl) off(); else if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true })
}

const sky = document.querySelector<HTMLCanvasElement>('.bg canvas')
if (sky) { const run = () => import('./backdrop').then(m => m.startBackdrop(sky)).catch(() => {}); 'requestIdleCallback' in window ? requestIdleCallback(run, { timeout: 900 }) : setTimeout(run, 120) }

// Discovery form opens from every call to action; without JavaScript the links are plain email links
document.addEventListener('click', e => {
  const a = (e.target as HTMLElement).closest<HTMLElement>('[data-lead]')
  if (!a || !('showModal' in HTMLDialogElement.prototype)) return
  e.preventDefault()
  const sol = a.dataset.lead === 'sol' ? Number(a.dataset.sol ?? document.querySelector<HTMLInputElement>('[name=sol]:checked')?.value ?? 0) : null
  import('./lead').then(m => m.openLead(sol === null ? a.dataset.lead! : 'Solution', sol, a)).catch(() => { if (!reloading) location.href = `${home}contact/` })
})

// Links from the earlier one-page site
const moved: Record<string, string> = { solutions: 'solutions/', services: 'services/', products: 'products/', approach: 'approach/', infrastructure: 'approach/', founder: 'company/', team: 'company/#team', company: 'company/', 'nova-bots': 'products/#nova-bots', nova: 'products/#nova', loco: 'products/#loco', storeloom: 'products/#storeloom' }
const was = moved[location.hash.slice(1)]
if (was && /^\/(ar\/|ur\/|zh\/)?(index\.html)?$/.test(location.pathname)) location.replace(location.pathname.replace('index.html', '') + was)
