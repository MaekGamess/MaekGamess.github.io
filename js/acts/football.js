// ─── ACT 4 · GOLDEN BOOT — bend it past physics ──────────────────────────────
import * as THREE from 'three';
import { gridMaterial, glowSprite, backdropPlane, canvasTexture, rand, fadeByLocal } from '../util.js';

/** stylized low-poly footballer — root at the feet, facing +z */
function makePlayer({ jersey = 0x1a2f55, shorts = 0x0e1830, socks = 0x1a2f55, skin = 0xc9986f, number = '4', accent = '#f4f7ff' } = {}) {
  const g = new THREE.Group();
  const M = (c, r = 0.75) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const jerseyM = M(jersey), skinM = M(skin, 0.6), sockM = M(socks),
    shortsM = M(shorts), bootM = M(0x14161c, 0.45), hairM = M(0x1c1410, 0.9);

  // legs + boots
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.075, 0.46, 10), sockM);
    leg.position.set(0.11 * s, 0.25, 0);
    g.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.3), bootM);
    boot.position.set(0.11 * s, 0.05, 0.06);
    g.add(boot);
  }
  const shortsMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.24, 0.24), shortsM);
  shortsMesh.position.y = 0.56;
  g.add(shortsMesh);
  // jersey
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.34, 6, 12), jerseyM);
  torso.scale.z = 0.72;
  torso.position.y = 0.98;
  g.add(torso);
  // shirt number, front + back
  const numTex = canvasTexture(64, 64, (gg, w, h) => {
    gg.clearRect(0, 0, w, h);
    gg.fillStyle = accent;
    gg.font = '900 42px "Arial Black", Arial';
    gg.textAlign = 'center'; gg.textBaseline = 'middle';
    gg.fillText(number, w / 2, h / 2 + 3);
  });
  const numMat = new THREE.MeshBasicMaterial({ map: numTex, transparent: true });
  for (const s of [1, -1]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), numMat);
    p.position.set(0, 1.02, 0.163 * s);
    if (s < 0) p.rotation.y = Math.PI;
    g.add(p);
  }
  // arms — two-segment, posed per use
  const arms = [];
  for (const s of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(0.235 * s, 1.14, 0);
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.046, 0.3, 8), jerseyM);
    upper.position.y = -0.15;
    shoulder.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -0.3;
    const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.04, 0.26, 8), skinM);
    fore.position.y = -0.13;
    elbow.add(fore);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), skinM);
    hand.position.y = -0.27;
    elbow.add(hand);
    shoulder.add(elbow);
    g.add(shoulder);
    arms.push({ shoulder, elbow, side: s });
  }
  // head + hair
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 12), skinM);
  head.position.y = 1.37;
  g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.132, 16, 12), hairM);
  hair.scale.set(1, 0.72, 1);
  hair.position.set(0, 1.41, -0.02);
  g.add(hair);

  g.userData.arms = arms;
  return g;
}

