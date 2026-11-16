// ─── ACT 1 · TURBO STRIKE — neon bowling with pin physics ────────────────────
import * as THREE from 'three';
import { canvasTexture, backdropPlane, glowSprite, fadeByLocal, smooth, lerp, rand } from '../util.js';

const PIN_PROFILE = [
  [0.0, 0.0], [0.30, 0.0], [0.38, 0.1], [0.42, 0.3], [0.35, 0.62], [0.23, 1.02],
  [0.18, 1.3], [0.25, 1.56], [0.3, 1.8], [0.31, 2.0], [0.26, 2.2], [0.15, 2.36], [0.0, 2.44],
].map(([x, y]) => new THREE.Vector2(x, y));

function pinTexture() {
  return canvasTexture(64, 256, (g, w, h) => {
    g.fillStyle = '#f4efe6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ff2f9e';
    g.fillRect(0, h * 0.40, w, h * 0.075);
    g.fillRect(0, h * 0.52, w, h * 0.075);
    g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(0, 0, w, 6);
  });
}

function ballTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#5c0a26'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      g.save();
      g.translate(rand(w), rand(h));
      g.rotate(rand(Math.PI * 2));
      const grad = g.createLinearGradient(0, 0, rand(30, 90), rand(6, 20));
      grad.addColorStop(0, 'rgba(255,79,216,0.75)');
      grad.addColorStop(0.5, 'rgba(10,4,16,0.85)');
      grad.addColorStop(1, 'rgba(255,79,216,0.15)');
      g.fillStyle = grad;
      g.fillRect(0, 0, rand(40, 110), rand(4, 14));
      g.restore();
    }
    for (let i = 0; i < 130; i++) {
      g.fillStyle = `rgba(255,255,255,${rand(0.05, 0.28)})`;
      g.fillRect(rand(w), rand(h), 1.6, 1.6);
    }
  });
}

