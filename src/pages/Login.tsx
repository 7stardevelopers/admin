import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  motion, AnimatePresence,
  useMotionValue, useTransform, useSpring,
} from 'framer-motion';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/auth.store';
import { useVectr } from '@/context/VectrContext';
import { PageTransition } from '@/components/PageTransition';
import {
  ChevronRight, Phone, ArrowLeft, Loader2,
  Wrench, Zap, Home, Droplets, Wind, Paintbrush, Lightbulb,
  Settings, Hammer, Star, Sparkles,
} from 'lucide-react';
import { authApi } from '@/lib/api';

type Step = 'phone' | 'otp';

// ── Color tokens ──────────────────────────────────────────────────────────────
const BLUE     = '#2563EB';
const TEAL     = '#14B8A6';
const SLATE    = '#0F172A';
const SLATE_MID = '#1E3A5F';
const MUTED    = '#64748B';
const INK      = '#1E293B';

// ── Service icons for the animated left panel ─────────────────────────────────
const SERVICE_ICONS = [
  { Icon: Wrench,     color: '#60A5FA', x: 8,  y: 14, sz: 26, delay: 0.00, dur: 3.8 },
  { Icon: Zap,        color: '#FBBF24', x: 74, y: 9,  sz: 22, delay: 0.35, dur: 4.2 },
  { Icon: Home,       color: '#34D399', x: 46, y: 5,  sz: 32, delay: 0.70, dur: 5.0 },
  { Icon: Droplets,   color: '#38BDF8', x: 85, y: 40, sz: 24, delay: 1.05, dur: 3.6 },
  { Icon: Wind,       color: '#C084FC', x: 4,  y: 54, sz: 24, delay: 0.20, dur: 4.6 },
  { Icon: Paintbrush, color: '#F472B6', x: 79, y: 63, sz: 26, delay: 0.55, dur: 3.4 },
  { Icon: Lightbulb,  color: '#FBBF24', x: 16, y: 74, sz: 22, delay: 0.90, dur: 4.8 },
  { Icon: Settings,   color: '#94A3B8', x: 87, y: 82, sz: 24, delay: 1.25, dur: 3.2 },
  { Icon: Hammer,     color: '#FB923C', x: 56, y: 85, sz: 24, delay: 0.45, dur: 4.4 },
  { Icon: Star,       color: '#FBBF24', x: 32, y: 48, sz: 18, delay: 0.80, dur: 5.2 },
  { Icon: Sparkles,   color: '#34D399', x: 62, y: 24, sz: 20, delay: 0.60, dur: 4.0 },
];

