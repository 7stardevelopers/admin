/* Vectr-style scroll journey
   A glowing "transmission line" draws itself through a dark industrial
   field as you scroll. The camera dollies along the same curve, and a
   substation node powers up at each of the four process steps. */

import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------- setup */
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x07090e, 1);
stage.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x07090e, 0.052);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);

scene.add(new THREE.HemisphereLight(0x2a3242, 0x05070a, 0.9));
const dir = new THREE.DirectionalLight(0x6a7a96, 0.35);
dir.position.set(-6, 12, 4);
scene.add(dir);

/* ----------------------------------------------------------- the curve */
const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-16, 0.45,  5.5),
  new THREE.Vector3(-10, 0.65, -2.5),
  new THREE.Vector3( -4, 0.35,  3.5),
  new THREE.Vector3(  2, 1.05, -3.5),
  new THREE.Vector3(  8, 0.50,  3.0),
  new THREE.Vector3( 14, 1.40, -4.0),
  new THREE.Vector3( 20, 0.60,  2.5),
  new THREE.Vector3( 26, 1.00, -2.0),
], false, 'catmullrom', 0.5);

const STEP_T = [0.16, 0.40, 0.64, 0.88]; // where the 4 nodes sit on the curve

/* --------------------------------------------------- glowing path core */
const uniforms = {
  uProgress: { value: 0.02 },
  uTime:     { value: 0 },
};

const coreMat = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */`
    uniform float uProgress;
    uniform float uTime;
    varying vec2 vUv;
    void main(){
      if (vUv.x > uProgress) discard;
      float head = smoothstep(uProgress - 0.05, uProgress, vUv.x);
      vec3 tail  = vec3(1.0, 0.45, 0.09);
      vec3 hot   = vec3(1.0, 0.93, 0.78);
      vec3 col   = mix(tail, hot, head);
      float energy = 0.9 + 0.1 * sin(uTime * 7.0 + vUv.x * 140.0);
      gl_FragColor = vec4(col * (1.15 + 2.6 * head) * energy, 1.0);
    }`,
});
const core = new THREE.Mesh(new THREE.TubeGeometry(curve, 420, 0.045, 10, false), coreMat);
core.frustumCulled = false;
scene.add(core);

/* ------------------------------------------------------------ glow halo */
const haloMat = new THREE.ShaderMaterial({
  uniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */`
    varying vec2 vUv;
    varying vec3 vN;
    varying vec3 vV;
    void main(){
      vUv = uv;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vN = normalize(normalMatrix * normal);
      vV = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    uniform float uProgress;
    varying vec2 vUv;
    varying vec3 vN;
    varying vec3 vV;
    void main(){
      if (vUv.x > uProgress) discard;
      float head = smoothstep(uProgress - 0.12, uProgress, vUv.x);
      float fres = pow(1.0 - abs(dot(vN, vV)), 1.7);
      float a = fres * mix(0.18, 0.65, head);
      gl_FragColor = vec4(vec3(1.0, 0.58, 0.16), a);
    }`,
});
const halo = new THREE.Mesh(new THREE.TubeGeometry(curve, 220, 0.26, 12, false), haloMat);
halo.frustumCulled = false;
scene.add(halo);

/* ------------------------------------------------- head spark sprites */
function radialTexture(stops) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([t, col]) => grad.addColorStop(t, col));
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

const glowTex = radialTexture([
  [0.0, 'rgba(255,255,255,1)'],
  [0.18, 'rgba(255,210,140,0.9)'],
  [0.45, 'rgba(255,140,40,0.35)'],
  [1.0, 'rgba(255,120,20,0)'],
]);

const headGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
}));
headGlow.scale.setScalar(2.8);
scene.add(headGlow);

const headCore = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
}));
headCore.scale.setScalar(0.9);
scene.add(headCore);

/* -------------------------------------------------------- step nodes */
const nodes = STEP_T.map((t) => {
  const g = new THREE.Group();
  const p = curve.getPointAt(t);
  g.position.copy(p);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.025, 8, 64),
    new THREE.MeshBasicMaterial({ color: 0xffb238, transparent: true, opacity: 0, depthWrite: false })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -p.y + 0.02;
  g.add(ring);

  const blockMat = new THREE.MeshStandardMaterial({
    color: 0x141a26, roughness: 0.85, metalness: 0.15,
    emissive: 0xff8a1e, emissiveIntensity: 0,
  });
  for (let i = 0; i < 3; i++) {
    const h = 0.5 + Math.random() * 1.4;
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.45, h, 0.45), blockMat.clone());
    const a = (i / 3) * Math.PI * 2 + t * 20;
    b.position.set(Math.cos(a) * 0.9, -p.y + h / 2, Math.sin(a) * 0.9);
    g.add(b);
  }

  const light = new THREE.PointLight(0xff9a2e, 0, 9, 2);
  light.position.y = 0.6;
  g.add(light);

  scene.add(g);
  return { g, ring, light, t };
});

