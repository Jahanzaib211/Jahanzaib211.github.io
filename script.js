import * as THREE from 'three';

document.getElementById('year').textContent = new Date().getFullYear();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------
   HUD: menu open/close
--------------------------------------------------------------- */
const hudMenu = document.getElementById('hudMenu');
const hudMenuBtn = document.getElementById('hudMenuBtn');
const hudMenuClose = document.getElementById('hudMenuClose');

function openMenu() {
  hudMenu.classList.add('open');
  hudMenuBtn.setAttribute('aria-expanded', 'true');
}
function closeMenu() {
  hudMenu.classList.remove('open');
  hudMenuBtn.setAttribute('aria-expanded', 'false');
}
hudMenuBtn.addEventListener('click', () => {
  hudMenu.classList.contains('open') ? closeMenu() : openMenu();
});
hudMenuClose.addEventListener('click', closeMenu);
hudMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

/* ---------------------------------------------------------------
   HUD: active level tracking via IntersectionObserver
--------------------------------------------------------------- */
const hudLevel = document.getElementById('hudLevel');
const hudProgress = document.getElementById('hudProgress');
const levels = Array.from(document.querySelectorAll('.level, .project-pod'));

const levelObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const num = el.dataset.level ?? el.closest('.level')?.dataset.level ?? '0';
        const name = el.dataset.levelName ?? el.closest('.level')?.dataset.levelName ?? 'BOOT';
        hudLevel.textContent = `LVL 0${num} · ${name}`;
      }
    });
  },
  { rootMargin: '-49% 0px -49% 0px', threshold: 0 }
);
levels.forEach((el) => levelObserver.observe(el));

/* ---------------------------------------------------------------
   Hero boot sequence typing
--------------------------------------------------------------- */
const bootLines = [
  '$ ssh operator@alilabsx.com',
  'Connected.',
  '$ whoami',
  'Jahanzaib Ali',
  '$ nova status',
  'six facets online · sub-agents ready',
];
const bootEl = document.getElementById('heroBoot');

if (reduceMotion) {
  bootEl.textContent = bootLines.join('\n');
} else {
  let lineIdx = 0, charIdx = 0;
  const typed = [];
  function typeStep() {
    if (lineIdx >= bootLines.length) {
      bootEl.innerHTML = typed.join('\n') + '<span class="caret"></span>';
      return;
    }
    const currentLine = bootLines[lineIdx];
    const isCmd = currentLine.startsWith('$');
    if (charIdx === 0) typed.push('');
    typed[lineIdx] = (isCmd ? `<span class="line-accent">` : '') +
      currentLine.slice(0, charIdx) + (isCmd ? `</span>` : '');
    bootEl.innerHTML = typed.join('\n') + '<span class="caret"></span>';
    charIdx++;
    if (charIdx > currentLine.length) {
      lineIdx++; charIdx = 0;
      setTimeout(typeStep, 220);
    } else {
      setTimeout(typeStep, 14 + Math.random() * 20);
    }
  }
  setTimeout(typeStep, 300);
}

/* ---------------------------------------------------------------
   Three.js scene
--------------------------------------------------------------- */
const canvas = document.getElementById('scene-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x05060a, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05060a, 0.045);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 6);

const ACCENT = 0x52f2c5;

/* Soft circular sprite for point materials (avoids hard GL_POINTS squares) */
function makeDotTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.6)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}
const dotTexture = makeDotTexture();

/* Starfield */
const starCount = 1400;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPos[i * 3] = (Math.random() - 0.5) * 60;
  starPos[i * 3 + 1] = (Math.random() - 0.5) * 60;
  starPos[i * 3 + 2] = (Math.random() - 0.5) * 90 - 20;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({
  color: 0x8a93a6, size: 0.11, map: dotTexture, alphaTest: 0.01,
  transparent: true, opacity: 0.7,
  blending: THREE.AdditiveBlending, depthWrite: false,
});
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

/* Agent core (hero / about) */
const coreGroup = new THREE.Group();
coreGroup.position.set(0, 0, 0);
const coreOuterGeo = new THREE.IcosahedronGeometry(1.3, 1);
const coreOuter = new THREE.LineSegments(
  new THREE.EdgesGeometry(coreOuterGeo),
  new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.55 })
);
const coreInner = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.75, 1),
  new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.08 })
);
coreGroup.add(coreOuter, coreInner);
scene.add(coreGroup);

