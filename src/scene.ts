import { WebGLRenderer, Scene, PerspectiveCamera, Group, MeshPhysicalMaterial, Mesh, Shape, ExtrudeGeometry, Color, HemisphereLight, DirectionalLight, PointLight, Object3D, NoToneMapping, PMREMGenerator, Float32BufferAttribute, Fog, SRGBColorSpace, MathUtils, Vector3 } from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { gsap } from 'gsap'
import { POLYS, toWorld } from './formations'
import { makers, halo, type Model } from './models'

export interface World { setForm(name: string): void; pulse(): void; gate(ok: boolean): void; act(name: string, v: number | string | boolean): void }
interface Stop { el: HTMLElement; text: HTMLElement; form: string; side: number }

export function createWorld(canvas: HTMLCanvasElement, reduced: boolean): World {
  const small = innerWidth < 900
  const r = new WebGLRenderer({ canvas, antialias: !small, alpha: true, powerPreference: 'high-performance' })
  r.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 1.75))
  r.toneMapping = NoToneMapping; r.outputColorSpace = SRGBColorSpace
  const scene = new Scene(); scene.fog = new Fog(0x050a16, 8, 16)
  const light = () => { const pm = new PMREMGenerator(r); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.12; pm.dispose() }; light()
  const cam = new PerspectiveCamera(36, 1, 0.1, 40); cam.position.z = 10
  scene.add(new HemisphereLight(0xb8dcff, 0x0a1c50, 1.5))
  const key = new DirectionalLight(0xffffff, 1.7); key.position.set(3, 5, 6); scene.add(key)
  const rim = new PointLight(0x04d8fa, 34, 14); rim.position.set(-4, 1, -3); scene.add(rim)
  const spark = new PointLight(0x0268f4, 0, 9); spark.position.set(0, 0, 2); scene.add(spark)
  const root = new Group(); scene.add(root)

  // Solid ribbons, extruded from the same polygons as the printed logo
  const ribbons: Mesh[] = []
  const stops = [['#0254ff', '#00c8ff'], ['#0230b4', '#008cff'], ['#008cff', '#0230b0'], ['#0260fb', '#00e6ff'], ['#0094e0', '#00f0ff']]
  POLYS.forEach((poly, k) => {
    const sh = new Shape(); poly.forEach(([x, y], i) => { const [a, b] = toWorld(x, y); i ? sh.lineTo(a, b) : sh.moveTo(a, b) })
    const g = new ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.025, bevelSegments: 2 }); g.translate(0, 0, -0.15)
    g.computeBoundingBox(); const bb = g.boundingBox!, p = g.attributes.position, col: number[] = [], A = new Color(stops[k][0]), B = new Color(stops[k][1]), c = new Color()
    for (let i = 0; i < p.count; i++) { let t = (p.getY(i) - bb.min.y) / (bb.max.y - bb.min.y); if (k === 1 || k === 3) t = 1 - t; c.copy(A).lerp(B, t); col.push(c.r, c.g, c.b) }
    g.setAttribute('color', new Float32BufferAttribute(col, 3))
    const m = new Mesh(g, new MeshPhysicalMaterial({ vertexColors: true, metalness: 0.15, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.3, emissive: 0x0146c8, emissiveIntensity: 0.22, transparent: true }))
    ribbons.push(m); root.add(m)
  })
  const scatter = [[-3, 2, 2, 1.2], [2, 3, -3, -1.6], [-2, -3, 3, 1.4], [3, -2, -2, -1.1], [4, 2.5, 2, 1.8]]
  const intro = { t: reduced ? 1 : 0 }

  // Real models, built when first needed and assembled part by part
  const made = new Map<string, { m: Model; pod: Group; w: number; home: Vector3[]; off: Vector3[]; spin: Vector3[] }>()
  const get = (n: string) => {
    let e = made.get(n); if (e || !makers[n]) return e
    const m = makers[n](), home = m.parts.map(o => o.position.clone())
    const off = home.map((h, i) => { const a = i * 2.4; return new Vector3(h.x * 0.9 + Math.cos(a) * 1.6, h.y * 0.9 + Math.sin(a * 1.3) * 1.8, h.z + Math.sin(a) * 1.8) })
    const pod = new Group(), glow = halo(); glow.position.y = -1.95; pod.add(m.root, glow); pod.visible = false; scene.add(pod)
    e = { m, pod, w: 0, home, off, spin: home.map((_, i) => new Vector3(Math.sin(i * 1.9) * 0.9, Math.cos(i * 2.7) * 1.1, 0)) }; made.set(n, e); return e
  }
  const base = new Map<Object3D, Vector3>()
  const sections: Stop[] = [...document.querySelectorAll<HTMLElement>('[data-form]')].map(el => ({ el, text: el.closest<HTMLElement>('.story-col') ?? el.querySelector<HTMLElement>('.panel,.say-big,.f-col,.h-text') ?? el, form: el.dataset.form!, side: Number(el.dataset.side ?? 1) * (document.dir === 'rtl' ? -1 : 1) }))
  let target = sections[0]?.form ?? 'logo', override = '', cur = sections[0], logoW = sections[0]?.form === 'logo' ? 1 : 0, px = 0, py = 0, mx = 0, my = 0, sc = 0.62, boost = 0, dirty = true
  let hold = 0
  const flash = { v: 0 }
  const home = sections[0]?.form === 'logo'
  const locate = () => {
    const mid = innerHeight * 0.52; let best = sections[0], d = 1e9
    for (const s of sections) { const b = s.el.getBoundingClientRect(), k = Math.abs((b.top + b.bottom) / 2 - mid); if (k < d) { d = k; best = s } }
    if (best !== cur) { cur = best; override = '' }
    target = override || (cur.el.dataset.active ?? cur.form); canvas.dataset.form = target; dirty = true
  }
  const size = () => {
    r.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight
    cam.position.z = cam.aspect < 0.8 ? 14.5 : cam.aspect < 1.2 ? 12.5 : 10.5; (scene.fog as Fog).near = cam.position.z - 1; (scene.fog as Fog).far = cam.position.z + 6; cam.updateProjectionMatrix(); locate()
  }
  addEventListener('resize', size); addEventListener('scroll', locate, { passive: true })
  if (!reduced && matchMedia('(pointer:fine)').matches) addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5 }, { passive: true })

  let last = performance.now(), run = true, raf = 0, until = 0, lost = false
  function frame(now: number) {
    if (!run) return
    raf = requestAnimationFrame(frame)
    const dt = Math.min((now - last) / 1000, 0.05); last = now
    if (reduced && !dirty && now > until) return
    const k1 = reduced ? 1 : 1 - Math.exp(-dt * 4), vh = innerHeight, unit = (2 * Math.tan((cam.fov * Math.PI) / 360) * cam.position.z) / vh
    const wide = innerWidth >= 900 || (vh < 520 && innerWidth > vh), fit = innerWidth >= 900 && cam.aspect < 1.5 ? 0.8 : 1, time = reduced ? 0 : now / 1000
    px += (mx - px) * Math.min(1, dt * 4); py += (my - py) * Math.min(1, dt * 4)
    // Where each section's writing is now. Its model is pinned to that place, so both move as one.
    const placed = new Map<string, { y: number; side: number; on: boolean }>(); let logo: { y: number; x: number; s: number; on: boolean } | null = null
    for (const s of sections) {
      const box = s.el.getBoundingClientRect()
      const reach = wide ? Math.max(box.bottom, s.text.getBoundingClientRect().bottom) : box.bottom
      if (reach < -vh || box.top > vh * 2) continue
      if (s.form === 'logo') {
        const first = s === sections[0]
        if (first) { const at0 = box.top + scrollY, y = wide ? (vh / 2 - (box.top + box.height / 2)) * unit : (2.2 / unit + (at0 - box.top)) * unit, on = box.bottom > vh * 0.12; if (on || !logo) logo = { y, x: wide ? s.side * 2.55 * Math.min(cam.aspect / 1.7, 1.1) : 0, s: wide ? 0.62 * fit : 0.56, on } }
        else { const h = s.el.querySelector('h2')!.getBoundingClientRect(), on = h.top < vh * 1.25; if (on) logo = { y: (vh / 2 - (box.top + (h.top - box.top) * 0.52)) * unit, x: 0, s: wide ? 0.62 : 0.5, on } }
        continue
      }
      const name = s === cur && override ? override : (s.el.dataset.active ?? s.form); let c: number
      const pin = s.el.querySelector<HTMLElement>('[data-pin]')
      if (wide && pin) { const q = pin.getBoundingClientRect(), want = (q.top + q.bottom) / 2 - box.top; hold += (want - (hold || want)) * k1; if (!hold) hold = want; c = box.top + hold; c = Math.min(Math.max(c, Math.min(vh * 0.4, box.top + box.height)), Math.max(vh * 0.62, box.top + vh * 0.3)) }
      else if (wide) { const q = s.text.getBoundingClientRect(), half = Math.min(q.height / 2, vh * 0.36); c = Math.min(Math.max(vh / 2, q.top + half), q.bottom - half) }
      else c = box.top + Math.min(vh * 0.3, 270) + (s.el.classList.contains('story-top') ? 0 : 30)
      placed.set(name, { y: (vh / 2 - c) * unit, side: s.side, on: c > -vh * 0.2 && c < vh * 1.12 }); if (Math.abs(c - vh / 2) < vh * 1.4) get(name)
    }
    const isLogo = !!logo?.on
    logoW += ((isLogo ? 1 : 0) - logoW) * (reduced ? 1 : 1 - Math.exp(-dt * 5))
    if (logo) { root.position.set(logo.x, logo.y, 0); sc += (logo.s - sc) * (logoW < 0.05 ? 1 : k1) }
    root.scale.setScalar(sc); root.rotation.set(py * 0.28, px * 0.65, 0)
    const it = intro.t
    ribbons.forEach((m, i) => {
      const s = scatter[i], e = 1 - MathUtils.clamp(it * 1.5 - i * 0.1, 0, 1), away = e * e * (3 - 2 * e) * 1.5 + (1 - logoW)
      m.position.set(s[0] * away, s[1] * away, s[2] * away); m.rotation.set(s[3] * away, s[3] * away * 1.4, 0)
      ;(m.material as MeshPhysicalMaterial).opacity = MathUtils.clamp(logoW * 1.6 - 0.5, 0, 1) * Math.min(1, it * 2.5); m.visible = logoW > 0.02
    })
    boost += (0 - boost) * Math.min(1, dt * 2.2)
    made.forEach((e, n) => {
      const at = placed.get(n), on = !!at?.on; e.w += ((on ? 1 : 0) - e.w) * (reduced ? 1 : 1 - Math.exp(-dt * (on ? 2.8 : 5)))
      e.pod.visible = e.w > 0.015; if (!e.pod.visible) return
      if (at) { e.pod.position.set(wide ? at.side * 2.25 * Math.min(cam.aspect / 1.7, 1.1) : 0, at.y, 0); e.pod.scale.setScalar((wide ? 0.82 * fit : 0.6) * (e.m.s ?? 1)); e.pod.userData.side = at.side }
      e.pod.rotation.set(e.m.tilt + py * 0.28, e.m.turn * ((e.pod.userData.side ?? 1) < 0 ? -1 : 1) + (reduced ? 0 : Math.sin(now / 2600) * 0.16) + px * 0.5, 0)
      e.pod.children[1].scale.setScalar(Math.max(0.001, e.w)); e.m.tick?.(time)
      e.m.parts.forEach((o, i) => {
        const d = on ? (i / e.m.parts.length) * 0.35 : 0, k = MathUtils.clamp((e.w - d) / (1 - d - 0.02), 0, 1), q = k * k * (3 - 2 * k), v = 1 - q
        if (!base.has(o)) base.set(o, new Vector3(o.rotation.x, o.rotation.y, o.rotation.z))
        o.userData.in = q > 0.995
        if (o.userData.in) { if (!o.userData.done) { o.position.copy(e.home[i]); const r0 = base.get(o)!; o.rotation.set(r0.x, r0.y, r0.z); o.scale.setScalar(1); o.userData.done = true } return }
        o.userData.done = false; const r0 = base.get(o)!
        o.position.copy(e.home[i]).addScaledVector(e.off[i], v); o.rotation.set(r0.x + e.spin[i].x * v, r0.y + e.spin[i].y * v, r0.z); o.scale.setScalar(Math.max(q, 0.001))
      })
    })
    spark.intensity = flash.v * 70
    r.render(scene, cam); dirty = false
  }
  size(); raf = requestAnimationFrame(frame)
  // Build the remaining models while the visitor reads, one per idle moment
  const queue = [...new Set(sections.map(s => s.form))].concat(home ? ['cloud', 'airgap'] : []).filter(n => n !== 'logo')
  const later = (f: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(f, { timeout: 2500 }) : setTimeout(f, 400))
  const prepare = () => { const n = queue.shift(); if (!n) return; const e = get(n); if (e) r.compile(e.m.root, cam, scene); later(prepare) }
  setTimeout(() => later(prepare), reduced ? 300 : 2400)
  if (!reduced) gsap.to(intro, { t: 1, duration: 2.2, ease: 'power2.out', delay: 0.15 })
  document.addEventListener('visibilitychange', () => { run = !document.hidden && !lost; cancelAnimationFrame(raf); if (run) { last = performance.now(); raf = requestAnimationFrame(frame) } })
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; run = false; cancelAnimationFrame(raf); document.documentElement.classList.add('no3d') })
  // The browser can take the graphics away and give them back, also while the page waits behind Back
  const recover = () => { if (!lost || r.getContext().isContextLost()) return; lost = false; document.documentElement.classList.remove('no3d'); light(); size(); run = !document.hidden; last = performance.now(); cancelAnimationFrame(raf); if (run) raf = requestAnimationFrame(frame) }
  canvas.addEventListener('webglcontextrestored', recover); addEventListener('pageshow', recover)
  // With reduced motion a model settles for a moment after a choice instead of flashing
  const settle = (ms: number) => { until = performance.now() + ms; dirty = true }
  const fl = (c: number) => { if (reduced) { settle(1800); return } spark.color.set(c); flash.v = 1; gsap.to(flash, { v: 0, duration: 1.1, ease: 'power2.out' }); boost = 1; dirty = true }
  return { setForm(n) { override = n; target = n; canvas.dataset.form = n; dirty = true }, pulse() { fl(0x04d8fa) }, gate(ok) { fl(ok ? 0x22e59a : 0xff4d5e); get('loco')!.m.act?.(ok) }, act(n, v) { get(n)?.m.act?.(v); settle(1800) } }
}
