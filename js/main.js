// ─── HYPERNOVA — scroll-driven 3D studio reel ────────────────────────────────
import * as THREE from 'three';
import { initWorld, renderFrame, QUALITY, world } from './world.js';
import { clamp, smooth, lerp } from './util.js';
import * as hero from './acts/hero.js';
import * as bowling from './acts/bowling.js';
import * as eyes from './acts/eyes.js';
import * as car from './acts/car.js';
import * as football from './acts/football.js';
import * as serpent from './acts/serpent.js';
import * as card from './acts/card.js';
import * as train from './acts/train.js';
import * as nuke from './acts/nuke.js';

const SPACING = 150;
const N_ACTS = 9;
const DETONATE = nuke.DETONATE ?? 0.33;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── act metadata: camera views are absolute world coords ─────────────────────
const z = (i) => -i * SPACING;
const ACTS = [
  { name: 'HYPERNOVA', label: 'INTRO', color: '#7ee8ff', fog: 0x05070c, density: 0.0105, side: 'center',
    pos: [0, 2.8, z(0) + 17], look: [0, 3.2, z(0) - 4] },
  { name: 'TURBO STRIKE', label: 'BOWLING', color: '#ff4fd8', fog: 0x0b0412, density: 0.0125, side: 'left',
    pos: [9, 6, z(1) + 26], look: [0, 1.8, z(1) - 8] },
  { name: 'ORACLE EYES', label: 'HORROR', color: '#b46bff', fog: 0x0b0514, density: 0.013, side: 'right',
    pos: [0, 3.4, z(2) + 19], look: [0, 3.6, z(2) - 6] },
  { name: 'APEX ZERO', label: 'RACING', color: '#48c8ff', fog: 0x030711, density: 0.011, side: 'left',
    pos: [6.6, 2.3, z(3) + 14], look: [0, 1.2, z(3) - 5] },
  { name: 'GOLDEN BOOT', label: 'FOOTBALL', color: '#ffcf4d', fog: 0x03130b, density: 0.012, side: 'right',
    pos: [-4.5, 6, z(4) + 21], look: [1, 2.2, z(4) - 8] },
  { name: 'SKULLVIPER', label: 'ROGUELITE', color: '#7dff5a', fog: 0x060a04, density: 0.012, side: 'left',
    pos: [0, 9, z(5) + 26], look: [0, 2.6, z(5) - 4] },
  { name: 'LEGENDS TCG', label: 'CARDS', color: '#ff9de2', fog: 0x0d0718, density: 0.0125, side: 'right',
    pos: [0, 3.0, z(6) + 13.5], look: [0, 3.1, z(6) - 0.5] },
  { name: 'BLOCKWAY EXPRESS', label: 'TRAIN', color: '#8fd0ff', fog: 0x0a121e, density: 0.012, side: 'left',
    pos: [12, 6, z(7) + 19], look: [0, 2.2, z(7) - 1] },
  { name: 'GROUND ZERO', label: 'EPILOGUE', color: '#ff7a2f', fog: 0x140c07, density: 0.007, side: 'center',
    pos: [0, 8.5, z(8) + 46], look: [0, 3, z(8) - 10] },
];
// finale dolly (after the blast the camera rises to take in the mushroom)
const FINALE_POS = [0, 17, z(8) + 34];
const FINALE_LOOK = [0, 13, z(8) - 10];

const ARC = [7, -7, 6, -6, 7, -7, 5, -6]; // lateral swoop per transition

// ── boot ─────────────────────────────────────────────────────────────────────
initWorld(document.getElementById('gl'));
const { scene, camera } = world;

const builders = [hero, bowling, eyes, car, football, serpent, card, train, nuke];
const sets = builders.map((mod, i) => {
  const s = mod.create(QUALITY);
  s.group.position.z = z(i);
  scene.add(s.group);
  return s;
});

// ── DOM refs ─────────────────────────────────────────────────────────────────
const sections = [...document.querySelectorAll('.sp-section')];
const panels = [...document.querySelectorAll('.panel')];
const navDots = [...document.querySelectorAll('.nav-dot')];
const actLabel = document.getElementById('act-label');
const progressBar = document.getElementById('progress-bar');
const countdown = document.getElementById('countdown');
const countdownNum = countdown?.querySelector('.cd-num');
const countdownTxt = countdown?.querySelector('.cd-txt');
const flash = document.getElementById('flash');
const cursor = document.getElementById('cursor');

