import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useVectr } from '@/context/VectrContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PageTransition } from '@/components/PageTransition';
import { ClickSpark } from '@/components/effects/ClickSpark';
import { providersApi } from '@/lib/api';
import { formatDate, getInitials } from '@/lib/utils';
import type { Provider, ProviderStatus } from '@/types';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

const STATUS_TABS: Array<ProviderStatus | ''> = ['', 'PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'];

export default function Providers() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);
  const [page, setPage]           = useState(1);
  const [statusFilter, setStatus] = useState<ProviderStatus | ''>('PENDING');
  const [modal, setModal]         = useState<{ provider: Provider; action: 'VERIFIED' | 'REJECTED' | 'SUSPENDED' } | null>(null);
  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['providers', page, statusFilter],
    queryFn: async () => {
      const res = await providersApi.getAll({ page, limit: 15, ...(statusFilter && { status: statusFilter }) });
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      providersApi.updateStatus(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['providers'] }); setModal(null); },
  });

  const providers: Provider[] = data?.data ?? [];
  const pagination = data?.pagination;

  const columns = [
    {
      key: 'name', header: 'Provider',
      render: (r: Provider) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {r.user.avatar
            ? (
              <motion.img
                src={r.user.avatar}
                alt=""
                whileHover={{ scale: 1.1, rotate: 3 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
              />
            )
            : (
              <motion.div
                whileHover={{ scale: 1.1, rotate: 3 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#ffb238,#ff8a1e)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, color: '#07090e',
                }}
              >
                {getInitials(r.user.name)}
              </motion.div>
            )
          }
          <div>
            <p style={{ fontWeight: 600, fontSize: '13px' }}>{r.user.name}</p>
            <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{r.user.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'rating', header: 'Rating',
      render: (r: Provider) => (
        <span style={{ color: 'var(--amber)', fontWeight: 600, fontSize: '13px' }}>
          ⭐ {r.rating.toFixed(1)} <span style={{ color: 'var(--muted)', fontSize: '11px' }}>({r.totalReviews})</span>
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (r: Provider) => <Badge status={r.status} /> },
    {
      key: 'bookings', header: 'Bookings',
      render: (r: Provider) => (
        <span style={{ fontFamily: 'var(--mono)', fontSize: '13px' }}>{r._count?.bookings ?? 0}</span>
      ),
    },
    {
      key: 'joined', header: 'Joined',
      render: (r: Provider) => (
        <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{formatDate(r.createdAt)}</span>
      ),
    },
    {
      key: 'actions', header: 'Actions',
      render: (r: Provider) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <motion.button
            onClick={(e) => { e.stopPropagation(); navigate(`/providers/${r.id}`); }}
            whileHover={{ scale: 1.15, color: 'var(--amber)' }}
            whileTap={{ scale: 0.9 }}
            style={{ padding: '6px', borderRadius: '8px', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            title="View"
          >
            <Eye size={15} />
          </motion.button>
          {r.status === 'PENDING' && (
            <>
              <ClickSpark color="#34d399">
                <motion.button
                  onClick={(e) => { e.stopPropagation(); setModal({ provider: r, action: 'VERIFIED' }); }}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ padding: '6px', borderRadius: '8px', color: '#34d399', background: 'rgba(52,211,153,0.08)', border: 'none', cursor: 'pointer' }}
                >
                  <CheckCircle size={15} />
                </motion.button>
              </ClickSpark>
              <motion.button
                onClick={(e) => { e.stopPropagation(); setModal({ provider: r, action: 'REJECTED' }); }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.9 }}
                style={{ padding: '6px', borderRadius: '8px', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: 'none', cursor: 'pointer' }}
              >
                <XCircle size={15} />
              </motion.button>
            </>
          )}
          {r.status === 'VERIFIED' && (
            <motion.button
              onClick={(e) => { e.stopPropagation(); setModal({ provider: r, action: 'SUSPENDED' }); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', cursor: 'pointer' }}
            >
              Suspend
            </motion.button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageTransition>
      <DashboardLayout title="Providers" subtitle="Manage and verify service professionals">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {STATUS_TABS.map((s) => {
            const active = statusFilter === s;
            return (
              <motion.button
                key={s || 'all'}
                onClick={() => { setStatus(s); setPage(1); }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  position: 'relative',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--mono)',
                  cursor: 'pointer',
                  border: 'var(--glass-border)',
                  background: 'var(--glass-bg)',
                  color: active ? 'var(--amber)' : 'var(--muted)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  overflow: 'hidden',
                }}
              >
                {active && (
                  <motion.span
                    layoutId="providerFilter"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(255,178,56,0.15)',
                      border: '1px solid var(--amber)',
                      borderRadius: '20px',
                      zIndex: 0,
                    }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{s || 'All'}</span>
              </motion.button>
            );
          })}
        </div>

        <DataTable columns={columns} data={providers} isLoading={isLoading}
          onRowClick={(r) => navigate(`/providers/${r.id}`)} />
        {pagination && <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />}

        <ConfirmModal
          isOpen={!!modal}
          title={modal?.action === 'VERIFIED' ? 'Approve Provider' : modal?.action === 'REJECTED' ? 'Reject Provider' : 'Suspend Provider'}
          message={`Are you sure you want to ${modal?.action?.toLowerCase()} ${modal?.provider.user.name}?`}
          confirmLabel={modal?.action === 'VERIFIED' ? 'Approve' : modal?.action === 'REJECTED' ? 'Reject' : 'Suspend'}
          confirmStyle={modal?.action === 'VERIFIED' ? 'success' : 'danger'}
          isLoading={updateMutation.isPending}
          onConfirm={() => modal && updateMutation.mutate({ id: modal.provider.id, status: modal.action })}
          onCancel={() => setModal(null)}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
