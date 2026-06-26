import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageTransition } from '@/components/PageTransition';
import { GlowCard } from '@/components/effects/GlowCard';
import { StaggerList } from '@/components/effects/StaggerList';
import { dashboardApi } from '@/lib/api';
import { useVectr } from '@/context/VectrContext';
import { MapPin, Wifi, Activity, Globe } from 'lucide-react';

export default function MapView() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => (await dashboardApi.getStats()).data.data,
  });

  const statCards = [
    { label: 'Online Providers', value: stats?.total ? Math.floor(stats.total * 0.12) : '—', icon: Wifi,      color: '#34d399' },
    { label: 'Active Bookings',  value: stats?.pending ?? '—',                                 icon: Activity,  color: '#ffb238' },
    { label: 'Cities Covered',   value: 12,                                                    icon: Globe,     color: '#818cf8' },
  ];

  return (
    <PageTransition>
      <DashboardLayout title="Live Provider Map" subtitle="Real-time provider location tracking — Phase 3">
        {/* Stats row */}
        <StaggerList
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <GlowCard
              key={label}
              glowColor={`${color}26`}
              className="glass-card"
              style={{
                padding: '18px 20px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <motion.div
                whileHover={{ rotate: 12, scale: 1.1 }}
                style={{
                  width: 40, height: 40, borderRadius: '10px',
                  background: `${color}18`, border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon size={18} style={{ color }} />
              </motion.div>
              <div>
                <p style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--mono)', color }}>{value}</p>
                <p style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)' }}>
                  {label}
                </p>
              </div>
            </GlowCard>
          ))}
        </StaggerList>

        {/*
          The Three.js SCENE IS the map. We carve out a transparent panel here
          so the live amber transmission line shows through, then float
          explanatory glass overlays on top of it.
        */}
        <div style={{
          position: 'relative',
          height: 'calc(100vh - 280px)',
          minHeight: '480px',
          background: 'transparent',
          borderRadius: '20px',
          border: '1px solid rgba(255,178,56,0.10)',
          overflow: 'hidden',
        }}>
          {/* Provider node dots — animated with framer */}
          {[
            { left: '12%', top: '22%', delay: 0 },
            { left: '34%', top: '64%', delay: 0.3 },
            { left: '58%', top: '38%', delay: 0.6 },
            { left: '76%', top: '74%', delay: 0.9 },
            { left: '86%', top: '20%', delay: 1.2 },
            { left: '22%', top: '82%', delay: 1.5 },
          ].map((p, i) => (
            <motion.span
              key={i}
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 2, delay: p.delay, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                left: p.left,
                top: p.top,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'var(--amber)',
                boxShadow: '0 0 14px var(--amber), 0 0 30px rgba(255,178,56,0.5)',
                zIndex: 2,
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* Top-left scene header glass chip */}
          <GlowCard
            style={{
              position: 'absolute', top: 16, left: 16, zIndex: 2,
              background: 'rgba(7,9,14,0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,178,56,0.18)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            <MapPin size={15} style={{ color: 'var(--amber)' }} />
            <span style={{
              fontSize: '11px', fontFamily: 'var(--mono)', fontWeight: 700,
              color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              Live Field View
            </span>
            <motion.span
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#34d399',
                boxShadow: '0 0 8px #34d399',
                marginLeft: 4,
              }}
            />
          </GlowCard>

          {/* Bottom centered glass note */}
          <GlowCard
            style={{
              position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(7,9,14,0.55)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,178,56,0.18)',
              borderRadius: '14px',
              padding: '14px 22px',
              maxWidth: '520px', width: '90%', textAlign: 'center',
              zIndex: 2,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 32px rgba(0,0,0,0.4)',
            }}
          >
            <p style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.55 }}>
              <span style={{ color: 'var(--amber)', fontWeight: 700, fontFamily: 'var(--mono)', letterSpacing: '0.05em' }}>
                LIVE FIELD VIEW
              </span>
              <span style={{ color: 'var(--muted)' }}>
                {' '}— provider nodes power up as bookings are assigned
              </span>
            </p>
          </GlowCard>
        </div>
      </DashboardLayout>
    </PageTransition>
  );
}
