// ─── ACT 8 · GROUND ZERO — the detonation finale ─────────────────────────────
// Everything is a pure function of `f` (0..1 scroll progress of the final act)
// so scrolling backwards un-detonates the world.
import * as THREE from 'three';
import { backdropPlane, glowSprite, rand, clamp, smooth, GLSL_NOISE, fadeByLocal } from '../util.js';

const DETONATE = 0.33;      // f at which the bomb goes off
const GZ = new THREE.Vector3(0, 0, -10); // ground zero

export function create(Q) {
  const group = new THREE.Group();

  // ── desert
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(160, 48),
    new THREE.MeshStandardMaterial({ color: 0x6b5a41, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);

  const rockMat = new THREE.MeshStandardMaterial({ color: 0x554838, roughness: 0.95 });
  const rocks = [];
  for (let i = 0; i < 26; i++) {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(0.3, 1.6), 0), rockMat);
    const a = rand(Math.PI * 2), d = rand(8, 60);
    r.position.set(GZ.x + Math.cos(a) * d, rand(0, 0.4), GZ.z + Math.sin(a) * d);
    r.rotation.set(rand(Math.PI), rand(Math.PI), 0);
    rocks.push(r);
    group.add(r);
  }

  // ── test tower
  const tower = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.6, metalness: 0.6 });
  const H = 9;
  for (const [x, z] of [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, H, 0.18), steel);
    leg.position.set(x * (1 - 0.25), H / 2, z * (1 - 0.25));
    tower.add(leg);
  }
  for (let i = 1; i <= 3; i++) {
    const cross = new THREE.Mesh(new THREE.BoxGeometry(1.9 - i * 0.28, 0.1, 0.1), steel);
    cross.position.y = i * (H / 4);
    tower.add(cross);
    const cross2 = cross.clone(); cross2.rotation.y = Math.PI / 2;
    tower.add(cross2);
  }
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.9, 1.9), steel);
  cabin.position.y = H + 0.45;
  tower.add(cabin);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 8), steel);
  mast.position.y = H + 2.1;
  tower.add(mast);
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xff2222 }),
  );
  beacon.position.y = H + 3.3;
  tower.add(beacon);
  const beaconGlow = glowSprite('#ff3333', 2.2, 0.8);
  beaconGlow.position.copy(beacon.position);
  tower.add(beaconGlow);
  // the bomb itself, hanging in the cabin
  const bomb = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.42, 0.9, 6, 14),
    new THREE.MeshStandardMaterial({ color: 0x707a84, roughness: 0.35, metalness: 0.85 }),
  );
  bomb.position.y = H + 0.3;
  tower.add(bomb);
  tower.position.copy(GZ);
  group.add(tower);

  // ── fireball (noise shader)
  const fireMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uHeat: { value: 1 } },
    vertexShader: `
      varying vec2 vUv; varying vec3 vN; varying vec3 vEye;
      void main() {
        vUv = uv; vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.);
        vEye = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec2 vUv; varying vec3 vN; varying vec3 vEye;
      uniform float uTime, uHeat;
      ${GLSL_NOISE}
      void main() {
        vec2 p = vUv * vec2(7.0, 3.5);
        float n = fbm(p + vec2(0.0, -uTime * 0.55)) * 0.7 + fbm(p * 2.3 + vec2(uTime * 0.2, -uTime * 0.9)) * 0.3;
        float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vEye))), 1.6);
        vec3 c = mix(vec3(1.0, 0.97, 0.86), vec3(1.0, 0.42, 0.03), clamp(n * 1.35, 0.0, 1.0));
        c = mix(c, vec3(0.62, 0.10, 0.02), fres * 0.85);
        c *= uHeat * (1.7 + n * 1.3);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const fireball = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), fireMat);
  fireball.position.copy(GZ).setY(2);
  fireball.visible = false;
  group.add(fireball);
  const fireLight = new THREE.PointLight(0xffa040, 0, 200, 1.6);
  fireLight.position.copy(GZ).setY(8);
  group.add(fireLight);

  // ── shockwave ring
  const shockMat = new THREE.MeshBasicMaterial({
    color: 0xfff0d8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const shock = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 90), shockMat);
  shock.rotation.x = -Math.PI / 2;
  shock.position.copy(GZ).setY(0.4);
  group.add(shock);

  // ── dust skirt ring racing over the ground
  const dust = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 90, 1), new THREE.MeshBasicMaterial({
    color: 0xb9a27c, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide,
  }));
  dust.rotation.x = -Math.PI / 2;
  dust.position.copy(GZ).setY(0.25);
  group.add(dust);

  // ── mushroom cloud — GPU particles, seeded, looped by uTime, gated by uActivate
  const stemCount = Math.floor(700 * Q.particles), capCount = Math.floor(1000 * Q.particles);
  const mkCloud = (count, placer, c1, c2) => {
    const pos = new Float32Array(count * 3), seed = new Float32Array(count), scale = new Float32Array(count);
    for (let i = 0; i < count; i++) { placer(i, pos, seed, scale); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scale, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 }, uActivate: { value: 0 },
        uPixelRatio: { value: Q.pixelRatio },
        uC1: { value: new THREE.Color(c1) }, uC2: { value: new THREE.Color(c2) },
      },
      vertexShader: `
        attribute float aSeed, aScale;
        uniform float uTime, uActivate, uPixelRatio;
        varying float vSeed; varying float vA;
        void main() {
          vSeed = aSeed;
          float life = 7.0;                       // seconds per particle loop
          float k = fract(aSeed + uTime / life);  // where in its own loop
          float rise = k * 34.0 * uActivate;
          // column swirl
          float ang = aSeed * 6.2831 + uTime * (0.25 + aSeed * 0.35);
          float R = 1.6 + aSeed * 2.6 + k * 1.5;
          vec3 p = position;
          p.y += rise;
          p.x = position.x * 0.2 + cos(ang) * R;
          p.z = position.z * 0.2 + sin(ang) * R;
          vA = uActivate * smoothstep(0.0, 0.12, k) * (1.0 - smoothstep(0.75, 1.0, k));
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (30.0 + aScale * 90.0) * uPixelRatio * (60.0 / max(1.0, -mv.z));
        }`,
      fragmentShader: `
        uniform vec3 uC1, uC2; varying float vSeed; varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.1, d) * vA * 0.5;
          vec3 c = mix(uC1, uC2, fract(vSeed * 3.7));
          gl_FragColor = vec4(c, a);
        }`,
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    return { pts, mat };
  };
  const stem = mkCloud(stemCount, (i, pos, seed, scale) => {
    pos[i * 3] = GZ.x + rand(-2.5, 2.5); pos[i * 3 + 1] = GZ.y + rand(0, 3); pos[i * 3 + 2] = GZ.z + rand(-2.5, 2.5);
    seed[i] = Math.random(); scale[i] = rand(0.2, 1);
  }, '#ff9a3c', '#ffd9a0');
  stem.pts.position.set(0, 0, 0);
  const cap = mkCloud(capCount, (i, pos, seed, scale) => {
    pos[i * 3] = GZ.x + rand(-3, 3); pos[i * 3 + 1] = 30 + rand(-2, 4); pos[i * 3 + 2] = GZ.z + rand(-3, 3);
    seed[i] = Math.random(); scale[i] = rand(0.4, 1.6);
  }, '#5a5148', '#8a7a68');
  group.add(stem.pts, cap.pts);

  // ember drift around the column
  const emberGlow = glowSprite('#ff7a2f', 30, 0.0);
  emberGlow.position.copy(GZ).setY(30);
  group.add(emberGlow);

  const sky = backdropPlane('#1c120a', '#4a3320', '#0d0805');
  sky.position.set(0, 30, -130);
  group.add(sky);

  const moonish = new THREE.PointLight(0x8fa8c8, 30, 120, 2);
  moonish.position.set(-30, 40, 20);
  group.add(moonish);

  let t = 0;
  return {
    group,
    /** @param f finale scroll progress 0..1 */
    update(dt, local, pointer, f = 0) {
      t += dt;
      const pre = f < DETONATE;
      const k = clamp((f - DETONATE) / (1 - DETONATE), 0, 1); // post-detonation progress
      sky.material.opacity = fadeByLocal(local);

      // tower + bomb visible only before the blast; after, it's gone
      tower.visible = pre;
      beaconGlow.material.opacity = pre ? (0.35 + Math.max(0, Math.sin(t * (2 + f * 8))) * 0.65) : 0;

      // fireball
      fireball.visible = !pre;
      if (fireball.visible) {
        const grow = smooth(0, 0.18, k);
        const decay = 1 - smooth(0.55, 0.95, k) * 0.55;
        const s = (0.5 + grow * 13) * decay + Math.sin(t * 2.2) * 0.3;
        fireball.scale.setScalar(Math.max(0.001, s));
        fireball.position.y = 2 + smooth(0.1, 0.7, k) * 6;
        fireMat.uniforms.uTime.value = t;
        fireMat.uniforms.uHeat.value = 1.4 * decay + 0.3;
        fireLight.intensity = 2600 * decay * grow;
        fireLight.color.setHSL(0.07 - k * 0.02, 0.9, 0.55);
      } else {
        fireLight.intensity = 0;
      }

      // shockwave
      const sk = clamp((f - DETONATE) / 0.24, 0, 1);
      shock.visible = sk > 0 && sk < 1;
      if (shock.visible) {
        shock.scale.setScalar(1 + sk * 85);
        shockMat.opacity = (1 - sk) * 0.9;
      }
      const dk = clamp((f - (DETONATE - 0.004)) / 0.3, 0, 1);
      dust.visible = dk > 0 && dk < 1;
      if (dust.visible) {
        dust.scale.setScalar(1 + dk * 70);
        dust.material.opacity = (1 - dk) * 0.5;
      }

      // mushroom cloud
      const activate = smooth(DETONATE + 0.02, 0.5, f);
      stem.mat.uniforms.uTime.value = t;
      cap.mat.uniforms.uTime.value = t;
      stem.mat.uniforms.uActivate.value = activate;
      cap.mat.uniforms.uActivate.value = activate;
      cap.pts.position.y = -smooth(0.15, 0.8, k) * 4 + 4; // cap sinks/spreads as it matures
      emberGlow.material.opacity = activate * (0.35 + Math.sin(t * 1.4) * 0.1);

      // sky scorches
      sky.material.color.setRGB(1 - k * 0.35, 1 - k * 0.55, 1 - k * 0.7);
      moonish.intensity = 30 * (1 - k) + 8;
    },
    DETONATE,
  };
}
