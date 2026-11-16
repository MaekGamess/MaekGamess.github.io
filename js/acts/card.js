// ─── ACT 6 · LEGENDS TCG — every card is a striker ───────────────────────────
import * as THREE from 'three';
import { canvasTexture, backdropPlane, makeParticles, rand, fadeByLocal } from '../util.js';

function cardFrontTexture() {
  return canvasTexture(640, 900, (g, w, h) => {
    // bg
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#1b1040'); bg.addColorStop(0.5, '#3d1657'); bg.addColorStop(1, '#0c0826');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    // burst rays
    g.save(); g.translate(w / 2, h * 0.42);
    for (let i = 0; i < 28; i++) {
      g.rotate(Math.PI * 2 / 28);
      g.fillStyle = i % 2 ? 'rgba(255,214,120,0.08)' : 'rgba(120,90,255,0.06)';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(w, -40); g.lineTo(w, 40); g.fill();
    }
    g.restore();
    // frame
    const frame = g.createLinearGradient(0, 0, w, 0);
    frame.addColorStop(0, '#ffe9a8'); frame.addColorStop(0.5, '#c9932f'); frame.addColorStop(1, '#ffe9a8');
    g.strokeStyle = frame; g.lineWidth = 18; g.strokeRect(9, 9, w - 18, h - 18);
    g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,0.5)'; g.strokeRect(24, 24, w - 48, h - 48);
    // watermark 99
    g.fillStyle = 'rgba(255,214,120,0.07)';
    g.font = '900 340px "Arial Black", sans-serif';
    g.textAlign = 'center'; g.fillText('99', w / 2, h * 0.52);
    // player silhouette — geometric kicker
    g.save(); g.translate(w / 2, h * 0.44); g.scale(1.6, 1.6);
    g.fillStyle = '#0a0620';
    g.strokeStyle = '#ffd76b'; g.lineWidth = 3; g.lineJoin = 'round';
    const body = new Path2D();
    body.moveTo(0, -132);            // head top
    body.arc(0, -148, 17, 0, Math.PI * 2); // head
    body.moveTo(-6, -130);
    body.lineTo(-16, -70);           // torso lean
    body.lineTo(-30, -18);
    body.moveTo(-14, -74);
    body.lineTo(34, -84);            // kicking leg up
    body.lineTo(72, -108);
    body.moveTo(-16, -70);
    body.lineTo(-48, -36);           // arms out
    body.lineTo(-64, -8);
    body.lineTo(-40, -2);
    body.lineTo(-18, -30);
    body.moveTo(-30, -18);
    body.lineTo(-64, 24);            // planted leg
    body.lineTo(-70, 66);
    g.fill(body); g.stroke(body);
    // ball
    g.beginPath(); g.arc(96, -92, 13, 0, Math.PI * 2);
    g.fillStyle = '#ffd76b'; g.fill(); g.stroke();
    g.restore();
    // name plate
    const plate = g.createLinearGradient(0, h * 0.62, 0, h * 0.72);
    plate.addColorStop(0, 'rgba(20,10,50,0.95)'); plate.addColorStop(1, 'rgba(8,4,24,0.95)');
    g.fillStyle = plate; g.fillRect(40, h * 0.62, w - 80, h * 0.1);
    g.strokeStyle = '#c9932f'; g.lineWidth = 3; g.strokeRect(40, h * 0.62, w - 80, h * 0.1);
    g.fillStyle = '#ffe9a8'; g.font = '900 64px "Arial Black", sans-serif'; g.textAlign = 'center';
    g.fillText('NOVA', w / 2, h * 0.695);
    // stats
    const stats = [['PAC', '97'], ['SHO', '99'], ['PAS', '93'], ['DRI', '96'], ['DEF', '64'], ['PHY', '82']];
    g.font = '700 26px Arial'; g.fillStyle = '#b8a8e8';
    const sw = (w - 100) / 6;
    stats.forEach(([k, v], i) => {
      const x = 50 + sw * i + sw / 2;
      g.fillText(k, x, h * 0.775);
      g.fillStyle = '#ffffff'; g.font = '900 40px "Arial Black", Arial';
      g.fillText(v, x, h * 0.825);
      g.font = '700 26px Arial'; g.fillStyle = '#b8a8e8';
    });
    // rarity gems
    for (let i = 0; i < 5; i++) {
      const x = w / 2 + (i - 2) * 44, y = h * 0.89;
      const gem = g.createLinearGradient(x - 14, y - 14, x + 14, y + 14);
      gem.addColorStop(0, i < 3 ? '#ffd76b' : '#8f6aff'); gem.addColorStop(1, i < 3 ? '#c9932f' : '#4d2fb0');
      g.fillStyle = gem;
      g.beginPath();
      g.moveTo(x, y - 15); g.lineTo(x + 13, y); g.lineTo(x, y + 15); g.lineTo(x - 13, y);
      g.fill();
    }
    // badge
    g.fillStyle = '#ffd76b'; g.beginPath(); g.arc(80, 80, 34, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1b1040'; g.font = '900 40px "Arial Black", Arial'; g.fillText('HN', 80, 94);
  });
}

