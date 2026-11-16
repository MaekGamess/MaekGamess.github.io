// ─── shared helpers ──────────────────────────────────────────────────────────
import * as THREE from 'three';

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const pick = (arr) => arr[(Math.random() * arr.length) | 0];

/** how much of a set's far decor (skies, suns) should show: fades out as the camera leaves the act */
export const fadeByLocal = (local) => 1 - smooth(0.45, 0.85, Math.abs(local || 0));

/** build a canvas texture with a draw callback */
export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** soft radial glow sprite texture (white core → transparent) */
export function glowTexture(size = 128, inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  return canvasTexture(size, size, (g, w) => {
    const r = w / 2;
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, inner);
    grad.addColorStop(0.35, inner.replace(',1)', ',0.55)'));
    grad.addColorStop(1, outer);
    g.fillStyle = grad;
    g.fillRect(0, 0, w, w);
  });
}

/** additive glow sprite */
export function glowSprite(color = '#ffffff', scale = 1, opacity = 1) {
  const mat = new THREE.SpriteMaterial({
    map: glowTexture(), color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const s = new THREE.Sprite(mat);
  s.scale.setScalar(scale);
  return s;
}

/**
 * GPU-animated star/dust particle field (positions static, sway in shader).
 * Returns { points, mat } — set mat.uniforms.uTime.value each frame.
 */
export function makeParticles(count, spreadFn, opts = {}) {
  const { size = 1, color1 = '#ffffff', color2 = '#7ee8ff', sway = 0.4, fall = 0, pixelRatio = 1 } = opts;
  const pos = new Float32Array(count * 3);
  const aScale = new Float32Array(count);
  const aSeed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const p = spreadFn(i, count);
    pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
    aScale[i] = rand(0.4, 1.4);
    aSeed[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aScale', new THREE.BufferAttribute(aScale, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: size * 16 * pixelRatio },
      uOpacity: { value: 1 },
        uC1: { value: new THREE.Color(color1) },
        uC2: { value: new THREE.Color(color2) },
        uSway: { value: sway },
        uFall: { value: fall },
      },
      vertexShader: `
        attribute float aScale; attribute float aSeed;
        uniform float uTime, uSize, uSway, uFall;
        varying float vSeed; varying float vDist;
        void main() {
          vSeed = aSeed;
          vec3 p = position;
          p.x += sin(uTime * 0.35 + aSeed * 6.283) * uSway;
          p.z += cos(uTime * 0.28 + aSeed * 9.42) * uSway * 0.6;
          if (uFall > 0.5) { // snowfall: descend + wrap through a 32-unit column
            p.y -= uTime * uFall * (0.5 + aSeed * 0.9);
            p.y = mod(p.y + 6.0, 32.0) - 6.0;
          }
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vDist = -mv.z;
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * aScale * (60.0 / max(1.0, vDist));
      }`,
    fragmentShader: `
      uniform vec3 uC1, uC2; uniform float uTime, uOpacity;
      varying float vSeed; varying float vDist;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.04, d);
        // fade particles very close to the camera (prevents additive wall-of-haze)
        a *= clamp((vDist - 2.0) / 6.0, 0.0, 1.0);
        float tw = 0.65 + 0.35 * sin(uTime * 2.6 + vSeed * 40.0);
        vec3 c = mix(uC1, uC2, fract(vSeed * 7.31));
        gl_FragColor = vec4(c, a * tw * uOpacity * 0.6);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, mat };
}

/** moving neon grid on a plane (synthwave floor / pitch lines) */
export function gridMaterial({ color = '#35c7ff', scale = 40, speed = 2.0, opacity = 0.9, glowWidth = 1.2 } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uScale: { value: scale },
      uSpeed: { value: speed },
      uOpacity: { value: opacity },
      uWidth: { value: glowWidth },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime, uScale, uSpeed, uOpacity, uWidth;
      uniform vec3 uColor;
      float gridLine(vec2 uv) {
        vec2 g = abs(fract(uv) - 0.5);
        vec2 fw = fwidth(uv);
        vec2 l = smoothstep(0.5 - fw * uWidth, 0.5, g);
        return max(l.x, l.y);
      }
      void main() {
        vec2 uv = vUv * uScale;
        uv.y += uTime * uSpeed;
        float line = gridLine(uv);
        float fade = 1.0 - smoothstep(0.05, 0.5, length(vUv - 0.5));
        float a = line * fade * uOpacity;
        if (a < 0.003) discard;
        gl_FragColor = vec4(uColor, a);
      }`,
  });
}

/** GLSL value-noise chunk (2D) used by fire/shader fx */
export const GLSL_NOISE = `
  float hash21(vec2 p) { p = fract(p * vec2(234.34, 435.345)); p += dot(p, p + 34.23); return fract(p.x * p.y); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i), b = hash21(i + vec2(1, 0)), c = hash21(i + vec2(0, 1)), d = hash21(i + vec2(1, 1));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, amp = 0.5;
    for (int i = 0; i < 4; i++) { v += amp * vnoise(p); p *= 2.03; amp *= 0.5; }
    return v;
  }`;

/** vertical gradient backdrop plane (fake sky per act) */
export function backdropTexture(top, bottom, mid) {
  return canvasTexture(16, 512, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, top);
    if (mid) grad.addColorStop(0.55, mid);
    grad.addColorStop(1, bottom);
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
}

export function backdropPlane(top, bottom, mid, width = 340, height = 190) {
  const mat = new THREE.MeshBasicMaterial({
    map: backdropTexture(top, bottom, mid), fog: false, depthWrite: false, transparent: true,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  m.renderOrder = -10;
  return m;
}

/** simple reusable bone (cylinder + knobbed ends) for the serpent set */
export function boneMesh(len = 1, r = 0.1) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.65 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r * 0.7, len, 10), mat);
  g.add(shaft);
  for (const s of [-1, 1]) {
    const k1 = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat);
    k1.position.set(0, len / 2 * s, 0);
    const k2 = k1.clone(); k2.position.x = r * 1.1;
    const k3 = k1.clone(); k3.position.x = -r * 1.1;
    g.add(k1, k2, k3);
  }
  return g;
}