// ── scroll mapping ───────────────────────────────────────────────────────────
let anchors = [];
let maxScroll = 1;
let lastDocH = 0;
function measure() {
  if (innerHeight < 80 || innerWidth < 80) return; // degenerate viewport — keep previous anchors
  maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  anchors = sections.map(s => s.offsetTop);
  anchors.push(maxScroll);
  lastDocH = document.documentElement.scrollHeight;
}
function actFloatAt(scroll) {
  const s = clamp(scroll, 0, maxScroll);
  for (let i = N_ACTS - 1; i >= 0; i--) {
    if (s >= anchors[i]) return i + (s - anchors[i]) / Math.max(1, anchors[i + 1] - anchors[i]);
  }
  return 0;
}

// ── pointer (parallax + gaze target) ─────────────────────────────────────────
const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
addEventListener('pointermove', (e) => {
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = -((e.clientY / innerHeight) * 2 - 1);
  if (cursor) {
    cursor.style.setProperty('--cx', e.clientX + 'px');
    cursor.style.setProperty('--cy', e.clientY + 'px');
  }
}, { passive: true });

// ── nav ──────────────────────────────────────────────────────────────────────
navDots.forEach((d, i) => d.addEventListener('click', () => {
  scrollTo({ top: anchors[i] + 4, behavior: 'smooth' });
}));
addEventListener('keydown', (e) => {
  const af = actFloatAt(smoothScroll);
  const cur = clamp(Math.round(af), 0, N_ACTS - 1);
  if (e.key === 'ArrowRight' && cur < N_ACTS - 1) scrollTo({ top: anchors[cur + 1] + 4, behavior: 'smooth' });
  if (e.key === 'ArrowLeft' && cur > 0) scrollTo({ top: anchors[cur] + 4, behavior: 'smooth' });
});

// ── colors ───────────────────────────────────────────────────────────────────
const fogColor = new THREE.Color();
const fogA = new THREE.Color(), fogB = new THREE.Color(), fogC = new THREE.Color();
const NUKE_AFTER = new THREE.Color(0x30140a);
let accentShown = -1;

// ── main loop ────────────────────────────────────────────────────────────────
let smoothScroll = scrollY, lastScroll = scrollY, skewVel = 0;
let t = 0, last = performance.now(), lastReal = performance.now();
let fpsEma = 60, degraded = false, fpsTimer = 0;

const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vDir = new THREE.Vector3(), vPerp = new THREE.Vector3();

measure();
smoothScroll = lastScroll = scrollY;