function cardBackTexture() {
  return canvasTexture(640, 900, (g, w, h) => {
    g.fillStyle = '#120a30'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,214,120,0.35)'; g.lineWidth = 14; g.strokeRect(10, 10, w - 20, h - 20);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 6; x++) {
      g.save(); g.translate(70 + x * 100, 80 + y * 108); g.rotate(Math.PI / 4);
      g.fillStyle = (x + y) % 2 ? 'rgba(143,106,255,0.18)' : 'rgba(255,214,120,0.1)';
      g.fillRect(-22, -22, 44, 44); g.restore();
    }
    g.fillStyle = '#ffd76b'; g.font = '900 90px "Arial Black", Arial'; g.textAlign = 'center';
    g.fillText('LEGENDS', w / 2, h / 2 - 10);
    g.font = '900 54px "Arial Black", Arial';
    g.fillText('TCG', w / 2, h / 2 + 70);
  });
}

function roundedCardGeo(w = 3.3, h = 4.62, r = 0.28) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return new THREE.ShapeGeometry(s, 12);
}

export function create(Q) {
  const group = new THREE.Group();
  const geo = roundedCardGeo();

  // hero card
  const card = new THREE.Group();
  const front = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    map: cardFrontTexture(), roughness: 0.5, metalness: 0.08, envMapIntensity: 0.35,
  }));
  card.add(front);
  const back = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    map: cardBackTexture(), roughness: 0.4, metalness: 0.15,
  }));
  back.rotation.y = Math.PI;
  card.add(back);
  card.position.set(0, 3.1, 0);
  group.add(card);

  // holographic sheen layer (rainbow stripes sliding over the face)
  const holoMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec2 vUv; varying vec3 vPos;
      void main(){ vUv = uv; vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `
      varying vec2 vUv; varying vec3 vPos; uniform float uTime;
      vec3 hue(float h) {
        vec3 c = abs(mod(h * 6.0 + vec3(0., 4., 2.), 6.) - 3.) - 1.;
        return clamp(c, 0., 1.);
      }
      void main() {
        float bands = sin((vUv.x + vUv.y) * 22.0 - uTime * 1.4) * 0.5 + 0.5;
        float sweep = smoothstep(0.35, 0.0, abs(fract(uTime * 0.11) * 1.6 - 0.3 - vUv.y));
        vec3 c = hue(fract(vUv.x * 0.6 + vUv.y * 0.35 + uTime * 0.08));
        float a = bands * 0.11 + sweep * 0.28;
        // fade near edges of card
        vec2 e = min(vUv, 1.0 - vUv);
        a *= smoothstep(0.0, 0.06, min(e.x, e.y));
        gl_FragColor = vec4(c * 1.15, a);
      }`,
  });
  const holo = new THREE.Mesh(geo, holoMat);
  holo.position.z = 0.012;
  card.add(holo);

  // fanned ghost cards behind
  const ghostMat = new THREE.MeshStandardMaterial({
    map: cardBackTexture(), roughness: 0.5, metalness: 0.1, transparent: true, opacity: 0.4,
  });
  for (const [x, rz, z, s] of [[-3.6, 0.34, -2.4, 0.86], [3.6, -0.34, -2.4, 0.86], [-6.4, 0.55, -5, 0.7], [6.4, -0.55, -5, 0.7]]) {
    const gh = new THREE.Mesh(geo, ghostMat);
    gh.position.set(x, 3.1 + rand(-0.4, 0.4), z);
    gh.rotation.z = rz;
    gh.scale.setScalar(s);
    gh.userData.ph = rand(Math.PI * 2);
    group.add(gh);
  }

  // sparkles
  const spark = makeParticles(Math.floor(380 * Q.particles), () => ({
    x: rand(-12, 12), y: rand(-4, 11), z: rand(-8, 6),
  }), { color1: '#ffd76b', color2: '#b48aff', size: 0.55, pixelRatio: Q.pixelRatio });
  group.add(spark.points);

  const sky = backdropPlane('#150b2e', '#33204f', '#080418');
  sky.position.set(0, 18, -90);
  group.add(sky);

  const key = new THREE.PointLight(0xfff1d6, 42, 60, 2); key.position.set(-7, 9, 7); group.add(key);
  const fill = new THREE.PointLight(0xb48aff, 32, 55, 2); fill.position.set(8, 6, -4); group.add(fill);
  const rim = new THREE.PointLight(0x7ee8ff, 22, 50, 2); rim.position.set(0, 10, -10); group.add(rim);

  let t = 0;
  const ghosts = group.children.filter(c => c.userData.ph !== undefined);
  return {
    group,
    update(dt, local, pointer) {
      t += dt;
      sky.material.opacity = fadeByLocal(local);
      spark.mat.uniforms.uOpacity.value = fadeByLocal(local);
      holoMat.uniforms.uTime.value = t;
      spark.mat.uniforms.uTime.value = t;
      // showcase float + tilt toward pointer
      card.rotation.y = Math.sin(t * 0.5) * 0.5 + (pointer ? pointer.x * 0.35 : 0);
      card.rotation.x = Math.sin(t * 0.33) * 0.1 - (pointer ? pointer.y * 0.22 : 0);
      card.position.y = 3.1 + Math.sin(t * 0.9) * 0.22;
      for (const gh of ghosts) {
        gh.rotation.y = Math.sin(t * 0.4 + gh.userData.ph) * 0.3 + 0.15;
        gh.position.y += Math.sin(t * 0.7 + gh.userData.ph) * 0.0035;
      }
      key.intensity = 34 + Math.sin(t * 2.2) * 10;
    },
  };
}