/* -------------------------------------------------- ambient structures */
{
  const mat = new THREE.MeshStandardMaterial({ color: 0x0e131d, roughness: 0.95, metalness: 0.05 });
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const inst = new THREE.InstancedMesh(geo, mat, 90);
  const m = new THREE.Matrix4();
  for (let i = 0; i < 90; i++) {
    const t = Math.random();
    const p = curve.getPointAt(t);
    const side = Math.random() > 0.5 ? 1 : -1;
    const off = 4 + Math.random() * 9;
    const h = 0.6 + Math.random() * 3.4;
    m.makeScale(0.6 + Math.random() * 1.6, h, 0.6 + Math.random() * 1.6);
    m.setPosition(p.x + (Math.random() - 0.5) * 4, h / 2 - 0.02, p.z + side * off);
    inst.setMatrixAt(i, m);
  }
  scene.add(inst);

  const grid = new THREE.GridHelper(220, 110, 0x1c2433, 0x10151f);
  grid.material.transparent = true;
  grid.material.opacity = 0.5;
  scene.add(grid);
}

/* ------------------------------------------------------------ particles */
const pts = (() => {
  const N = 350;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const t = Math.random();
    const p = curve.getPointAt(t);
    pos[i * 3 + 0] = p.x + (Math.random() - 0.5) * 14;
    pos[i * 3 + 1] = Math.random() * 5;
    pos[i * 3 + 2] = p.z + (Math.random() - 0.5) * 14;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({
    size: 0.06, map: glowTex, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, color: 0xffb070, opacity: 0.55,
  });
  const p = new THREE.Points(g, m);
  scene.add(p);
  return p;
})();

/* ------------------------------------------------------ scroll plumbing */
let target = 0.02;   // scroll-driven target progress
let eased  = 0.02;   // smoothed value used by the scene

const steps = [...document.querySelectorAll('.step')];
const railFill = document.getElementById('railFill');
const ticks = [...document.querySelectorAll('.rail .tick')];

/* .stage is CSS position:sticky, so ScrollTrigger only maps scroll → progress */
ScrollTrigger.create({
  trigger: '#journey',
  start: 'top top',
  end: 'bottom bottom',
  onUpdate(self) { target = 0.02 + self.progress * 0.98; },
});

/* hero fades as the journey takes over */
gsap.to('.hero', {
  opacity: 0, y: -60, ease: 'none',
  scrollTrigger: { trigger: '#journey', start: 'top 90%', end: 'top 25%', scrub: true },
});

/* card visibility window per quarter of the journey */
function cardAlpha(p, i) {
  const q0 = i / 4, q1 = (i + 1) / 4;
  const fadeIn  = THREE.MathUtils.smoothstep(p, q0 + 0.015, q0 + 0.075);
  const fadeOut = 1 - THREE.MathUtils.smoothstep(p, q1 - 0.075, q1 - 0.01);
  return Math.min(fadeIn, i === 3 ? 1 : fadeOut);
}

/* ----------------------------------------------------------- the loop */
const camPos = new THREE.Vector3();
const lookAt = new THREE.Vector3();
const tangent = new THREE.Vector3();
const side = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const t0 = performance.now();

function frame() {
  const t = (performance.now() - t0) / 1000;
  uniforms.uTime.value = REDUCED ? 0 : t;

  eased += (target - eased) * (REDUCED ? 1 : 0.085);
  uniforms.uProgress.value = eased;

  /* head sprites ride the tip of the line */
  const head = curve.getPointAt(Math.min(eased, 1));
  headGlow.position.copy(head);
  headCore.position.copy(head);
  const pulse = REDUCED ? 1 : 1 + Math.sin(t * 5) * 0.12;
  headGlow.scale.setScalar(2.8 * pulse);

  /* camera follows behind the head, offset to the side so the path sweeps */
  const camT = THREE.MathUtils.clamp(eased - 0.07, 0, 1);
  curve.getPointAt(camT, camPos);
  curve.getTangentAt(camT, tangent);
  side.crossVectors(tangent, UP).normalize();
  const sway = Math.sin(eased * Math.PI * 2.0) * 1.0; // the scene "re-frames" through the bends
  camPos.addScaledVector(side, 2.4 + sway).add(UP.clone().multiplyScalar(2.4));
  camera.position.lerp(camPos, REDUCED ? 1 : 0.12);

  curve.getPointAt(THREE.MathUtils.clamp(eased + 0.05, 0, 1), lookAt);
  lookAt.addScaledVector(side, -1.7); // keep the path head right of the cards
  lookAt.y += camera.aspect < 0.8 ? -0.35 : 0.3; // portrait: frame the head higher, clear of cards
  camera.lookAt(lookAt);

  /* power up each node as the line reaches it */
  for (const n of nodes) {
    const a = THREE.MathUtils.smoothstep(eased, n.t - 0.015, n.t + 0.015);
    n.light.intensity = a * 7;
    n.ring.material.opacity = a * 0.9;
    if (!REDUCED) n.ring.rotation.z = t * 0.4;
    n.g.children.forEach((c) => {
      if (c.isMesh && c.material.emissive) c.material.emissiveIntensity = a * 0.85;
    });
  }

  /* DOM sync — cards + rail */
  const p = (eased - 0.02) / 0.98;
  steps.forEach((el, i) => {
    const a = cardAlpha(p, i);
    el.style.opacity = a;
    el.style.transform = `translateY(${(1 - a) * 26}px)`;
  });
  railFill.style.transform = `scaleY(${THREE.MathUtils.clamp(p, 0, 1)})`;
  ticks.forEach((tk) => {
    tk.classList.toggle('on', p >= (+tk.dataset.tick) / 4);
  });

  if (!REDUCED) pts.rotation.y = t * 0.004;

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
frame();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* hook for automated verification */
window.__vectr = {
  progress: () => eased,
  target: () => target,
  cameraPos: () => camera.position.toArray(),
};