function stepFrame(now, doRender = true) {
  const dt = Math.min(0.05, (now - last) / 1000) || 0.016;
  last = now;
  lastReal = now;
  t += dt;

  // self-heal layout anchors if the document size changed (viewport settling late)
  const docH = document.documentElement.scrollHeight;
  if (docH !== lastDocH) measure();

  // damped scroll + velocity skew
  // (damping uses RAW elapsed time so the camera snaps to target after any
  //  throttled/background pause instead of crawling for seconds)
  const prev = smoothScroll;
  const rawDt = Math.max(0.001, (now - lastReal) / 1000);
  const fs = window.__forceScroll;
  const scrollTarget = (typeof fs === 'number' && isFinite(fs)) ? fs : scrollY;
  if (!isFinite(smoothScroll)) smoothScroll = scrollTarget; // recover from any NaN state
  smoothScroll += (scrollTarget - smoothScroll) * (1 - Math.exp(-rawDt * 6.5));
  const vel = (smoothScroll - prev) / Math.max(dt, 1e-4);
  skewVel += ((clamp(vel * 0.0035, -3.2, 3.2)) - skewVel) * (1 - Math.exp(-dt * 8));

  const af = actFloatAt(smoothScroll);
  const afC = Math.min(af, N_ACTS - 1);          // clamped for panels/nav
  const actIdx = clamp(Math.round(afC), 0, N_ACTS - 1);
  const f = clamp(af - (N_ACTS - 1), 0, 1);      // finale progress

  // ── camera rig ──
  if (af < N_ACTS - 1) {
    const i = clamp(Math.floor(af), 0, N_ACTS - 2);
    const frac = af - i;
    const e = smooth(0.34, 0.8, frac);
    const A = ACTS[i], B = ACTS[i + 1];
    vA.fromArray(A.pos); vB.fromArray(B.pos);
    vDir.subVectors(vB, vA).normalize();
    vPerp.set(vDir.z, 0, -vDir.x).normalize().multiplyScalar(Math.sin(e * Math.PI) * ARC[i]);
    camPos.lerpVectors(vA, vB, e).add(vPerp);
    camLook.lerpVectors(vA.fromArray(A.look), vB.fromArray(B.look), e);
    fogA.setHex(A.fog); fogB.setHex(B.fog);
    fogColor.lerpColors(fogA, fogB, e);
    world.scene.fog.density = lerp(A.density, B.density, e);
  } else {
    // finale: hold + dolly up as the mushroom rises
    const e = smooth(0.12, 0.9, f);
    vA.fromArray(ACTS[8].pos); vB.fromArray(FINALE_POS);
    camPos.lerpVectors(vA, vB, e);
    camLook.lerpVectors(vA.fromArray(ACTS[8].look), vB.fromArray(FINALE_LOOK), e);
    fogA.setHex(ACTS[8].fog); fogColor.lerpColors(fogA, NUKE_AFTER, smooth(0.33, 0.8, f));
    world.scene.fog.density = lerp(0.007, 0.011, smooth(0.33, 0.8, f));
  }
  world.scene.fog.color.copy(fogColor);

  // pointer parallax
  pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt * 4));
  pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt * 4));
  if (QUALITY.parallax && !reducedMotion) {
    camPos.x += pointer.sx * 0.85;
    camPos.y += pointer.sy * 0.5;
  }

  // detonation camera shake
  if (af >= N_ACTS - 1 && f > DETONATE && !reducedMotion) {
    const amp = 1.15 * (1 - smooth(DETONATE + 0.03, DETONATE + 0.34, f));
    camPos.x += Math.sin(t * 47.3) * amp;
    camPos.y += Math.sin(t * 39.7 + 1.3) * amp * 0.8;
    camLook.x += Math.sin(t * 41.1 + 2.1) * amp * 0.4;
  }

  camera.position.copy(camPos);
  camera.lookAt(camLook);
  if (af >= N_ACTS - 1 && f > DETONATE && !reducedMotion) {
    camera.rotation.z += Math.sin(t * 53) * 0.02 * (1 - smooth(DETONATE, DETONATE + 0.3, f));
  }

  // ── update nearby sets only ──
  for (let i = 0; i < N_ACTS; i++) {
    const s = sets[i];
    const vis = af > i - 1.4 && af < i + 1.4;
    s.group.visible = vis;
    if (vis) s.update(dt, clamp(afC - i, -1, 1), pointer, i === N_ACTS - 1 ? f : undefined);
  }

  // ── HTML overlay: panels (eased fade + staggered children via --pv) ──
  for (let i = 0; i < panels.length; i++) {
    const p = panels[i];
    let op, ty;
    if (i === N_ACTS - 1) {
      // finale panel: hidden during blast, revealed in the afterglow
      op = smooth(0.74, 0.9, f);
      ty = (1 - op) * 60;
    } else {
      const dd = afC - i;
      const raw = clamp(1 - Math.abs(dd) * 2.2, 0, 1);
      op = 1 - Math.pow(1 - raw, 3); // easeOutCubic for a softer fade edge
      ty = dd * -90;
    }
    p.style.opacity = op.toFixed(3);
    p.style.setProperty('--pv', op.toFixed(3));
    p.style.transform = p.classList.contains('center')
      ? `translate(-50%, calc(-50% + ${ty.toFixed(1)}px))`
      : `translateY(${ty.toFixed(1)}px)`;
    p.style.pointerEvents = op > 0.5 ? 'auto' : 'none';
    p.style.visibility = op <= 0.001 ? 'hidden' : 'visible';
  }
  if (!reducedMotion) document.getElementById('panels').style.transform = `skewY(${skewVel.toFixed(2)}deg)`;

  // ── countdown / flash ──
  if (countdown) {
    if (f > 0.02 && f < DETONATE) {
      countdown.style.opacity = '1';
      const n = 3 - clamp(Math.floor((f - 0.05) / 0.0933), 0, 3);
      if (countdownNum) countdownNum.textContent = f < 0.05 ? '' : String(n);
      if (countdownTxt) countdownTxt.textContent = f < 0.05 ? 'TEST SITE 07 — FINAL CHECKS' : 'DETONATION IN';
    } else {
      countdown.style.opacity = '0';
    }
  }
  if (flash) {
    flash.style.opacity = (f > DETONATE)
      ? clamp(1 - (f - DETONATE) / 0.13, 0, 1).toFixed(3)
      : '0';
  }

  // ── HUD ──
  const prog = clamp(smoothScroll / maxScroll, 0, 1);
  progressBar.style.transform = `scaleX(${prog.toFixed(4)})`;
  if (actIdx !== accentShown) {
    accentShown = actIdx;
    document.documentElement.style.setProperty('--accent', ACTS[actIdx].color);
    document.title = `${ACTS[actIdx].name} — HYPERNOVA`;
    navDots.forEach((d, i) => {
      d.classList.toggle('active', i === actIdx);
      d.setAttribute('aria-current', i === actIdx ? 'true' : 'false');
    });
  }
  actLabel.textContent = `ACT ${String(actIdx + 1).padStart(2, '0')} / ${String(N_ACTS).padStart(2, '0')} — ${ACTS[actIdx].name}`;

  // ── adaptive quality ──
  fpsEma = fpsEma * 0.95 + (1 / dt) * 0.05;
  fpsTimer += dt;
  if (!degraded && fpsTimer > 5 && fpsEma < 42) {
    degraded = true;
    world.renderer.setPixelRatio(1.15);
    world.composer.setPixelRatio(1.15);
    world.composer.setSize(innerWidth, innerHeight);
    world.bloom.strength = 0.5;
  }

  if (doRender) renderFrame(dt);
}
function frame(now) { requestAnimationFrame(frame); stepFrame(now); }
requestAnimationFrame(frame);

