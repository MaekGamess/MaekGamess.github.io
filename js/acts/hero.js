// ─── ACT 0 · HERO — "the singularity" ────────────────────────────────────────
import * as THREE from 'three';
import { makeParticles, glowSprite, backdropPlane, rand, fadeByLocal } from '../util.js';

export function create(Q) {
  const group = new THREE.Group();

  // star / dust nebula
  const stars = makeParticles(Math.floor(2600 * Q.particles), () => {
    const r = rand(24, 130), th = rand(Math.PI * 2), ph = Math.acos(rand(-1, 1));
    return { x: r * Math.sin(ph) * Math.cos(th), y: r * Math.cos(ph) * 0.6 + rand(-6, 26), z: r * Math.sin(ph) * Math.sin(th) };
  }, { color1: '#cfeaff', color2: '#69b8ff', size: 1.15, pixelRatio: Q.pixelRatio });
  group.add(stars.points);

  // the core: pulsing icosahedron
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x0a1420, roughness: 0.18, metalness: 0.9,
    emissive: new THREE.Color('#7ee8ff'), emissiveIntensity: 1.6,
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9, 1), coreMat);
  core.position.y = 3.2;
  group.add(core);

  const coreShell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.5, 1),
    new THREE.MeshBasicMaterial({ color: 0x7ee8ff, wireframe: true, transparent: true, opacity: 0.28 }),
  );
  coreShell.position.y = 3.2;
  group.add(coreShell);

  const coreGlow = glowSprite('#9feaff', 11, 0.6);
  coreGlow.position.y = 3.2;
  group.add(coreGlow);

  // orbit rings
  const rings = new THREE.Group();
  rings.position.y = 3.2;
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x8ff2ff });
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(3.4 + i * 0.9, 0.045, 12, 120), ringMat);
    r.rotation.set(rand(Math.PI), rand(Math.PI), 0);
    r.userData.spin = rand(0.15, 0.4) * (i % 2 ? -1 : 1);
    rings.add(r);
  }
  group.add(rings);

  // orbiting sparks
  const orbiters = new THREE.Group();
  orbiters.position.y = 3.2;
  for (let i = 0; i < 26; i++) {
    const s = glowSprite('#bff4ff', rand(0.35, 0.9), 0.9);
    const rad = rand(3.2, 6.4);
    s.userData = { rad, speed: rand(0.25, 0.7) * (Math.random() > 0.5 ? -1 : 1), ph: rand(Math.PI * 2), y: rand(-1.4, 1.4) };
    orbiters.add(s);
  }
  group.add(orbiters);

  // polar grid floor
  const gridMat = new THREE.LineBasicMaterial({ color: 0x2a6d8c, transparent: true, opacity: 0.35 });
  const gridPts = [];
  for (let ri = 1; ri <= 6; ri++) {
    const r = ri * 5.5;
    const seg = 72;
    for (let i = 0; i < seg; i++) {
      const a = i / seg * Math.PI * 2, b = (i + 1) / seg * Math.PI * 2;
      gridPts.push(new THREE.Vector3(Math.cos(a) * r, -7, Math.sin(a) * r), new THREE.Vector3(Math.cos(b) * r, -7, Math.sin(b) * r));
    }
  }
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2;
    gridPts.push(new THREE.Vector3(Math.cos(a) * 5.5, -7, Math.sin(a) * 5.5), new THREE.Vector3(Math.cos(a) * 33, -7, Math.sin(a) * 33));
  }
  group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gridPts), gridMat));

  const sky = backdropPlane('#020409', '#0a1a2e', '#03060d');
  sky.position.set(0, 26, -110);
  group.add(sky);

  const key = new THREE.PointLight(0x7ee8ff, 60, 90, 2);
  key.position.set(6, 10, 8);
  group.add(key);

  let t = 0;
  return {
    group,
    update(dt, local) {
      t += dt;
      const fade = fadeByLocal(local);
      stars.mat.uniforms.uTime.value = t;
      stars.mat.uniforms.uOpacity.value = fade;
      sky.material.opacity = fade;
      group.position.y = local * 6;
      const pulse = 1.35 + Math.sin(t * 1.7) * 0.5 + Math.sin(t * 3.9) * 0.2;
      coreMat.emissiveIntensity = pulse;
      core.rotation.y += dt * 0.35; core.rotation.x += dt * 0.12;
      coreShell.rotation.y -= dt * 0.22;
      coreShell.scale.setScalar(1 + Math.sin(t * 2.2) * 0.04);
      coreGlow.material.opacity = 0.55 + Math.sin(t * 1.7) * 0.22;
      for (const r of rings.children) {
        r.rotation.x += r.userData.spin * dt * 0.4;
        r.rotation.y += r.userData.spin * dt;
      }
      for (const s of orbiters.children) {
        const u = s.userData;
        const a = u.ph + t * u.speed;
        s.position.set(Math.cos(a) * u.rad, u.y + Math.sin(a * 1.3) * 0.5, Math.sin(a) * u.rad);
      }
      key.intensity = 45 + Math.sin(t * 1.7) * 22;
    },
  };
}
