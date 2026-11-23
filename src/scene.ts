import { WebGLRenderer, Scene, PerspectiveCamera, Group, InstancedMesh, BoxGeometry, MeshStandardMaterial, MeshPhysicalMaterial, Mesh, Shape, ExtrudeGeometry, Color, HemisphereLight, DirectionalLight, PointLight, Object3D, DynamicDrawUsage, NoToneMapping, PMREMGenerator, Float32BufferAttribute, Fog, SRGBColorSpace, MathUtils } from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { gsap } from 'gsap'
import { COUNT, POLYS, forms, toWorld } from './formations'

export interface World { setForm(name: string): void; pulse(): void; gate(ok: boolean): void }
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

  const shards = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ metalness: 0.25, roughness: 0.35, emissive: 0x0130a0, emissiveIntensity: 0.35 }), COUNT)
  shards.instanceMatrix.setUsage(DynamicDrawUsage); shards.frustumCulled = false; root.add(shards)
  const o = new Object3D(), ramp = [new Color('#0a2a78'), new Color('#0268f4'), new Color('#04d8fa')], tmp = new Color()
  const cp = new Float32Array(forms.logo.p), cs = new Float32Array(COUNT * 3), cq = new Float32Array(COUNT * 3), cc = new Float32Array(forms.logo.c)
  const speed = new Float32Array(COUNT); for (let i = 0; i < COUNT; i++) speed[i] = 2.2 + ((i * 7919) % 100) / 28
  for (let i = 0; i < COUNT; i++) shards.setColorAt(i, ramp[1])

  const sections: Stop[] = [...document.querySelectorAll<HTMLElement>('[data-form]')].map(el => ({ el, form: el.dataset.form!, side: Number(el.dataset.side ?? 1) * (document.dir === 'rtl' ? -1 : 1) }))
  let target = 'logo', override = '', cur = sections[0], logoW = 1, x = 0, px = 0, py = 0, mx = 0, my = 0, spin = 0, yy = 0, sc = 0.62, boost = 0, dirty = true
  const flash = { v: 0 }
  const locate = () => {
    const mid = innerHeight * 0.52; let best = sections[0], d = 1e9
    for (const s of sections) { const b = s.el.getBoundingClientRect(), k = Math.abs((b.top + b.bottom) / 2 - mid); if (k < d) { d = k; best = s } }
    if (best !== cur) { cur = best; override = '' }
    target = override || (cur.el.dataset.active ?? cur.form); dirty = true
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
    const f = forms[target], isLogo = target === 'logo', k1 = reduced ? 1 : 1 - Math.exp(-dt * 4)
    const wide = innerWidth >= 900
    logoW += ((isLogo ? 1 : 0) - logoW) * (reduced ? 1 : 1 - Math.exp(-dt * 5))
    x += ((wide ? cur.side * (cur === sections[0] ? 2.55 : 2.25) * Math.min(cam.aspect / 1.7, 1.1) : 0) - x) * k1
    px += (mx - px) * Math.min(1, dt * 4); py += (my - py) * Math.min(1, dt * 4)
    if (!reduced) spin = isLogo ? spin * Math.exp(-dt * 3) : spin + dt * (target === 'storeloom' ? 0 : 0.16)
    if (isLogo) spin = ((spin + Math.PI) % (Math.PI * 2)) - Math.PI
    const still = target === 'storeloom' || target === 'loco'
    const end = isLogo && cur !== sections[0]
    yy += ((wide ? (end ? 1.1 : 0) : cur === sections[0] ? 2.2 : end ? 1.6 : 2.3) - yy) * k1; sc += ((wide ? (isLogo ? (end ? 0.74 : 0.62) : 0.9) : isLogo ? 0.56 : 0.74) - sc) * k1
    root.position.set(x, yy, 0)
    root.scale.setScalar(sc)
    root.rotation.set((isLogo ? 0 : still ? -0.12 : 0.28) * (1 - logoW) + py * 0.28, spin * (still ? 0.15 : 1) + px * 0.65 + (still ? -0.5 : 0) * (1 - logoW), 0)
    const it = intro.t
    ribbons.forEach((m, i) => {
      const s = scatter[i], e = 1 - MathUtils.clamp(it * 1.5 - i * 0.1, 0, 1), away = e * e * (3 - 2 * e) * 1.5 + (1 - logoW)
      m.position.set(s[0] * away, s[1] * away, s[2] * away); m.rotation.set(s[3] * away, s[3] * away * 1.4, 0)
      ;(m.material as MeshPhysicalMaterial).opacity = MathUtils.clamp(logoW * 1.6 - 0.5, 0, 1) * Math.min(1, it * 2.5); m.visible = logoW > 0.02
    })
    const shardScale = 1 - logoW * 0.985
    boost += (0 - boost) * Math.min(1, dt * 2.2)
    const t = now / 1000
    for (let i = 0; i < COUNT; i++) {
      const j = i * 3, a = reduced ? 1 : 1 - Math.exp(-dt * speed[i])
      for (let n = 0; n < 3; n++) { cp[j + n] += (f.p[j + n] - cp[j + n]) * a; cs[j + n] += (f.s[j + n] - cs[j + n]) * a; cq[j + n] += (f.q[j + n] - cq[j + n]) * a }
      cc[i] += (f.c[i] - cc[i]) * a
      const wob = reduced ? 0 : Math.sin(t * 1.4 + i * 0.37) * (target === 'innovate' ? 0.06 : 0.008) + boost * Math.sin(i * 1.7 + t * 9) * 0.07
      o.position.set(cp[j], cp[j + 1] + wob, cp[j + 2]); o.rotation.set(cq[j], cq[j + 1], cq[j + 2]); o.scale.set(Math.max(cs[j] * shardScale, 1e-4), Math.max(cs[j + 1] * shardScale, 1e-4), Math.max(cs[j + 2] * shardScale, 1e-4)); o.updateMatrix(); shards.setMatrixAt(i, o.matrix)
      const v = MathUtils.clamp(cc[i] + boost * 0.5, 0, 1); tmp.copy(v < 0.5 ? ramp[0] : ramp[1]).lerp(v < 0.5 ? ramp[1] : ramp[2], v < 0.5 ? v * 2 : v * 2 - 1); shards.setColorAt(i, tmp)
    }
    shards.instanceMatrix.needsUpdate = true; shards.instanceColor!.needsUpdate = true
    spark.intensity = flash.v * 70
    r.render(scene, cam); dirty = false
  }
  size(); requestAnimationFrame(frame)
  if (!reduced) gsap.to(intro, { t: 1, duration: 2.2, ease: 'power2.out', delay: 0.15 })
  document.addEventListener('visibilitychange', () => { run = !document.hidden; if (run) { last = performance.now(); requestAnimationFrame(frame) } })
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); run = false; document.documentElement.classList.add('no3d') })
  const fl = (c: number) => { spark.color.set(c); flash.v = 1; gsap.to(flash, { v: 0, duration: 1.1, ease: 'power2.out' }); boost = reduced ? 0 : 1; dirty = true }
  return { setForm(n) { override = n; target = n; dirty = true }, pulse() { fl(0x04d8fa) }, gate(ok) { fl(ok ? 0x22e59a : 0xff4d5e) } }
}
