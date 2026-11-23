// A slow surface of folded light behind the page. Drawn small, at 30 frames a second, and only while it is seen.
const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'
const FS = `precision highp float;uniform vec2 r;uniform float t;
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
// Where each sheet of light lies. The waves bend one another, so the sheets drift and never repeat
float flow(vec2 p){return p.y*1.9+.62*sin(p.x*.95+t*.11)+.36*sin(p.x*1.7-p.y*.8-t*.085)+.15*sin(p.x*3.1+p.y*1.5+t*.13);}
void main(){vec2 uv=gl_FragCoord.xy/r,p=(gl_FragCoord.xy-.5*r)/min(r.x,r.y*1.5);
float c=cos(.66),s=sin(.66);p=mat2(c,-s,s,c)*p*1.75+vec2(.3,.1);
float h=flow(p)*1.05+t*.012,f=fract(h),k=floor(h),e=.012;
// Each sheet is bright along its upper edge, falls away into shadow, and has its own depth of blue
float sheet=smoothstep(0.,.03,f)*pow(1.-f,2.1),edge=smoothstep(0.,e*1.5,f)*exp(-f*22.),v=hash(vec2(k,3.7)),along=.55+.45*sin(p.x*1.4+k*2.1+t*.16);
vec3 tint=mix(vec3(.006,.13,.5),vec3(.008,.34,.74),v);vec3 col=vec3(.01,.026,.075)+tint*sheet*(.55+.45*along)+vec3(.1,.66,.92)*edge*along*.75;
// Strong at the top outer corner, quiet where words are read
float m=smoothstep(.2,1.3,uv.x*.86+uv.y*.6)*.82+.07;if(r.x<r.y)m=smoothstep(.35,1.15,uv.y)*.62+.07;
vec3 base=mix(vec3(.016,.031,.075),vec3(.02,.055,.13),uv.y);col=mix(base,col,m);
gl_FragColor=vec4(col+(hash(gl_FragCoord.xy)-.5)/170.,1.);}`
export function startBackdrop(canvas: HTMLCanvasElement) {
  const still = matchMedia('(prefers-reduced-motion:reduce)'), saving = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' }); if (!gl) return
  let ur: WebGLUniformLocation | null = null, ut: WebGLUniformLocation | null = null
  const setup = () => {
    const pr = gl.createProgram()!
    for (const [k, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, FS]] as const) { const s = gl.createShader(k)!; gl.shaderSource(s, src); gl.compileShader(s); gl.attachShader(pr, s) }
    gl.bindAttribLocation(pr, 0, 'a'); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return false
    gl.useProgram(pr); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    ur = gl.getUniformLocation(pr, 'r'); ut = gl.getUniformLocation(pr, 't'); return true
  }
  if (!setup()) return
  let raf = 0, last = 0, clock = 40, frames = 0, slow = 0, frozen = saving, lost = false
  const draw = () => { gl.uniform1f(ut, clock); gl.drawArrays(gl.TRIANGLES, 0, 3); canvas.dataset.frames = String(++frames) }
  const size = () => { const k = innerWidth < 900 ? 0.6 : 0.5; canvas.width = Math.max(2, Math.round(innerWidth * k)); canvas.height = Math.max(2, Math.round(innerHeight * k)); gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(ur, canvas.width, canvas.height); draw() }
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop); const dt = now - last; if (dt < 30) return
    last = now; clock += Math.min(dt, 60) / 1000
    draw()
    // A device that cannot keep up keeps a still picture instead
    if (frames > 8 && dt < 1000) { slow = dt > 90 ? slow + 1 : 0; if (slow > 24) { frozen = true; stop() } }
  }
  const stop = () => { cancelAnimationFrame(raf); raf = 0 }
  const go = () => { stop(); if (!lost && !frozen && !still.matches && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop) } }
  let wait = 0, w = innerWidth
  // Phone browser bars change the height while scrolling; only a real change redraws
  addEventListener('resize', () => { if (innerWidth === w && innerWidth < 900) return; w = innerWidth; clearTimeout(wait); wait = window.setTimeout(() => { if (!lost) size() }, 120) })
  document.addEventListener('visibilitychange', go); still.addEventListener('change', go)
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; stop(); canvas.parentElement!.classList.remove('on') })
  const back = () => { if (!lost || gl.isContextLost()) return; lost = false; if (setup()) { size(); canvas.parentElement!.classList.add('on'); go() } }
  canvas.addEventListener('webglcontextrestored', back); addEventListener('pageshow', back)
  size(); canvas.parentElement!.classList.add('on'); go()
}
