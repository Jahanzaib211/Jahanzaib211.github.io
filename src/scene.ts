import { WebGLRenderer, Scene, PerspectiveCamera, Group, MeshPhysicalMaterial, Mesh, Shape, ExtrudeGeometry, Color, HemisphereLight, DirectionalLight, PointLight, Object3D, NoToneMapping, PMREMGenerator, Float32BufferAttribute, Fog, SRGBColorSpace, MathUtils, Vector3 } from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { gsap } from 'gsap'
import { POLYS, toWorld } from './formations'
import { makers, halo, type Model } from './models'

export interface World { setForm(name: string): void; pulse(): void; gate(ok: boolean): void; act(name: string, v: number | string | boolean): void }
interface Stop { el: HTMLElement; form: string; side: number }

export function createWorld(canvas: HTMLCanvasElement, reduced: boolean): World {
  const small = innerWidth < 900
  const r = new WebGLRenderer({ canvas, antialias: !small, alpha: true, powerPreference: 'high-performance' })
  r.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 1.75))
  r.toneMapping = NoToneMapping; r.outputColorSpace = SRGBColorSpace
  const scene = new Scene(); scene.fog = new Fog(0x050a16, 8, 16)
  const pm = new PMREMGenerator(r); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.12; pm.dispose()
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
  const made = new Map<string, { m: Model; w: number; home: Vector3[]; off: Vector3[]; spin: Vector3[] }>()
  const get = (n: string) => {
    let e = made.get(n); if (e || !makers[n]) return e
    const m = makers[n](), home = m.parts.map(o => o.position.clone())
    const off = home.map((h, i) => { const a = i * 2.4; return new Vector3(h.x * 0.9 + Math.cos(a) * 1.6, h.y * 0.9 + Math.sin(a * 1.3) * 1.8, h.z + Math.sin(a) * 1.8) })
    e = { m, w: 0, home, off, spin: home.map((_, i) => new Vector3(Math.sin(i * 1.9) * 0.9, Math.cos(i * 2.7) * 1.1, 0)) }; m.root.visible = false; root.add(m.root); made.set(n, e); return e
  }
  const base = new Map<Object3D, Vector3>(), glowPlane = halo(); glowPlane.position.y = -1.95; root.add(glowPlane)
  const sections: Stop[] = [...document.querySelectorAll<HTMLElement>('[data-form]')].map(el => ({ el, form: el.dataset.form!, side: Number(el.dataset.side ?? 1) * (document.dir === 'rtl' ? -1 : 1) }))
  let target = sections[0]?.form ?? 'logo', override = '', cur = sections[0], logoW = sections[0]?.form === 'logo' ? 1 : 0, x = 0, px = 0, py = 0, mx = 0, my = 0, spin = 0, lean = 0, yy = 0, sc = 0.62, boost = 0, dirty = true
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

  let last = performance.now(), run = true
  function frame(now: number) {
    if (!run) return
    requestAnimationFrame(frame)
    const dt = Math.min((now - last) / 1000, 0.05); last = now
    if (reduced && !dirty) return
    const isLogo = target === 'logo', k1 = reduced ? 1 : 1 - Math.exp(-dt * 4)
    const wide = innerWidth >= 900
    logoW += ((isLogo ? 1 : 0) - logoW) * (reduced ? 1 : 1 - Math.exp(-dt * 5))
    x += ((wide ? cur.side * (cur === sections[0] && home ? 2.55 : 2.25) * Math.min(cam.aspect / 1.7, 1.1) : 0) - x) * k1
    px += (mx - px) * Math.min(1, dt * 4); py += (my - py) * Math.min(1, dt * 4)
    const mod = made.get(target)?.m
    const ty = isLogo ? 0 : (mod?.turn ?? -0.4) * (x < 0 ? -1 : 1) + (reduced ? 0 : Math.sin(now / 2600) * 0.16), tx = isLogo ? 0 : mod?.tilt ?? 0.2
    spin += (ty - spin) * k1; lean += (tx - lean) * k1
    const end = isLogo && cur !== sections[0]
    let goal = wide ? 0 : cur === sections[0] ? 2.2 : 2.3
    if (end) { const h = cur.el.querySelector('h2')!.getBoundingClientRect(), top = cur.el.getBoundingClientRect().top, px1 = (2 * Math.tan((cam.fov * Math.PI) / 360) * cam.position.z) / innerHeight; goal = (innerHeight / 2 - (top + (h.top - top) * 0.52)) * px1; yy = goal } else yy += (goal - yy) * k1
    sc += ((wide ? (isLogo ? (end ? 0.62 : 0.62) : 0.82) : isLogo ? (end ? 0.5 : 0.56) : 0.6) - sc) * k1
    root.position.set(x, yy, 0)
    root.scale.setScalar(sc)
    root.rotation.set(lean + py * 0.28, spin + px * 0.65, 0)
    const it = intro.t
    ribbons.forEach((m, i) => {
      const s = scatter[i], e = 1 - MathUtils.clamp(it * 1.5 - i * 0.1, 0, 1), away = e * e * (3 - 2 * e) * 1.5 + (1 - logoW)
      m.position.set(s[0] * away, s[1] * away, s[2] * away); m.rotation.set(s[3] * away, s[3] * away * 1.4, 0)
      ;(m.material as MeshPhysicalMaterial).opacity = MathUtils.clamp(logoW * 1.6 - 0.5, 0, 1) * Math.min(1, it * 2.5); m.visible = logoW > 0.02
    })
    boost += (0 - boost) * Math.min(1, dt * 2.2)
    const time = reduced ? 0 : now / 1000
    if (!isLogo) get(target)
    glowPlane.scale.setScalar(Math.max(0.001, 1 - logoW)); glowPlane.visible = logoW < 0.98
    made.forEach((e, n) => {
      const on = n === target; e.w += ((on ? 1 : 0) - e.w) * (reduced ? 1 : 1 - Math.exp(-dt * (on ? 2.6 : 6)))
      e.m.root.visible = e.w > 0.015; if (!e.m.root.visible) return
      e.m.root.scale.setScalar(e.m.s ?? 1); e.m.tick?.(time)
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
  size(); requestAnimationFrame(frame)
  // Build the remaining models while the visitor reads, one per idle moment
  const queue = [...new Set(sections.map(s => s.form))].concat(home ? ['cloud', 'airgap'] : []).filter(n => n !== 'logo')
  const later = (f: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(f, { timeout: 2500 }) : setTimeout(f, 400))
  const prepare = () => { const n = queue.shift(); if (!n) return; const e = get(n); if (e) r.compile(e.m.root, cam, scene); later(prepare) }
  setTimeout(() => later(prepare), reduced ? 300 : 2400)
  if (!reduced) gsap.to(intro, { t: 1, duration: 2.2, ease: 'power2.out', delay: 0.15 })
  document.addEventListener('visibilitychange', () => { run = !document.hidden; if (run) { last = performance.now(); requestAnimationFrame(frame) } })
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); run = false; document.documentElement.classList.add('no3d') })
  const fl = (c: number) => { spark.color.set(c); flash.v = 1; gsap.to(flash, { v: 0, duration: 1.1, ease: 'power2.out' }); boost = reduced ? 0 : 1; dirty = true }
  return { setForm(n) { override = n; target = n; canvas.dataset.form = n; dirty = true }, pulse() { fl(0x04d8fa) }, gate(ok) { fl(ok ? 0x22e59a : 0xff4d5e); get('loco')!.m.act?.(ok) }, act(n, v) { get(n)?.m.act?.(v); dirty = true } }
}
