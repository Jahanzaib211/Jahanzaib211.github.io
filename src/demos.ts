import type { World } from './scene'
const $ = <T extends HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s)!
const $$ = <T extends HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)]
let world: World | null = null
export const attach = (w: World) => { world = w }
const I = JSON.parse(document.getElementById('i18n')?.textContent ?? '{}'), J = I.js
const fmt = (s: string, o: Record<string, string | number>) => s.replace(/\{(\w)\}/g, (_, k) => String(o[k]))
const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches
const wait = (ms: number) => new Promise(r => setTimeout(r, reduced ? 0 : ms))

function deployment() {
  const sec = $('#infrastructure'), out = $('#deploy-out')
  $$<HTMLInputElement>('input[name=deploy]').forEach(i => i.addEventListener('change', () => {
    sec.dataset.active = i.value; world?.setForm(i.value); world?.pulse(); out.textContent = I.inf[i.value][1]
  }))
}
function bots() {
  const box = $('#bots-demo'), log = $('ol', box), nodes = $$('.bot', box)
  let token = 0
  $$<HTMLButtonElement>('[data-job]', box).forEach(b => b.addEventListener('click', async () => {
    const id = ++token; log.innerHTML = ''; $$('[data-job]', box).forEach(x => x.setAttribute('aria-pressed', String(x === b)))
    const steps: string[] = J.jobs[+b.dataset.job!][1]
    for (let i = 0; i < steps.length; i++) {
      if (id !== token) return
      nodes.forEach((n, k) => n.classList.toggle('on', k === i % 4)); world?.act('bots', i % 4); world?.pulse()
      const li = document.createElement('li'); li.textContent = steps[i]; log.append(li); await wait(1000)
    }
    if (id === token) { nodes.forEach(n => n.classList.remove('on')); world?.act('bots', -1) }
  }))
}
function nova() {
  const box = $('#nova-demo'), tabs = $$<HTMLButtonElement>('[role=tab]', box), pane = $('[role=tabpanel]', box)
  const show = (i: number, focus = false) => {
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1 })
    if (focus) tabs[i].focus()
    world?.act('nova', i)
    pane.setAttribute('aria-labelledby', tabs[i].id)
    if (i === 3) {
      pane.innerHTML = `<form class="calc"><label>${J.calc[0]} <input type="number" name="t" value="84" min="0"></label><label>${J.calc[1]} <input type="number" name="p" value="10" min="0"></label><label>${J.calc[2]} <input type="number" name="n" value="3" min="1"></label><output></output></form>`
      const f = $<HTMLFormElement>('form', pane), up = () => { const g = (n: string) => Number((f.elements.namedItem(n) as HTMLInputElement).value), v = g('t') * (1 + g('p') / 100) / g('n'); $('output', f).textContent = g('n') >= 1 && isFinite(v) && v >= 0 ? fmt(J.calc[3], { x: v.toFixed(2) }) : J.calc[4] }
      f.addEventListener('input', up); f.addEventListener('submit', e => e.preventDefault()); up()
    } else { const p = document.createElement('pre'); p.textContent = J.views[i]; pane.replaceChildren(p) }
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { show(i); world?.pulse() })
    t.addEventListener('keydown', e => { const d = (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0) * (document.dir === 'rtl' ? -1 : 1); if (d) { e.preventDefault(); show((i + d + tabs.length) % tabs.length, true) } })
  })
  show(0)
}
function loco() {
  const box = $('#loco-demo'), cap = $<HTMLInputElement>('#vram', box), out = $('output', box), fill = $('.fill', box), say = $('.say', box), RES = 1.5
  const on = new Map<string, number>(), btn = $$<HTMLButtonElement>('[data-gb]', box)
  const used = () => [...on.values()].reduce((a, b) => a + b, 0)
  const draw = () => { const c = +cap.value; out.textContent = `${c} GB`; world?.act('loco', Math.min(1, used() / c)); fill.style.width = `${Math.min(100, used() / c * 100)}%`; btn.forEach(b => b.setAttribute('aria-pressed', String(on.has(b.dataset.i!)))) }
  btn.forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.i!, n: string = J.models[+id], g = +b.dataset.gb!, c = +cap.value
    if (on.has(id)) { on.delete(id); say.textContent = fmt(J.un, { n, f: (c - used()).toFixed(1) }); say.className = 'say' }
    else { const free = c - used() - RES, ok = g <= free; if (ok) on.set(id, g); say.textContent = fmt(ok ? J.ok : J.no, { n, g, f: (ok ? c - used() : Math.max(0, free)).toFixed(1) }); say.className = `say ${ok ? 'ok' : 'no'}`; world?.gate(ok) }
    draw()
  }))
  cap.addEventListener('input', () => { if (used() + RES > +cap.value) { on.clear(); say.textContent = J.shrink; say.className = 'say no' } draw() }); draw()
}
function store() {
  const box = $('#store-demo'), prev = $('.shop', box)
  const B = [`<div class="s-banner">${J.sb}</div>`, '<div class="s-prod"><i></i><i></i><i></i></div>', `<div class="s-rev">${J.sr}</div>`, `<div class="s-buy">${J.blocks[3]}</div>`]
  let order = [0, 1]
  const draw = () => {
    prev.innerHTML = order.length ? order.map((b, i) => `<div class="blk">${B[b]}<span><button type="button" data-up="${i}" aria-label="${J.up} ${J.blocks[b]}" ${i ? '' : 'disabled'}>${J.up}</button><button type="button" data-rm="${i}" aria-label="${J.rm} ${J.blocks[b]}">${J.rm}</button></span></div>`).join('') : `<p>${J.empty}</p>`
    $$<HTMLButtonElement>('[data-add]', box).forEach(b => { b.disabled = order.includes(+b.dataset.add!) })
  }
  box.addEventListener('click', e => {
    const t = e.target as HTMLElement, d = t.dataset
    if (d.add) order.push(+d.add); else if (d.rm) order = order.filter((_, i) => i !== +d.rm!); else if (d.up) { const i = +d.up;[order[i - 1], order[i]] = [order[i], order[i - 1]] }
    else if (d.hue) { prev.style.setProperty('--shop', d.hue); world?.act('storeloom', d.hue); $$('[data-hue]', box).forEach(x => x.setAttribute('aria-pressed', String(x === t))); return } else return
    draw(); world?.pulse()
    ;(d.add ? $<HTMLElement>('.blk:last-child [data-rm]', prev) : prev.querySelector<HTMLElement>('button:not([disabled])') ?? $<HTMLElement>('[data-add]:not([disabled])', box))?.focus({ preventScroll: true })
  }); draw()
}
function solutions() {
  const sec = $('#solutions'), ask = $<HTMLAnchorElement>('#sol-ask')
  $$<HTMLInputElement>('input[name=sol]').forEach(i => i.addEventListener('change', () => { world?.setForm('desk'); world?.act('desk', +i.value); world?.pulse(); ask.href = i.dataset.m! }))
}
function founder() {
  const el = $$<HTMLElement>('#founder [data-mark]'); if (!el.length) return
  let cur = -2, wait = false
  const pick = () => {
    wait = false; const line = innerHeight * 0.6, b = el.map(e => e.getBoundingClientRect()); let n = -1
    b.forEach((r, i) => { if (r.top < line) n = +el[i].dataset.mark! })
    if (n === cur) return
    cur = n; world?.act('marks', n); el.forEach(e => e.classList.toggle('on', +e.dataset.mark! === n))
  }
  addEventListener('scroll', () => { if (!wait) { wait = true; requestAnimationFrame(pick) } }, { passive: true })
  el.slice(0, 4).forEach(e => { const go = () => world?.act('marks', +e.dataset.mark!), back = () => { cur = -2; pick() }; e.addEventListener('pointerenter', go); e.addEventListener('pointerleave', back); e.addEventListener('focusin', go); e.addEventListener('focusout', back) })
  pick()
}
export function startDemos() { founder(); solutions(); deployment(); bots(); nova(); loco(); store() }
