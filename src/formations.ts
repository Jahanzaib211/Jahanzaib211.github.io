// Every formation places the same shards, so one object can become the next.
export const COUNT = 1500
export const POLYS: [number, number][][] = [
  [[508, 8], [612, 143], [510, 268], [212, 657], [10, 657]],
  [[612, 143], [803, 388], [700, 511], [510, 268]],
  [[890, 355], [988, 470], [836, 657], [629, 657]],
  [[720, 149], [936, 149], [1360, 657], [1145, 657]],
  [[1221, 8], [1442, 8], [1152, 346], [1048, 222]],
]
export const toWorld = (x: number, y: number): [number, number] => [(x - 726) / 235, (332 - y) / 235]
export interface Form { p: Float32Array; s: Float32Array; q: Float32Array; c: Float32Array }
let seed = 7
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
const mk = (): Form => ({ p: new Float32Array(COUNT * 3), s: new Float32Array(COUNT * 3), q: new Float32Array(COUNT * 3), c: new Float32Array(COUNT) })
type Put = [x: number, y: number, z: number, sx: number, sy: number, sz: number, tone: number, rx?: number, ry?: number, rz?: number]
function form(fn: (i: number, u: number) => Put): Form {
  seed = 7
  const f = mk()
  for (let i = 0; i < COUNT; i++) {
    const a = fn(i, i / COUNT)
    f.p.set([a[0], a[1], a[2]], i * 3); f.s.set([a[3], a[4], a[5]], i * 3)
    f.q.set([a[7] ?? 0, a[8] ?? 0, a[9] ?? 0], i * 3); f.c[i] = a[6]
  }
  return f
}
const hide = (x = 0, y = 0, z = 0): Put => [x, y, z, 0.0001, 0.0001, 0.0001, 0]
const inside = (x: number, y: number, P: [number, number][]) => {
  let r = false
  for (let i = 0, j = P.length - 1; i < P.length; j = i++)
    if (P[i][1] > y !== P[j][1] > y && x < ((P[j][0] - P[i][0]) * (y - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) r = !r
  return r
}
const sphere = (u: number, n = 1): [number, number, number] => {
  const t = Math.acos(1 - 2 * u), a = Math.PI * (1 + Math.sqrt(5)) * u * COUNT * n
  return [Math.sin(t) * Math.cos(a), Math.cos(t), Math.sin(t) * Math.sin(a)]
}
const along = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t) as [number, number, number]
const boxEdge = (r: number[]): [number, number, number, number] => {
  const ax = Math.floor(rnd() * 3), s = () => (rnd() < 0.5 ? -1 : 1), t = rnd() * 2 - 1
  const v = [s() * r[0], s() * r[1], s() * r[2]]; v[ax] = t * r[ax]
  return [v[0], v[1], v[2], ax]
}
const bar = (ax: number, l: number, w: number): [number, number, number] => [ax === 0 ? l : w, ax === 1 ? l : w, ax === 2 ? l : w]
function rackPut(i: number, ox = 0, oy = 0, oz = 0, k = 1): Put {
  const n = 12, per = 34, r = i % n, l = Math.floor(i / n) % per
  const gx = (r % 4) - 1.5, gz = Math.floor(r / 4) - 1
  return [ox + gx * 0.82 * k, oy + (-1.05 + l * 0.062) * k, oz + gz * 1.0 * k, 0.56 * k, 0.045 * k, 0.62 * k, (l * 7 + r * 3) % 11 === 0 ? 1 : 0.22 + 0.2 * rnd()]
}
export const forms: Record<string, Form> = {
  logo: form(() => {
    for (;;) {
      const k = Math.floor(rnd() * 5), x = rnd() * 1450, y = rnd() * 665
      if (!inside(x, y, POLYS[k])) continue
      const [wx, wy] = toWorld(x, y)
      return [wx, wy, (rnd() - 0.5) * 0.34, 0.05, 0.05, 0.05, x / 1450]
    }
  }),
  // Build: a structure rising in ordered storeys
  build: form(i => {
    const f = Math.floor(i / 100), k = i % 100, n = 10, x = (k % n) - 4.5, z = Math.floor(k / n) - 4.5
    const r = 4.6 - f * 0.24, on = Math.abs(x) < r && Math.abs(z) < r
    if (!on) return hide(x * 0.3, -1.6, z * 0.3)
    const shell = Math.max(Math.abs(x), Math.abs(z)) > r - 1.05
    return [x * 0.31, -1.75 + f * 0.25, z * 0.31, 0.27, shell ? 0.21 : 0.05, 0.27, shell ? 0.25 + f / 22 : 0.95]
  }),
  // Own: an enclosure around a protected core
  own: form((i, u) => {
    if (u < 0.5) { const [x, y, z, a] = boxEdge([1.9, 1.5, 1.9]); return [x, y, z, ...bar(a, 0.18, 0.05), 0.95] }
    if (u < 0.62) { const [x, y, z, a] = boxEdge([2.3, 1.85, 2.3]); return [x, y, z, ...bar(a, 0.1, 0.022), 0.5] }
    return rackPut(i, 0, 0, 0, 0.82)
  }),
  // Innovate: a wave of signal
  innovate: form(i => {
    const n = 50, gx = i % n, gz = Math.floor(i / n), x = (gx - 24.5) * 0.11, z = (gz - 14.5) * 0.15
    const d = Math.hypot(x, z), h = Math.sin(d * 2.5) * Math.exp(-d * 0.28)
    return [x, h * 0.85 - 0.2, z, 0.07, 0.07 + Math.abs(h) * 0.5, 0.07, 0.45 + h * 0.55]
  }),
  cloud: form((i, u) => {
    if (u < 0.6) { const b = [[0, 1, 0, 0.95], [-1.05, 0.72, 0.1, 0.68], [1.1, 0.75, -0.1, 0.72], [0.35, 0.6, 0.7, 0.6]][i % 4], [x, y, z] = sphere(rnd()); return [b[0] + x * b[3], b[1] + Math.abs(y) * b[3] * 0.85, b[2] + z * b[3], 0.07, 0.07, 0.07, 0.5 + y * 0.4] }
    if (u < 0.8) { const a = (i % 5 - 2) * 0.62; return [a, 0.7 - rnd() * 1.8, 0, 0.025, 0.11, 0.025, 1] }
    return rackPut(i, 0, -0.75, 0, 0.55)
  }),
  onprem: form((i, u) => {
    if (u < 0.1) { const [x, , z, a] = boxEdge([2, 0, 1.75]); return [x, -1.2, z, ...bar(a === 1 ? 0 : a, 0.2, 0.04), 0.9] }
    return rackPut(i)
  }),
  airgap: form((i, u) => {
    if (u < 0.28) { const [x, y, z, a] = boxEdge([2.05, 1.45, 1.8]); return [x, y, z, ...bar(a, 0.17, 0.055), 1] }
    if (u < 0.42) { const [x, y] = sphere(rnd()); return [3.5 + x * 0.12, y * 1.8, (rnd() - 0.5) * 2.6, 0.04, 0.04, 0.04, 0.1] }
    return rackPut(i, 0, 0.05, 0, 0.8)
  }),
  bots: form((i, u) => {
    const C = [[0, 1.45, 0], [-1.75, 0.1, 0.4], [0, -1.4, 0.2], [1.75, 0.1, 0.4]]
    if (u < 0.76) { const k = i % 4, r = k === 0 ? 0.62 : 0.5, [x, y, z] = sphere(rnd()); const m = Math.pow(Math.abs(x) ** 0.55 + Math.abs(y) ** 0.55 + Math.abs(z) ** 0.55, -1 / 0.55) * r * 1.75; return [C[k][0] + x * m, C[k][1] + y * m, C[k][2] + z * m, 0.07, 0.07, 0.07, k * 0.28 + 0.1] }
    const k = i % 4, n = (k + 1) % 4, [x, y, z] = along(C[k], C[n], rnd())
    return [x, y, z, 0.035, 0.035, 0.035, 1]
  }),
  nova: form((i) => {
    const k = i % 6, j = Math.floor(i / 6), w = 18, x = (j % w) / (w - 1) - 0.5, y = Math.floor(j / w) / 13 - 0.5
    const a = (k / 6) * Math.PI * 2, R = 1.75
    const px = Math.cos(a) * x * 1.5, pz = -Math.sin(a) * x * 1.5
    const edge = Math.abs(x) > 0.46 || Math.abs(y) > 0.45
    return [Math.sin(a) * R + px, y * 2.1, Math.cos(a) * R + pz, 0.075, edge ? 0.14 : 0.05, 0.03, edge ? 0.95 : 0.2 + ((j * 13) % 7) / 12, 0, a, 0]
  }),
  loco: form((i, u) => {
    if (u < 0.34) { const t = u / 0.34 * 6, k = Math.floor(t), e = t - k, A = (n: number) => [Math.sin(n * Math.PI / 3) * 2, Math.cos(n * Math.PI / 3) * 2, 0], [x, y] = along(A(k), A(k + 1), e); return [x, y, ((i % 5) - 2) * 0.16, 0.06, 0.06, 0.12, 0.2 + y * 0.2 + 0.4] }
    if (u < 0.8) { const l = i % 9, a = rnd() * Math.PI * 2, r = 0.35 + rnd() * 0.62; return [Math.cos(a) * r, Math.sin(a) * r, (l - 4) * 0.26, 0.08, 0.08, 0.05, l / 9] }
    return [0, 0, (rnd() - 0.5) * 6, 0.05, 0.05, 0.22, 1]
  }),
  storeloom: form(i => {
    const warp = i % 2, n = 15, per = COUNT / 2, j = Math.floor(i / 2), t = Math.floor(j / (per / n)), s = (j % (per / n)) / (per / n)
    const a = (t - 7) * 0.27, b = (s - 0.5) * 4, z = Math.sin(b * Math.PI / 0.54 + (t % 2) * Math.PI) * 0.13 * (warp ? 1 : -1)
    return warp ? [a, b, z, 0.15, 0.1, 0.04, 0.15 + s * 0.35] : [b, a, z, 0.1, 0.15, 0.04, 0.6 + s * 0.4]
  }),
}