// ── Particle canvas ────────────────────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;

    const resize = () => {
      const p = canvas.parentElement;
      if (!p) return;
      canvas.width  = p.clientWidth;
      canvas.height = p.clientHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const pts = Array.from({ length: 55 }, () => ({
      x:    Math.random(),
      y:    Math.random(),
      vx:   (Math.random() - 0.5) * 0.00028,
      vy:   (Math.random() - 0.5) * 0.00028,
      r:    0.8 + Math.random() * 1.6,
      teal: Math.random() < 0.28,
    }));

    const frame = () => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = (pts[i].x - pts[j].x) * w;
          const dy = (pts[i].y - pts[j].y) * h;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 105) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x * w, pts[i].y * h);
            ctx.lineTo(pts[j].x * w, pts[j].y * h);
            ctx.strokeStyle = `rgba(37,99,235,${(1 - d / 105) * 0.18})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.teal ? 'rgba(20,184,166,0.55)' : 'rgba(37,99,235,0.42)';
        ctx.fill();
      });
      animId = requestAnimationFrame(frame);
    };
    animId = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, display: 'block', pointerEvents: 'none' }}
    />
  );
}

// ── Left animated brand panel ──────────────────────────────────────────────────
function LeftPanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const mouseX   = useMotionValue(0);
  const mouseY   = useMotionValue(0);
  const spr      = { stiffness: 48, damping: 20, mass: 1 };
  const lx       = useSpring(useTransform(mouseX, [-500, 500], [-14, 14]), spr);
  const ly       = useSpring(useTransform(mouseY, [-400, 400], [-14, 14]), spr);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!panelRef.current) return;
    const r = panelRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - r.left - r.width  / 2);
    mouseY.set(e.clientY - r.top  - r.height / 2);
  };

  return (
    <motion.div
      ref={panelRef}
      onMouseMove={onMove}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
      initial={{ opacity: 0, x: -36 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col overflow-hidden"
      style={{
        background: `linear-gradient(155deg, ${SLATE} 0%, ${SLATE_MID} 45%, #0C4A6E 75%, ${SLATE} 100%)`,
        minHeight: '100%',
      }}
    >
      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(37,99,235,0.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(37,99,235,0.045) 1px, transparent 1px)
        `,
        backgroundSize: '44px 44px',
      }} />

      {/* Atmospheric depth glows */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 70% 52% at 28% 38%, rgba(37,99,235,0.22) 0%, transparent 65%),
          radial-gradient(ellipse 55% 45% at 72% 68%, rgba(20,184,166,0.14) 0%, transparent 62%),
          radial-gradient(ellipse 42% 32% at 82% 16%, rgba(245,158,11,0.09) 0%, transparent 55%)
        `,
      }} />

      <ParticleField />

      {/* Floating service icon cards — parallax layer */}
      <motion.div style={{ x: lx, y: ly, position: 'absolute', inset: 0 }}>
        {SERVICE_ICONS.map(({ Icon, color, x, y, sz, delay, dur }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.45, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, delay: delay + 0.55, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'absolute', left: `${x}%`, top: `${y}%` }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut', delay: i * 0.22 }}
            >
              <div style={{
                width: sz + 22, height: sz + 22,
                borderRadius: '15px',
                background: `rgba(255,255,255,0.065)`,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: `1px solid rgba(255,255,255,0.12)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 22px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)`,
              }}>
                <Icon size={Math.round(sz * 0.72)} color={color} strokeWidth={1.6} />
              </div>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* Wordmark top-left */}
      <motion.div
        className="relative z-10 px-8 pt-8"
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.18 }}
        style={{ display: 'flex', alignItems: 'center', gap: '11px' }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: '11px',
          background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '15px', fontWeight: 800, color: '#fff',
          boxShadow: `0 4px 18px rgba(37,99,235,0.42)`,
          flexShrink: 0,
        }}>7★</div>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: '15px', lineHeight: 1.1 }}>
            7 Stars
          </div>
          <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: '10px', letterSpacing: '0.08em' }}>
            Admin Portal
          </div>
        </div>
      </motion.div>

      {/* Central hero */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-8">
        <motion.div
          style={{ textAlign: 'center' }}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65 }}
        >
          {/* Pulsing central home icon */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '22px' }}>
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 32px rgba(37,99,235,0.32)',
                  '0 0 64px rgba(20,184,166,0.28)',
                  '0 0 32px rgba(37,99,235,0.32)',
                ],
              }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 92, height: 92, borderRadius: '26px',
                background: `linear-gradient(135deg, rgba(37,99,235,0.22), rgba(20,184,166,0.14))`,
                border: `1px solid rgba(37,99,235,0.32)`,
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Home size={42} color={TEAL} strokeWidth={1.5} />
            </motion.div>
            {/* Orbit ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', inset: -16, borderRadius: '50%',
                border: `1px dashed rgba(37,99,235,0.22)`,
              }}
            >
              <div style={{
                position: 'absolute', width: 8, height: 8, borderRadius: '50%',
                background: TEAL, top: -4, left: '50%', marginLeft: -4,
                boxShadow: `0 0 10px ${TEAL}`,
              }} />
            </motion.div>
          </div>

          <h2 style={{
            color: '#fff', fontSize: 'clamp(18px, 2vw, 22px)', fontWeight: 800,
            letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '10px',
          }}>
            Professional Home Services
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.46)', fontSize: '13px',
            lineHeight: 1.72, maxWidth: '210px', margin: '0 auto 22px',
          }}>
            at Your Doorstep
          </p>

        </motion.div>
      </div>

    </motion.div>
  );
}

// ── 6-digit OTP input ──────────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus();
  };
  const handleChange = (i: number, ch: string) => {
    const digit = ch.replace(/\D/g, '').slice(-1);
    onChange((value.slice(0, i) + digit + value.slice(i + 1)).slice(0, 6));
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(p);
    refs.current[Math.min(p.length, 5)]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: '9px', justifyContent: 'center' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.input
          key={i}
          ref={el => { refs.current[i] = el; }}
          maxLength={1}
          inputMode="numeric"
          value={value[i] ?? ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          whileFocus={{ scale: 1.06 }}
          onFocus={e => {
            (e.target as HTMLInputElement).style.borderColor = BLUE;
            (e.target as HTMLInputElement).style.boxShadow  = `0 0 0 3px rgba(37,99,235,0.12)`;
            (e.target as HTMLInputElement).style.background = 'rgba(37,99,235,0.03)';
          }}
          onBlur={e => {
            (e.target as HTMLInputElement).style.borderColor = value[i] ? BLUE : '#E2E8F0';
            (e.target as HTMLInputElement).style.boxShadow  = 'none';
            (e.target as HTMLInputElement).style.background = '#FAFAFA';
          }}
          style={{
            width: '46px', height: '54px',
            textAlign: 'center', fontSize: '22px', fontWeight: 700,
            background: '#FAFAFA',
            border: `1.5px solid ${value[i] ? BLUE : '#E2E8F0'}`,
            borderRadius: '13px',
            outline: 'none', color: INK,
            transition: 'border-color 0.18s, box-shadow 0.18s, background 0.18s',
            caretColor: BLUE,
          }}
        />
      ))}
    </div>
  );
}

// ── Login page ─────────────────────────────────────────────────────────────────
export default function Login() {
  const navigate    = useNavigate();
  const setUser     = useAuthStore(s => s.setUser);
  const { setMode } = useVectr();

  const [step,  setStep]  = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp,   setOtp]   = useState('');
  const [error, setError] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [phoneFocused,    setPhoneFocused]    = useState(false);

  useEffect(() => { setMode('ambient'); }, [setMode]);
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);
  const handleSendOtp = async () => {
    const clean = phone.trim();
    if (!clean) { setError('Enter your phone number'); return; }
    setError(''); setLoading(true);
    try {
      await authApi.sendOtp(clean);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) { setError('Enter the 6-digit OTP'); return; }
    setError(''); setLoading(true);
    try {
      const res = await authApi.login(phone.trim(), otp);
      const payload = res.data.data ?? res.data;
      const { user } = payload;
      const token = payload.access_token ?? payload.accessToken ?? payload.token ?? payload.jwt;
      if (!token) {
        console.error('Login response had no recognizable token field:', payload);
        setError('Login succeeded but no auth token was returned — check console for the response shape.');
        return;
      }
      Cookies.set('admin_token', token, { expires: 1 });
      setUser({ name: user.name, phone: user.phone, role: user.role });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Invalid OTP');
      setOtp('');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;
    setError(''); setLoading(true);
    try {
      await authApi.sendOtp(phone.trim());
      setResendCountdown(30); setOtp('');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to resend OTP');
    } finally { setLoading(false); }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    if (step === 'phone') handleSendOtp();
    else if (otp.length === 6) handleVerifyOtp();
  };

  const btnActive   = !loading;
  const verifyActive = !loading && otp.length === 6;

  return (
    <PageTransition>
      <style>{`
        @keyframes ls-spin   { to { transform: rotate(360deg); } }
        @keyframes ls-shine  {
          0%   { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translateX(320%)  skewX(-18deg); opacity: 0; }
        }
        .ls-btn { position: relative; overflow: hidden; }
        .ls-btn::after {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.30), transparent);
          transform: translateX(-120%) skewX(-18deg);
          border-radius: inherit;
          pointer-events: none;
        }
        .ls-btn:hover::after { animation: ls-shine 0.75s ease forwards; }
        .ls-input::placeholder { color: #94A3B8; }
      `}</style>

      {/* Page */}
      <div style={{
        minHeight: '100vh',
        position: 'relative',
        zIndex: 2,
        background: `
          radial-gradient(ellipse 80% 55% at 8% 50%,  rgba(37,99,235,0.08) 0%, transparent 52%),
          radial-gradient(ellipse 60% 48% at 92% 28%, rgba(20,184,166,0.06) 0%, transparent 48%),
          radial-gradient(ellipse 50% 40% at 50% 90%, rgba(245,158,11,0.04) 0%, transparent 55%),
          #F1F5F9
        `,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          transition={{ duration: 0.68, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'flex',
            width: '880px',
            maxWidth: 'calc(100vw - 48px)',
            minHeight: '580px',
            borderRadius: '28px',
            overflow: 'hidden',
            boxShadow: `
              0 40px 100px rgba(15,23,42,0.22),
              0 12px 36px rgba(15,23,42,0.12),
              0 0 0 1px rgba(15,23,42,0.06)
            `,
          }}
        >
          {/* ── Left panel (hidden on mobile) ── */}
          <div
            className="hidden md:flex flex-col"
            style={{ width: '46%', minHeight: '100%' }}
          >
            <LeftPanel />
          </div>

          {/* ── Right: login form ── */}
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.62, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onKeyDown={onKey}
            style={{
              flex: 1,
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: 'clamp(36px, 5vw, 58px) clamp(28px, 5.5vw, 56px)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Corner accent glow */}
            <div style={{
              position: 'absolute', top: -80, right: -80, width: 220, height: 220,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(37,99,235,0.06), transparent 68%)`,
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: -60, left: -60, width: 180, height: 180,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(20,184,166,0.05), transparent 68%)`,
              pointerEvents: 'none',
            }} />

            {/* Mobile logo */}
            <div className="md:hidden mb-8" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '10px',
                background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '15px', fontWeight: 800, color: '#fff',
                boxShadow: `0 3px 14px rgba(37,99,235,0.36)`,
              }}>7★</div>
              <div>
                <div style={{ color: SLATE, fontWeight: 800, fontSize: '15px' }}>7 Stars</div>
                <div style={{ color: MUTED, fontSize: '10px' }}>Home Services</div>
              </div>
            </div>

            <AnimatePresence mode="wait">

              {/* ── Step 1: Phone ── */}
              {step === 'phone' && (
                <motion.div
                  key="phone"
                  initial={{ opacity: 0, x: 22 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -22 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Heading */}
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.42, delay: 0.05 }}
                    style={{ marginBottom: '32px' }}
                  >
                    <p style={{
                      fontSize: '11px', fontWeight: 700,
                      color: BLUE, letterSpacing: '0.16em',
                      textTransform: 'uppercase', marginBottom: '8px',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      <span style={{
                        display: 'inline-block', width: 18, height: 2,
                        background: `linear-gradient(90deg, ${BLUE}, ${TEAL})`,
                        borderRadius: 2, verticalAlign: 'middle',
                      }} />
                      Admin Portal
                    </p>
                    <h1 style={{
                      fontSize: 'clamp(26px, 3vw, 34px)',
                      fontWeight: 800, color: SLATE,
                      letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: '10px',
                    }}>
                      Welcome back
                    </h1>
                    <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.7 }}>
                      Sign in to manage your home services platform.
                    </p>
                  </motion.div>

                  {/* Phone input */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.38, delay: 0.13 }}
                    style={{ marginBottom: '22px' }}
                  >
                    <label style={{
                      display: 'block', fontSize: '13px', fontWeight: 600,
                      color: INK, marginBottom: '9px',
                    }}>
                      Phone Number
                    </label>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      border: `1.5px solid ${phoneFocused ? BLUE : '#E2E8F0'}`,
                      borderRadius: '14px',
                      padding: '0 16px',
                      background: phoneFocused ? 'rgba(37,99,235,0.025)' : '#FAFAFA',
                      boxShadow: phoneFocused ? `0 0 0 3.5px rgba(37,99,235,0.11)` : 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
                    }}>
                      <Phone
                        size={16}
                        color={phoneFocused ? BLUE : '#94A3B8'}
                        style={{ flexShrink: 0, transition: 'color 0.2s' }}
                      />
                      <input
                        autoFocus
                        type="tel"
                        placeholder="+91 99999 99999"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        onFocus={() => setPhoneFocused(true)}
                        onBlur={() => setPhoneFocused(false)}
                        className="ls-input"
                        style={{
                          flex: 1, background: 'transparent', border: 'none', outline: 'none',
                          color: INK, fontSize: '15px', padding: '14px 0', fontWeight: 500,
                          caretColor: BLUE,
                        }}
                      />
                    </div>
                  </motion.div>

                  {/* Error message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: '18px' }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        style={{
                          background: 'rgba(239,68,68,0.07)',
                          border: '1px solid rgba(239,68,68,0.18)',
                          borderRadius: '11px', padding: '10px 14px',
                          fontSize: '13px', color: '#DC2626', fontWeight: 500,
                        }}
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* CTA button */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.38, delay: 0.20 }}
                    style={{ marginBottom: '18px' }}
                  >
                    <motion.button
                      onClick={handleSendOtp}
                      disabled={!btnActive}
                      className="ls-btn"
                      whileHover={btnActive ? {
                        scale: 1.018, y: -2,
                        boxShadow: '0 16px 40px rgba(37,99,235,0.42)',
                      } : {}}
                      whileTap={btnActive ? { scale: 0.975 } : {}}
                      style={{
                        width: '100%', padding: '15px 28px',
                        borderRadius: '14px',
                        fontSize: '15px', fontWeight: 700,
                        background: loading
                          ? '#E2E8F0'
                          : `linear-gradient(135deg, ${BLUE} 0%, ${TEAL} 100%)`,
                        color: loading ? MUTED : '#fff',
                        border: 'none', cursor: loading ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        boxShadow: loading ? 'none' : '0 8px 28px rgba(37,99,235,0.34)',
                        transition: 'background 0.22s, box-shadow 0.22s, color 0.22s',
                      }}
                    >
                      {loading
                        ? <Loader2 size={18} style={{ animation: 'ls-spin 0.7s linear infinite' }} />
                        : <><span>Send OTP</span><ChevronRight size={16} /></>
                      }
                    </motion.button>
                  </motion.div>

                  {/* Divider */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.28 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}
                  >
                    <div style={{ flex: 1, height: 1, background: '#F1F5F9' }} />
                    <span style={{ fontSize: '11px', color: '#CBD5E1', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
                      Admin access only
                    </span>
                    <div style={{ flex: 1, height: 1, background: '#F1F5F9' }} />
                  </motion.div>

                  {/* Trust badges */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.34 }}
                    style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
                  >
                    {[
                      { icon: '🔒', text: 'End-to-end encrypted', col: 'rgba(37,99,235,0.09)', border: 'rgba(37,99,235,0.16)', txt: '#1D4ED8' },
                      { icon: '✓',  text: 'Two-factor auth',       col: 'rgba(20,184,166,0.08)', border: 'rgba(20,184,166,0.18)', txt: '#0F766E' },
                    ].map(({ icon, text, col, border, txt }) => (
                      <div key={text} style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 12px', borderRadius: '20px',
                        background: col, border: `1px solid ${border}`,
                      }}>
                        <span style={{ fontSize: '11px' }}>{icon}</span>
                        <span style={{ fontSize: '11px', color: txt, fontWeight: 600 }}>{text}</span>
                      </div>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {/* ── Step 2: OTP ── */}
              {step === 'otp' && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 22 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -22 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Back */}
                  <motion.button
                    whileHover={{ x: -4 }}
                    onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'none', border: 'none', color: MUTED,
                      fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                      padding: 0, marginBottom: '28px',
                      transition: 'color 0.18s',
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = INK)}
                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = MUTED)}
                  >
                    <ArrowLeft size={14} /> Back
                  </motion.button>

                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ marginBottom: '30px' }}
                  >
                    {/* Icon badge */}
                    <div style={{
                      width: 58, height: 58, borderRadius: '18px',
                      background: `linear-gradient(135deg, rgba(37,99,235,0.12), rgba(20,184,166,0.08))`,
                      border: `1.5px solid rgba(37,99,235,0.16)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '20px',
                    }}>
                      <Phone size={26} color={BLUE} strokeWidth={1.8} />
                    </div>

                    <h1 style={{
                      fontSize: 'clamp(24px, 2.8vw, 30px)',
                      fontWeight: 800, color: SLATE,
                      letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: '9px',
                    }}>
                      Enter OTP
                    </h1>
                    <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.7 }}>
                      We sent a 6-digit code to{' '}
                      <span style={{ color: BLUE, fontWeight: 700 }}>{phone}</span>
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{ marginBottom: '26px' }}
                  >
                    <OtpInput value={otp} onChange={setOtp} />
                  </motion.div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: '18px' }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        style={{
                          background: 'rgba(239,68,68,0.07)',
                          border: '1px solid rgba(239,68,68,0.18)',
                          borderRadius: '11px', padding: '10px 14px',
                          fontSize: '13px', color: '#DC2626', fontWeight: 500,
                        }}
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    onClick={handleVerifyOtp}
                    disabled={!verifyActive}
                    className="ls-btn"
                    whileHover={verifyActive ? {
                      scale: 1.018, y: -2,
                      boxShadow: '0 16px 40px rgba(37,99,235,0.42)',
                    } : {}}
                    whileTap={verifyActive ? { scale: 0.975 } : {}}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    style={{
                      width: '100%', padding: '15px 28px',
                      borderRadius: '14px', marginBottom: '20px',
                      fontSize: '15px', fontWeight: 700,
                      background: !verifyActive
                        ? '#E2E8F0'
                        : `linear-gradient(135deg, ${BLUE} 0%, ${TEAL} 100%)`,
                      color: !verifyActive ? MUTED : '#fff',
                      border: 'none', cursor: !verifyActive ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: !verifyActive ? 'none' : '0 8px 28px rgba(37,99,235,0.34)',
                      transition: 'background 0.22s, box-shadow 0.22s, color 0.22s',
                    }}
                  >
                    {loading
                      ? <Loader2 size={18} style={{ animation: 'ls-spin 0.7s linear infinite' }} />
                      : <><span>Verify &amp; Sign In</span><ChevronRight size={16} /></>
                    }
                  </motion.button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: MUTED }}>Didn't receive it?</span>
                    <motion.button
                      whileHover={resendCountdown === 0 && !loading ? { scale: 1.04 } : {}}
                      onClick={handleResend}
                      disabled={resendCountdown > 0 || loading}
                      style={{
                        background: 'none', border: 'none', padding: 0,
                        color: resendCountdown > 0 ? '#CBD5E1' : BLUE,
                        cursor: resendCountdown > 0 ? 'default' : 'pointer',
                        fontSize: '13px', fontWeight: 700,
                        transition: 'opacity 0.2s',
                      }}
                    >
                      {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
                    </motion.button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
