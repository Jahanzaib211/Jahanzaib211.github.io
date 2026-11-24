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

// Software being made: written lines turn into light, the light becomes the product piece by piece, and each check passes
function build(): Model {
  const LINES = [[0, 30, 1], [1, 46, 0], [1, 34, 2], [2, 52, 0], [2, 40, 3], [2, 28, 1], [1, 22, 0], [1, 44, 2], [2, 36, 3], [2, 50, 0], [1, 26, 1], [0, 18, 0]], INK = [UI.dim, UI.c, '#7fb4ff', UI.g], CYCLE = 13, WRITE = 7.5
  const code = (n: number) => (c: Ctx) => { frame(c, 704, 480); rr(c, 0, 34, 52, 446, '#0a1f48', 0); if (n < LINES.length) rr(c, 52, 52 + n * 34, 652, 34, '#0e2a5e', 0); LINES.forEach(([tab, w, ink], i) => { const y = 62 + i * 34; rr(c, 18, y + 3, 18, 8, i < n ? '#3f6bb5' : '#1c3a75', 4); if (i >= n) return; const x = 78 + tab * 36; rr(c, x, y, w * 3.6, 14, INK[ink], 7); rr(c, x + w * 3.6 + 12, y, 70 + ((i * 47) % 130), 14, '#35589f', 7) }); if (n < LINES.length) rr(c, 78 + LINES[n][0] * 36, 58 + n * 34, 5, 22, '#e9f1ff', 2) }
  const tx = canvas(704, 480, code(LINES.length)), face = new Mesh(new PlaneGeometry(3.02, 2.06), new MeshBasicMaterial({ map: tx.t })); face.position.z = 0.056
  const edge = (w: number, h: number, z: number, m: Material, k = 0.02) => inst(unit, m, [[0, h / 2, z, w, k, k], [0, -h / 2, z, w, k, k], [w / 2, 0, z, k, h, k], [-w / 2, 0, z, k, h, k]])
  const editor = grp(rb(3.14, 2.18, 0.1, M.dark, 0.06), face, edge(3.14, 2.18, 0.05, M.blue)); editor.rotation.y = 0.16
  // The product, in solid pieces
  const card = std(0x1b4fa8, { emissive: 0x0a2d73, emissiveIntensity: 0.7, metalness: 0.2 }), W = 1.62, H = 2.2, app = grp(rb(W, H, 0.12, std(0x0b1c40, { metalness: 0.3 }), 0.07), edge(W, H, 0.06, M.cyan, 0.024)); app.rotation.y = -0.2
  const piece = (w: number, h: number, x: number, y: number, m: Material, ...more: Object3D[]) => { const g = grp(rb(w, h, 0.1, m, 0.04), ...more); g.position.set(x, y, 0.12); app.add(g); return g }
  const row = (w: number, x: number, y: number, m: Material) => at(rb(w, 0.06, 0.03, m, 0.015), x, y, 0.06)
  const pieces = [piece(1.4, 0.24, 0, 0.88, M.blue, row(0.42, -0.4, 0, M.white), at(cy(0.05, 0.03, M.white, 20), 0.56, 0, 0.06)), piece(0.66, 0.52, -0.37, 0.44, card, row(0.3, -0.12, 0.13, M.pale), row(0.46, -0.04, -0.06, M.white)), piece(0.66, 0.52, 0.37, 0.44, card, row(0.3, -0.12, 0.13, M.pale), row(0.4, -0.07, -0.06, M.ok)), piece(1.4, 0.74, 0, -0.24, card), piece(0.66, 0.24, -0.37, -0.82, M.cyan, row(0.3, 0, 0, M.white)), piece(0.66, 0.24, 0.37, -0.82, card, row(0.3, 0, 0, M.pale))]
  ;(pieces[0].children[2] as Mesh).rotation.x = Math.PI / 2
  const tall = [0.2, 0.36, 0.28, 0.46, 0.4, 0.58], chart = tall.map((h, i) => { const b = grp(at(rb(0.13, 1, 0.1, i === 5 ? M.cyan : M.blue, 0.02), 0, 0.5, 0)); b.position.set(-0.5 + i * 0.2, -0.31, 0.06); b.scale.y = h; pieces[3].add(b); return b })
  // Light travels from the written lines into the product
  const paths = [0.55, 0.15, -0.25, -0.6].map((y, i) => new CatmullRomCurve3([new Vector3(-0.1, 0.35 + y, -0.35), new Vector3(0.35, 0.6 + y * 0.8, 0.5 + i * 0.1), new Vector3(0.85, 0.3 + y * 0.7, 0.95), new Vector3(1.2, -0.1 + y * 0.8, 0.75)]))
  const haze = new MeshBasicMaterial({ color: 0x04d8fa, transparent: true, opacity: 0.22, blending: AdditiveBlending, depthWrite: false }), lines = grp(...paths.map(p => new Mesh(new TubeGeometry(p, 40, 0.008, 6), haze)))
  const N = 32, sparks = inst(new SphereGeometry(0.032, 10, 10), M.cyan, Array.from({ length: N }, () => [0, 0, 0] as [number, number, number])), o = new Object3D(), v = new Vector3()
  // Four checks on the base
  const rings: Mesh[] = [], nodes: Mesh[] = [], fill = at(bx(1, 0.03, 0.05, M.ok), 0, 0.005, 0), track = grp(at(bx(2.7, 0.025, 0.04, M.steel), 0, 0, 0), fill)
  for (let i = 0; i < 4; i++) { const x = -1.35 + i * 0.9, n = at(new Mesh(new SphereGeometry(0.105, 24, 24), M.ok), x, 0.05, 0), r = at(new Mesh(new TorusGeometry(0.2, 0.014, 8, 40), M.ok), x, 0, 0); r.rotation.x = Math.PI / 2; nodes.push(n); rings.push(r); track.add(n, r) }
  const base = grp(rb(3.9, 0.12, 2.5, M.floor, 0.06), at(inst(unit, M.blue, [[0, 0, 1.25, 3.8, 0.03, 0.02], [0, 0, -1.25, 3.8, 0.03, 0.02], [1.95, 0, 0, 0.02, 0.03, 2.4], [-1.95, 0, 0, 0.02, 0.03, 2.4]]), 0, 0.05, 0))
  const m = model([at(base, 0, -1.72, 0), at(editor, -0.5, 0.2, -0.6), at(app, 1.08, -0.35, 0.5), at(track, -0.1, -1.6, 0.98), lines, sparks], 0.17, -0.3, 1.08)
  const ease = (k: number) => 1 - (1 - k) ** 3, part = (c: number, from: number, len: number) => Math.min(1, Math.max(0, (c - from) / len)); let was = -1
  // Standing still shows the finished work
  m.tick = t => {
    const c = t === 0 ? CYCLE - 2 : t % CYCLE, out = part(c, CYCLE - 0.9, 0.9), n = out ? 0 : Math.min(LINES.length, Math.floor((c / WRITE) * (LINES.length + 1)))
    if (n !== was) { was = n; tx.redraw(code(n)) }
    pieces.forEach((g, i) => { const k = ease(part(c, 0.9 + i * 1.05, 1.1)) * (1 - out); g.position.z = 0.12 + (1 - k) * 0.9; g.scale.setScalar(Math.max(0.001, k)) })
    chart.forEach((b, i) => { b.scale.y = Math.max(0.001, tall[i] * ease(part(c, 4.7 + i * 0.16, 0.8))) })
    const live = part(c, 0.6, 0.6) * (1 - part(c, WRITE - 0.2, 0.8)); haze.opacity = 0.05 + 0.2 * live
    for (let i = 0; i < N; i++) { const k = (t * 0.42 + i / N + (i % 4) * 0.13) % 1; paths[i % 4].getPoint(k, v); o.position.copy(v); o.scale.setScalar(Math.max(0.0001, Math.sin(k * Math.PI) * live)); o.updateMatrix(); sparks.setMatrixAt(i, o.matrix) } sparks.instanceMatrix.needsUpdate = true
    const go = part(c, WRITE, 2.6) * (1 - out); fill.scale.x = Math.max(0.001, go * 2.7); fill.position.x = -1.35 + (go * 2.7) / 2
    nodes.forEach((x, i) => { const d = go >= (i + 0.02) / 3.02 && go > 0, now = part(c, WRITE + (i / 3) * 2.6, 0.7); x.material = rings[i].material = d ? M.ok : M.steel; rings[i].scale.setScalar(d ? 1 + Math.sin(now * Math.PI) * 0.45 : 1) })
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