// debug: manually advance N frames (used by automated checks when rAF is throttled)
window.__step = (n = 24) => { const t0 = performance.now(); for (let i = 0; i < n; i++) stepFrame(t0 + i * 16.7, false); };
// debug: jump straight to an act position (af 0..9, 8.x = finale progress); bypasses async DOM scroll
window.__forceScroll = null;
window.__jump = (af) => {
  if (!anchors.length || !isFinite(anchors[N_ACTS - 1])) measure(); // anchors may not exist yet
  const i = clamp(Math.floor(af), 0, N_ACTS - 1);
  const frac = clamp(af - i, 0, 1);
  let y = anchors[i] + frac * Math.max(1, anchors[i + 1] - anchors[i]);
  if (!isFinite(y)) y = 0;
  window.__forceScroll = y;
  smoothScroll = lastScroll = y;
  scrollTo(0, y);
  return y;
};

// re-measure on resize / after fonts settle
addEventListener('resize', measure);
document.fonts?.ready.then(() => measure());

// ── loader out ───────────────────────────────────────────────────────────────
const pctEl = document.getElementById('loader-pct');
let pct = 0;
const pctTimer = setInterval(() => {
  pct = Math.min(100, pct + 6 + ((Math.random() * 12) | 0));
  if (pctEl) pctEl.textContent = pct + '%';
}, 90);
const bootMin = new Promise(r => setTimeout(r, 1100));
Promise.all([document.fonts?.ready ?? Promise.resolve(), bootMin]).then(() => {
  clearInterval(pctTimer);
  if (pctEl) pctEl.textContent = '100%';
  measure();
  document.body.classList.add('loaded');
});

// ── cursor grows over interactive elements ───────────────────────────────────
if (cursor) {
  document.addEventListener('pointerover', (e) => {
    cursor.classList.toggle('big', !!(e.target.closest && e.target.closest('a, button')));
  }, true);
}

// ── keyboard hint: fades away after first use or a while ─────────────────────
const kbHint = document.getElementById('kb-hint');
let kbGone = false;
const hideKbHint = () => {
  if (kbGone || !kbHint) return;
  kbGone = true;
  kbHint.style.opacity = '0';
  setTimeout(() => { if (kbHint) kbHint.style.display = 'none'; }, 900);
};
setTimeout(hideKbHint, 15000);
addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') hideKbHint(); }, { once: false });
// embedded webviews sometimes settle their viewport late — re-measure a few times
setTimeout(measure, 2000);
setTimeout(measure, 4000);

// ── debug frame sampler (used by automated checks; harmless in production) ──
window.__shot = () => {
  window.__step(30);   // settle camera/animations even if rAF is throttled
  renderFrame(0);
  const W = 16, H = 9;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.drawImage(world.renderer.domElement, 0, 0, W, H);
  const d = ctx.getImageData(0, 0, W, H).data;
  const cells = [];
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < d.length; i += 4) {
    cells.push([d[i], d[i + 1], d[i + 2]]);
    r += d[i]; g += d[i + 1]; b += d[i + 2];
  }
  const n = W * H;
  const bright = cells.filter(p => p[0] + p[1] + p[2] > 90).length / cells.length;
  return { avg: [Math.round(r / n), Math.round(g / n), Math.round(b / n)], bright, cells };
};
