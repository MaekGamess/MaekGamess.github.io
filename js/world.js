// ─── renderer / scene / camera / post core ───────────────────────────────────
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const QUALITY = (() => {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const smallish = Math.min(innerWidth, innerHeight) < 700;
  const mobile = coarse || smallish;
  return {
    mobile,
    pixelRatio: Math.min(devicePixelRatio || 1, mobile ? 1.4 : 1.75),
    particles: mobile ? 0.55 : 1,
    bloomStrength: mobile ? 0.55 : 0.85,
    parallax: !coarse,
  };
})();

export const world = {};

export function initWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, powerPreference: 'high-performance', alpha: false,
  });
  renderer.setPixelRatio(QUALITY.pixelRatio);
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070c, 0.011);

  // image-based lighting for PBR chrome/gloss (generated, zero download)
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.06).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, 0.1, 600);
  camera.position.set(0, 2.5, 15);

  // post: render → bloom → tonemap output
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(QUALITY.pixelRatio);
  composer.setSize(innerWidth, innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), QUALITY.bloomStrength, 0.55, 0.72);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  Object.assign(world, { renderer, scene, camera, composer, bloom });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
  });

  return world;
}

const clearColor = new THREE.Color();
export function renderFrame(dt) {
  world.renderer.setClearColor(clearColor.copy(world.scene.fog.color));
  world.composer.render(dt);
}
