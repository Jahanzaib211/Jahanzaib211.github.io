// Quiet messages. They move into an open dialog, so they are never behind it.
let box: HTMLElement | null = null
export interface Toast { text: string; kind?: 'ok' | 'info' | 'warn'; action?: { label: string; run: () => void }; close?: string; ms?: number }
export function toast(o: Toast) {
  box ??= Object.assign(document.createElement('div'), { className: 'toasts' }); box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite')
  const host = document.querySelector('dialog[open]') ?? document.body; if (box.parentElement !== host) host.append(box)
  while (box.children.length > (host === document.body ? 1 : 0)) box.firstElementChild!.remove()
  const e = document.createElement('div'); e.className = `toast ${o.kind ?? 'info'}`
  const p = document.createElement('p'); p.textContent = o.text; e.append(p)
  const gone = () => { e.classList.add('bye'); setTimeout(() => e.remove(), 220) }
  let timer = 0; const start = () => { timer = window.setTimeout(gone, o.ms ?? 4200) }
  if (o.action) { const b = document.createElement('button'); b.type = 'button'; b.className = 'go'; b.textContent = o.action.label; b.addEventListener('click', () => { gone(); o.action!.run() }); e.append(b) }
  if (o.close) { const x = document.createElement('button'); x.type = 'button'; x.className = 'no'; x.textContent = o.close; x.addEventListener('click', gone); e.append(x) }
  for (const n of ['pointerenter', 'focusin']) e.addEventListener(n, () => clearTimeout(timer)); for (const n of ['pointerleave', 'focusout']) e.addEventListener(n, start)
  box.append(e); start()
}
export const clearToasts = () => box?.replaceChildren()