export function create(Q) {
  const group = new THREE.Group();

  // lane
  const laneLen = 90;
  const lane = new THREE.Mesh(
    new THREE.BoxGeometry(7.4, 0.5, laneLen),
    new THREE.MeshStandardMaterial({ color: 0x120a1c, roughness: 0.16, metalness: 0.55 }),
  );
  lane.position.set(0, -0.25, -laneLen / 2 + 24);
  group.add(lane);

  const stripMat = new THREE.MeshBasicMaterial({ color: 0xff4fd8 });
  for (const s of [-1, 1]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, laneLen), stripMat);
    strip.position.set(3.85 * s, 0.02, -laneLen / 2 + 24);
    group.add(strip);
  }
  const gutterMat = new THREE.MeshBasicMaterial({ color: 0x27e6d4 });
  for (const s of [-1, 1]) {
    const gut = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, laneLen), gutterMat);
    gut.position.set(4.9 * s, -0.02, -laneLen / 2 + 24);
    group.add(gut);
  }

  const arrowMat = new THREE.MeshBasicMaterial({ color: 0x7dfcff, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 7; i++) {
    const a = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.1, 3), arrowMat);
    a.rotation.x = Math.PI / 2;
    a.rotation.z = Math.PI;
    a.position.set((i - 3) * 1.05, 0.06, 10 - Math.abs(i - 3) * 2.6);
    group.add(a);
  }

  // kickback walls + dark pit curtain behind the rack
  const kickMat = new THREE.MeshStandardMaterial({ color: 0x1c0f2a, roughness: 0.7 });
  for (const s of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.6, 9), kickMat);
    wall.position.set(4.0 * s, 1.3, -24);
    group.add(wall);
  }
  const pit = new THREE.Mesh(new THREE.PlaneGeometry(8.3, 3.2), new THREE.MeshBasicMaterial({ color: 0x07030d }));
  pit.position.set(0, 1.6, -27.5);
  group.add(pit);
  const pitGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(8.3, 0.14),
    new THREE.MeshBasicMaterial({ color: 0xff4fd8, transparent: true, opacity: 0.6 }),
  );
  pitGlow.position.set(0, 0.1, -27.4);
  group.add(pitGlow);

  // the ball — marble-look, deep clearcoat
  const ballMat = new THREE.MeshPhysicalMaterial({
    map: ballTexture(), roughness: 0.05, metalness: 0.2,
    clearcoat: 1, clearcoatRoughness: 0.06, transparent: true,
  });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1.08, 48, 32), ballMat);
  group.add(ball);
  // finger holes
  const holes = new THREE.Group();
  const holeMat = new THREE.MeshBasicMaterial({ color: 0x05030a });
  [[-0.28, 0.3], [0.28, 0.3], [0, -0.28]].forEach(([x, y]) => {
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.11, 20), holeMat);
    d.position.set(x, y, 1.03);
    d.lookAt(x * 2, y * 2, 3);
    holes.add(d);
  });
  ball.add(holes);
  const ballGlow = glowSprite('#ff4fd8', 7, 0.5);
  ballGlow.position.y = 0.4;
  ball.add(ballGlow);

  // pins (triangle rack)
  const pinGeo = new THREE.LatheGeometry(PIN_PROFILE, 26);
  const pinMat = new THREE.MeshStandardMaterial({ map: pinTexture(), roughness: 0.22, metalness: 0.05 });
  const pins = [];
  let idx = 0;
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i <= row; i++) {
      const p = new THREE.Mesh(pinGeo, pinMat);
      const x = (i - row / 2) * 1.15;
      p.position.set(x, 0, -20 - row * 1.15);
      pins.push(p); group.add(p);
      idx++;
    }
  }

  // per-pin dynamic state (mini rigid body)
  const IDENT = new THREE.Quaternion();
  const homes = pins.map(p => new THREE.Vector3(p.position.x, 0, p.position.z));
  const dyn = pins.map(() => ({
    pos: new THREE.Vector3(), vel: new THREE.Vector3(),
    quat: new THREE.Quaternion(), angVel: new THREE.Vector3(),
    state: 'stand', from: new THREE.Vector3(), fromQ: new THREE.Quaternion(), rt: 1,
  }));
  for (let i = 0; i < pins.length; i++) dyn[i].pos.copy(homes[i]);

  // contact flash at the rack
  const impactGlow = glowSprite('#ffd9f2', 8, 0);
  impactGlow.position.set(0, 1.6, -20.4);
  group.add(impactGlow);

  const sky = backdropPlane('#160318', '#2b0a3f', '#08020f');
  sky.position.set(0, 22, -100);
  group.add(sky);

  const pink = new THREE.PointLight(0xff4fd8, 90, 70, 2); pink.position.set(-8, 9, 4); group.add(pink);
  const teal = new THREE.PointLight(0x27e6d4, 70, 70, 2); teal.position.set(9, 8, -18); group.add(teal);
  const front = new THREE.PointLight(0xffe9fb, 60, 60, 2); front.position.set(0, 7, 26); group.add(front);
  const pinsKey = new THREE.PointLight(0xfff4ff, 120, 40, 2); pinsKey.position.set(0, 9, -19); group.add(pinsKey);

  let t = 0, lastCycle = 0, struck = false, lastBx = 2.6, glowPulse = 0;
  const qTmp = new THREE.Quaternion(), vTmp = new THREE.Vector3();

  /** the throw lands in the pocket — impulse per standing pin by distance */
  function strike(bx, bz) {
    for (let i = 0; i < pins.length; i++) {
      const d = dyn[i];
      if (d.state !== 'stand') continue;
      const dx = d.pos.x - bx, dz = d.pos.z - bz;
      const dist = Math.hypot(dx, dz);
      if (dist < 1.5) {
        const nx = dx / (dist || 1), nz = dz / (dist || 1);
        const power = 8.5 - dist * 3.2;
        d.vel.set(nx * power, 2.5 + rand(0, 3.5), nz * power - 2.4);
        d.angVel.set(rand(-11, 11), rand(-9, 9), rand(-11, 11));
        d.state = 'fly';
      }
    }
  }

  return {
    group,
    update(dt, local) {
      t += dt;
      sky.material.opacity = fadeByLocal(local);
      const cycle = (t * 0.14) % 1;
      const IMPACT = 0.85, TRAVEL = 37;

      // loop wrap → re-rack the pins (they tween home with a little hop)
      if (cycle < lastCycle) {
        struck = false;
        for (const d of dyn) {
          if (d.state === 'stand') continue;
          d.from.copy(d.pos); d.fromQ.copy(d.quat);
          d.rt = 0; d.state = 'reset';
        }
      }
      lastCycle = cycle;

      // ball: hooking throw into the pocket, plows through, fades at the seam
      let bx;
      if (cycle <= IMPACT) {
        const roll = cycle / IMPACT;
        bx = lerp(2.6, -0.4, smooth(0.1, 0.92, roll));
        ball.position.z = 16 - Math.pow(roll, 1.45) * TRAVEL;
      } else {
        bx = lastBx;
        ball.position.z = -21 - (cycle - IMPACT) * 14; // slower through the rack
      }
      lastBx = bx;
      ball.position.set(bx, 1.08, ball.position.z);
      ball.rotation.x -= dt * (7 + Math.min(cycle / IMPACT, 1) * 11);
      ball.rotation.y += dt * 1.6; // hook spin
      ballMat.opacity = Math.min(1, Math.min(cycle / 0.04, 1) * (1 - smooth(0.955, 1, cycle)));

      // the strike
      if (!struck && cycle > IMPACT) {
        struck = true;
        strike(bx, -20.2);
        glowPulse = 1;
      }
      glowPulse = Math.max(0, glowPulse - dt * 3.2);
      impactGlow.material.opacity = glowPulse * 0.85;

      // pin dynamics
      const G = 24;
      for (let i = 0; i < pins.length; i++) {
        const d = dyn[i];
        if (d.state === 'fly') {
          d.vel.y -= G * dt;
          d.pos.addScaledVector(d.vel, dt);
          if (d.pos.y < 0) {
            d.pos.y = 0;
            if (Math.abs(d.vel.y) > 1.4) { // bounce off the lane
              d.vel.y = -d.vel.y * 0.38;
              d.vel.x *= 0.8; d.vel.z *= 0.8;
              d.angVel.multiplyScalar(0.72);
            } else { // skid + settle
              d.vel.y = 0;
              d.vel.x *= Math.max(0, 1 - 3.4 * dt);
              d.vel.z *= Math.max(0, 1 - 3.4 * dt);
              d.angVel.multiplyScalar(Math.max(0, 1 - 4.5 * dt));
              if (d.vel.lengthSq() < 0.04) d.vel.set(0, 0, 0);
            }
          }
          if (d.pos.z < -26.5) { d.pos.z = -26.5; d.vel.z *= -0.45; } // kickback curtain
          if (Math.abs(d.pos.x) > 3.8) { d.pos.x = Math.sign(d.pos.x) * 3.8; d.vel.x *= -0.5; } // gutters
          // chain reaction — a flying pin knocks the next one over
          if (d.vel.lengthSq() > 3.5) {
            for (let j = 0; j < pins.length; j++) {
              if (j === i) continue;
              const o = dyn[j];
              if (o.state !== 'stand') continue;
              if (d.pos.distanceToSquared(o.pos) < 1.05) {
                o.state = 'fly';
                o.vel.copy(d.vel).multiplyScalar(0.62);
                o.vel.y = 2 + rand(0, 3);
                o.vel.x += rand(-1.6, 1.6);
                o.vel.z -= rand(0, 1.6);
                o.angVel.set(rand(-11, 11), rand(-9, 9), rand(-11, 11));
                d.vel.multiplyScalar(0.5);
              }
            }
          }
          // tumble
          const w = d.angVel, wl = w.length();
          if (wl > 0.01) {
            qTmp.setFromAxisAngle(vTmp.copy(w).divideScalar(wl), wl * dt);
            d.quat.premultiply(qTmp);
          }
        } else if (d.state === 'reset') {
          d.rt = Math.min(1, d.rt + dt / 0.8);
          const e = d.rt * d.rt * (3 - 2 * d.rt);
          d.pos.lerpVectors(d.from, homes[i], e);
          d.pos.y = Math.sin(Math.PI * d.rt) * (1.1 + (i % 3) * 0.3);
          d.quat.slerpQuaternions(d.fromQ, IDENT, e);
          if (d.rt >= 1) { d.state = 'stand'; d.quat.copy(IDENT); d.vel.set(0, 0, 0); d.angVel.set(0, 0, 0); }
        }
        pins[i].position.copy(d.pos);
        pins[i].quaternion.copy(d.quat);
      }

      pink.intensity = 75 + Math.sin(t * 5.2) * 25;
      teal.intensity = 60 + Math.sin(t * 4.1 + 2) * 20;
    },
  };
}
