import { useEffect, useRef } from 'react';
import {
  Wrench, Home, Droplets, Wind, Paintbrush, Lightbulb, Settings, Hammer, Sparkles, Zap,
} from 'lucide-react';

/**
 * Grid + particle-network + soft-glow + floating service-icon layer, matching
 * the Login page's brand panel but recolored to a white/blue light theme.
 * Sits between the persistent Three.js scene (zIndex 0, mounted in App.tsx,
 * which is not recolored) and page content (zIndex 1+) — its own backdrop is
 * opaque enough to fully hide the dark 3D scene behind it.
 */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const pts = Array.from({ length: 46 }, () => ({
      x:   Math.random(),
      y:   Math.random(),
      vx:  (Math.random() - 0.5) * 0.00022,
      vy:  (Math.random() - 0.5) * 0.00022,
      r:   0.7 + Math.random() * 1.4,
      alt: Math.random() < 0.3,
    }));

    const frame = () => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      pts.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = (pts[i].x - pts[j].x) * w;
          const dy = (pts[i].y - pts[j].y) * h;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x * w, pts[i].y * h);
            ctx.lineTo(pts[j].x * w, pts[j].y * h);
            ctx.strokeStyle = `rgba(37,99,235,${(1 - d / 110) * 0.10})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      pts.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.alt ? 'rgba(20,184,166,0.40)' : 'rgba(37,99,235,0.32)';
        ctx.fill();
      });
      animId = requestAnimationFrame(frame);
    };
    animId = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, display: 'block' }}
    />
  );
}

// Decorative service-tool icons, anchored to the page corners/edges so they
// never sit under the sidebar or main content column.
const SERVICE_ICONS = [
  { Icon: Wrench,     x: 4,  y: 12, sz: 30, delay: 0.00, dur: 5.2, color: '#2563EB' },
  { Icon: Home,       x: 94, y: 8,  sz: 32, delay: 0.30, dur: 6.0, color: '#14B8A6' },
  { Icon: Droplets,   x: 96, y: 40, sz: 24, delay: 0.60, dur: 4.6, color: '#2563EB' },
  { Icon: Lightbulb,  x: 3,  y: 46, sz: 24, delay: 0.90, dur: 5.6, color: '#F59E0B' },
  { Icon: Wind,       x: 95, y: 74, sz: 24, delay: 1.10, dur: 5.0, color: '#14B8A6' },
  { Icon: Paintbrush, x: 5,  y: 78, sz: 24, delay: 0.45, dur: 4.8, color: '#2563EB' },
  { Icon: Settings,   x: 92, y: 92, sz: 26, delay: 0.75, dur: 6.4, color: '#64748B' },
  { Icon: Hammer,     x: 8,  y: 92, sz: 24, delay: 1.30, dur: 5.4, color: '#2563EB' },
  { Icon: Zap,        x: 50, y: 4,  sz: 20, delay: 0.55, dur: 5.8, color: '#F59E0B' },
  { Icon: Sparkles,   x: 48, y: 96, sz: 20, delay: 0.20, dur: 6.2, color: '#14B8A6' },
];

function ServiceIcons() {
  return (
    <>
      {SERVICE_ICONS.map(({ Icon, x, y, sz, delay, dur, color }, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            opacity: 0.16,
            animation: `atmoFloat ${dur}s ease-in-out ${delay}s infinite`,
          }}
        >
          <div style={{
            width: sz + 20, height: sz + 20,
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(37,99,235,0.14)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(15,23,42,0.05)',
          }}>
            <Icon size={Math.round(sz * 0.66)} color={color} strokeWidth={1.6} />
          </div>
        </div>
      ))}
    </>
  );
}

export function AtmosphericBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden',
        background: '#eef2f9',
      }}
    >
      <style>{`
        @keyframes atmoFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
      `}</style>

      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(37,99,235,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(37,99,235,0.05) 1px, transparent 1px)
        `,
        backgroundSize: '44px 44px',
      }} />

      {/* Atmospheric depth glows */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse 60% 45% at 16% 20%, rgba(37,99,235,0.10) 0%, transparent 62%),
          radial-gradient(ellipse 52% 42% at 84% 70%, rgba(20,184,166,0.09) 0%, transparent 60%),
          radial-gradient(ellipse 45% 35% at 55% 96%, rgba(37,99,235,0.06) 0%, transparent 58%)
        `,
      }} />

      <ServiceIcons />
      <ParticleField />
    </div>
  );
}
