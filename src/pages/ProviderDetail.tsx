import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useVectr } from '@/context/VectrContext';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PageTransition } from '@/components/PageTransition';
import { GlowCard } from '@/components/effects/GlowCard';
import { AnimatedCounter } from '@/components/effects/AnimatedCounter';
import { providersApi } from '@/lib/api';
import { formatDate, formatCurrency, getInitials } from '@/lib/utils';
import { ArrowLeft, CheckCircle, XCircle, Ban } from 'lucide-react';

export default function ProviderDetail() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<'VERIFIED' | 'REJECTED' | 'SUSPENDED' | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['provider', id],
    queryFn: async () => {
      const res = await providersApi.getById(id!);
      return res.data.data;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (status: string) => providersApi.updateStatus(id!, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['provider', id] }); setModal(null); },
  });

  const cardStyle: React.CSSProperties = {
    background: 'rgba(7,9,14,0.55)',
    border: '1px solid rgba(255,178,56,0.10)',
    backdropFilter: 'blur(24px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
    borderRadius: '18px',
    padding: '24px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.3)',
  };

  if (isLoading) return (
    <PageTransition>
      <DashboardLayout title="Provider Details">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
          <div className="spinner" />
        </div>
      </DashboardLayout>
    </PageTransition>
  );

  const p = data;
  if (!p) return (
    <PageTransition>
      <DashboardLayout title="Provider Details">
        <p style={{ color: 'var(--muted)' }}>Provider not found.</p>
      </DashboardLayout>
    </PageTransition>
  );

  const infoRows = [
    { label: 'Rating',          value: `⭐ ${p.rating.toFixed(1)} (${p.totalReviews} reviews)` },
    { label: 'Experience',      value: p.experience ? `${p.experience} years` : 'Not set' },
    { label: 'Joined',          value: formatDate(p.createdAt) },
    { label: 'Total Earnings',  value: formatCurrency(p.totalEarnings)  },
    { label: 'Wallet Balance',  value: formatCurrency(p.walletBalance)  },
    { label: 'Availability',    value: p.isAvailable ? '🟢 Online' : '🔴 Offline' },
  ];

  return (
    <PageTransition>
      <DashboardLayout title="Provider Details">
        <motion.button
          onClick={() => navigate(-1)}
          whileHover={{ x: -4, color: 'var(--amber)' }}
          whileTap={{ scale: 0.97 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            color: 'var(--muted)', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: '13px', marginBottom: '24px',
          }}
        >
          <ArrowLeft size={16} /> Back to Providers
        </motion.button>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
          {/* Profile card */}
          <GlowCard style={cardStyle}>
            <div style={{ textAlign: 'center' }}>
              {p.user?.avatar
                ? <motion.img
                    src={p.user.avatar}
                    whileHover={{ scale: 1.08, rotate: 2 }}
                    alt=""
                    style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--amber)', margin: '0 auto', boxShadow: '0 0 24px rgba(255,178,56,0.25)' }}
                  />
                : (
                  <motion.div
                    whileHover={{ scale: 1.08, rotate: 2 }}
                    style={{
                      width: 72, height: 72, borderRadius: '50%',
                      background: 'linear-gradient(135deg,#ffb238,#ff8a1e)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '24px', fontWeight: 800, color: '#07090e', margin: '0 auto',
                      boxShadow: '0 0 24px rgba(255,178,56,0.4)',
                    }}
                  >
                    {getInitials(p.user?.name ?? 'U')}
                  </motion.div>
                )
              }
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginTop: '12px' }}>{p.user?.name}</h2>
              <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'var(--mono)' }}>{p.user?.phone}</p>
              <div style={{ marginTop: '10px' }}><Badge status={p.status} /></div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {infoRows.map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '10px 0',
                  borderBottom: 'var(--glass-border)', fontSize: '13px',
                }}>
                  <span style={{ color: 'var(--muted)' }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {p.status === 'PENDING' && (
                <>
                  <motion.button
                    onClick={() => setModal('VERIFIED')}
                    whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(16,185,129,0.35)' }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      width: '100%', padding: '10px', borderRadius: '10px', fontSize: '14px',
                      fontWeight: 700, cursor: 'pointer', border: 'none', color: '#fff',
                      background: 'linear-gradient(135deg,#10b981,#059669)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                  >
                    <CheckCircle size={16} /> Approve Provider
                  </motion.button>
                  <motion.button
                    onClick={() => setModal('REJECTED')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      width: '100%', padding: '10px', borderRadius: '10px', fontSize: '14px',
                      fontWeight: 700, cursor: 'pointer', color: '#f87171',
                      background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                  >
                    <XCircle size={16} /> Reject Provider
                  </motion.button>
                </>
              )}
              {p.status === 'VERIFIED' && (
                <motion.button
                  onClick={() => setModal('SUSPENDED')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '10px', fontSize: '14px',
                    fontWeight: 700, cursor: 'pointer', color: '#f87171',
                    background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  <Ban size={16} /> Suspend Provider
                </motion.button>
              )}
            </div>
          </GlowCard>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Services */}
            {p.services && p.services.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                style={cardStyle}
              >
                <p style={{ fontSize: '11px', fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--amber)', marginBottom: '16px' }}>
                  Services Offered
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {p.services.map((ps: any, i: number) => (
                    <motion.span
                      key={ps.id}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.05, type: 'spring', stiffness: 280, damping: 20 }}
                      whileHover={{ scale: 1.05 }}
                      style={{
                        padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                        background: 'rgba(79,70,229,0.12)', color: '#818cf8',
                        border: '1px solid rgba(79,70,229,0.2)',
                      }}
                    >
                      {ps.service?.name} — {formatCurrency(ps.price)}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Bio */}
            {p.bio && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                style={cardStyle}
              >
                <p style={{ fontSize: '11px', fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--amber)', marginBottom: '12px' }}>
                  Bio
                </p>
                <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6 }}>{p.bio}</p>
              </motion.div>
            )}

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { label: 'Rating', value: p.rating, decimals: 1, suffix: ' / 5' },
                { label: 'Reviews', value: p.totalReviews, decimals: 0, suffix: '' },
                { label: 'Bookings', value: p._count?.bookings ?? 0, decimals: 0, suffix: '' },
              ].map(({ label, value, decimals, suffix }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  style={{ ...cardStyle, textAlign: 'center' }}
                >
                  <p style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--amber)' }}>
                    <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <ConfirmModal
          isOpen={!!modal}
          title={modal === 'VERIFIED' ? 'Approve Provider' : modal === 'REJECTED' ? 'Reject Provider' : 'Suspend Provider'}
          message={`Are you sure you want to ${modal?.toLowerCase()} ${p.user?.name}?`}
          confirmLabel={modal === 'VERIFIED' ? 'Approve' : modal === 'REJECTED' ? 'Reject' : 'Suspend'}
          confirmStyle={modal === 'VERIFIED' ? 'success' : 'danger'}
          isLoading={updateMutation.isPending}
          onConfirm={() => modal && updateMutation.mutate(modal)}
          onCancel={() => setModal(null)}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
