// Offers help once the visitor has shown interest. At most two offers per visit, never over the form.
import { toast } from './toast'
const L = JSON.parse(document.getElementById('lead-text')?.textContent ?? '{}')
let offers = 0, last = 0
const get = (k: string) => { try { return sessionStorage.getItem(k) } catch { return null } }, put = (k: string) => { try { sessionStorage.setItem(k, '1') } catch { /* private mode */ } }
function offer(id: string, text: string, label: string, lead: string) {
  if (offers >= 2 || Date.now() - last < 25000 || get('alx-' + id) || get('alx-lead') || document.querySelector('dialog[open]')) return
  offers++; last = Date.now(); put('alx-' + id)
  toast({ text, ms: 11000, close: L.later, action: { label, run: () => { const a = document.createElement('button'); a.dataset.lead = lead; a.hidden = true; document.body.append(a); a.click(); setTimeout(() => a.remove(), 0) } } })
}
export const formOpened = () => put('alx-lead')
export function startAssist() {
  const used: Record<string, number> = {}, N: Record<string, string> = { 'bots-demo': 'NOVA BOTS', 'nova-demo': 'NOVA', 'loco-demo': 'LOCO', 'store-demo': 'STORELOOM' }
  document.addEventListener('click', e => { const d = (e.target as HTMLElement).closest<HTMLElement>('.demo'); if (!d || !N[d.id] || !(e.target as HTMLElement).closest('button')) return; used[d.id] = (used[d.id] ?? 0) + 1; if (used[d.id] === 3) setTimeout(() => offer(d.id, L.aDemo.replace('{n}', N[d.id]), L.aDemoGo, `${N[d.id]} private demo`), 1800) })
  let t = 0; document.addEventListener('change', e => { if ((e.target as HTMLInputElement).name !== 'sol') return; clearTimeout(t); t = window.setTimeout(() => offer('sol', L.aSol, L.aSolGo, 'sol'), 7000) })
  const team = document.getElementById('team'); if (team) new IntersectionObserver(x => { if (x[0].isIntersecting) setTimeout(() => offer('end', L.aEnd, L.open, 'Founder story'), 2500) }, { threshold: 0.4 }).observe(team)
}
