import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useVectr, type VectrMode } from '@/context/VectrContext';

/**
 * Persistent Three.js background — mounted once in App.tsx, never unmounts.
 *
 * FIX 1 — seamless loop: snake/worm model.
 *   uHead advances continuously 0→∞. The visible segment is always WINDOW wide
 *   behind the head. fract(uHead - vUv.x) gives the distance-from-head with
 *   automatic wrap-around — no hard reset, never a flash.
 *
 * FIX 2 — visible mouse tilt: applied directly to lookAt (±4 world units)
 *   with a single smooth pass. Previously it was adding ±0.45 to camPos
 *   which was swamped by the 4.5+ unit side offset and double-smoothed.
 */
export function VectrBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { mode } = useVectr();
  const modeRef = useRef<VectrMode>(mode);

  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const WINDOW = 0.38; // fraction of path visible at once

    // ── renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x07090e, 1);
    container.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;display:block;';

    // ── scene ─────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const fog = new THREE.FogExp2(0x07090e, 0.052);
    scene.fog = fog;

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);

    const hemi = new THREE.HemisphereLight(0x2a3242, 0x05070a, 0.9);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0x6a7a96, 0.35);
    dir.position.set(-6, 12, 4);
    scene.add(dir);

    // ── curve ─────────────────────────────────────────────────────────────
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

    const STEP_T = [0.16, 0.40, 0.64, 0.88];

    // ── uniforms ──────────────────────────────────────────────────────────
    const uniforms = {
      uHead:    { value: 0.02 },  // snake head, advances 0→∞, wraps in shader
      uTime:    { value: 0 },
      uOpacity: { value: 1.0 },
      uWindow:  { value: WINDOW },
    };

    // ── core tube shader (snake model) ────────────────────────────────────
    const coreMat = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }`,
      fragmentShader: `
        uniform float uHead;
        uniform float uTime;
        uniform float uOpacity;
        uniform float uWindow;
        varying vec2 vUv;
        void main(){
          float h = fract(uHead);
          float dist = h - vUv.x;
          if (dist < 0.0) dist += 1.0;
          if (dist > uWindow) discard;
          float headness = 1.0 - dist / uWindow;
          vec3 tail = vec3(1.0, 0.45, 0.09);
          vec3 hot  = vec3(1.0, 0.93, 0.78);
          vec3 col  = mix(tail, hot, pow(headness, 1.6));
          float energy = 0.9 + 0.1 * sin(uTime * 7.0 + vUv.x * 140.0);
          gl_FragColor = vec4(col * (1.15 + 2.6 * headness) * energy, uOpacity);
        }`,
    });
    const core = new THREE.Mesh(new THREE.TubeGeometry(curve, 420, 0.045, 10, false), coreMat);
    core.frustumCulled = false;
    scene.add(core);

    // ── halo tube shader ──────────────────────────────────────────────────
    const haloMat = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vN;
        varying vec3 vV;
        void main(){
          vUv = uv;
          vec4 mv = modelViewMatrix * vec4(position,1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform float uHead;
        uniform float uOpacity;
        uniform float uWindow;
        varying vec2 vUv;
        varying vec3 vN;
        varying vec3 vV;
        void main(){
          float h = fract(uHead);
          float dist = h - vUv.x;
          if (dist < 0.0) dist += 1.0;
          if (dist > uWindow) discard;
          float headness = 1.0 - dist / uWindow;
          float fres = pow(1.0 - abs(dot(vN, vV)), 1.7);
          float a = fres * mix(0.18, 0.65, headness) * uOpacity;
          gl_FragColor = vec4(vec3(1.0, 0.58, 0.16), a);
        }`,
    });
    const halo = new THREE.Mesh(new THREE.TubeGeometry(curve, 220, 0.26, 12, false), haloMat);
    halo.frustumCulled = false;
    scene.add(halo);

    // ── head spark sprites ────────────────────────────────────────────────
    function radialTexture(stops: [number, string][]) {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d')!;
      const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      stops.forEach(([t, col]) => grad.addColorStop(t, col));
      g.fillStyle = grad;
      g.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    }
    const glowTex = radialTexture([
      [0.00, 'rgba(255,255,255,1)'],
      [0.18, 'rgba(255,210,140,0.9)'],
      [0.45, 'rgba(255,140,40,0.35)'],
      [1.00, 'rgba(255,120,20,0)'],
    ]);
    const spriteMat = (scale: number) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
      }));
      s.scale.setScalar(scale);
      scene.add(s);
      return s;
    };
    const headGlow = spriteMat(2.8);
    const headCore = spriteMat(0.9);

    // ── nodes ─────────────────────────────────────────────────────────────
    interface NodeData { g: any; ring: any; light: any; t: number }
    const nodes: NodeData[] = STEP_T.map((st) => {
      const g = new THREE.Group();
      const p = curve.getPointAt(st);
      g.position.copy(p);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.15, 0.025, 8, 64),
        new THREE.MeshBasicMaterial({ color: 0xffb238, transparent: true, opacity: 0, depthWrite: false }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -p.y + 0.02;
      g.add(ring);

      const bMat = new THREE.MeshStandardMaterial({ color: 0x141a26, roughness: 0.85, metalness: 0.15, emissive: 0xff8a1e, emissiveIntensity: 0 });
      for (let i = 0; i < 3; i++) {
        const h = 0.5 + Math.random() * 1.4;
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.45, h, 0.45), bMat.clone());
        const a = (i / 3) * Math.PI * 2 + st * 20;
        b.position.set(Math.cos(a) * 0.9, -p.y + h / 2, Math.sin(a) * 0.9);
        g.add(b);
      }
      const light = new THREE.PointLight(0xff9a2e, 0, 9, 2);
      light.position.y = 0.6;
      g.add(light);
      scene.add(g);
      return { g, ring, light, t: st };
    });

    // ── ambient structures ────────────────────────────────────────────────
    const ambMat = new THREE.MeshStandardMaterial({ color: 0x0e131d, roughness: 0.95, metalness: 0.05 });
    const ambGeo = new THREE.BoxGeometry(1, 1, 1);
    const ambInst = new THREE.InstancedMesh(ambGeo, ambMat, 90);
    {
      const m = new THREE.Matrix4();
      for (let i = 0; i < 90; i++) {
        const t = Math.random();
        const p = curve.getPointAt(t);
        const side = Math.random() > 0.5 ? 1 : -1;
        const h = 0.6 + Math.random() * 3.4;
        m.makeScale(0.6 + Math.random() * 1.6, h, 0.6 + Math.random() * 1.6);
        m.setPosition(p.x + (Math.random() - 0.5) * 4, h / 2 - 0.02, p.z + side * (4 + Math.random() * 9));
        ambInst.setMatrixAt(i, m);
      }
    }
    scene.add(ambInst);
    const grid = new THREE.GridHelper(220, 110, 0x1c2433, 0x10151f);
    (grid.material as any).transparent = true;
    (grid.material as any).opacity = 0.5;
    scene.add(grid);

    // ── particles ─────────────────────────────────────────────────────────
    const pPos = new Float32Array(350 * 3);
    for (let i = 0; i < 350; i++) {
      const p = curve.getPointAt(Math.random());
      pPos[i*3+0] = p.x + (Math.random() - 0.5) * 14;
      pPos[i*3+1] = Math.random() * 5;
      pPos[i*3+2] = p.z + (Math.random() - 0.5) * 14;
    }
    const ptsGeo = new THREE.BufferGeometry();
    ptsGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const ptsMat = new THREE.PointsMaterial({ size: 0.06, map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffb070, opacity: 0.55 });
    const particles = new THREE.Points(ptsGeo, ptsMat);
    scene.add(particles);

    // ── mode targets ──────────────────────────────────────────────────────
    const TARGETS = {
      login: {
        fog: 0.052, hemi: 0.9, dir: 0.35, opacity: 1.0,
        loopSeconds: 8, camSide: 2.4, camUp: 2.4, camLerp: 0.12,
        orbitAmp: 0.0, orbitFreq: 0.0,
      },
      ambient: {
        fog: 0.031, hemi: 0.36, dir: 0.14, opacity: 0.55,
        loopSeconds: 20, camSide: 4.5, camUp: 4.0, camLerp: 0.06,
        orbitAmp: 1.5, orbitFreq: 0.07,
      },
    };
    const live = { ...TARGETS.ambient };

    // ── mouse ─────────────────────────────────────────────────────────────
    // Single smooth pass — stored in plain object (no setState).
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let lastMt = 0;
    const onMouse = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastMt < 16) return;
      lastMt = now;
      mouse.tx = (e.clientX / window.innerWidth)  * 2 - 1;  // -1..1
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    document.addEventListener('mousemove', onMouse, { passive: true });

    // ── render loop ───────────────────────────────────────────────────────
    const camPos  = new THREE.Vector3();
    const lookAt  = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const sideVec = new THREE.Vector3();
    const UP = new THREE.Vector3(0, 1, 0);
    const t0 = performance.now();
    let prev = t0;
    let rafId = 0;
    const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

    const frame = () => {
      rafId = requestAnimationFrame(frame);
      const now = performance.now();
      const t   = (now - t0) / 1000;
      const dt  = Math.min(0.1, (now - prev) / 1000);
      prev = now;

      // ── smooth mode transition ──
      const tgt = TARGETS[modeRef.current] ?? TARGETS.ambient;
      const K = 1 - Math.exp(-dt * 2.4);
      live.fog         = lerp(live.fog,         tgt.fog,         K);
      live.hemi        = lerp(live.hemi,         tgt.hemi,        K);
      live.dir         = lerp(live.dir,          tgt.dir,         K);
      live.opacity     = lerp(live.opacity,      tgt.opacity,     K);
      live.loopSeconds = lerp(live.loopSeconds,  tgt.loopSeconds, K);
      live.camSide     = lerp(live.camSide,      tgt.camSide,     K);
      live.camUp       = lerp(live.camUp,        tgt.camUp,       K);
      live.camLerp     = lerp(live.camLerp,      tgt.camLerp,     K);
      live.orbitAmp    = lerp(live.orbitAmp,     tgt.orbitAmp,    K);
      live.orbitFreq   = lerp(live.orbitFreq,    tgt.orbitFreq,   K);

      fog.density  = live.fog;
      hemi.intensity = live.hemi;
      dir.intensity  = live.dir;
      uniforms.uOpacity.value = live.opacity;
      uniforms.uTime.value    = REDUCED ? 0 : t;

      // ── snake head advances continuously, wraps in shader ──
      uniforms.uHead.value += dt / Math.max(0.5, live.loopSeconds);
      const headPos = uniforms.uHead.value % 1.0;

      // ── head sprites ──
      const headPt = curve.getPointAt(headPos);
      headGlow.position.copy(headPt);
      headCore.position.copy(headPt);
      const pulse = REDUCED ? 1 : 1 + Math.sin(t * 5) * 0.12;
      headGlow.scale.setScalar(2.8 * pulse);
      headCore.scale.setScalar(0.9 * pulse);
      (headGlow.material as any).opacity = lerp(0.4, 1.0, live.opacity);
      (headCore.material as any).opacity = lerp(0.4, 1.0, live.opacity);

      // ── camera ──
      const camT = THREE.MathUtils.clamp(headPos - 0.07, 0, 1);
      curve.getPointAt(camT, camPos);
      curve.getTangentAt(camT, tangent);
      sideVec.crossVectors(tangent, UP).normalize();

      const sway  = Math.sin(headPos * Math.PI * 2) * 1.0;
      const orbit = live.orbitAmp > 0.001 ? Math.sin(t * live.orbitFreq * Math.PI * 2) * live.orbitAmp : 0;

      camPos.addScaledVector(sideVec, live.camSide + sway + orbit);
      camPos.addScaledVector(UP, live.camUp);
      camera.position.lerp(camPos, REDUCED ? 1 : live.camLerp);

      // ── look-at ──
      curve.getPointAt(THREE.MathUtils.clamp(headPos + 0.05, 0, 1), lookAt);
      lookAt.addScaledVector(sideVec, -1.7);
      lookAt.y += camera.aspect < 0.8 ? -0.35 : 0.3;

      // ── mouse tilt — applied to lookAt for maximum visibility ──
      // Single smooth pass at 0.06, then a 4-unit offset on lookAt.
      // (Previously: added 0.45 to camPos then double-smoothed → invisible.)
      mouse.x = lerp(mouse.x, mouse.tx, 0.06);
      mouse.y = lerp(mouse.y, mouse.ty, 0.06);
      lookAt.addScaledVector(sideVec, mouse.x * 4.0);   // ±4 world units → clearly visible
      lookAt.y -= mouse.y * 2.0;

      camera.lookAt(lookAt);

      // ── nodes ──
      for (const n of nodes) {
        // light up when head passes within ±0.08 of node
        let dist = headPos - n.t;
        if (dist < 0) dist += 1.0;
        const a = dist < 0.08
          ? THREE.MathUtils.smoothstep(dist, 0, 0.04) * (1 - THREE.MathUtils.smoothstep(dist, 0.04, 0.08))
          : THREE.MathUtils.smoothstep(headPos, n.t - 0.015, n.t + 0.015); // fallback glow when near
        const intensity = a * live.opacity;
        n.light.intensity = intensity * 7;
        (n.ring.material as any).opacity = intensity * 0.9;
        if (!REDUCED) n.ring.rotation.z = t * 0.4;
        n.g.children.forEach((c: any) => {
          const mesh = c as any;
          if (mesh.isMesh && mesh.material?.emissive) mesh.material.emissiveIntensity = intensity * 0.85;
        });
      }

      if (!REDUCED) particles.rotation.y = t * 0.004;
      renderer.render(scene, camera);
    };
    rafId = requestAnimationFrame(frame);

    // ── resize ────────────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // ── cleanup ───────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousemove', onMouse);
      try {
        core.geometry.dispose(); coreMat.dispose();
        halo.geometry.dispose(); haloMat.dispose();
        (headGlow.material as any).dispose();
        (headCore.material as any).dispose();
        glowTex.dispose();
        ambGeo.dispose(); ambMat.dispose();
        ptsGeo.dispose(); ptsMat.dispose();
        nodes.forEach((n) => {
          n.ring.geometry.dispose();
          (n.ring.material as any).dispose();
          n.g.children.forEach((c: any) => {
            const mesh = c as any;
            mesh.geometry?.dispose();
            mesh.material?.dispose?.();
          });
        });
        (grid.material as any).dispose();
        grid.geometry.dispose();
      } catch { /* noop */ }
      renderer.dispose();
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
