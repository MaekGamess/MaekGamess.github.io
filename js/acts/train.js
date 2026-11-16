// ─── ACT 7 · BLOCKWAY EXPRESS — haunted winter night line ────────────────────
// All scenery is at FIXED, curated positions (a clear corridor is kept in front
// of the camera) — nothing random can ever block the view.
import * as THREE from 'three';
import { backdropPlane, glowSprite, makeParticles, fadeByLocal } from '../util.js';

export function create(Q) {
  const group = new THREE.Group();

  const plastic = (hex, opts = {}) => new THREE.MeshStandardMaterial({
    color: hex, roughness: 0.6, metalness: 0.05, envMapIntensity: 0.3, ...opts,
  });
  const ironM = plastic(0x272e38, { metalness: 0.45, roughness: 0.5 }),
    ironDarkM = plastic(0x171c24),
    bloodM = plastic(0x571a1c),
    coachM = plastic(0x232c38),
    paleM = plastic(0x93a4b8),
    trimM = plastic(0xa9c3d8, { metalness: 0.6, roughness: 0.35 }),
    steelM = plastic(0x5a636e, { metalness: 0.5, roughness: 0.4 }),
    woodM = plastic(0x3a2f26),
    gravM = plastic(0x66707e, { roughness: 0.95 }),
    snowM = plastic(0xd7e3f2, { envMapIntensity: 0.2 }),
    pineM = plastic(0x0d1a13),
    trunkM = plastic(0x241c16),
    winMat = new THREE.MeshBasicMaterial({ color: 0x9dffc8 }); // sickly ghost-green

  // ── snow ground + ballast + track
  const ground = new THREE.Mesh(new THREE.BoxGeometry(220, 2, 180), snowM);
  ground.position.y = -1.01;
  group.add(ground);

  const ballast = new THREE.Mesh(new THREE.BoxGeometry(170, 0.28, 3.6), plastic(0x3c4654));
  group.add(ballast);
  const railMat = plastic(0x6d7783, { metalness: 0.6, roughness: 0.4 });
  const railL = new THREE.Mesh(new THREE.BoxGeometry(150, 0.22, 0.34), railMat);
  const railR = railL.clone();
  railL.position.set(0, 0.3, -1.05);
  railR.position.set(0, 0.3, 1.05);
  group.add(railL, railR);
  const sleepers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.16, 2.8), plastic(0x2e2620), 50);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 50; i++) {
    dummy.position.set(-72 + i * 3, 0.14, 0);
    dummy.updateMatrix();
    sleepers.setMatrixAt(i, dummy.matrix);
  }
  group.add(sleepers);

  // ── FIXED scenery ──
  // dead snow-capped pines; near-side row keeps a wide gap over the camera corridor
  const pine = (x, z, h) => {
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.5, h, 0.5), trunkM);
    trunk.position.y = h / 2;
    t.add(trunk);
    const tiers = 3;
    for (let i = 0; i < tiers; i++) {
      const ty = h * (0.35 + i * 0.22);
      const tr = 1.6 - i * 0.42;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(tr, 1.5, 7), pineM);
      cone.position.y = ty + 0.7;
      t.add(cone);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(tr * 0.7, 0.4, 7), snowM);
      cap.position.y = ty + 1.55;
      t.add(cap);
    }
    t.position.set(x, 0, z);
    t.rotation.y = (Math.sin(x * 12.9898 + z * 78.233) * 0.5) % 0.6; // deterministic jitter
    group.add(t);
  };
  // near side (camera side, z+): gap from x -12 to +30 keeps every sightline clear
  [-78, -60, -44, -28, -12, 30, 46, 64, 82].forEach((x, i) => pine(x, 11 + (i % 3) * 1.9, 4.2 + (i % 3) * 0.8));
  // far side (z-): dense wall of pines behind the track
  [-80, -66, -53, -40, -28, -16, -4, 8, 20, 33, 46, 60, 74, 86].forEach((x, i) => pine(x, -(11 + (i % 4) * 2.2), 4.6 + (i % 3) * 1.1));

  // distant ridge silhouettes (fixed)
  [[-70, 30, 9], [-28, 38, 13], [18, 32, 10], [64, 34, 8]].forEach(([x, w, h]) => {
    const r = new THREE.Mesh(new THREE.BoxGeometry(w, h, 10), plastic(0x0c141c));
    r.position.set(x, h / 2 - 0.5, -58);
    group.add(r);
  });

  // graveyard by the platform (fixed, tilted stones with snow caps)
  const grave = (x, z, rot) => {
    const g = new THREE.Group();
    const stone = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.95, 0.16), gravM);
    stone.position.y = 0.48;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.275, 0.275, 0.16, 12, 1, false, 0, Math.PI), gravM);
    top.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    top.position.y = 0.95;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.2), snowM);
    cap.position.y = 1.02;
    g.add(stone, top, cap);
    g.position.set(x, 0, z);
    g.rotation.z = rot;
    g.rotation.y = 0.3;
    group.add(g);
  };
  [[-22.5, 0.1], [-20.8, -0.12], [-19.2, 0.07], [-11.4, -0.09], [-9.8, 0.13]].forEach(([x, r]) => grave(x, 8.2 + (x % 2) * 0.9, r));
  // one cross marker
  const cross = new THREE.Group();
  const cV = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.5, 0.14), woodM);
  cV.position.y = 0.75;
  const cH = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.14), woodM);
  cH.position.y = 1.05;
  const cCap = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.18), snowM);
  cCap.position.y = 1.53;
  cross.add(cV, cH, cCap);
  cross.position.set(-15.5, 0, 9.4);
  cross.rotation.z = -0.08;
  group.add(cross);

  // ── abandoned wayside station
  const station = new THREE.Group();
  const platform = new THREE.Mesh(new THREE.BoxGeometry(12, 0.7, 3.2), plastic(0x3f4550));
  platform.position.set(-16, 0.35, 4.6);
  const platTop = new THREE.Mesh(new THREE.BoxGeometry(12, 0.1, 3.2), snowM);
  platTop.position.set(-16, 0.75, 4.6);
  station.add(platform, platTop);
  for (const px of [-20, -16, -12]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.6, 0.18), woodM);
    post.position.set(px, 1.7, 5.4);
    station.add(post);
  }
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.15, 1.9), ironDarkM);
  canopy.position.set(-16, 3.1, 5.4);
  const canopySnow = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.08, 2.0), snowM);
  canopySnow.position.set(-16, 3.22, 5.4);
  station.add(canopy, canopySnow);
  const bench = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.5), woodM);
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.1), woodM);
  back.position.set(0, 0.3, -0.2);
  bench.add(seat, back);
  bench.position.set(-18, 1.05, 5.0);
  station.add(bench);
  const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.6, 8), ironDarkM);
  lampPole.position.set(-13.5, 1.4, 5.4);
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffe2a8, transparent: true });
  const lampBall = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), lampMat);
  lampBall.position.set(-13.5, 2.8, 5.4);
  const lampGlow = glowSprite('#ffdf9e', 2.4, 0.5);
  lampGlow.position.copy(lampBall.position);
  station.add(lampPole, lampBall, lampGlow);
  const signPole = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), woodM);
  signPole.position.set(-10.2, 1.1, 4.2);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 0.08), ironDarkM);
  sign.position.set(-10.2, 2.05, 4.2);
  sign.rotation.z = 0.06;
  station.add(signPole, sign);
  group.add(station);

  // ── signal — red tonight. the express does not stop.
  const sigPole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.4, 8), ironDarkM);
  sigPole.position.set(20, 1.7, -4.2);
  const sigBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.25), ironDarkM);
  sigBox.position.set(20, 3.6, -4.2);
  const sigGreen = new THREE.Mesh(new THREE.CircleGeometry(0.1, 10), new THREE.MeshBasicMaterial({ color: 0x123310 }));
  sigGreen.position.set(20, 3.78, -4.06);
  const sigRed = new THREE.Mesh(new THREE.CircleGeometry(0.1, 10), new THREE.MeshBasicMaterial({ color: 0xff3333 }));
  sigRed.position.set(20, 3.44, -4.06);
  group.add(sigPole, sigBox, sigGreen, sigRed);
  const sigGlow = glowSprite('#ff3333', 1.8, 0.5);
  sigGlow.position.set(20, 3.44, -3.9);
  group.add(sigGlow);

  // ── moon + drifting dark clouds
  const moon = new THREE.Mesh(
    new THREE.CircleGeometry(5, 32),
    new THREE.MeshBasicMaterial({ color: 0xdcecff, fog: false }),
  );
  moon.position.set(-30, 34, -86);
  group.add(moon);
  const moonGlow = glowSprite('#b9d9ff', 22, 0.5);
  moonGlow.position.copy(moon.position);
  group.add(moonGlow);

  const clouds = [];
  [[-50, 24, -8], [-10, 28, -30], [35, 22, -18], [65, 27, -35]].forEach(([x, y, z]) => {
    const cloud = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(2.5 + j * 0.8, 1.1, 2 + (j % 2)), plastic(0x151d29));
      b.position.set(j * 1.8 - 2.7, (j % 2) * 0.5, (j % 3) * 0.7 - 0.7);
      cloud.add(b);
    }
    cloud.position.set(x, y, z);
    cloud.userData.v = 0.25 + x * 0.003;
    clouds.push(cloud);
    group.add(cloud);
  });

  // ── falling snow
  const snow = makeParticles(Math.floor(800 * Q.particles), () => ({
    x: (Math.random() - 0.5) * 140, y: Math.random() * 32 - 6, z: Math.random() * 60 - 38,
  }), { color1: '#ffffff', color2: '#cfe4ff', size: 0.55, sway: 0.5, fall: 1.7, pixelRatio: Q.pixelRatio });
  group.add(snow.points);

  // ── the haunted express (built along local +Z, nose at +Z; yawed to travel +X)
  const train = new THREE.Group();
  const wheels = [];
  const rods = [];
  let spin = 0;

  const wheelAt = (car, x, z, r, drive) => {
    const w = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.22, 20), plastic(0x101318));
    tire.rotation.z = Math.PI / 2;
    w.add(tire);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.66, 0.045, 8, 24), steelM);
    ring.rotation.y = Math.PI / 2;
    w.add(ring);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.22, r * 0.22, 0.27, 12), trimM);
    hub.rotation.z = Math.PI / 2;
    w.add(hub);
    if (drive) {
      for (let i = 0; i < 4; i++) {
        const sp = new THREE.Mesh(new THREE.BoxGeometry(0.07, r * 1.2, 0.07), steelM);
        sp.rotation.x = i * Math.PI / 4;
        w.add(sp);
      }
      for (const s of [-1, 1]) {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.32, 8), steelM);
        pin.rotation.z = Math.PI / 2;
        pin.position.set(0.15 * s, r * 0.5, 0);
        w.add(pin);
      }
    }
    w.position.set(x, 0.35 + r - 0.95, z);
    car.add(w);
    wheels.push({ g: w, r });
    return w;
  };

  // ── engine: cold iron, ghost-green cab light
  const engine = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.22, 5.2), plastic(0x101318));
  frame.position.y = 0.35;
  engine.add(frame);
  const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 3.2, 20), ironM);
  boiler.rotation.x = Math.PI / 2;
  boiler.position.set(0, 1.45, 0.9);
  engine.add(boiler);
  for (const zz of [-0.5, 0.85, 2.0]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.035, 8, 28), trimM);
    band.position.set(0, 1.45, zz);
    engine.add(band);
  }
  const smokebox = new THREE.Mesh(new THREE.CylinderGeometry(0.77, 0.77, 0.5, 20), steelM);
  smokebox.rotation.x = Math.PI / 2;
  smokebox.position.set(0, 1.45, 2.55);
  engine.add(smokebox);
  const door = new THREE.Mesh(new THREE.CircleGeometry(0.48, 20), plastic(0x0b0e13));
  door.position.set(0, 1.45, 2.81);
  const doorRing = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.045, 8, 24), trimM);
  doorRing.position.set(0, 1.45, 2.81);
  engine.add(door, doorRing);
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, 0.55, 14), ironDarkM);
  stack.position.set(0, 2.55, 1.95);
  const flare = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.17, 0.24, 14), trimM);
  flare.position.set(0, 2.92, 1.95);
  engine.add(stack, flare);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), trimM);
  dome.scale.y = 0.7;
  dome.position.set(0, 2.2, 0.9);
  engine.add(dome);
  const lampBox = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.3), trimM);
  lampBox.position.set(0, 2.32, 2.95);
  const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xd8fff4 });
  const lampGlass = new THREE.Mesh(new THREE.CircleGeometry(0.15, 14), lampGlowMat);
  lampGlass.position.set(0, 2.32, 3.11);
  engine.add(lampBox, lampGlass);
  const headBeam = glowSprite('#bfffe9', 6, 0.65);
  headBeam.position.set(0, 2.32, 3.4);
  engine.add(headBeam);
  const headLight = new THREE.PointLight(0xbfffe9, 30, 34, 2);
  headLight.position.set(0, 2.3, 4.5);
  engine.add(headLight);
  for (let i = 0; i < 4; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.7 - i * 0.35, 0.09, 0.09), bloodM);
    bar.position.set(0, 0.62 - i * 0.15, 2.85 - i * 0.14);
    bar.rotation.x = 0.55;
    engine.add(bar);
  }
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.5, 1.6), ironDarkM);
  cab.position.set(0, 1.85, -1.9);
  const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 1.85), bloodM);
  cabRoof.position.set(0, 2.68, -1.9);
  const cabSnow = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.07, 1.87), snowM);
  cabSnow.position.set(0, 2.79, -1.9);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.07, 1.64), trimM);
  trim.position.set(0, 1.32, -1.9);
  engine.add(cab, cabRoof, cabSnow, trim);
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), winMat);
    w.position.set(0.5 * s, 2.0, -1.08);
    engine.add(w);
    const w2 = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), winMat);
    w2.position.set(0.96 * s, 2.05, -1.9);
    w2.rotation.y = (Math.PI / 2) * s;
    engine.add(w2);
  }
  const ez = [1.35, -0.35];
  for (const z of ez) for (const x of [-0.95, 0.95]) wheelAt(engine, x, z, 0.55, true);
  for (const x of [-0.75, 0.75]) wheelAt(engine, x, 2.2, 0.3, false);
  for (const x of [-1.12, 1.12]) {
    const rod = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, (ez[0] - ez[1]) + 0.8), steelM);
    rod.position.set(x, -0.05 + 0.275, (ez[0] + ez[1]) / 2);
    engine.add(rod);
    rods.push({ mesh: rod, baseY: -0.05, baseZ: (ez[0] + ez[1]) / 2, crank: 0.275 });
  }
  train.add(engine);

  // ── passenger coach: dark, snow on the roof, ghost windows
  const coach = new THREE.Group();
  const cFrame = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.2, 4.0), plastic(0x101318));
  cFrame.position.y = 0.42;
  const cBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.35, 3.8), coachM);
  cBody.position.y = 1.25;
  const cRoof = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.02, 3.7, 18), paleM);
  cRoof.rotation.x = Math.PI / 2;
  cRoof.position.y = 1.98;
  const cRoofSnow = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 3.75), snowM);
  cRoofSnow.position.y = 2.85;
  coach.add(cFrame, cBody, cRoof, cRoofSnow);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), winMat);
      w.position.set(1.01 * s, 1.35, -1.35 + i * 0.9);
      w.rotation.y = (Math.PI / 2) * s;
      coach.add(w);
    }
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 3.82), trimM);
    line.position.set(1.01 * s, 0.85, 0);
    coach.add(line);
  }
  for (const z of [-1.3, 1.3]) for (const x of [-0.9, 0.9]) wheelAt(coach, x, z, 0.42, false);
  coach.position.z = -5.7;
  train.add(coach);

  // ── cargo wagon: dark crates under a snowy tarp edge
  const cargo = new THREE.Group();
  const gFrame = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.2, 3.6), plastic(0x101318));
  gFrame.position.y = 0.42;
  const bed = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.15, 3.4), woodM);
  bed.position.y = 0.6;
  cargo.add(gFrame, bed);
  for (const s of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 3.4), bloodM);
    wall.position.set(0.95 * s, 0.92, 0);
    cargo.add(wall);
  }
  const endWall = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 0.1), bloodM);
  endWall.position.set(0, 0.92, -1.65);
  cargo.add(endWall);
  const crateCols = [0x4a5568, 0x3d4a5c, 0x5c4a3d, 0x445b52, 0x39302b];
  for (let i = 0; i < 6; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.5 + (i % 3) * 0.08, 0.5 + (i % 2) * 0.1, 0.55), plastic(crateCols[i % 5]));
    c.position.set((i % 2 ? 0.4 : -0.45), 0.98 + (i % 3) * 0.28, -1.3 + i * 0.5);
    c.rotation.y = (i % 2 ? 0.3 : -0.2);
    cargo.add(c);
  }
  const tarpSnow = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.09, 2.4), snowM);
  tarpSnow.position.set(0, 1.55, 0.2);
  cargo.add(tarpSnow);
  for (const z of [-1.2, 1.2]) for (const x of [-0.9, 0.9]) wheelAt(cargo, x, z, 0.42, false);
  cargo.position.z = -10.2;
  train.add(cargo);

  // couplings
  const couple = (zMid) => {
    for (let i = 0; i < 3; i++) {
      const link = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.03, 6, 12), steelM);
      link.position.set(0, 0.48, zMid - 0.18 + i * 0.18);
      link.rotation.y = Math.PI / 2;
      train.add(link);
    }
  };
  couple(-3.35);
  couple(-8.15);

  train.position.y = 0.95;
  train.rotation.y = Math.PI / 2;
  group.add(train);

  // funnel smoke — cold and slow
  const smokeMat = new THREE.MeshBasicMaterial({ color: 0x454e5c, transparent: true, opacity: 0.55, depthWrite: false });
  const puffs = [];
  for (let i = 0; i < 12; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), smokeMat.clone());
    p.userData.k = i / 12;
    puffs.push(p);
    group.add(p);
  }

  const sky = backdropPlane('#060a12', '#0b1524', '#04070d');
  sky.position.set(0, 44, -130);
  sky.scale.set(1.6, 1.6, 1);
  group.add(sky);

  // moonlight rig
  const moonDir = new THREE.DirectionalLight(0x9fbde0, 0.5);
  moonDir.position.set(-30, 40, -20);
  group.add(moonDir);
  group.add(new THREE.HemisphereLight(0x1e2c40, 0x080c12, 0.4));

  let t = 0;
  return {
    group,
    update(dt, local) {
      t += dt;
      const fade = fadeByLocal(local);
      sky.material.opacity = fade;
      snow.mat.uniforms.uTime.value = t;
      snow.mat.uniforms.uOpacity.value = fade;
      // train shuttles through frame, wraps around
      const cycle = 46;
      const k = (t % cycle) / cycle;
      train.position.x = -70 + k * 140;
      train.position.y = 0.95 + Math.abs(Math.sin(t * 14)) * 0.04;
      spin += dt * 4.2;
      for (const w of wheels) w.g.rotation.x = spin * (0.55 / w.r);
      for (const r of rods) {
        r.mesh.position.y = r.baseY + r.crank * Math.cos(spin);
        r.mesh.position.z = r.baseZ + r.crank * Math.sin(spin);
      }
      headLight.intensity = 26 + Math.sin(t * 13.7) * 8;
      headBeam.material.opacity = 0.5 + Math.sin(t * 13.7) * 0.2;
      // smoke
      for (const p of puffs) {
        p.userData.k = (p.userData.k + dt * 0.16) % 1;
        const kk = p.userData.k;
        const cx = train.position.x + 1.95;
        p.position.set(
          cx - kk * 6 + Math.sin(kk * 9 + p.id) * kk * 1.2,
          3.9 + kk * 5.0,
          Math.cos(kk * 7 + p.id) * kk * 0.9,
        );
        p.scale.setScalar(0.5 + kk * 2.2);
        p.material.opacity = 0.5 * (1 - kk) * Math.min(1, kk * 4);
      }
      // station lamp — buzzing, failing
      const flick = (Math.sin(t * 30.7) * Math.sin(t * 13.1) > -0.25) ? 0.95 : 0.2;
      lampMat.opacity = 0.35 + flick * 0.6;
      lampGlow.material.opacity = 0.25 + flick * 0.4;
      sigGlow.material.opacity = 0.35 + Math.sin(t * 2.4) * 0.2;
      for (const c of clouds) {
        c.position.x += c.userData.v * dt;
        if (c.position.x > 90) c.position.x = -90;
      }
      moonGlow.material.opacity = 0.35 + Math.sin(t * 0.7) * 0.08;
    },
  };
}
