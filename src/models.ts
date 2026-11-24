import { Group, Mesh, Object3D, BoxGeometry, CylinderGeometry, SphereGeometry, TorusGeometry, CapsuleGeometry, PlaneGeometry, MeshStandardMaterial, MeshPhysicalMaterial, MeshBasicMaterial, CanvasTexture, SRGBColorSpace, InstancedMesh, Color, Shape, ExtrudeGeometry, DoubleSide, TubeGeometry, CatmullRomCurve3, Vector3, AdditiveBlending, type BufferGeometry, type Material } from 'three'
import { POLYS } from './formations'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

export interface Model { root: Group; parts: Object3D[]; tick?(t: number): void; act?(v: number | string | boolean): void; tilt: number; turn: number; s?: number }
const std = (c: number | string, o = {}) => new MeshStandardMaterial({ color: c, metalness: 0.45, roughness: 0.42, ...o })
const glow = (c: number | string) => new MeshBasicMaterial({ color: c })
const M = {
  steel: std(0x4a6398, { metalness: 0.4, roughness: 0.4 }), dark: std(0x1a2c57, { metalness: 0.35, roughness: 0.5 }), blue: std(0x0268f4, { emissive: 0x0130a0, emissiveIntensity: 0.4 }),
  white: std(0xe9f1ff, { metalness: 0.05, roughness: 0.4 }), pale: std(0x9cc0f5, { metalness: 0.15 }), floor: std(0x16284f, { metalness: 0.1, roughness: 0.8 }), gold: std(0xe0b04f, { metalness: 0.45, roughness: 0.35 }),
  glass: new MeshPhysicalMaterial({ color: 0x6fc4ff, metalness: 0, roughness: 0.06, transparent: true, opacity: 0.16, clearcoat: 1, side: DoubleSide, depthWrite: false }),
  window: std(0x1b4fa8, { metalness: 0.9, roughness: 0.14, emissive: 0x06306f, emissiveIntensity: 0.7 }), cyan: glow(0x04d8fa), ok: glow(0x2be6a0), bad: glow(0xff4d5e), amber: glow(0xffc857),
}
const rb = (w: number, h: number, d: number, m: Material, r = 0.04) => new Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.1, h / 2.1, d / 2.1)), m)
const bx = (w: number, h: number, d: number, m: Material) => new Mesh(new BoxGeometry(w, h, d), m)
const cy = (r: number, h: number, m: Material, seg = 32, r2 = r) => new Mesh(new CylinderGeometry(r2, r, h, seg), m)
const at = <T extends Object3D>(o: T, x: number, y: number, z: number) => { o.position.set(x, y, z); return o }
const grp = (...k: Object3D[]) => { const g = new Group(); g.add(...k); return g }
const inst = (geo: BufferGeometry, m: Material, list: [number, number, number, number?, number?, number?][]) => { const i = new InstancedMesh(geo, m, list.length), o = new Object3D(); list.forEach((p, n) => { o.position.set(p[0], p[1], p[2]); o.scale.set(p[3] ?? 1, p[4] ?? 1, p[5] ?? 1); o.updateMatrix(); i.setMatrixAt(n, o.matrix) }); i.frustumCulled = false; return i }
const unit = new BoxGeometry(1, 1, 1)
const model = (parts: Object3D[], tilt = 0.22, turn = -0.5, s = 1): Model => ({ root: grp(...parts), parts, tilt, turn, s })
type Ctx = CanvasRenderingContext2D
function canvas(w: number, h: number, draw: (c: Ctx) => void) { const e = document.createElement('canvas'); e.width = w; e.height = h; const c = e.getContext('2d')!; draw(c); const t = new CanvasTexture(e); t.colorSpace = SRGBColorSpace; t.anisotropy = 4; return { t, redraw(f: (c: Ctx) => void) { c.clearRect(0, 0, w, h); f(c); t.needsUpdate = true } } }
const rr = (c: Ctx, x: number, y: number, w: number, h: number, f: string, r = 10) => { c.fillStyle = f; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill() }

// A server rack with real units, vents, handles and status lights
function rack(h = 2.1, leds: Mesh[] = []) {
  const g = new Group(), w = 0.66, d = 0.82
  for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) g.add(at(bx(0.04, h, 0.04, M.steel), x, 0, z))
  g.add(at(rb(w + 0.06, 0.06, d + 0.06, M.dark), 0, h / 2, 0), at(rb(w + 0.06, 0.06, d + 0.06, M.dark), 0, -h / 2, 0), at(bx(0.02, h - 0.06, d - 0.04, M.dark), -w / 2, 0, 0), at(bx(0.02, h - 0.06, d - 0.04, M.dark), w / 2, 0, 0))
  const n = Math.floor((h - 0.16) / 0.155), vents: [number, number, number, number, number, number][] = [], hands: typeof vents = [], faces: typeof vents = []
  for (let i = 0; i < n; i++) {
    const y = -h / 2 + 0.14 + i * 0.155; faces.push([0, y, 0.01, w - 0.06, 0.132, d - 0.04])
    for (let v = 0; v < 9; v++) vents.push([-0.1 + v * 0.032, y, d / 2 - 0.008, 0.014, 0.075, 0.01])
    hands.push([-w / 2 + 0.07, y, d / 2 + 0.012, 0.02, 0.09, 0.05], [w / 2 - 0.07, y, d / 2 + 0.012, 0.02, 0.09, 0.05])
    const l = new Mesh(new SphereGeometry(0.016, 8, 8), i % 5 === 3 ? M.cyan : M.ok); l.position.set(-0.19, y + 0.015, d / 2 + 0.008); leds.push(l); g.add(l)
  }
  g.add(inst(unit, M.steel, faces), inst(unit, M.dark, vents), inst(unit, M.pale, hands)); return g
}
const floor = (w: number, d: number, y: number) => { const g = grp(at(rb(w, 0.07, d, M.floor, 0.03), 0, y, 0)), l: [number, number, number, number, number, number][] = []; for (let i = 1; i < 6; i++) l.push([-w / 2 + (w * i) / 6, y + 0.037, 0, 0.008, 0.004, d - 0.06], [0, y + 0.037, -d / 2 + (d * i) / 6, w - 0.06, 0.004, 0.008]); g.add(inst(unit, M.steel, l)); return g }
const blink = (leds: Mesh[]) => (t: number) => leds.forEach((l, i) => { l.visible = Math.sin(t * (2 + (i % 5)) + i * 2.3) > -0.55 })

