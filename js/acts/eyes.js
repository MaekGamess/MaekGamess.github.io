// ─── ACT 2 · ORACLE EYES — they see you first ────────────────────────────────
import * as THREE from 'three';
import { canvasTexture, backdropPlane, makeParticles, glowSprite, rand, fadeByLocal } from '../util.js';

function irisTexture(hueA = '#ffd76b', hueB = '#8f4bff') {
  return canvasTexture(256, 256, (g, w) => {
    const r = w / 2;
    g.clearRect(0, 0, w, w);
    const iris = g.createRadialGradient(r, r, r * 0.2, r, r, r);
    iris.addColorStop(0.0, '#05030a');
    iris.addColorStop(0.22, '#0a060f');
    iris.addColorStop(0.30, hueA);
    iris.addColorStop(0.62, hueB);
    iris.addColorStop(0.95, '#1a0f38');
    iris.addColorStop(1.0, 'rgba(10,6,20,0)');
    g.fillStyle = iris;
    g.beginPath(); g.arc(r, r, r, 0, Math.PI * 2); g.fill();
    // spokes
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2;
    for (let i = 0; i < 42; i++) {
      const a = i / 42 * Math.PI * 2;
      g.beginPath();
      g.moveTo(r + Math.cos(a) * r * 0.3, r + Math.sin(a) * r * 0.3);
      g.lineTo(r + Math.cos(a) * r * 0.92, r + Math.sin(a) * r * 0.92);
      g.stroke();
    }
    // glint
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.beginPath(); g.arc(r - r * 0.28, r - r * 0.3, r * 0.09, 0, Math.PI * 2); g.fill();
  });
}

function makeEye(r, seed) {
  const eye = new THREE.Group();
  const sclera = new THREE.Mesh(
    new THREE.SphereGeometry(r, 40, 28),
    new THREE.MeshStandardMaterial({ color: 0xd8d2da, roughness: 0.45, metalness: 0.05, envMapIntensity: 0.45 }),
  );
  eye.add(sclera);
  const iris = new THREE.Mesh(
    new THREE.CircleGeometry(r * 0.52, 40),
    new THREE.MeshBasicMaterial({ map: irisTexture(), transparent: true }),
  );
  iris.position.z = r * 0.925;
  iris.userData.seed = seed;
  eye.add(iris);
  // veins
  const veins = new THREE.Mesh(
    new THREE.SphereGeometry(r * 1.002, 28, 20),
    new THREE.MeshStandardMaterial({ color: 0xc98a8a, roughness: 0.5, transparent: true, opacity: 0.16, wireframe: true }),
  );
  eye.add(veins);
  const glint = glowSprite('#ffe9b0', r * 1.7, 0.32);
  glint.position.z = r * 0.6;
  eye.add(glint);
  eye.userData.iris = iris;
  return eye;
}

export function create(Q) {
  const group = new THREE.Group();

  const eyes = new THREE.Group();
  const big = makeEye(2.6, 0);
  big.position.set(0, 3.4, -6);
  eyes.add(big);
  const satellites = [
    [-7.5, 5.2, -12, 1.05], [7.8, 6.4, -14, 0.85], [-9.5, 0.2, -6, 0.7],
    [8.6, 0.4, -4, 0.62], [-4.2, 7.6, -18, 0.55], [4.6, 8.4, -20, 0.5],
  ].map(([x, y, z, r], i) => {
    const e = makeEye(r, i + 1);
    e.position.set(x, y, z);
    e.userData.floatPh = i * 1.3;
    eyes.add(e);
    return e;
  });
  group.add(eyes);

  // rune rings around the big eye
  const runeMat = new THREE.MeshBasicMaterial({ color: 0xc9a44c, transparent: true, opacity: 0.55 });
  const runeRings = new THREE.Group();
  runeRings.position.copy(big.position);
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4.2 + i * 1.15, 0.03, 8, 110), runeMat);
    ring.rotation.set(rand(Math.PI), rand(Math.PI), 0);
    ring.userData.sp = (0.12 + i * 0.08) * (i % 2 ? -1 : 1);
    runeRings.add(ring);
  }
  group.add(runeRings);

  // golden dust
  const dust = makeParticles(Math.floor(520 * Q.particles), () => ({
    x: rand(-26, 26), y: rand(-8, 22), z: rand(-34, 12),
  }), { color1: '#ffd76b', color2: '#ffe9b0', size: 0.55, pixelRatio: Q.pixelRatio });
  group.add(dust.points);

  // floating stone slabs ( pedestals / ruins )
  const slabMat = new THREE.MeshStandardMaterial({ color: 0x241a33, roughness: 0.9 });
  const slabs = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(rand(1.4, 3.4), rand(0.5, 1.1), rand(1.2, 2.6)), slabMat);
    s.position.set(rand(-22, 22), rand(-6, -1), rand(-30, 2));
    s.rotation.set(rand(-0.2, 0.2), rand(Math.PI), rand(-0.2, 0.2));
    slabs.add(s);
  }
  group.add(slabs);

  const sky = backdropPlane('#0c0416', '#241040', '#060210');
  sky.position.set(0, 20, -110);
  group.add(sky);

  const violet = new THREE.PointLight(0x8f4bff, 85, 80, 2); violet.position.set(-10, 10, 6); group.add(violet);
  const gold = new THREE.PointLight(0xffc85c, 70, 70, 2); gold.position.set(8, 8, -10); group.add(gold);
  const rim = new THREE.PointLight(0xb46bff, 55, 60, 2); rim.position.set(0, 12, -26); group.add(rim);

  let t = 0;
  const target = new THREE.Vector3();
  const lookTmp = new THREE.Vector3();
  return {
    group,
    update(dt, local, pointer) {
      t += dt;
      sky.material.opacity = fadeByLocal(local);
      dust.mat.uniforms.uTime.value = t;
      // the gaze wanders… and sometimes finds the camera
      const huntPhase = Math.sin(t * 0.21) > 0.55 ? 1 : 0;
      target.set(
        Math.sin(t * 0.5) * 10 + (pointer ? pointer.x * 26 * huntPhase : 0),
        3.4 + Math.sin(t * 0.34) * 5 + (pointer ? pointer.y * 14 * huntPhase : 0),
        26,
      );
      for (const e of [big, ...satellites]) {
        lookTmp.copy(target).sub(e.getWorldPosition(new THREE.Vector3()));
        e.lookAt(target);
        const iris = e.userData.iris;
        const dil = 1 + Math.sin(t * 0.7 + e.userData.iris.userData.seed * 2.4) * 0.16 + huntPhase * 0.12;
        iris.scale.setScalar(dil);
      }
      for (const e of satellites) e.position.y += Math.sin(t * 0.8 + e.userData.floatPh) * 0.004;
      big.position.y = 3.4 + Math.sin(t * 0.6) * 0.3;
      for (const r of runeRings.children) { r.rotation.x += r.userData.sp * dt; r.rotation.y += r.userData.sp * dt * 0.7; }
      const surge = 0.45 + Math.max(0, Math.sin(t * 0.21)) * 0.35;
      gold.intensity = 60 + surge * 75;
      rim.intensity = 45 + Math.sin(t * 1.3) * 22;
      // slight dolly of the whole set as you pass through
      group.rotation.y = Math.sin(t * 0.1) * 0.03 + local * 0.12;
    },
  };
}
