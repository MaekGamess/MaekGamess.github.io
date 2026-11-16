// ─── ACT 5 · SKULLVIPER — feed the serpent ───────────────────────────────────
import * as THREE from 'three';
import { backdropPlane, boneMesh, glowSprite, rand, fadeByLocal } from '../util.js';

function makeSkull(scale = 1, horned = false, eyeColor = '#57ff6e') {
  const g = new THREE.Group();
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xcfc7b4, roughness: 0.62, metalness: 0.05 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x050604, roughness: 0.9 });

  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.5, 22, 16), boneMat);
  cranium.scale.set(1, 0.92, 1.12);
  g.add(cranium);

  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.24, 0.52), boneMat);
  jaw.position.set(0, -0.3, 0.14);
  g.add(jaw);

  // eye sockets + glowing pupils
  for (const s of [-1, 1]) {
    const socket = new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 10), darkMat);
    socket.position.set(0.19 * s, 0.03, 0.42);
    g.add(socket);
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 10, 8),
      new THREE.MeshBasicMaterial({ color: eyeColor }),
    );
    pupil.position.set(0.19 * s, 0.03, 0.5);
    g.add(pupil);
  }
  // nose
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 8), darkMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, -0.14, 0.56);
  g.add(nose);
  // fangs
  for (const s of [-1, 1]) {
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.16, 6), boneMat);
    fang.rotation.x = Math.PI;
    fang.position.set(0.16 * s, -0.42, 0.36);
    g.add(fang);
  }
  if (horned) {
    for (const s of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.55, 8), boneMat);
      horn.position.set(0.3 * s, 0.34, -0.18);
      horn.rotation.z = -0.7 * s;
      horn.rotation.x = -0.5;
      g.add(horn);
    }
  }
  g.scale.setScalar(scale);
  return g;
}

function makeVertebra() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xbdb5a2, roughness: 0.7 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.1, 10, 18), mat);
  g.add(ring);
  for (let i = 0; i < 4; i++) {
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat);
    const a = i / 4 * Math.PI * 2;
    k.position.set(Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0);
    g.add(k);
  }
  return g;
}

export function create(Q) {
  const group = new THREE.Group();

  // slither path — a closed S-loop the serpent endlessly hunts along
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(17, 1.4, 8), new THREE.Vector3(8, 3.6, -13), new THREE.Vector3(-7, 0.8, -15),
    new THREE.Vector3(-18, 3.2, 2), new THREE.Vector3(-9, 5.0, 14), new THREE.Vector3(2, 1.6, 17),
    new THREE.Vector3(12, 3.0, 13), new THREE.Vector3(20, 1.2, 0),
  ], true, 'catmullrom', 0.6);
  const pathLen = path.getLength();

  const SEGS = 26, SPACING = 0.9;
  const head = makeSkull(1.5, true);
  const spine = [];
  const segDu = SPACING / pathLen;
  for (let i = 1; i <= SEGS; i++) {
    const isSkull = i % 5 === 0;
    const seg = isSkull ? makeSkull(1.0 - i * 0.012, false) : makeVertebra();
    seg.scale.multiplyScalar(1 - i * 0.02);
    spine.push(seg);
    group.add(seg);
  }
  group.add(head);

  // head glow
  const eyeGlow = glowSprite('#57ff6e', 3.4, 0.55);
  group.add(eyeGlow);

  // giant forgotten god skull in the mist (background)
  const godSkull = makeSkull(16, true, '#ff3b3b');
  godSkull.position.set(-6, 6, -58);
  group.add(godSkull);
  const godGlow1 = glowSprite('#ff3b3b', 6, 0.7); godGlow1.position.set(-6 + 16 * 0.19, 6 + 16 * 0.03, -58 + 16 * 0.5);
  const godGlow2 = glowSprite('#ff3b3b', 6, 0.7); godGlow2.position.set(-6 - 16 * 0.19, 6 + 16 * 0.03, -58 + 16 * 0.5);
  group.add(godGlow1, godGlow2);

  // scattered bones on the floor
  const bones = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const b = boneMesh(rand(0.8, 2.2), rand(0.06, 0.12));
    b.position.set(rand(-24, 24), rand(0, 0.4), rand(-26, 10));
    b.rotation.set(rand(Math.PI), rand(Math.PI), rand(Math.PI));
    bones.add(b);
  }
  group.add(bones);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(60, 40),
    new THREE.MeshStandardMaterial({ color: 0x161d10, roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  const sky = backdropPlane('#050803', '#101c08', '#020402');
  sky.position.set(0, 20, -110);
  group.add(sky);

  const green = new THREE.PointLight(0x57ff6e, 200, 55, 2); green.position.set(0, 9, 6); group.add(green);
  const red = new THREE.PointLight(0xff3b3b, 260, 120, 2); red.position.set(-8, 15, -34); group.add(red);
  const cold = new THREE.PointLight(0x9fd8ff, 120, 55, 2); cold.position.set(12, 7, 14); group.add(cold);
  const headL = new THREE.PointLight(0xaaffbb, 90, 40, 2); headL.position.set(0, 6, 10); group.add(headL);

  let t = 0, uHead = 0;
  const vTmp = new THREE.Vector3(), vTmp2 = new THREE.Vector3();
  return {
    group,
    update(dt, local) {
      t += dt;
      sky.material.opacity = fadeByLocal(local);
      uHead = (uHead + (dt * 3.4) / pathLen) % 1;
      const bob = Math.sin(t * 2.2) * 0.15;

      path.getPointAt(uHead, head.position);
      head.position.y += bob;
      path.getPointAt((uHead + 0.012) % 1, vTmp);
      head.lookAt(vTmp);
      head.rotateY(Math.PI); // skull "forward" is +z
      eyeGlow.position.copy(head.position).add(vTmp2.copy(head.getWorldDirection(new THREE.Vector3())).multiplyScalar(0.6));

      for (let i = 0; i < spine.length; i++) {
        const seg = spine[i];
        const u = (uHead - (i + 1) * segDu + 1) % 1;
        path.getPointAt(u, seg.position);
        seg.position.y += Math.sin(t * 2.2 - i * 0.55) * 0.12;
        path.getPointAt((u + 0.012) % 1, vTmp);
        seg.lookAt(vTmp);
        seg.rotateY(Math.PI);
        seg.rotateZ(Math.sin(u * Math.PI * 8) * 0.25);
      }

      green.intensity = 170 + Math.sin(t * 3.1) * 50;
      red.intensity = 220 + Math.sin(t * 1.2) * 60;
      const godBreath = 1 + Math.sin(t * 0.7) * 0.02;
      godSkull.scale.setScalar(16 * godBreath);
      godGlow1.material.opacity = godGlow2.material.opacity = 0.45 + Math.sin(t * 0.7) * 0.25;
    },
  };
}
