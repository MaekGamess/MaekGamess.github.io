// ─── ACT 3 · APEX ZERO — anti-grav hypercar ──────────────────────────────────
import * as THREE from 'three';
import { gridMaterial, glowSprite, glowTexture, backdropPlane, canvasTexture, rand, fadeByLocal } from '../util.js';

export function create(Q) {
  const group = new THREE.Group();

  // ── car
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x0d1b33, roughness: 0.22, metalness: 0.85, clearcoat: 1, clearcoatRoughness: 0.1,
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 26), bodyMat);
  body.scale.set(0.98, 0.34, 2.45);
  car.add(body);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.7, 30, 20), bodyMat);
  nose.scale.set(0.8, 0.26, 1.5);
  nose.position.set(0, -0.05, 2.2);
  car.add(nose);

  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, 30, 20),
    new THREE.MeshPhysicalMaterial({ color: 0x04070c, roughness: 0.05, metalness: 0.9 }),
  );
  canopy.scale.set(0.86, 0.55, 1.5);
  canopy.position.set(0, 0.34, 0.15);
  car.add(canopy);

  // neon spine + skirts
  const neonMat = new THREE.MeshBasicMaterial({ color: 0x38e0ff });
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 4.4), neonMat);
  spine.position.set(0, 0.38, -0.2);
  car.add(spine);
  for (const s of [-1, 1]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 3.6), neonMat);
    skirt.position.set(0.95 * s, -0.12, -0.1);
    car.add(skirt);
  }

  // spoiler
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.07, 0.55), bodyMat);
  spoiler.position.set(0, 0.55, -2.2);
  car.add(spoiler);
  for (const s of [-1, 1]) {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.3), bodyMat);
    strut.position.set(0.8 * s, 0.32, -2.15);
    car.add(strut);
  }

  // hover thrusters — no wheels, it flies (Tesla-style EV on an air cushion)
  const thrusterPts = [[-1.05, 1.55], [1.05, 1.55], [-1.05, -1.55], [1.05, -1.55]];
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x9feaff });
  const thrusterGlows = [];
  for (const [x, z] of thrusterPts) {
    const recess = new THREE.Mesh(
      new THREE.CircleGeometry(0.3, 24),
      new THREE.MeshBasicMaterial({ color: 0x020610 }),
    );
    recess.rotation.x = Math.PI / 2;
    recess.position.set(x, -0.38, z);
    car.add(recess);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.045, 10, 28), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, -0.44, z);
    car.add(ring);
    const g = glowSprite('#7ee8ff', 1.7, 0.75);
    g.position.set(x, -0.5, z);
    car.add(g);
    thrusterGlows.push(g);
  }

  // downward air-jet streaks (the "air particles" doing the pushing)
  const jetGeo = new THREE.BoxGeometry(0.055, 0.55, 0.055);
  const jetMat = new THREE.MeshBasicMaterial({
    color: 0x8fe8ff, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const JET_N = Math.floor(150 * Q.particles);
  const jets = new THREE.InstancedMesh(jetGeo, jetMat, JET_N);
  jets.frustumCulled = false;
  const jetData = [];
  for (let i = 0; i < JET_N; i++) {
    jetData.push({ x: 0, z: 0, y: rand(-1.1, 0.1), v: rand(6, 12), wob: rand(Math.PI * 2) });
  }
  car.add(jets);

  // floor blast glow under each thruster (ground effect)
  const blastTex = glowTexture();
  const blasts = [];
  for (const [x, z] of thrusterPts) {
    const b = new THREE.Mesh(
      new THREE.CircleGeometry(0.85, 24),
      new THREE.MeshBasicMaterial({
        map: blastTex, color: 0x38e0ff, transparent: true, opacity: 0.3,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }),
    );
    b.rotation.x = -Math.PI / 2;
    b.position.set(x, 0.03, z);
    b.userData.ph = rand(Math.PI * 2);
    blasts.push(b);
    group.add(b);
  }

  // headlights + tail burners
  const headMat = new THREE.MeshBasicMaterial({ color: 0xeafcff });
  for (const s of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.06), headMat);
    h.position.set(0.5 * s, 0.02, 2.85);
    car.add(h);
  }
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff3358 });
  const tail = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.06), tailMat);
  tail.position.set(0, 0.16, -2.95);
  car.add(tail);
  const tailGlow = glowSprite('#ff3358', 5, 0.8);
  tailGlow.position.set(0, 0.16, -3.2);
  car.add(tailGlow);
  const underglow = glowSprite('#38e0ff', 8, 0.55);
  underglow.position.y = -0.75;
  car.add(underglow);

  car.position.y = 1.05;
  group.add(car);

  // ── red light trails behind the car
  const trails = [];
  for (const s of [-1, 1]) {
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(s > 0 ? '#38e0ff' : '#ff3358') } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `
        varying vec2 vUv; uniform float uTime; uniform vec3 uColor;
        void main(){
          float head = smoothstep(0.0, 0.25, vUv.x);
          float tail = pow(vUv.x, 1.6);
          float wave = 0.75 + 0.25 * sin(vUv.x * 40.0 - uTime * 30.0);
          float a = head * tail * wave * 0.85;
          gl_FragColor = vec4(uColor * (1.2 + wave * 0.6), a);
        }`,
    });
    const trail = new THREE.Mesh(new THREE.PlaneGeometry(46, 0.3, 64, 1), mat);
    trail.rotation.x = -Math.PI / 2;
    trail.position.set(0.55 * s, 0.22, -26.4);
    group.add(trail);
    trails.push(mat);
  }

  // ── speed streak particles
  const streakGeo = new THREE.BoxGeometry(0.03, 0.03, 3.2);
  const streakMat = new THREE.MeshBasicMaterial({ color: 0x9feaff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  const streaks = new THREE.InstancedMesh(streakGeo, streakMat, Math.floor(110 * Q.particles));
  const dummy = new THREE.Object3D();
  const streakData = [];
  for (let i = 0; i < streaks.count; i++) {
    streakData.push({ x: rand(-14, 14), y: rand(0.1, 7), z: rand(-50, 12), v: rand(26, 55) });
  }
  streaks.frustumCulled = false;
  group.add(streaks);

  // ── neon grid floor
  const gridMat = gridMaterial({ color: '#2fb9ff', scale: 46, speed: 3.2, opacity: 0.8 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), gridMat);
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  // ── giant retro sun backdrop
  const sunTex = canvasTexture(256, 256, (g, w) => {
    const r = w / 2;
    const grad = g.createRadialGradient(r, r, r * 0.1, r, r, r);
    grad.addColorStop(0, '#fff3f6'); grad.addColorStop(0.4, '#ff9de2'); grad.addColorStop(0.8, '#ff3d68'); grad.addColorStop(1, 'rgba(255,61,104,0)');
    g.fillStyle = grad; g.beginPath(); g.arc(r, r, r, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 7; i++) g.fillRect(0, r + r * (0.18 + i * 0.13), w, 5 + i * 2.4);
  });
  const sun = new THREE.Mesh(
    new THREE.PlaneGeometry(46, 46),
    new THREE.MeshBasicMaterial({ map: sunTex, transparent: true, fog: false, depthWrite: false }),
  );
  sun.position.set(0, 21, -95);
  group.add(sun);

  const sky = backdropPlane('#100322', '#33084a', '#05010e');
  sky.position.set(0, 40, -110);
  group.add(sky);

  const keyL = new THREE.PointLight(0x38e0ff, 70, 60, 2); keyL.position.set(-8, 7, 4); group.add(keyL);
  const redL = new THREE.PointLight(0xff3358, 70, 60, 2); redL.position.set(8, 6, -8); group.add(redL);

  let t = 0;
  return {
    group,
    update(dt, local) {
      t += dt;
      const fade = fadeByLocal(local);
      sun.material.opacity = fade;
      sky.material.opacity = fade;
      // hover: bob + gentle pitch/roll like it's riding air
      car.position.y = 1.18 + Math.sin(t * 2.1) * 0.09 + Math.sin(t * 5.3) * 0.03;
      car.rotation.z = Math.sin(t * 1.4) * 0.025;
      car.rotation.y = Math.sin(t * 0.4) * 0.03;
      car.rotation.x = Math.sin(t * 1.7) * 0.02;
      tailGlow.material.opacity = 0.6 + Math.sin(t * 17) * 0.25;
      underglow.material.opacity = 0.5 + Math.sin(t * 8) * 0.18;
      // thruster pulses
      const thPulse = 0.55 + Math.sin(t * 11) * 0.25;
      thrusterGlows.forEach((g, i) => { g.material.opacity = thPulse + Math.sin(t * 9 + i * 1.7) * 0.12; });
      // air jets fall from the thrusters and recycle
      for (let i = 0; i < jetData.length; i++) {
        const j = jetData[i];
        j.y -= j.v * dt;
        if (j.y < -1.15) {
          const tp = thrusterPts[i % 4];
          j.x = tp[0] + rand(-0.09, 0.09);
          j.z = tp[1] + rand(-0.09, 0.09);
          j.y = -0.3 + rand(0, 0.3);
          j.v = rand(6, 12);
        }
        dummy.position.set(
          j.x + Math.sin(t * 10 + j.wob) * 0.04,
          j.y,
          j.z + Math.cos(t * 8 + j.wob) * 0.04,
        );
        dummy.rotation.z = Math.sin(t * 6 + j.wob) * 0.08;
        dummy.updateMatrix();
        jets.setMatrixAt(i, dummy.matrix);
      }
      jets.instanceMatrix.needsUpdate = true;
      // floor blast shimmer
      for (const b of blasts) {
        b.material.opacity = 0.18 + Math.max(0, Math.sin(t * 7 + b.userData.ph)) * 0.2;
        b.scale.setScalar(0.9 + Math.sin(t * 7 + b.userData.ph) * 0.12);
      }
      for (const m of trails) m.uniforms.uTime.value = t;
      gridMat.uniforms.uTime.value = t;
      for (let i = 0; i < streakData.length; i++) {
        const s = streakData[i];
        s.z += s.v * dt;
        if (s.z > 14) { s.z = -50; s.x = rand(-14, 14); s.y = rand(0.1, 7); }
        dummy.position.set(s.x, s.y, s.z);
        dummy.updateMatrix();
        streaks.setMatrixAt(i, dummy.matrix);
      }
      streaks.instanceMatrix.needsUpdate = true;
      keyL.intensity = 60 + Math.sin(t * 6) * 18;
    },
  };
}