function blobShadow(scale = 1) {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(0.42 * scale, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.015;
  return m;
}

export function create(Q) {
  const group = new THREE.Group();

  // pitch
  const pitchMat = gridMaterial({ color: '#37e08a', scale: 24, speed: 0, opacity: 0.5 });
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(160, 130), pitchMat);
  pitch.rotation.x = -Math.PI / 2;
  group.add(pitch);
  const turf = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 130),
    new THREE.MeshStandardMaterial({ color: 0x06180e, roughness: 1 }),
  );
  turf.rotation.x = -Math.PI / 2;
  turf.position.y = -0.02;
  group.add(turf);

  // ── the free-kick curve: over the wall, into the top corner
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-13, 0.9, 10),
    new THREE.Vector3(-7, 2.4, 4),
    new THREE.Vector3(-2.5, 4.4, -1.5),
    new THREE.Vector3(3.2, 4.2, -6.5),
    new THREE.Vector3(7.6, 3.1, -10.5),
    new THREE.Vector3(9.4, 2.35, -13.6),
  ]);
  const trailGeo = new THREE.TubeGeometry(curve, 120, 0.09, 8, false);
  const trailMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime;
      void main(){
        float flow = fract(vUv.x * 3.0 - uTime * 0.55);
        float pulse = smoothstep(0.0, 0.25, flow) * smoothstep(0.75, 0.35, flow);
        float ends = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
        vec3 c = mix(vec3(1.0, 0.83, 0.29), vec3(1.0, 0.96, 0.8), pulse);
        gl_FragColor = vec4(c, (0.3 + pulse * 0.85) * ends);
      }`,
  });
  group.add(new THREE.Mesh(trailGeo, trailMat));

  // ── energy ball: core + wireframe shell + orbiting panels
  const ball = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 28, 20),
    new THREE.MeshBasicMaterial({ color: 0xfff3c4 }),
  );
  ball.add(core);
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.78, 1),
    new THREE.MeshBasicMaterial({ color: 0xffcf4d, wireframe: true, transparent: true, opacity: 0.7 }),
  );
  ball.add(shell);
  const ballGlow = glowSprite('#ffd24a', 4.4, 0.8);
  ball.add(ballGlow);
  const panels = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const p = new THREE.Mesh(
      new THREE.CircleGeometry(rand(0.14, 0.24), 6),
      new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
    );
    const a = rand(Math.PI * 2), ph = rand(-1.2, 1.2), r = rand(1.05, 1.45);
    p.userData = { a, ph, r, sp: rand(0.5, 1.3) };
    panels.add(p);
  }
  ball.add(panels);
  group.add(ball);

  // ── the defensive wall — full players, eyes on the ball
  const wallPlayers = [];
  const KIT = { jersey: 0x1a2f55, shorts: 0x0e1830, socks: 0x1a2f55 };
  ['4', '5', '6', '2'].forEach((num, i) => {
    const man = makePlayer({ ...KIT, number: num, skin: [0xc9986f, 0x8a5a3b, 0xe6b58c, 0x6e452c][i % 4] });
    man.scale.setScalar(1.24);
    man.position.set(-4.6 + i * 0.95, 0, 0.4);
    man.userData.ph = i * 0.55;
    for (const a of man.userData.arms) { a.shoulder.rotation.z = a.side * 0.55; a.elbow.rotation.x = -1.2; }
    wallPlayers.push(man);
    group.add(man);
    const sh = blobShadow(1.24);
    sh.position.set(man.position.x, 0.015, man.position.z);
    group.add(sh);
  });

  // ── goal at the curve's end
  const goal = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: 0xf4f8ff, roughness: 0.3, metalness: 0.4, emissive: new THREE.Color('#cfe4ff'), emissiveIntensity: 0.35 });
  const pw = 7.3, ph = 2.44;
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, pw, 10), postMat);
  bar.rotation.z = Math.PI / 2; bar.position.y = ph;
  const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, ph, 10), postMat); p1.position.set(-pw / 2, ph / 2, 0);
  const p2 = p1.clone(); p2.position.x = pw / 2;
  const net = new THREE.Mesh(
    new THREE.PlaneGeometry(pw, ph, 18, 8),
    new THREE.MeshBasicMaterial({ color: 0x9fd8ff, wireframe: true, transparent: true, opacity: 0.16 }),
  );
  net.position.y = ph / 2;
  goal.add(bar, p1, p2, net);
  goal.position.set(7.2, 0, -14.6);
  group.add(goal);

  // ── goalkeeper — ready at the line, dives for the top corner… and misses
  const keeper = new THREE.Group(); // pivot at waist for the dive
  const kp = makePlayer({ jersey: 0x17c3bd, shorts: 0x101018, socks: 0x17c3bd, skin: 0x8a5a3b, number: '1', accent: '#06231f' });
  kp.position.y = -0.92;
  keeper.add(kp);
  keeper.position.set(7.2, 0.95, -13.85);
  const keeperArms = kp.userData.arms;
  for (const a of keeperArms) {
    a.shoulder.rotation.z = a.side * 2.45; // arms overhead, ready
    a.elbow.rotation.x = -0.25;
    a.elbow.children[1].scale.setScalar(1.35); // keeper gloves
  }
  group.add(keeper);
  const keeperShadow = blobShadow(1.3);
  keeperShadow.position.set(keeper.position.x, 0.015, keeper.position.z);
  group.add(keeperShadow);
  const keeperBase = keeper.position.clone();
  const goalGlow = glowSprite('#ffe9a8', 4.5, 0.3);
  goalGlow.position.copy(goal.position).setY(1.4).add(new THREE.Vector3(0, 0, 0.5));
  group.add(goalGlow);

  // stadium light cones
  const coneMat = new THREE.MeshBasicMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const cones = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(5.5, 34, 20, 1, true), coneMat);
    c.position.set(-18 + i * 12, 17, -20 + (i % 2) * 6);
    c.userData.ph = i * 1.9;
    cones.add(c);
  }
  group.add(cones);

  // crowd sparkle band
  const crowdTex = glowSprite('#ffd76b', 0.6, 0.9).material;
  const crowd = new THREE.Group();
  for (let i = 0; i < Math.floor(120 * Q.particles); i++) {
    const s = new THREE.Sprite(crowdTex.clone());
    s.material.color.set(Math.random() > 0.5 ? '#ffd76b' : '#37e0c8');
    s.scale.setScalar(rand(0.25, 0.5));
    s.position.set(rand(-45, 45), rand(3, 9), rand(-46, -38));
    s.userData.ph = rand(Math.PI * 2);
    crowd.add(s);
  }
  group.add(crowd);

  const sky = backdropPlane('#03130b', '#0b3322', '#020a06');
  sky.position.set(0, 22, -110);
  group.add(sky);

  const spot = new THREE.PointLight(0xfff1cf, 90, 90, 2); spot.position.set(0, 16, 4); group.add(spot);
  const gLight = new THREE.PointLight(0x37e08a, 55, 70, 2); gLight.position.set(-14, 6, 10); group.add(gLight);
  const rimFill = new THREE.PointLight(0xaad4ff, 45, 45, 2); rimFill.position.set(-7, 4, 9); group.add(rimFill);

  let t = 0;
  const KICK_PERIOD = 4.4;
  return {
    group,
    update(dt, local) {
      t += dt;
      sky.material.opacity = fadeByLocal(local);
      trailMat.uniforms.uTime.value = t;
      // ball flies the curve, then resets
      const k = (t % KICK_PERIOD) / KICK_PERIOD;
      const u = Math.min(1, k / 0.62);
      curve.getPointAt(u, ball.position);
      const ease = u * u * (3 - 2 * u);
      ball.scale.setScalar(0.6 + ease * 0.4);
      shell.rotation.y += dt * 2.4; shell.rotation.x += dt * 1.1;
      for (const p of panels.children) {
        const d = p.userData;
        const a = d.a + t * d.sp;
        p.position.set(Math.cos(a) * d.r, Math.sin(a * 0.7 + d.ph) * d.r * 0.6, Math.sin(a) * d.r);
        p.lookAt(ball.getWorldPosition(new THREE.Vector3()));
      }
      ballGlow.material.opacity = 0.55 + Math.sin(t * 9) * 0.25;
      // wall tracks the ball, jumps with arms tucked as it arrives
      for (const man of wallPlayers) {
        man.lookAt(ball.position.x, 0, ball.position.z);
        const near = smoothstep01(1, 0, Math.abs(u - 0.18) * 6);
        const jump = Math.max(0, Math.sin((u - 0.08) * 8.5)) * near;
        man.position.y = jump * 0.5 + Math.abs(Math.sin(t * 3 + man.userData.ph)) * 0.02;
        for (const a of man.userData.arms) a.elbow.rotation.x = -1.2 + jump * 0.55;
      }
      // keeper: bounces on his line, dives late — top bins beats him
      const dp = smoothstep01(0.8, 1.0, u);
      const dive = Math.sin(dp * Math.PI);
      keeper.position.x = keeperBase.x + dive * 1.5;
      keeper.position.y = keeperBase.y + dive * 0.85 + (1 - dive) * Math.abs(Math.sin(t * 3.2)) * 0.04;
      keeper.rotation.z = -1.02 * dive;
      keeper.rotation.x = -0.3 * dive;
      for (const a of keeperArms) a.shoulder.rotation.z = a.side * (2.45 + dive * 0.25);
      if (dive < 0.02) keeper.lookAt(ball.position.x, 0.5, ball.position.z);
      keeperShadow.position.x = keeper.position.x;
      for (const c of cones.children) {
        c.material.opacity = 0.035 + Math.max(0, Math.sin(t * 0.9 + c.userData.ph)) * 0.05;
        c.rotation.z = Math.sin(t * 0.5 + c.userData.ph) * 0.05;
      }
      crowd.children.forEach((s, i) => { s.material.opacity = 0.35 + Math.max(0, Math.sin(t * 4 + s.userData.ph)) * 0.6; });
      goalGlow.material.opacity = 0.3 + Math.max(0, Math.sin((t % KICK_PERIOD) / KICK_PERIOD * Math.PI * 1.6 - 1)) * 0.5;
    },
  };
}

function smoothstep01(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
