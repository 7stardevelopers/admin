import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/auth.store';
import { useVectr } from '@/context/VectrContext';
import { PageTransition } from '@/components/PageTransition';
import { ClickSpark } from '@/components/effects/ClickSpark';
import { ShinyText } from '@/components/effects/ShinyText';
import { ChevronRight, Phone, ArrowLeft, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';

type Step = 'phone' | 'otp';

const card: React.CSSProperties = {
  width: '100%',
  maxWidth: '420px',
  background: 'rgba(7,9,14,0.30)',
  backdropFilter: 'blur(32px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(32px) saturate(1.4)',
  border: '1px solid rgba(255,178,56,0.20)',
  borderRadius: '24px',
  padding: '40px 36px',
  position: 'relative',
  boxShadow:
    '0 0 80px rgba(255,178,56,0.08), 0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 16px',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,178,56,0.18)',
  color: 'var(--ink)',
  fontSize: '15px',
  fontFamily: 'var(--mono)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const btnPrimary: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  borderRadius: '12px',
  fontSize: '15px',
  fontWeight: 700,
  background: 'linear-gradient(135deg, #ffb238, #ff8a1e)',
  color: '#07090e',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  boxShadow: '0 8px 24px rgba(255,138,30,0.35)',
};

// Six individual digit boxes for OTP input
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handleChange = (i: number, ch: string) => {
    const digit = ch.replace(/\D/g, '').slice(-1);
    const arr = value.split('');
    arr[i] = digit;
    const next = arr.join('').padEnd(6, '').slice(0, 6);
    onChange(next.trimEnd() + (digit ? '' : ''));
    const newVal = (value.slice(0, i) + digit + value.slice(i + 1)).slice(0, 6);
    onChange(newVal);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    const focus = Math.min(pasted.length, 5);
    refs.current[focus]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          maxLength={1}
          inputMode="numeric"
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => (e.target.style.borderColor = 'rgba(255,178,56,0.6)')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(255,178,56,0.18)')}
          style={{
            ...inputStyle,
            width: '46px',
            height: '56px',
            textAlign: 'center',
            fontSize: '22px',
            fontWeight: 700,
            padding: '0',
            letterSpacing: 0,
          }}
        />
      ))}
    </div>
  );
}

export default function Login() {
  const navigate  = useNavigate();
  const setUser   = useAuthStore((s) => s.setUser);
  const { setMode } = useVectr();

  const [step, setStep]   = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp]     = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => { setMode('login'); }, [setMode]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  const handleSendOtp = async () => {
    const clean = phone.trim();
    if (!clean) { setError('Enter your phone number'); return; }
    setError('');
    setLoading(true);
    try {
      await authApi.sendOtp(clean);
      setStep('otp');
      setResendCountdown(30);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) { setError('Enter the 6-digit OTP'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(phone.trim(), otp);
      const { user, accessToken } = res.data.data;
      Cookies.set('admin_token', accessToken, { expires: 1 });
      setUser({ name: user.name, phone: user.phone, role: user.role });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Invalid OTP');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;
    setError('');
    setLoading(true);
    try {
      await authApi.sendOtp(phone.trim());
      setResendCountdown(30);
      setOtp('');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 'phone') handleSendOtp();
      else if (otp.length === 6) handleVerifyOtp();
    }
  };

  return (
    <PageTransition>
      <div style={{
        minHeight: '100vh',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={card}
        >
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '28px', fontWeight: 800 }}>
              <ShinyText>7STAR/</ShinyText>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '6px', fontFamily: 'var(--mono)', letterSpacing: '0.1em' }}>
              ADMIN PORTAL
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'phone' ? (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
                onKeyDown={handleKeyDown}
              >
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                  Sign In
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '24px' }}>
                  Enter your admin phone number
                </p>

                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: '8px', letterSpacing: '0.06em' }}>
                  PHONE NUMBER
                </label>
                <div style={{ position: 'relative', marginBottom: '20px' }}>
                  <Phone size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--amber)', pointerEvents: 'none' }} />
                  <input
                    autoFocus
                    type="tel"
                    placeholder="+91 99999 99999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(255,178,56,0.5)')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,178,56,0.18)')}
                    style={{ ...inputStyle, paddingLeft: '40px' }}
                  />
                </div>

                {error && (
                  <p style={{ fontSize: '13px', color: '#f87171', marginBottom: '16px', textAlign: 'center' }}>{error}</p>
                )}

                <ClickSpark>
                  <motion.button
                    onClick={handleSendOtp}
                    disabled={loading}
                    whileHover={!loading ? { scale: 1.02, boxShadow: '0 12px 32px rgba(255,138,30,0.45)' } : {}}
                    whileTap={!loading ? { scale: 0.97 } : {}}
                    style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? <Loader2 size={18} className="spin" /> : <>Send OTP <ChevronRight size={18} /></>}
                  </motion.button>
                </ClickSpark>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
                onKeyDown={handleKeyDown}
              >
                <button
                  onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '13px', cursor: 'pointer', padding: 0, marginBottom: '20px' }}
                >
                  <ArrowLeft size={14} /> Back
                </button>

                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                  Enter OTP
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '28px' }}>
                  Sent to <span style={{ color: 'var(--amber)', fontFamily: 'var(--mono)' }}>{phone}</span>
                </p>

                <div style={{ marginBottom: '24px' }}>
                  <OtpInput value={otp} onChange={setOtp} />
                </div>

                {error && (
                  <p style={{ fontSize: '13px', color: '#f87171', marginBottom: '16px', textAlign: 'center' }}>{error}</p>
                )}

                <ClickSpark>
                  <motion.button
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length < 6}
                    whileHover={!loading && otp.length === 6 ? { scale: 1.02, boxShadow: '0 12px 32px rgba(255,138,30,0.45)' } : {}}
                    whileTap={!loading && otp.length === 6 ? { scale: 0.97 } : {}}
                    style={{ ...btnPrimary, opacity: loading || otp.length < 6 ? 0.6 : 1, marginBottom: '16px' }}
                  >
                    {loading ? <Loader2 size={18} className="spin" /> : <>Verify & Sign In <ChevronRight size={18} /></>}
                  </motion.button>
                </ClickSpark>

                <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted)' }}>
                  Didn't receive it?{' '}
                  <button
                    onClick={handleResend}
                    disabled={resendCountdown > 0 || loading}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      color: resendCountdown > 0 ? 'var(--muted)' : 'var(--amber)',
                      cursor: resendCountdown > 0 ? 'default' : 'pointer',
                      fontSize: '13px', fontWeight: 600,
                    }}
                  >
                    {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </PageTransition>
  );
}
