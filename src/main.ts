import './style.css'
import { startAssist } from './assist'
import { startDemos, startStory, attach } from './demos'
const root = document.documentElement; root.classList.add('js')
const menu = document.querySelector<HTMLButtonElement>('.menu')!, nav = document.getElementById('nav')!
const set = (o: boolean) => { nav.classList.toggle('open', o); menu.setAttribute('aria-expanded', String(o)); menu.textContent = o ? menu.dataset.close! : menu.dataset.open! }
if (document.getElementById('lead-text')) startAssist()
menu.addEventListener('click', () => set(!nav.classList.contains('open')))
nav.addEventListener('click', e => { if ((e.target as HTMLElement).closest('a')) set(false) })
addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { set(false); menu.focus() } })
const canvas = document.querySelector<HTMLCanvasElement>('#world')
if (canvas) {
  if (document.getElementById('solutions')) startDemos(); else startStory()
  const off = () => root.classList.add('no3d')
  const gl = (() => { try { return !!document.createElement('canvas').getContext('webgl2') } catch { return false } })()
  const start = () => import('./scene').then(m => { attach(m.createWorld(canvas, matchMedia('(prefers-reduced-motion:reduce)').matches)); root.classList.add('ready'); dispatchEvent(new Event('world-ready')) }).catch(off)
  if (!gl) off(); else if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 900 }); else setTimeout(start, 200)
}

// Discovery form opens from every call to action; without JavaScript the links still start an email
document.addEventListener('click', e => {
  const a = (e.target as HTMLElement).closest<HTMLElement>('[data-lead]')
  if (!a || !('showModal' in HTMLDialogElement.prototype)) return
  e.preventDefault()
  const sol = a.dataset.lead === 'sol' ? Number(document.querySelector<HTMLInputElement>('[name=sol]:checked')?.value ?? 0) : null
  import('./lead').then(m => m.openLead(sol === null ? a.dataset.lead! : 'Solution', sol, a)).catch(() => { location.href = (a as HTMLAnchorElement).href })
})
