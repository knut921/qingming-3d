import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import './style.css';

const $ = (id) => document.getElementById(id);
const stage = $('stage'), canvas = $('scene');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 650px)').matches;
let renderer, controls, root, mixer, actions = [], ready = false;
let playing = !reducedMotion, animationTime = 0, duration = 30, speed = 1;
let transition = null, lastFrame = performance.now(), lastUI = 0;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(mobile ? 42 : 32, 1, 0.15, 500);
const presets = {
  overview: { position: [-43, 54, 62], target: [0, 3.3, 0] },
  bridge: { position: [-9, 24, 30], target: [0, 5.8, 0] },
  river: { position: [-27, 25, 45], target: [3, 2.5, 11] },
  quay: { position: [-44, 21, 21], target: [-25, 2.5, 1] },
};
function fail(message) {
  $('loading').classList.add('loaded');
  $('error-message').textContent = message;
  $('error').hidden = false;
  stage.dataset.ready = 'error';
}
function updatePlayButton() {
  $('play').setAttribute('aria-label', playing ? '暫停動畫' : (animationTime >= duration ? '重播動畫' : '播放動畫'));
  $('play-icon').innerHTML = playing ? '<path d="M8 5v14M16 5v14"/>' : '<path d="m8 5 11 7-11 7z"/>';
  $('play').dataset.playing = String(playing);
}
function updateTime() {
  const seconds = Math.min(30, Math.floor(animationTime));
  $('time').innerHTML = `00:${String(seconds).padStart(2, '0')} <span>/ 00:30</span>`;
  $('scrubber').value = String(animationTime);
  $('scrubber').setAttribute('aria-valuetext', `${animationTime.toFixed(1)} 秒，共 30 秒`);
}
function poseAt(seconds) {
  animationTime = THREE.MathUtils.clamp(seconds, 0, duration);
  actions.forEach((action) => { action.time = Math.min(animationTime, action.getClip().duration); });
  mixer?.update(0);
}
function togglePlayback() {
  if (!ready) return;
  if (animationTime >= duration) poseAt(0);
  playing = !playing;
  updatePlayButton();
}
function setView(name, immediate = false) {
  if (!controls) return;
  const preset = presets[name];
  const position = new THREE.Vector3(...preset.position);
  const target = new THREE.Vector3(...preset.target);
  if (mobile && name === 'overview') position.sub(target).multiplyScalar(1.33).add(target);
  if (immediate || reducedMotion) { camera.position.copy(position); controls.target.copy(target); controls.update(); transition = null; }
  else transition = { start: performance.now(), from: camera.position.clone(), fromTarget: controls.target.clone(), to: position, toTarget: target };
  document.querySelectorAll('[data-view]').forEach((button) => {
    const selected = button.dataset.view === name;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}
function zoom(factor) {
  if (!controls) return;
  transition = null;
  const offset = camera.position.clone().sub(controls.target);
  offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
  camera.position.copy(controls.target).add(offset);
  controls.update();
}

try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.minDistance = 7;
  controls.maxDistance = 180;
  controls.minPolarAngle = 0.09;
  controls.maxPolarAngle = Math.PI * 0.475;
  controls.maxTargetRadius = 70;
  controls.screenSpacePanning = true;
  controls.panSpeed = 0.65;
  controls.rotateSpeed = 0.62;
  controls.zoomSpeed = 0.8;
  controls.autoRotateSpeed = 0.55;
  controls.addEventListener('start', () => { transition = null; });
  setView('overview', true);
  scene.add(new THREE.HemisphereLight(0xfff5de, 0x748465, 2.1));
  const sun = new THREE.DirectionalLight(0xffedca, 2.8);
  sun.position.set(-30, 60, 35);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -54, right: 54, top: 48, bottom: -48, near: 1, far: 160 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0;
  sun.shadow.radius = 3;
  scene.add(sun);
  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage);
  resize();
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    ready = false;
    fail('瀏覽器暫停了 3D 顯示。請重新載入，或先關閉其他佔用較多資源的分頁。');
  });
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  loader.load(`${import.meta.env.BASE_URL}models/qingming.glb?v=20260909-visitors-1`, (gltf) => {
    root = gltf.scene;
    root.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = !object.name.startsWith('River_surface') && !object.name.startsWith('Sunlight_strokes');
        object.receiveShadow = true;
        if (object.isSkinnedMesh) object.frustumCulled = false;
      }
    });
    scene.add(root);
    mixer = new THREE.AnimationMixer(root);
    duration = Math.max(...gltf.animations.map((clip) => clip.duration), 30);
    actions = gltf.animations.map((clip) => {
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.play();
      action.paused = true;
      return action;
    });
    poseAt(0);
    ready = true;
    stage.dataset.ready = 'true';
    $('progress-bar').style.width = '100%';
    $('loading').classList.add('loaded');
    $('play').disabled = false;
    $('scrubber').disabled = false;
    updatePlayButton();
    updateTime();
    // Read-only diagnostics make deployment and motion checks reproducible.
    window.qingmingViewer = Object.freeze({ snapshot() {
      let skins = 0, bones = 0, sampleBone = null;
      const visitors = [];
      root.traverse((o) => {
        if (!o.isSkinnedMesh || !o.userData.visitor_asset) return;
        const pose = (name) => o.skeleton.bones.find(b => b.name.startsWith(name))?.quaternion.toArray();
        visitors.push({ asset: o.userData.visitor_asset, bones: o.skeleton.bones.length,
          head: pose('head'), hand: pose(o.userData.visitor_asset === 'pink' ? 'lowerL' : 'lowerR') });
      });
      root.traverse((o) => { if (o.isSkinnedMesh) skins++; if (o.isBone) { bones++; if (!sampleBone && o.name.includes('thigh')) sampleBone = o.quaternion.toArray(); } });
      return { ready, playing, time: animationTime, duration, skins, bones, sampleBone, visitors, camera: camera.position.toArray(), target: controls.target.toArray(), drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles, clips: gltf.animations.length };
    }});
  }, (event) => {
    const percent = event.total ? Math.min(95, event.loaded / event.total * 95) : 40;
    $('progress-bar').style.width = `${percent}%`;
    $('load-status').textContent = event.total ? `載入場景 ${Math.round(percent)}%` : '正在準備人物與河岸…';
  }, (error) => {
    console.error('Scene load failed', error);
    fail('場景載入未完成，請檢查網路連線後重試。也可以直接觀看已製作的 30 秒動畫。');
  });
  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min((now - lastFrame) / 1000, 0.06);
    lastFrame = now;
    if (document.hidden) return;
    if (transition) {
      const t = Math.min((now - transition.start) / 850, 1), eased = t * t * (3 - 2 * t);
      camera.position.lerpVectors(transition.from, transition.to, eased);
      controls.target.lerpVectors(transition.fromTarget, transition.toTarget, eased);
      if (t === 1) transition = null;
    }
    if (ready && playing) {
      poseAt(animationTime + dt * speed);
      if (animationTime >= duration) { playing = false; updatePlayButton(); }
    }
    controls.update(dt);
    renderer.render(scene, camera);
    if (now - lastUI > 100) { updateTime(); lastUI = now; }
  }
  requestAnimationFrame(tick);
} catch (error) {
  console.error('WebGL unavailable', error);
  fail('這個瀏覽器目前無法啟用 3D 顯示。請開啟硬體加速，或改用 Chrome、Safari、Edge。');
}

