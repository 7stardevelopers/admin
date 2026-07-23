import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVectr } from '@/context/VectrContext';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PageTransition } from '@/components/PageTransition';
import { GlowCard } from '@/components/effects/GlowCard';
import { AnimatedCounter } from '@/components/effects/AnimatedCounter';
import { providersApi, documentsApi } from '@/lib/api';
import { formatDate, formatCurrency, getInitials } from '@/lib/utils';
import { ArrowLeft, CheckCircle, Ban, ShieldCheck, XCircle, Eye, X } from 'lucide-react';

const DOC_LABELS: Record<string, string> = {
  AADHAAR_FRONT:       'Aadhaar Front',
  AADHAAR_BACK:        'Aadhaar Back',
  PAN:                 'PAN Card',
  POLICE_VERIFICATION: 'Police Verification',
  CERTIFICATE:         'Certificate',
  PROFILE_PHOTO:       'Profile Photo',
};

function DocCard({ doc, onVerify, onReject, isPending }: {
  doc: any;
  onVerify: () => void;
  onReject: () => void;
  isPending: boolean;
}) {
  const [lightbox, setLightbox] = useState(false);

  const { data: contentData, isFetching } = useQuery({
    queryKey: ['doc-content', doc.document_id],
    queryFn: async () => {
      const res = await documentsApi.getContent(doc.document_id);
      return res.data.data as { content_type: string; file_content: string };
    },
    enabled: true,
    staleTime: 15 * 60 * 1000,
  });

  const imgSrc = contentData
    ? `data:${contentData.content_type};base64,${contentData.file_content}`
    : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          borderRadius: '14px',
          background: 'rgba(37,99,235,0.04)',
          border: '1px solid rgba(37,99,235,0.10)',
          overflow: 'hidden',
        }}
      >
        {/* Thumbnail — click to open modal */}
        <div
          onClick={() => imgSrc && setLightbox(true)}
          style={{
            width: '100%', height: '140px', background: 'rgba(0,0,0,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: imgSrc ? 'zoom-in' : 'default',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {isFetching && !imgSrc ? (
            <div className="spinner" style={{ width: 24, height: 24 }} />
          ) : imgSrc ? (
            <img
              src={imgSrc}
              alt={DOC_LABELS[doc.doc_type] ?? doc.doc_type}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Eye size={22} style={{ opacity: 0.3 }} />
          )}
          <div style={{
            position: 'absolute', top: 6, right: 6,
            background: 'rgba(0,0,0,0.55)', borderRadius: 6, padding: '2px 8px',
          }}>
            <Badge status={doc.status} />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px',
        }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>
              {DOC_LABELS[doc.doc_type] ?? doc.doc_type}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--muted)', margin: 0 }}>
              {formatDate(doc.created_at)}
            </p>
          </div>
          {doc.status === 'PENDING' && (
            <div style={{ display: 'flex', gap: 6 }}>
              <motion.button
                onClick={onVerify}
                disabled={isPending}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Verify"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#34d399', display: 'flex' }}
              >
                <ShieldCheck size={18} />
              </motion.button>
              <motion.button
                onClick={onReject}
                disabled={isPending}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Reject"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', display: 'flex' }}
              >
                <XCircle size={18} />
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.88)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '24px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                background: '#1a1a2e',
                borderRadius: '16px',
                overflow: 'hidden',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              }}
            >
              {/* Header bar with title + close */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                  {DOC_LABELS[doc.doc_type] ?? doc.doc_type}
                </p>
                <motion.button
                  onClick={() => setLightbox(false)}
                  whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.15)' }}
                  whileTap={{ scale: 0.92 }}
                  style={{
                    background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px',
                    color: '#fff', cursor: 'pointer', padding: '6px', display: 'flex',
                  }}
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* Image area */}
              <div style={{
                minHeight: '300px', maxHeight: '70vh',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#111',
                overflow: 'hidden',
              }}>
                {isFetching && !imgSrc ? (
                  <div className="spinner" style={{ width: 36, height: 36 }} />
                ) : imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={DOC_LABELS[doc.doc_type] ?? doc.doc_type}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '70vh' }}
                  />
                ) : (
                  <p style={{ color: '#f87171', fontSize: '13px' }}>Failed to load image</p>
                )}
              </div>

              {/* Action footer inside modal */}
              {doc.status === 'PENDING' && (
                <div style={{
                  display: 'flex', gap: 10, padding: '14px 16px',
                  background: 'rgba(255,255,255,0.03)',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <motion.button
                    onClick={() => { onVerify(); setLightbox(false); }}
                    disabled={isPending}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13px',
                      fontWeight: 700, cursor: 'pointer', border: 'none', color: '#fff',
                      background: 'linear-gradient(135deg,#10b981,#059669)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <ShieldCheck size={15} /> Verify
                  </motion.button>
                  <motion.button
                    onClick={() => { onReject(); setLightbox(false); }}
                    disabled={isPending}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13px',
                      fontWeight: 700, cursor: 'pointer', color: '#f87171',
                      background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <XCircle size={15} /> Reject
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function ProviderDetail() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<'APPROVED' | 'SUSPENDED' | null>(null);

  const { data: p, isLoading } = useQuery({
    queryKey: ['provider', id],
    queryFn: async () => {
      const res = await providersApi.getById(id!);
      return res.data.data as Record<string, any>;
    },
    enabled: !!id,
  });

  const { data: docs = [], error: docsError } = useQuery({
    queryKey: ['provider-docs', id],
    queryFn: async () => {
      const res = await documentsApi.getByProvider(id!);
      return (res.data.data ?? []) as Record<string, any>[];
    },
    enabled: !!id,
  });

  const actionMutation = useMutation({
    mutationFn: (action: 'APPROVED' | 'SUSPENDED') =>
      action === 'APPROVED' ? providersApi.approve(id!) : providersApi.suspend(id!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['provider', id] }); setModal(null); },
  });

  const verifyDocMutation = useMutation({
    mutationFn: ({ docId, status }: { docId: string; status: 'VERIFIED' | 'REJECTED' }) =>
      documentsApi.verify(docId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-docs', id] }),
  });

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.72)',
    border: '1px solid rgba(37,99,235,0.14)',
    backdropFilter: 'blur(24px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
    borderRadius: '18px',
    padding: '24px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 8px 32px rgba(15,23,42,0.10)',
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

  if (!p) return (
    <PageTransition>
      <DashboardLayout title="Provider Details">
        <p style={{ color: 'var(--muted)' }}>Provider not found.</p>
      </DashboardLayout>
    </PageTransition>
  );

  const infoRows = [
    { label: 'Status',       value: <Badge status={p.status} /> },
    { label: 'Experience',   value: p.years_experience ? `${p.years_experience} yrs` : 'Not set' },
    { label: 'Joined',       value: formatDate(p.created_at) },
    { label: 'Wallet',       value: formatCurrency(p.wallet_balance ?? 0) },
    { label: 'Availability', value: p.is_available ? '🟢 Online' : '🔴 Offline' },
    { label: 'Acceptance',   value: `${(Number(p.acceptance_rate ?? 1) * 100).toFixed(0)}%` },
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

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
          {/* Left: Profile card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <GlowCard style={cardStyle}>
              <div style={{ textAlign: 'center' }}>
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 2 }}
                  style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#2563EB,#14B8A6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: '0 auto',
                    boxShadow: '0 0 24px rgba(37,99,235,0.4)',
                  }}
                >
                  {getInitials(p.provider_id?.slice(0, 2).toUpperCase() ?? 'P')}
                </motion.div>
                <p style={{ color: 'var(--muted)', fontSize: '11px', fontFamily: 'var(--mono)', marginTop: '8px' }}>
                  ID: {p.provider_id}
                </p>
                <p style={{ color: 'var(--muted)', fontSize: '11px', fontFamily: 'var(--mono)' }}>
                  User: {p.user_id}
                </p>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {infoRows.map(({ label, value }) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 0', borderBottom: 'var(--glass-border)', fontSize: '13px',
                  }}>
                    <span style={{ color: 'var(--muted)' }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {p.status === 'PENDING' && (
                  <motion.button
                    onClick={() => setModal('APPROVED')}
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
                )}
                {(p.status === 'APPROVED' || p.status === 'PENDING') && (
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

            {/* Bio */}
            {p.bio && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                style={cardStyle}
              >
                <p style={{ fontSize: '11px', fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--amber)', marginBottom: '10px' }}>
                  Bio
                </p>
                <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>{p.bio}</p>
              </motion.div>
            )}
          </div>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { label: 'Rating',   value: Number(p.avg_rating ?? 0),   decimals: 1, suffix: ' / 5' },
                { label: 'Reviews',  value: p.total_reviews ?? 0,         decimals: 0, suffix: '' },
                { label: 'Avg Resp', value: p.avg_response_secs ?? 0,     decimals: 0, suffix: 's' },
              ].map(({ label, value, decimals, suffix }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                  style={{ ...cardStyle, textAlign: 'center' }}
                >
                  <p style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--amber)' }}>
                    <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                </motion.div>
              ))}
            </div>

            {/* Documents */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={cardStyle}
            >
              <p style={{ fontSize: '11px', fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--amber)', marginBottom: '16px' }}>
                KYC Documents
              </p>
              {docsError ? (
                <p style={{ color: '#f87171', fontSize: '13px' }}>
                  Failed to load documents: {(docsError as any)?.response?.data?.message ?? (docsError as any)?.message ?? 'Unknown error'}
                </p>
              ) : docs.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '13px' }}>No documents uploaded yet.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                  {docs.map((doc: any) => (
                    <DocCard
                      key={doc.document_id}
                      doc={doc}
                      onVerify={() => verifyDocMutation.mutate({ docId: doc.document_id, status: 'VERIFIED' })}
                      onReject={() => verifyDocMutation.mutate({ docId: doc.document_id, status: 'REJECTED' })}
                      isPending={verifyDocMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        <ConfirmModal
          isOpen={!!modal}
          title={modal === 'APPROVED' ? 'Approve Provider' : 'Suspend Provider'}
          message={`Are you sure you want to ${modal === 'APPROVED' ? 'approve' : 'suspend'} this provider?`}
          confirmLabel={modal === 'APPROVED' ? 'Approve' : 'Suspend'}
          confirmStyle={modal === 'APPROVED' ? 'success' : 'danger'}
          isLoading={actionMutation.isPending}
          onConfirm={() => modal && actionMutation.mutate(modal)}
          onCancel={() => setModal(null)}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