/* Skills cluster (level 2), fibonacci sphere layout */
const skillsGroup = new THREE.Group();
skillsGroup.position.set(1.2, 0.4, -4.6);
const skillCount = 10;
for (let i = 0; i < skillCount; i++) {
  const y = 1 - (i / (skillCount - 1)) * 2;
  const radiusAtY = Math.sqrt(1 - y * y);
  const theta = Math.PI * (1 + Math.sqrt(5)) * i;
  const r = 2.1;
  const node = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.14, 0),
    new THREE.MeshBasicMaterial({ color: ACCENT, wireframe: true, transparent: true, opacity: 0.8 })
  );
  node.position.set(Math.cos(theta) * radiusAtY * r, y * r, Math.sin(theta) * radiusAtY * r);
  skillsGroup.add(node);
}
scene.add(skillsGroup);

/* Activity data-stream (level 3) */
const streamGroup = new THREE.Group();
streamGroup.position.set(0, 0, -9.8);
const streamCount = 260;
const streamGeo = new THREE.BufferGeometry();
const streamPos = new Float32Array(streamCount * 3);
for (let i = 0; i < streamCount; i++) {
  streamPos[i * 3] = (Math.random() - 0.5) * 5;
  streamPos[i * 3 + 1] = (Math.random() - 0.5) * 5;
  streamPos[i * 3 + 2] = (Math.random() - 0.5) * 6;
}
streamGeo.setAttribute('position', new THREE.BufferAttribute(streamPos, 3));
const streamMat = new THREE.PointsMaterial({
  color: ACCENT, size: 0.16, map: dotTexture, alphaTest: 0.01,
  transparent: true, opacity: 0.85,
  blending: THREE.AdditiveBlending, depthWrite: false,
});
streamGroup.add(new THREE.Points(streamGeo, streamMat));
scene.add(streamGroup);

/* Project pods (level 4) */
const podDepths = [-17.4, -22.6, -27.8, -33.0, -38.2];
const podScales = [1.5, 1.05, 1.05, 1.05, 1.05];
const pods = podDepths.map((z, i) => {
  const size = podScales[i] * 2.6;
  const geo = new THREE.PlaneGeometry(size, size * 0.62);
  const wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: i === 0 ? 0.7 : 0.4 })
  );
  wire.position.set(0, 0, z);
  scene.add(wire);
  return wire;
});

/* Contact portal (level 5) */
const portal = new THREE.Mesh(
  new THREE.TorusGeometry(2, 0.045, 16, 64),
  new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.7 })
);
portal.position.set(0, 0, -43.5);
scene.add(portal);

/* ---------------------------------------------------------------
   Scroll-driven camera flight
--------------------------------------------------------------- */
const Z_START = 6;
const Z_END = -47;

let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5);
  mouseY = (e.clientY / window.innerHeight - 0.5);
});

function scrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}

function fadeFactor(centerZ, range) {
  const d = Math.abs(camera.position.z - centerZ);
  return THREE.MathUtils.clamp(1 - d / range, 0, 1);
}

function animate() {
  requestAnimationFrame(animate);
  const p = scrollProgress();
  hudProgress.style.width = `${(p * 100).toFixed(1)}%`;
  const targetZ = THREE.MathUtils.lerp(Z_START, Z_END, p);
  camera.position.z += (targetZ - camera.position.z) * (reduceMotion ? 1 : 0.12);

  if (!reduceMotion) {
    camera.position.x += ((mouseX * 0.5) - camera.position.x) * 0.04;
    camera.position.y += ((-mouseY * 0.3) - camera.position.y) * 0.04;
    coreGroup.rotation.y += 0.0022;
    coreGroup.rotation.x += 0.0009;
    skillsGroup.rotation.y += 0.0016;
    stars.rotation.y += 0.00025;
    portal.rotation.z += 0.0016;
    pods.forEach((pod, i) => { pod.rotation.z = Math.sin(Date.now() * 0.0002 + i) * 0.03; });
  }

  /* Keep each object contained to its own level — only visible near its own depth */
  const coreF = fadeFactor(0, 6.5);
  coreOuter.material.opacity = 0.55 * coreF;
  coreInner.material.opacity = 0.08 * coreF;
  coreGroup.visible = coreF > 0.01;

  const skillsF = fadeFactor(-4.6, 4.2);
  skillsGroup.children.forEach((n) => { n.material.opacity = 0.8 * skillsF; });
  skillsGroup.visible = skillsF > 0.01;

  const streamF = fadeFactor(-9.8, 4.2);
  streamMat.opacity = 0.85 * streamF;
  streamGroup.visible = streamF > 0.01;

  pods.forEach((pod, i) => {
    const f = fadeFactor(podDepths[i], 3.6);
    pod.material.opacity = (i === 0 ? 0.7 : 0.4) * f;
    pod.visible = f > 0.01;
  });

  const portalF = fadeFactor(-43.5, 4.2);
  portal.material.opacity = 0.7 * portalF;
  portal.visible = portalF > 0.01;

  camera.lookAt(0, 0, camera.position.z - 10);
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