// Software being built, as a stack. Servers carry the code, the code carries the product, and light climbs from one to the next
function slab(w: number, d: number, h: number, r: number, m: Material) {
  const s = new Shape(), x = w / 2, y = d / 2
  s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0, false); s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2, false); s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI, false); s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5, false)
  const g = new ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 4, curveSegments: 14 }); g.rotateX(-Math.PI / 2); g.translate(0, -h / 2, 0); return new Mesh(g, m)
}
function rim(w: number, r: number, m: Material, k = 0.018) { const p: Vector3[] = [], x = w / 2 + 0.03; for (const [cx, cz, a0] of [[x - r, x - r, 0], [-x + r, x - r, 1], [-x + r, -x + r, 2], [x - r, -x + r, 3]]) for (let i = 0; i <= 8; i++) { const a = ((a0 + i / 8) * Math.PI) / 2; p.push(new Vector3(cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r)) } return new Mesh(new TubeGeometry(new CatmullRomCurve3(p, true, 'catmullrom', 0.05), 220, k, 8, true), m) }
function build(): Model {
  const W = 2.75, R = 0.3, GAP = 1.22, CYCLE = 12, Y = [-1.3, -1.3 + GAP, -1.3 + GAP * 2]
  const soft = canvas(256, 256, c => { const g = c.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(40,150,255,.75)'); g.addColorStop(0.45, 'rgba(2,104,244,.3)'); g.addColorStop(1, 'rgba(2,104,244,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256) })
  const body = (c: number, e: number) => new MeshPhysicalMaterial({ color: c, metalness: 0.25, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.25, emissive: e, emissiveIntensity: 0.55 })
  const edges = [0x0268f4, 0x1a9bff, 0x04d8fa].map(c => new MeshBasicMaterial({ color: c })), full = edges.map(e => e.color.clone()), DIM = new Color(0x1b3566)
  const auras = [0, 1, 2].map(() => new MeshBasicMaterial({ map: soft.t, transparent: true, opacity: 0.5, blending: AdditiveBlending, depthWrite: false }))
  const layer = (i: number, c: number, e: number) => { const au = new Mesh(new PlaneGeometry(W * 1.5, W * 1.5), auras[i]); au.rotation.x = -Math.PI / 2; au.position.y = -0.14; return grp(slab(W, W, 0.14, R, body(c, e)), at(rim(W, R, edges[i]), 0, 0, 0), au) }
  const top = (w: number, t: CanvasTexture) => { const p = new Mesh(new PlaneGeometry(w, w), new MeshBasicMaterial({ map: t, transparent: true })); p.rotation.x = -Math.PI / 2; p.position.y = 0.104; return p }
  // Foundation: machines and the routes between them
  const l0 = layer(0, 0x0f3a86, 0x0b3a94), leds: Mesh[] = [], routes = canvas(512, 512, c => { c.strokeStyle = '#5fa4ff'; c.lineWidth = 6; c.lineCap = 'round'; for (const [x1, y1, x2, y2] of [[110, 110, 256, 110], [256, 110, 256, 256], [402, 110, 402, 256], [402, 256, 256, 256], [110, 402, 110, 256], [110, 256, 256, 256], [256, 256, 256, 402], [256, 402, 402, 402]]) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke() } c.fillStyle = '#04d8fa'; for (const [x, y] of [[256, 256], [256, 110], [402, 256], [110, 256], [256, 402]]) { c.beginPath(); c.arc(x, y, 9, 0, 7); c.fill() } })
  const unitA = std(0x3f7be0, { metalness: 0.2, roughness: 0.35, emissive: 0x1048b8, emissiveIntensity: 0.6 })
  for (const [x, z] of [[-0.86, -0.86], [0.86, -0.86], [-0.86, 0.86], [0.86, 0.86]]) { const g = new Group(); for (let k = 0; k < 3; k++) { g.add(at(slab(0.5, 0.5, 0.09, 0.08, unitA), 0, 0.16 + k * 0.17, 0)); const d = at(bx(0.2, 0.026, 0.012, k === 2 ? M.ok : M.cyan), -0.06, 0.16 + k * 0.17, 0.288), d2 = at(bx(0.012, 0.026, 0.2, M.cyan), 0.288, 0.16 + k * 0.17, -0.04); leds.push(d, d2); g.add(d, d2) } l0.add(at(g, x, 0.02, z)) }
  l0.add(top(2.5, routes.t))
  // Code
  const LN = [[0, 34, 1], [1, 50, 0], [1, 38, 2], [2, 56, 0], [2, 44, 3], [1, 26, 1], [1, 48, 2], [2, 40, 3], [2, 54, 0], [1, 30, 1], [0, 20, 0]], INK = ['#7f9fd8', '#1fe0ff', '#8ec1ff', '#45f0b4']
  const code = (n: number) => (c: Ctx) => { rr(c, 8, 8, 752, 752, '#071938', 46); rr(c, 8, 8, 752, 66, '#0f2c63', 40); ['#ff6b6b', '#ffc857', '#2be6a0'].forEach((f, i) => { c.fillStyle = f; c.beginPath(); c.arc(54 + i * 38, 42, 11, 0, 7); c.fill() }); rr(c, 8, 74, 78, 640, '#0a2350', 0); LN.forEach(([tab, w, ink], i) => { const y = 106 + i * 57; rr(c, 32, y + 6, 30, 12, i < n ? '#4a78c8' : '#1c3a75', 6); if (i >= n) return; const x = 116 + tab * 48; rr(c, x, y, w * 5, 24, INK[ink], 12); rr(c, x + w * 5 + 16, y, 70 + ((i * 47) % 150), 24, '#3a63b4', 12) }); if (n < LN.length) rr(c, 116 + LN[n][0] * 48, 100 + n * 57, 8, 36, '#ffffff', 3) }
  const tx = canvas(768, 768, code(LN.length)), l1 = layer(1, 0x1246a0, 0x0b3a94); l1.add(top(2.62, tx.t))
  // Product
  const l2 = layer(2, 0x1a5cc4, 0x0d48b0), ui = canvas(768, 768, c => {
    rr(c, 8, 8, 752, 752, '#eef4ff', 46); rr(c, 8, 8, 150, 752, '#0b2a5b', 46); rr(c, 110, 8, 48, 752, '#0b2a5b', 0); rr(c, 46, 46, 74, 74, '#0268f4', 20); for (let i = 0; i < 5; i++) rr(c, 46, 170 + i * 84, 74, 46, i ? '#1b4687' : '#04d8fa', 16)
    rr(c, 192, 48, 250, 30, '#0b2a5b', 15); rr(c, 192, 92, 160, 18, '#9db4d8', 9); c.fillStyle = '#0268f4'; c.beginPath(); c.arc(700, 72, 30, 0, 7); c.fill()
    for (let i = 0; i < 3; i++) { rr(c, 192 + i * 182, 148, 164, 130, '#ffffff', 22); rr(c, 214 + i * 182, 172, 80, 16, '#a9bddd', 8); rr(c, 214 + i * 182, 206, 112, 34, ['#0268f4', '#12b886', '#0b2a5b'][i], 14) }
    rr(c, 192, 302, 346, 250, '#ffffff', 22); rr(c, 560, 302, 168, 250, '#ffffff', 22); c.lineWidth = 26; c.strokeStyle = '#dbe6f8'; c.beginPath(); c.arc(644, 412, 54, 0, 7); c.stroke(); c.strokeStyle = '#0268f4'; c.beginPath(); c.arc(644, 412, 54, -1.57, 2.4); c.stroke(); c.strokeStyle = '#04d8fa'; c.beginPath(); c.arc(644, 412, 54, 2.4, 3.6); c.stroke(); rr(c, 596, 504, 96, 16, '#a9bddd', 8)
    rr(c, 192, 576, 536, 150, '#ffffff', 22); for (let i = 0; i < 3; i++) { c.fillStyle = ['#0268f4', '#12b886', '#04d8fa'][i]; c.beginPath(); c.arc(228, 608 + i * 43, 13, 0, 7); c.fill(); rr(c, 256, 600 + i * 43, 210 - i * 36, 16, '#5d7aa8', 8); rr(c, 600, 598 + i * 43, 98, 20, i === 1 ? '#c8f5e3' : '#dbe6f8', 10) }
  }); l2.add(top(2.62, ui.t))
  const P = 2.62 / 768, tall = [0.16, 0.28, 0.22, 0.38, 0.32, 0.52], bars3 = tall.map((h, i) => { const b = grp(at(rb(0.13, 1, 0.13, i === 5 ? std(0x04d8fa, { emissive: 0x04a0d8, emissiveIntensity: 0.6, metalness: 0.1 }) : std(0x0268f4, { emissive: 0x0146c8, emissiveIntensity: 0.5, metalness: 0.1 }), 0.03), 0, 0.5, 0)); b.position.set((226 + i * 55 - 384) * P, 0.1, (490 - 384) * P); b.scale.y = h; l2.add(b); return b })
  // Light climbing between the layers
  const beam = new MeshBasicMaterial({ color: 0x2fb6ff, transparent: true, opacity: 0.2, blending: AdditiveBlending, depthWrite: false }), posts: [number, number, number, number, number, number][] = [], spots = [[-1.02, 1.02], [1.02, 1.02], [1.02, -1.02], [-1.02, -1.02], [0, 1.15], [1.15, 0]]
  for (const [x, z] of spots) for (const y of [0, 1]) posts.push([x, Y[y] + GAP / 2, z, 0.03, GAP - 0.2, 0.03])
  const N = 36, sparks = inst(new SphereGeometry(0.036, 12, 12), M.cyan, Array.from({ length: N }, () => [0, 0, 0] as [number, number, number])), o = new Object3D(), scan = rim(W + 0.12, R, new MeshBasicMaterial({ color: 0x9df0ff, transparent: true, opacity: 0.9 }), 0.012)
  const m = model([at(l0, 0, Y[0], 0), at(l1, 0, Y[1], 0), at(l2, 0, Y[2], 0), inst(unit, beam, posts), sparks, scan], 0.5, 0.72, 1.02), ease = (k: number) => 1 - (1 - k) ** 3, part = (c: number, f: number, l: number) => Math.min(1, Math.max(0, (c - f) / l)); let was = -1
  const bl = blink(leds)
  // Standing still shows the finished work
  m.tick = t => {
    const c = t === 0 ? CYCLE - 2 : t % CYCLE, off = part(c, CYCLE - 0.8, 0.8), n = off ? LN.length : Math.floor(part(c, 1.6, 3.6) * LN.length), fade = 1 - off
    if (n !== was) { was = n; tx.redraw(code(n)) } if (t) bl(t)
    edges.forEach((e, i) => { const k = ease(part(c, i * 2.5, 1)) * fade; e.color.copy(DIM).lerp(full[i], k); auras[i].opacity = 0.12 + 0.5 * k })
    bars3.forEach((b, i) => { b.scale.y = Math.max(0.01, tall[i] * ease(part(c, 5.4 + i * 0.16, 0.9)) * fade) })
    const live = part(c, 0.8, 0.8) * (1 - part(c, CYCLE - 1.6, 0.8)); beam.opacity = 0.08 + 0.24 * live
    for (let i = 0; i < N; i++) { const s = spots[i % spots.length], k = (t * 0.28 + i * 0.137) % 1; o.position.set(s[0], Y[0] + 0.1 + k * (GAP * 2 - 0.2), s[1]); o.scale.setScalar(Math.max(0.0001, Math.sin(k * Math.PI) * live)); o.updateMatrix(); sparks.setMatrixAt(i, o.matrix) } sparks.instanceMatrix.needsUpdate = true
    const u = part(c, 0.2, 6); scan.position.y = Y[0] - 0.15 + ease(u) * (GAP * 2 + 0.35); scan.visible = u > 0 && u < 1
  }
  return m
}
function padlock(k = 1) {
  const body = rb(0.9, 0.74, 0.3, M.blue, 0.1), sh = new Mesh(new TorusGeometry(0.28, 0.07, 16, 40, Math.PI), M.white), g = grp(body, at(sh, 0, 0.5, 0), at(cy(0.07, 0.16, M.white), -0.28, 0.42, 0), at(cy(0.07, 0.16, M.white), 0.28, 0.42, 0), at(new Mesh(new SphereGeometry(0.1, 20, 20), M.dark), 0, 0.05, 0.13), at(bx(0.07, 0.22, 0.06, M.dark), 0, -0.1, 0.14)); g.scale.setScalar(k); return g
}
function own(): Model {
  const leds: Mesh[] = [], lock = padlock(1), edge: [number, number, number, number, number, number][] = [], a = 1.3, b = 1.4
  for (const x of [-a, a]) for (const y of [-b, b]) edge.push([x, y, 0, 0.045, 0.045, a * 2])
  for (const x of [-a, a]) for (const z of [-a, a]) edge.push([x, 0, z, 0.045, b * 2, 0.045])
  for (const y of [-b, b]) for (const z of [-a, a]) edge.push([0, y, z, a * 2, 0.045, 0.045])
  const parts = [at(rb(3, 0.14, 3, M.dark), 0, -1.5, 0), at(rack(2.3, leds), -0.42, -0.25, -0.1), at(rack(2.3, leds), 0.42, -0.25, -0.1), inst(unit, M.pale, edge), bx(a * 2, b * 2, a * 2, M.glass), at(lock, 0, -0.35, 1.55)]
  const m = model(parts, 0.2, -0.45), bl = blink(leds); m.tick = t => { bl(t); lock.position.y = -0.35 + Math.sin(t * 1.3) * 0.05 }; return m
}
function chip(): Model {
  const board = rb(3.5, 0.12, 3.5, std(0x0f3f86, { metalness: 0.15, roughness: 0.5 }), 0.06), die = rb(1.35, 0.2, 1.35, M.steel, 0.05), cap = rb(0.95, 0.06, 0.95, std(0x0b1225, { metalness: 0.9, roughness: 0.2 })), tr: [number, number, number, number, number, number][] = [], pins: typeof tr = [], small: typeof tr = []
  for (let i = -5; i <= 5; i++) { const x = i * 0.11, L = 0.75 + ((i * i) % 4) * 0.08; for (const s of [-1, 1]) { tr.push([x, 0.066, s * (0.7 + L / 2), 0.022, 0.012, L], [s * (0.7 + L / 2), 0.066, x, L, 0.012, 0.022]); pins.push([x, 0.1, s * 0.71, 0.05, 0.05, 0.12], [s * 0.71, 0.1, x, 0.12, 0.05, 0.05]) } }
  for (let i = 0; i < 14; i++) small.push([(i % 2 ? 1.3 : -1.3) + ((i * 7) % 5) * 0.06, 0.12, -1.3 + (i >> 1) * 0.42, 0.2, 0.14, 0.13])
  const edge = new Mesh(new TorusGeometry(0.36, 0.018, 8, 48), M.cyan); edge.rotation.x = Math.PI / 2
  const pulses = inst(new SphereGeometry(0.035, 10, 10), M.cyan, Array.from({ length: 28 }, () => [0, 0, 0] as [number, number, number])), o = new Object3D()
  const parts = [board, inst(unit, M.gold, tr), inst(unit, M.gold, pins), inst(unit, M.dark, small), at(die, 0, 0.16, 0), at(cap, 0, 0.29, 0), at(edge, 0, 0.33, 0), pulses], m = model(parts, 0.72, 0.5)
  m.tick = t => { for (let i = 0; i < 28; i++) { const k = (t * 0.5 + i * 0.37) % 1, l = ((i % 11) - 5) * 0.11, s = i % 2 ? 1 : -1, d = 1.6 - k * 0.9; i % 4 < 2 ? o.position.set(l, 0.1, s * d) : o.position.set(s * d, 0.1, l); o.scale.setScalar(Math.sin(k * Math.PI)); o.updateMatrix(); pulses.setMatrixAt(i, o.matrix) } pulses.instanceMatrix.needsUpdate = true; edge.scale.setScalar(1 + Math.sin(t * 2) * 0.05) }; return m
}
function onprem(): Model {
  const leds: Mesh[] = [], wall = (w: number, h: number, d: number) => rb(w, h, d, std(0x24477f, { metalness: 0.1, roughness: 0.8 }), 0.02)
  const tray = inst(unit, M.pale, Array.from({ length: 14 }, (_, i) => [-1.5 + i * 0.23, 1.25, -0.5, 0.03, 0.02, 0.4] as [number, number, number, number, number, number]))
  const parts = [floor(3.6, 2.8, -1.4), at(wall(3.6, 2.9, 0.08), 0, 0.02, -1.38), at(wall(0.08, 2.9, 2.8), -1.8, 0.02, 0), ...[-1.12, -0.34, 0.44, 1.22].map(x => at(rack(2.15, leds), x, -0.28, -0.55)), grp(tray, at(bx(3.3, 0.02, 0.03, M.pale), 0, 1.25, -0.7), at(bx(3.3, 0.02, 0.03, M.pale), 0, 1.25, -0.3)), at(grp(rb(0.5, 0.75, 0.5, M.steel), at(bx(0.36, 0.3, 0.02, M.cyan), 0, 0.12, 0.26)), 1.15, -0.98, 0.85)]
  const m = model(parts, 0.3, -0.55); m.tick = blink(leds); return m
}
function cloud(): Model {
  const leds: Mesh[] = [], c = new Group(), mat = std(0xd7e8ff, { metalness: 0, roughness: 0.75, emissive: 0x2a6fd8, emissiveIntensity: 0.28 })
  for (const [x, y, z, r] of [[0, 0.2, 0, 0.82], [-0.85, -0.02, 0.05, 0.62], [0.88, 0.02, 0, 0.66], [-0.4, 0.3, 0.3, 0.56], [0.45, 0.36, -0.15, 0.6], [0.35, -0.08, 0.42, 0.5], [-1.35, -0.2, 0, 0.4], [1.4, -0.18, 0, 0.42]]) c.add(at(new Mesh(new SphereGeometry(r, 40, 32), mat), x, y, z))
  c.add(at(rb(2.9, 0.42, 0.9, mat, 0.2), 0, -0.4, 0))
  const dots = inst(new SphereGeometry(0.045, 12, 12), M.cyan, Array.from({ length: 18 }, () => [0, 0, 0] as [number, number, number])), o = new Object3D(), X = [-1.1, 0, 1.1]
  const office = (x: number) => { const g = grp(bx(0.6, 0.75, 0.5, M.window), at(bx(0.68, 0.05, 0.58, M.pale), 0, 0.4, 0)); g.add(inst(unit, M.white, [[-0.15, 0, 0.255, 0.02, 0.75, 0.02], [0.15, 0, 0.255, 0.02, 0.75, 0.02], [0, 0.12, 0.255, 0.6, 0.02, 0.02], [0, -0.12, 0.255, 0.6, 0.02, 0.02]])); return at(g, x, -1.25, 0.2) }
  const parts = [at(rb(3.6, 0.08, 1.6, M.floor), 0, -1.68, 0.2), ...X.map(office), at(c, 0, 0.95, 0), inst(unit, M.steel, X.map(x => [x, -0.15, 0.2, 0.02, 1.4, 0.02])), dots], m = model(parts, 0.1, -0.35)
  m.tick = t => { c.position.y = 0.95 + Math.sin(t) * 0.05; for (let i = 0; i < 18; i++) { let k = (t * 0.4 + i / 6) % 1; if (i % 2) k = 1 - k; o.position.set(X[i % 3], -0.8 + k * 1.3, 0.2); o.updateMatrix(); dots.setMatrixAt(i, o.matrix) } dots.instanceMatrix.needsUpdate = true; blink(leds)(t) }; return m
}
function airgap(): Model {
  const leds: Mesh[] = [], r = grp(at(rack(1.9, leds), -0.4, 0, 0), at(rack(1.9, leds), 0.42, 0, 0)), curve = (p: number[][]) => new Mesh(new TubeGeometry(new CatmullRomCurve3(p.map(a => new Vector3(a[0], a[1], a[2]))), 40, 0.045, 10), M.pale)
  const plug = (f: number) => grp(rb(0.34, 0.24, 0.2, M.steel), at(bx(0.12, 0.035, 0.05, M.gold), f * 0.22, 0.05, 0), at(bx(0.12, 0.035, 0.05, M.gold), f * 0.22, -0.05, 0))
  const L = plug(1), R = plug(-1), globe = grp(new Mesh(new SphereGeometry(0.42, 28, 20), M.blue), new Mesh(new SphereGeometry(0.43, 14, 10), new MeshBasicMaterial({ color: 0x9cd8ff, wireframe: true, transparent: true, opacity: 0.4 })))
  const parts = [at(rb(2.6, 0.12, 2.1, M.dark), -0.5, -1.3, 0), at(r, -0.5, -0.2, 0), at(bx(2.3, 2.3, 1.8, M.glass), -0.5, -0.1, 0), curve([[0.2, -1, 0.5], [0.6, -1.15, 0.9], [0.9, -0.9, 0.95]]), at(L, 1.05, -0.85, 0.95), at(R, 1.75, -0.85, 0.95), curve([[1.9, -0.85, 0.95], [2.2, -0.7, 0.8], [2.2, 0, 0.4]]), at(globe, 2.2, 0.4, 0.4), at(padlock(0.42), -0.5, -0.5, 1.02)]
  const m = model(parts, 0.2, -0.4, 0.95), bl = blink(leds); m.tick = t => { bl(t); globe.rotation.y = t * 0.4; L.position.x = 1.05 - Math.abs(Math.sin(t)) * 0.05 }; return m
}
function robot(tone: Material) {
  const face = new Group(), screen = rb(0.56, 0.36, 0.06, std(0x050d22, { metalness: 0.8, roughness: 0.15 }), 0.09); face.add(screen)
  const eye = () => new Mesh(new CapsuleGeometry(0.045, 0.06, 6, 14), M.cyan), e1 = at(eye(), -0.12, 0.02, 0.045), e2 = at(eye(), 0.12, 0.02, 0.045); face.add(e1, e2)
  const head = grp(rb(0.78, 0.6, 0.6, M.white, 0.2), at(face, 0, 0, 0.29), at(cy(0.018, 0.2, M.pale), 0, 0.38, 0), at(new Mesh(new SphereGeometry(0.055, 16, 16), M.cyan), 0, 0.5, 0), at(cy(0.11, 0.07, tone), -0.41, 0, 0), at(cy(0.11, 0.07, tone), 0.41, 0, 0)); head.children[4].rotation.z = head.children[5].rotation.z = Math.PI / 2
  const body = grp(rb(0.66, 0.56, 0.46, M.white, 0.18), at(rb(0.3, 0.2, 0.04, tone, 0.04), 0, 0.04, 0.23)), arm = (s: number) => { const a = new Mesh(new CapsuleGeometry(0.085, 0.26, 6, 14), tone); a.rotation.z = s * 0.35; return at(a, s * 0.43, -0.03, 0) }
  const g = grp(at(head, 0, 0.52, 0), at(body, 0, -0.1, 0), at(arm(-1), -0.43, -0.12, 0), at(arm(1), 0.43, -0.12, 0), at(cy(0.2, 0.12, M.steel, 32, 0.26), 0, -0.44, 0)); return { g, head, e1, e2 }
}
function bots(): Model {
  const tones = [M.blue, std(0x8b6bff), std(0x04b8dc), std(0x2bbf8a)], P = [[0, 0.95, -0.4], [-1.45, -0.35, 0.1], [0, -0.75, 0.95], [1.45, -0.35, 0.1]], R = P.map((_, i) => robot(tones[i])), ring = P.map(p => { const t = new Mesh(new TorusGeometry(0.46, 0.022, 10, 48), M.cyan); t.rotation.x = Math.PI / 2; return at(t, p[0], p[1] - 0.53, p[2]) })
  R[0].g.scale.setScalar(1.12); const links: Mesh[] = [], ord = [0, 1, 2, 3]; ord.forEach(i => { const a = P[i], b = P[(i + 1) % 4], mid = [(a[0] + b[0]) / 2 * 1.15, (a[1] + b[1]) / 2 - 0.35, (a[2] + b[2]) / 2 + 0.2]; links.push(new Mesh(new TubeGeometry(new CatmullRomCurve3([a, mid, b].map(v => new Vector3(v[0], v[1] - 0.3, v[2]))), 40, 0.014, 8), M.steel)) })
  const pk = rb(0.2, 0.15, 0.05, M.amber, 0.03); let on = -1
  const parts = [...R.map((r, i) => at(r.g, P[i][0], P[i][1], P[i][2])), ...ring, ...links, pk], m = model(parts, 0.16, -0.12, 1.02)
  m.tick = t => { R.forEach((r, i) => { r.g.position.y = P[i][1] + Math.sin(t * 1.5 + i * 1.6) * 0.045 + (on === i ? 0.12 : 0); r.head.rotation.y = Math.sin(t * 0.8 + i) * 0.3; const b = (t * 0.6 + i * 0.7) % 3 < 0.12 ? 0.15 : 1; r.e1.scale.y = r.e2.scale.y = b; ring[i].visible = on === i || on < 0; ring[i].scale.setScalar(on === i ? 1.2 + Math.sin(t * 5) * 0.06 : 1) }); const s = Math.floor(t * 0.55), i = on >= 0 ? (on + 3) % 4 : s % 4, k = on >= 0 ? Math.min(1, (t * 0.9) % 1) : (t * 0.55) % 1, a = P[i], b = P[(i + 1) % 4]; pk.position.set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k + Math.sin(k * Math.PI) * 0.35, a[2] + (b[2] - a[2]) * k + 0.5); pk.rotation.y = t * 2 }
  m.act = v => { on = Number(v) }; return m
}
const UI = { bg: '#071634', bar: '#0d2553', line: '#2a4c8f', b: '#0268f4', c: '#04d8fa', w: '#e9f1ff', g: '#2be6a0', dim: '#5f7fb8' }
const frame = (c: Ctx, w: number, h: number) => { rr(c, 0, 0, w, h, UI.bg, 18); rr(c, 0, 0, w, 34, UI.bar, 14); ['#ff6b6b', '#ffc857', '#2be6a0'].forEach((f, i) => { c.fillStyle = f; c.beginPath(); c.arc(22 + i * 22, 17, 6, 0, 7); c.fill() }) }
const bars = (c: Ctx, x: number, y: number, n: number, w: number, f = UI.line, gap = 24) => { for (let i = 0; i < n; i++) rr(c, x, y + i * gap, w * (0.5 + ((i * 37) % 50) / 100), 10, f, 5) }
const VIEW: ((c: Ctx, w: number, h: number) => void)[] = [
  (c, w) => { for (let i = 0; i < 7; i++) { rr(c, 30 + (i % 3) * 26, 60 + i * 30, 22, 18, i % 3 ? UI.c : UI.b, 4); rr(c, 64 + (i % 3) * 26, 64 + i * 30, w * 0.35 + (i % 4) * 22, 10, UI.dim, 5) } },
  (c, w) => { bars(c, 34, 62, 4, w * 0.6, UI.dim, 34); for (let i = 0; i < 3; i++) { rr(c, 34, 200 + i * 28, 16, 16, UI.g, 8); rr(c, 62, 203 + i * 28, w * 0.5 - i * 30, 10, UI.g, 5) } },
  (c, w) => { const f = [UI.c, UI.w, '#8b6bff', UI.g, UI.dim]; for (let i = 0; i < 9; i++) { rr(c, 26, 60 + i * 25, 14, 8, UI.line, 4); let x = 54 + (i % 3) * 22; for (let k = 0; k < 3; k++) { const q = 34 + ((i * 29 + k * 41) % 80); if (x + q < w - 20) rr(c, x, 58 + i * 25, q, 11, f[(i + k) % 5], 5); x += q + 12 } } },
  (c, w, h) => { rr(c, 24, 48, w - 48, 24, UI.bar, 12); rr(c, 24, 88, w - 48, 70, UI.b, 8); for (let i = 0; i < 3; i++) rr(c, 24 + i * ((w - 36) / 3), 174, (w - 72) / 3, h - 200, '#e9f1ff', 8) },
  (c, w) => { c.strokeStyle = UI.line; c.lineWidth = 4; c.beginPath(); c.moveTo(48, 66); c.lineTo(48, 290); c.stroke(); for (let i = 0; i < 5; i++) { c.fillStyle = i < 4 ? UI.c : '#ffc857'; c.beginPath(); c.arc(48, 72 + i * 52, 10, 0, 7); c.fill(); rr(c, 78, 66 + i * 52, w * 0.5 - (i % 3) * 30, 13, UI.dim, 6) } },
  (c, w, h) => { for (let i = 0; i < 4; i++) { rr(c, 30, 62 + i * 40, 26, 26, UI.g, 13); c.strokeStyle = '#04101f'; c.lineWidth = 4; c.beginPath(); c.moveTo(37, 75 + i * 40); c.lineTo(42, 81 + i * 40); c.lineTo(50, 69 + i * 40); c.stroke(); rr(c, 72, 69 + i * 40, w * 0.5, 12, UI.dim, 6) } rr(c, 30, h - 70, 140, 42, UI.b, 8) },
]
// What each solution looks like on its own screen
const SOL: ((c: Ctx, w: number, h: number) => void)[] = [
  (c, w, h) => { rr(c, 0, 34, 170, h - 34, UI.bar, 0); bars(c, 24, 70, 8, 120, UI.dim, 44); for (let i = 0; i < 4; i++) { const r = i % 2; rr(c, r ? w - 330 : 210, 70 + i * 92, 290, 64, r ? UI.b : '#17356f', 24); rr(c, (r ? w - 330 : 210) + 24, 96 + i * 92, 180 - i * 18, 12, UI.w, 6) } },
  (c, w, h) => { for (let x = 0; x < 7; x++) for (let y = 0; y < 5; y++) rr(c, 30 + x * ((w - 50) / 7), 66 + y * ((h - 86) / 5), (w - 50) / 7 - 10, (h - 86) / 5 - 10, (x * 3 + y * 5) % 9 === 0 ? UI.b : (x + y * 2) % 8 === 3 ? UI.c : '#12305f', 8) },
  (c, w, h) => { rr(c, 0, 34, 200, h - 34, UI.bar, 0); bars(c, 26, 70, 9, 150, UI.dim, 40); rr(c, 240, 70, 300, 26, UI.w, 8); bars(c, 240, 126, 9, w - 290, UI.dim, 34) },
  (c, w) => { for (let i = 0; i < 12; i++) { const x = 50 + (i % 4) * ((w - 60) / 4), y = 80 + Math.floor(i / 4) * 124; rr(c, x, y, 56, 18, i % 3 ? UI.b : UI.c, 6); rr(c, x, y + 10, 120, 72, i % 3 ? UI.b : UI.c, 10) } },
  (c, w) => { for (let i = 0; i < 6; i++) { rr(c, 30, 60 + i * 66, w - 60, 54, '#12305f', 12); c.fillStyle = [UI.b, UI.c, UI.g, '#8b6bff'][i % 4]; c.beginPath(); c.arc(64, 87 + i * 66, 19, 0, 7); c.fill(); rr(c, 104, 76 + i * 66, 170, 12, UI.w, 6); rr(c, 104, 96 + i * 66, 110, 8, UI.dim, 4); rr(c, w - 150, 78 + i * 66, 96, 20, i % 2 ? UI.g : UI.b, 10) } },
  (c, w) => { for (let i = 0; i < 5; i++) { rr(c, 30, 64 + i * 78, w - 60, 64, '#12305f', 12); rr(c, 30, 64 + i * 78, 10, 64, ['#ff6b6b', '#ffc857', UI.g, UI.g, UI.c][i], 5); rr(c, 66, 82 + i * 78, 260, 12, UI.w, 6); rr(c, 66, 104 + i * 78, 180, 9, UI.dim, 4) } },
  (c, w, h) => { for (let x = 0; x < 3; x++) { const X = 26 + x * ((w - 40) / 3); rr(c, X, 60, (w - 40) / 3 - 14, h - 86, '#0d2553', 12); for (let i = 0; i < 3 - (x === 2 ? 1 : 0); i++) { rr(c, X + 14, 92 + i * 100, (w - 40) / 3 - 42, 82, '#1a407f', 10); rr(c, X + 30, 110 + i * 100, 90, 11, UI.w, 5); rr(c, X + 30, 140 + i * 100, 50, 14, [UI.c, UI.b, UI.g][x], 7) } } },
  (c, w, h) => { for (let i = 0; i < 9; i++) { const q = 70 + ((i * 67) % 190); rr(c, 40 + i * 54, h - 50 - q, 34, q, i % 3 === 2 ? UI.c : UI.b, 6) } c.strokeStyle = UI.g; c.lineWidth = 6; c.beginPath(); for (let i = 0; i < 9; i++) c.lineTo(57 + i * 54, 190 - Math.sin(i * 0.8) * 36 - i * 8); c.stroke(); c.lineWidth = 38; c.strokeStyle = UI.b; c.beginPath(); c.arc(w - 130, 210, 74, 0, 4); c.stroke(); c.strokeStyle = UI.c; c.beginPath(); c.arc(w - 130, 210, 74, 4, 5.4); c.stroke() },
  (c) => { const N = [[110, 120], [350, 120], [350, 330], [590, 220], [590, 400]]; c.strokeStyle = UI.c; c.lineWidth = 5; for (const [a, b] of [[0, 1], [1, 3], [0, 2], [2, 3], [2, 4]]) { c.beginPath(); c.moveTo(N[a][0], N[a][1]); c.lineTo(N[b][0], N[b][1]); c.stroke() } N.forEach((n, i) => { rr(c, n[0] - 66, n[1] - 34, 132, 68, i % 2 ? UI.b : '#1a407f', 14); rr(c, n[0] - 30, n[1] - 6, 60, 12, UI.w, 6) }) },
  (c, w, h) => { for (let i = 0; i < 4; i++) { const X = 26 + (i % 2) * ((w - 36) / 2), Y = 56 + (i >> 1) * ((h - 120) / 2), W = (w - 64) / 2, H = (h - 150) / 2; rr(c, X, Y, W, H, '#12305f', 12); c.fillStyle = [UI.b, UI.c, '#8b6bff', UI.g][i]; c.beginPath(); c.arc(X + W / 2, Y + H * 0.42, 34, 0, 7); c.fill(); c.beginPath(); c.arc(X + W / 2, Y + H + 14, 78, Math.PI * 1.16, Math.PI * 1.84); c.fill() } rr(c, w / 2 - 90, h - 56, 180, 38, UI.bar, 19); c.fillStyle = '#ff4d5e'; c.beginPath(); c.arc(w / 2, h - 37, 15, 0, 7); c.fill() },
  (c, w, h) => { rr(c, w / 2 - 170, 66, 340, h - 96, '#12305f', 20); c.strokeStyle = UI.c; c.lineWidth = 13; c.beginPath(); c.arc(w / 2, 150, 34, Math.PI, 0); c.stroke(); rr(c, w / 2 - 52, 150, 104, 80, UI.b, 14); rr(c, w / 2 - 124, 264, 248, 46, '#071634', 10); for (let i = 0; i < 6; i++) { c.fillStyle = UI.w; c.beginPath(); c.arc(w / 2 - 90 + i * 30, 287, 7, 0, 7); c.fill() } rr(c, w / 2 - 124, 330, 248, 48, UI.b, 10) },
  (c, w, h) => { c.fillStyle = UI.c; c.save(); c.translate(w / 2, 150); c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 20 : 78; c.lineTo(Math.cos(a) * r, Math.sin(a) * r) } c.fill(); c.restore(); bars(c, 130, 270, 3, w - 260, UI.dim, 30); rr(c, 90, h - 90, w - 180, 56, '#17356f', 28); rr(c, w - 160, h - 82, 60, 40, UI.b, 20) },
  (c, w) => { rr(c, 24, 50, w - 48, 110, UI.b, 12); rr(c, 60, 84, 220, 20, UI.w, 8); for (let i = 0; i < 4; i++) { const X = 24 + i * ((w - 30) / 4); rr(c, X, 182, (w - 90) / 4, 170, '#e9f1ff', 10); rr(c, X + 22, 206, (w - 90) / 4 - 44, 82, ['#9cc0f5', '#8fe5f7', '#b9a8ff', '#9fe9cb'][i], 10); rr(c, X + 22, 306, 60, 24, UI.b, 8) } },
  (c, w, h) => { c.strokeStyle = UI.g; c.lineWidth = 6; c.beginPath(); for (let x = 30; x < w - 30; x += 6) { const k = (x * 0.013) % 1; c.lineTo(x, 190 + (k > 0.6 && k < 0.66 ? -100 : k > 0.66 && k < 0.72 ? 80 : 0)) } c.stroke(); for (let i = 0; i < 4; i++) { rr(c, 30 + i * ((w - 40) / 4), h - 130, (w - 100) / 4, 92, '#12305f', 12); rr(c, 50 + i * ((w - 40) / 4), h - 100, 22, 22, i === 2 ? '#ffc857' : UI.g, 11) } },
]
function monitor() {
  const tx = canvas(720, 450, c => { frame(c, 720, 450); SOL[0](c, 720, 450) }), shell = rb(3.7, 2.4, 0.14, M.steel, 0.08), scr = at(new Mesh(new PlaneGeometry(3.52, 2.2), new MeshBasicMaterial({ map: tx.t })), 0, 0, 0.076)
  return { tx, g: grp(shell, scr) }
}
function desk(): Model {
  const mo = monitor(), keys: [number, number, number, number, number, number][] = []; for (let r = 0; r < 4; r++) for (let k = 0; k < 13; k++) keys.push([-0.96 + k * 0.16, 0.05, -0.2 + r * 0.13, 0.13, 0.03, 0.1])
  const kb = grp(rb(2.2, 0.07, 0.66, M.dark, 0.03), inst(unit, M.pale, keys)); kb.rotation.x = 0.06
  const parts = [at(mo.g, 0, 0.45, 0), at(cy(0.12, 0.6, M.steel), 0, -0.95, -0.05), at(cy(0.6, 0.06, M.steel, 48), 0, -1.26, 0), at(kb, -0.25, -1.22, 1.05), at(rb(0.24, 0.12, 0.38, M.white, 0.06), 1.25, -1.2, 1.05)], m = model(parts, 0.12, -0.4, 0.95)
  m.act = v => mo.tx.redraw(c => { frame(c, 720, 450); (SOL[Number(v)] ?? SOL[0])(c, 720, 450) }); return m
}
function nova(): Model {
  const pos = [[-1.28, 0.95, 0.35], [0, 1.15, 0], [1.28, 0.95, 0.35], [-1.28, -0.35, 0.35], [0, -0.2, 0], [1.28, -0.35, 0.35]], ry = [0.42, 0, -0.42, 0.42, 0, -0.42]; let sel = 0
  const W = VIEW.map((f, i) => { const t = canvas(400, 340, c => { frame(c, 400, 340); f(c, 400, 340) }), g = grp(rb(1.2, 1.02, 0.06, M.steel, 0.03), at(new Mesh(new PlaneGeometry(1.14, 0.97), new MeshBasicMaterial({ map: t.t })), 0, 0, 0.034)); g.rotation.y = ry[i]; return at(g, pos[i][0], pos[i][1], pos[i][2]) })
  const keys: [number, number, number, number, number, number][] = []; for (let r = 0; r < 4; r++) for (let k = 0; k < 14; k++) keys.push([-1.04 + k * 0.16, 0.05, -0.2 + r * 0.13, 0.13, 0.03, 0.1])
  const kb = grp(rb(2.4, 0.07, 0.68, M.dark, 0.03), inst(unit, M.pale, keys)), tower = grp(rb(0.5, 1, 0.7, M.steel, 0.05), at(new Mesh(new TorusGeometry(0.13, 0.02, 10, 40), M.cyan), 0, 0.2, 0.36), at(bx(0.3, 0.02, 0.01, M.cyan), 0, -0.25, 0.36))
  const parts = [...W, at(kb, 0, -1.35, 0.9), at(tower, 1.75, -1.25, -0.3), at(rb(4.2, 0.07, 1.9, M.floor), 0, -1.6, 0.4)], m = model(parts, 0.1, -0.25, 0.95)
  m.tick = t => W.forEach((g, i) => { const k = i === sel ? 1 : 0; g.position.z += (pos[i][2] + k * 0.45 - g.position.z) * 0.08; const s = g.scale.x + (1 + k * 0.1 - g.scale.x) * 0.08; if (g.userData.in) g.scale.setScalar(s); g.position.y = pos[i][1] + Math.sin(t * 1.2 + i) * 0.02 }); m.act = v => { sel = Number(v) }; return m
}
function gpu(): Model {
  const fans: Group[] = [], fan = (x: number) => { const b = new Group(); for (let i = 0; i < 11; i++) { const sh = new Shape(); sh.moveTo(0.13, -0.03); sh.quadraticCurveTo(0.32, -0.12, 0.5, 0.05); sh.lineTo(0.5, 0.17); sh.quadraticCurveTo(0.3, 0.05, 0.13, 0.08); const bl = new Mesh(new ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false }), M.steel); bl.rotation.z = (i / 11) * Math.PI * 2; bl.rotation.y = 0.25; b.add(bl) } const hub = cy(0.15, 0.1, M.dark); hub.rotation.x = Math.PI / 2; b.add(hub, at(new Mesh(new TorusGeometry(0.09, 0.012, 8, 32), M.cyan), 0, 0, 0.055)); fans.push(b); return at(grp(new Mesh(new TorusGeometry(0.56, 0.045, 12, 56), M.pale), b), x, 0.12, 0.3) }
  const fins: [number, number, number, number, number, number][] = []; for (let i = 0; i < 64; i++) fins.push([-1.75 + i * 0.0555, 0.1, 0, 0.012, 1.18, 0.36])
  const pins: typeof fins = []; for (let i = 0; i < 30; i++) pins.push([-0.95 + i * 0.05, -0.93, -0.24, 0.03, 0.16, 0.035])
  const cells: Mesh[] = []; for (let i = 0; i < 12; i++) cells.push(at(bx(0.2, 0.1, 0.02, M.dark), -1.32 + i * 0.24, -0.62, 0.275))
  const shr = new Shape(); shr.moveTo(-1.9, -0.75); shr.lineTo(1.75, -0.75); shr.lineTo(1.95, -0.45); shr.lineTo(1.95, 0.8); shr.lineTo(-1.7, 0.8); shr.lineTo(-1.9, 0.55); shr.closePath(); for (const x of [-0.9, 0.9]) { const h = new Shape(); h.absarc(x, 0.12, 0.6, 0, Math.PI * 2); shr.holes.push(h) }
  const shroud = new Mesh(new ExtrudeGeometry(shr, { depth: 0.1, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, curveSegments: 40 }), std(0x2a4f9c, { metalness: 0.35, roughness: 0.35 })), strip = bx(0.5, 0.03, 0.03, M.cyan)
  const parts = [at(rb(3.8, 1.72, 0.05, std(0x0d3577, { metalness: 0.2 })), 0, -0.02, -0.25), inst(unit, M.pale, fins), at(shroud, 0, 0, 0.16), fan(-0.9), fan(0.9), grp(...cells), inst(unit, M.gold, pins), at(rb(0.05, 2.1, 0.75, M.pale, 0.02), -2, -0.1, 0), at(strip, 0, 0.7, 0.3), at(rb(0.4, 0.16, 0.24, M.dark), 1.35, 0.9, -0.05)]
  const m = model(parts, 0.14, -0.5, 0.95); let load = 0, want = 0, speed = 2, last = 0
  m.tick = t => { const dt = Math.min(0.05, t - last); last = t; load += (want - load) * 0.08; speed += (2 + load * 16 - speed) * 0.05; fans.forEach((f, i) => { f.rotation.z -= dt * speed * (i ? 1 : -1) }); cells.forEach((c, i) => { c.material = i < Math.round(load * 12) ? M.cyan : M.dark }) }
  m.act = v => { if (typeof v === 'boolean') { strip.material = v ? M.ok : M.bad; setTimeout(() => { strip.material = M.cyan }, 1400) } else want = Number(v) }; return m
}
function shop(): Model {
  const accent = std(0x0268f4, { metalness: 0.05, roughness: 0.6 }), wall = std(0xdfeaff, { metalness: 0, roughness: 0.8 }), awn = new Group()
  for (let i = 0; i < 12; i++) { const s = bx(0.28, 0.05, 1, i % 2 ? M.white : accent); s.rotation.x = 0.42; awn.add(at(s, -1.54 + i * 0.28, 0, 0)); const e = cy(0.14, 0.05, i % 2 ? M.white : accent, 24); e.rotation.x = Math.PI / 2; awn.add(at(e, -1.54 + i * 0.28, -0.2, 0.46)) }
  const sign = canvas(700, 120, c => { rr(c, 0, 0, 700, 120, '#0b2a5b', 16); c.fillStyle = '#fff'; c.font = '600 64px Alexandria, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('STORELOOM', 350, 64) })
  document.fonts?.load('600 64px Alexandria').then(() => sign.redraw(c => { rr(c, 0, 0, 700, 120, '#0b2a5b', 16); c.fillStyle = '#fff'; c.font = '600 64px Alexandria, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('STORELOOM', 350, 64) }))
  const goods = new Group(); const col = [0x04d8fa, 0x8b6bff, 0x2bbf8a, 0xffc857]; for (let r = 0; r < 2; r++) { goods.add(at(bx(1.6, 0.04, 0.3, M.pale), -0.62, -0.95 + r * 0.6, 0.5)); for (let i = 0; i < 5; i++) goods.add(at(i % 2 ? cy(0.09, 0.28, std(col[(i + r) % 4])) : rb(0.2, 0.26, 0.16, std(col[(i + r) % 4])), -1.25 + i * 0.31, -0.79 + r * 0.6, 0.5)) }
  const door = grp(rb(0.82, 1.6, 0.06, accent, 0.03), at(bx(0.58, 1.1, 0.07, M.window), 0, 0.12, 0), at(cy(0.025, 0.3, M.gold), -0.32, -0.1, 0.07))
  const bulbs = inst(new SphereGeometry(0.05, 12, 12), M.amber, Array.from({ length: 5 }, (_, i) => [-1.4 + i * 0.7, 0.18, 0.85] as [number, number, number]))
  const plant = () => grp(cy(0.16, 0.24, M.blue, 24, 0.2), at(new Mesh(new SphereGeometry(0.24, 20, 16), std(0x2bbf8a, { roughness: 0.9, metalness: 0 })), 0, 0.3, 0))
  const parts = [at(rb(4.2, 0.1, 2.6, M.floor), 0, -1.6, 0.1), at(bx(3.5, 2.9, 0.1, wall), 0, -0.1, -0.7), at(bx(0.1, 2.9, 1.3, wall), -1.72, -0.1, -0.1), at(bx(0.1, 2.9, 1.3, wall), 1.72, -0.1, -0.1), at(bx(3.6, 0.12, 1.6, M.steel), 0, 1.4, -0.05), goods, at(bx(2, 1.5, 0.03, M.glass), -0.62, -0.6, 0.66), at(bx(2.1, 0.3, 0.2, wall), -0.62, -1.42, 0.6), at(door, 1.05, -0.78, 0.6), at(awn, 0, 0.45, 1), at(grp(rb(2.6, 0.48, 0.1, M.steel, 0.04), at(new Mesh(new PlaneGeometry(2.5, 0.43), new MeshBasicMaterial({ map: sign.t })), 0, 0, 0.056)), 0, 1, 0.66), bulbs, at(plant(), -1.85, -1.4, 1.05), at(plant(), 1.85, -1.4, 1.05)]
  const m = model(parts, 0.14, -0.42, 0.92); m.act = v => { if (typeof v === 'string') accent.color.set(v as unknown as Color) }; return m
}
// The four product marks around the company mark
function marks(): Model {
  const fine = (c: number) => std(c, { metalness: 0.2, roughness: 0.35, emissive: c, emissiveIntensity: 0.18 }), ex = (s: Shape, m: Material, d = 0.16) => { const g = new ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.02, bevelSegments: 2, curveSegments: 24 }); g.translate(0, 0, -d / 2); return new Mesh(g, m) }
  const star = (r: number) => { const s = new Shape(), k = 0.3, j = 0.16; s.moveTo(0, r); s.bezierCurveTo(j * r, k * r, k * r, j * r, r, 0); s.bezierCurveTo(k * r, -j * r, j * r, -k * r, 0, -r); s.bezierCurveTo(-j * r, -k * r, -k * r, -j * r, -r, 0); s.bezierCurveTo(-k * r, j * r, -j * r, k * r, 0, r); return s }
  const hexa = (r: number) => Array.from({ length: 6 }, (_, i) => [Math.sin(i * Math.PI / 3) * r, Math.cos(i * Math.PI / 3) * r] as const), path = (p: readonly (readonly number[])[]) => { const s = new Shape(); p.forEach((v, i) => i ? s.lineTo(v[0], v[1]) : s.moveTo(v[0], v[1])); s.closePath(); return s }
  const blue = fine(0x0a7cff), cyan = fine(0x04d8fa), violet = fine(0x6f6bff), green = fine(0x22c98f)
  const orbit = new Mesh(new TorusGeometry(0.78, 0.035, 12, 64), cyan); orbit.scale.set(1, 0.42, 1); orbit.rotation.z = 0.42
  const eyes = [-0.1, 0.1].map(x => at(new Mesh(new CapsuleGeometry(0.035, 0.13, 6, 12), M.white), x, 0, 0.11))
  const bots = grp(ex(star(0.66), violet), orbit, at(new Mesh(new SphereGeometry(0.1, 20, 20), cyan), 0.68, 0.36, 0), ...eyes)
  const novaM = grp(at(ex(star(0.68), blue), -0.08, -0.06, 0), at(ex(star(0.24), cyan), 0.52, 0.48, 0))
  const hs = path(hexa(0.76)); hs.holes.push(path([...hexa(0.64)].reverse())); const loco = grp(ex(hs, blue), new Mesh(new TorusGeometry(0.31, 0.05, 14, 48), cyan), at(bx(0.56, 0.07, 0.07, M.white), 0, 0, 0), at(new Mesh(new SphereGeometry(0.13, 24, 24), green), 0.3, 0, 0))
  const bag = path([[-0.62, 0.34], [0.62, 0.34], [0.5, -0.7], [-0.5, -0.7]]); bag.holes.push(path([[-0.51, 0.24], [-0.42, -0.6], [0.42, -0.6], [0.51, 0.24]])); const handle = at(new Mesh(new TorusGeometry(0.28, 0.05, 12, 40, Math.PI), cyan), 0, 0.36, 0), cells = [[-0.2, 0.06], [0.14, 0.06], [-0.03, -0.17], [0.28, -0.17], [-0.19, -0.4], [0.12, -0.4]].map(([x, y]) => at(rb(0.15, 0.17, 0.12, cyan, 0.02), x, y, 0)), store = grp(ex(bag, blue), handle, ...cells)
  const icons = [bots, novaM, loco, store], P = [[-1.12, 1.02], [1.12, 1.02], [-1.12, -1.02], [1.12, -1.02]], ax = new Group(), tone = [blue, fine(0x0252d8), fine(0x0266e8), fine(0x0298ff), cyan]
  POLYS.forEach((p, i) => ax.add(ex(path(p.map(([x, y]) => [(x - 726) / 700, (332 - y) / 700])), tone[i], 0.14))); ax.scale.setScalar(0.001)
  let on = -1, spread = 1, mid = 0
  const m = model([...icons.map((g, i) => at(g, P[i][0], P[i][1], 0)), ax], 0.02, -0.22, 1)
  m.tick = t => { const all = on === 4; spread += ((all ? 1.22 : 1) - spread) * 0.05; mid += ((all ? 1 : 0) - mid) * 0.06; ax.scale.setScalar(Math.max(0.001, mid * 0.95)); icons.forEach((g, i) => { if (!g.userData.in) return; const hit = on === i, q = g.userData.k ?? 1, k = q + ((hit ? 1.28 : all || on < 0 ? 1 : 0.74) - q) * 0.08; g.userData.k = k; g.scale.setScalar(k * (all ? 0.86 : 1)); g.position.set(P[i][0] * spread, P[i][1] * spread + Math.sin(t * 1.1 + i * 1.5) * 0.04, hit ? 0.35 : 0); g.rotation.y = Math.sin(t * 0.8 + i) * 0.18 }) }
  m.act = v => { on = Number(v) }; return m
}
export const makers: Record<string, () => Model> = { build, own, innovate: chip, onprem, cloud, airgap, bots, nova, loco: gpu, storeloom: shop, desk, marks }
// Warm light spill under a model
export function halo() { const c = canvas(256, 256, x => { const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(2,104,244,.5)'); g.addColorStop(1, 'rgba(2,104,244,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256) }); const m = new Mesh(new PlaneGeometry(6.4, 6.4), new MeshBasicMaterial({ map: c.t, transparent: true, depthWrite: false, blending: AdditiveBlending })); m.rotation.x = -Math.PI / 2; return m }