$('retry').addEventListener('click', () => location.reload());
$('play').addEventListener('click', togglePlayback);
$('scrubber').addEventListener('input', (event) => { playing = false; poseAt(Number(event.target.value)); updateTime(); updatePlayButton(); });
$('speed').addEventListener('change', (event) => { speed = Number(event.target.value); });
$('zoom-in').addEventListener('click', () => zoom(0.8));
$('zoom-out').addEventListener('click', () => zoom(1.25));
$('reset').addEventListener('click', () => { if (controls) controls.autoRotate = false; $('orbit').setAttribute('aria-pressed', 'false'); setView('overview'); });
$('orbit').addEventListener('click', () => { if (!controls) return; controls.autoRotate = !controls.autoRotate; $('orbit').setAttribute('aria-pressed', String(controls.autoRotate)); });
document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
if (!document.fullscreenEnabled) $('fullscreen').hidden = true;
$('fullscreen').addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.querySelector('.experience').requestFullscreen(); }
  catch { $('fullscreen').hidden = true; }
});
document.addEventListener('fullscreenchange', () => $('fullscreen').setAttribute('aria-label', document.fullscreenElement ? '離開全螢幕' : '進入全螢幕'));
canvas.addEventListener('keydown', (event) => {
  if (event.code === 'Space') { event.preventDefault(); togglePlayback(); }
  if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(0.8); }
  if (event.key === '-') { event.preventDefault(); zoom(1.25); }
  if (event.key.toLowerCase() === 'r') setView('overview');
});
