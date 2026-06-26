import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Cookies from 'js-cookie';
import { Sidebar } from './Sidebar';
import { ShinyText } from '@/components/effects/ShinyText';

interface DashboardLayoutProps {
  title?: string;
  subtitle?: string;
  /** Right-side slot in the header bar (e.g. a LIVE indicator). */
  headerRight?: React.ReactNode;
  children?: React.ReactNode;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768,
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}

export function DashboardLayout({ title, subtitle, headerRight, children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setMounted(true);
    const token = Cookies.get('admin_token');
    if (!token) navigate('/login');
  }, [navigate]);

  if (!mounted) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'transparent',
      }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'transparent',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Desktop sidebar always rendered; mobile sidebar only when open */}
      {!isMobile && <Sidebar />}

      <AnimatePresence>
        {isMobile && mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              className="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <Sidebar
              key="sidebar-mobile"
              isMobile
              mobileOpen={mobileOpen}
              onMobileClose={() => setMobileOpen(false)}
            />
          </>
        )}
      </AnimatePresence>

      <main style={{
        flex: 1,
        overflowY: 'auto',
        background: 'transparent',
        position: 'relative',
        zIndex: 1,
        width: '100%',
      }}>
        {(title || subtitle || headerRight || isMobile) && (
          <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 5,
            background: 'rgba(7, 9, 14, 0.7)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255,178,56,0.08)',
            padding: isMobile ? '16px 18px' : '20px 32px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
              {isMobile && (
                <motion.button
                  onClick={() => setMobileOpen((v) => !v)}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Toggle menu"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    background: 'rgba(255,178,56,0.08)',
                    border: '1px solid rgba(255,178,56,0.18)',
                    color: 'var(--amber)',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={mobileOpen ? 'x' : 'menu'}
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      style={{ display: 'flex' }}
                    >
                      {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                    </motion.span>
                  </AnimatePresence>
                </motion.button>
              )}

              <div style={{ position: 'relative' }}>
                {title && (
                  <h1 style={{
                    fontSize: isMobile ? '18px' : '22px',
                    fontWeight: 800,
                    fontFamily: 'var(--mono)',
                    letterSpacing: '-0.01em',
                    position: 'relative',
                    display: 'inline-block',
                  }}>
                    <ShinyText>{title}</ShinyText>
                    {/* Animated amber underline */}
                    <motion.span
                      layoutId="pageTitleUnderline"
                      style={{
                        position: 'absolute',
                        left: 0,
                        bottom: -4,
                        height: 2,
                        width: '100%',
                        borderRadius: 2,
                        background: 'linear-gradient(90deg, var(--amber), transparent)',
                        transformOrigin: 'left center',
                      }}
                      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                    />
                  </h1>
                )}
                {subtitle && (
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--muted)',
                    marginTop: '6px',
                  }}>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            {headerRight && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {headerRight}
              </div>
            )}
          </div>
        )}
        <div style={{ padding: isMobile ? '20px 18px' : '28px 32px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
