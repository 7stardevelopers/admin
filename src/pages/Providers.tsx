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
import { CheckCircle, XCircle, Eye, Search } from 'lucide-react';

const STATUS_TABS: Array<ProviderStatus | ''> = ['', 'PENDING', 'APPROVED', 'SUSPENDED'];

export default function Providers() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);
  const [page, setPage]           = useState(1);
  const [statusFilter, setStatus] = useState<ProviderStatus | ''>('PENDING');
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState<{ provider: Provider; action: 'APPROVED' | 'SUSPENDED' } | null>(null);
  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['providers', page, statusFilter, search],
    queryFn: async () => {
      const res = await providersApi.getAll({ page, per_page: 15, ...(statusFilter && { status: statusFilter }), ...(search && { search }) });
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'APPROVED' | 'SUSPENDED' }) =>
      action === 'APPROVED' ? providersApi.approve(id) : providersApi.suspend(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['providers'] }); setModal(null); },
  });

  const providers: Provider[] = Array.isArray(data?.data?.items) ? data.data.items : [];
  const totalPages = data?.data?.total ? Math.ceil(data.data.total / 15) : 1;

  const columns = [
    {
      key: 'name', header: 'Provider',
      render: (r: Provider) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {(r as any).photo_url
            ? (
              <motion.img
                src={(r as any).photo_url}
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
                  background: 'linear-gradient(135deg,#2563EB,#14B8A6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, color: '#ffffff',
                }}
              >
                {getInitials((r as any).name ?? '')}
              </motion.div>
            )
          }
          <div>
            <p style={{ fontWeight: 600, fontSize: '13px' }}>{(r as any).name}</p>
            <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{(r as any).phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'rating', header: 'Rating',
      render: (r: Provider) => (
        <span style={{ color: 'var(--amber)', fontWeight: 600, fontSize: '13px' }}>
          ⭐ {Number((r as any).avg_rating ?? 0).toFixed(1)}
          <span style={{ color: 'var(--muted)', fontSize: '11px' }}> ({(r as any).total_reviews ?? 0})</span>
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (r: Provider) => <Badge status={r.status} /> },
    {
      key: 'joined', header: 'Joined',
      render: (r: Provider) => (
        <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{formatDate((r as any).created_at)}</span>
      ),
    },
    {
      key: 'actions', header: 'Actions',
      render: (r: Provider) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <motion.button
            onClick={(e) => { e.stopPropagation(); navigate(`/providers/${(r as any).provider_id}`); }}
            whileHover={{ scale: 1.15, color: 'var(--amber)' }}
            whileTap={{ scale: 0.9 }}
            style={{ padding: '6px', borderRadius: '8px', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            title="View"
          >
            <Eye size={15} />
          </motion.button>
          {(r.status === 'PENDING' || r.status === 'SUSPENDED') && (
            <ClickSpark color="#34d399">
              <motion.button
                onClick={(e) => { e.stopPropagation(); setModal({ provider: r, action: 'APPROVED' }); }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.9 }}
                style={{ padding: '6px', borderRadius: '8px', color: '#34d399', background: 'rgba(52,211,153,0.08)', border: 'none', cursor: 'pointer' }}
                title={r.status === 'SUSPENDED' ? 'Activate' : 'Approve'}
              >
                <CheckCircle size={15} />
              </motion.button>
            </ClickSpark>
          )}
          {r.status === 'APPROVED' && (
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
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
                      background: 'rgba(37,99,235,0.15)',
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
          <div style={{ position: 'relative', width: '220px', flexShrink: 0 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or phone…"
              className="input-base"
              style={{ padding: '8px 12px 8px 30px', fontSize: '12px', width: '100%' }}
            />
          </div>
        </div>

        <DataTable columns={columns} data={providers} isLoading={isLoading}
          onRowClick={(r) => navigate(`/providers/${(r as any).provider_id}`)} />
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}

        <ConfirmModal
          isOpen={!!modal}
          title={modal?.action === 'APPROVED'
            ? ((modal?.provider as any)?.status === 'SUSPENDED' ? 'Activate Provider' : 'Approve Provider')
            : 'Suspend Provider'}
          message={`Are you sure you want to ${
            modal?.action === 'APPROVED'
              ? ((modal?.provider as any)?.status === 'SUSPENDED' ? 'activate' : 'approve')
              : 'suspend'
          } ${(modal?.provider as any)?.name}?`}
          confirmLabel={modal?.action === 'APPROVED'
            ? ((modal?.provider as any)?.status === 'SUSPENDED' ? 'Activate' : 'Approve')
            : 'Suspend'}
          confirmStyle={modal?.action === 'APPROVED' ? 'success' : 'danger'}
          isLoading={updateMutation.isPending}
          onConfirm={() => modal && updateMutation.mutate({ id: (modal.provider as any).provider_id, action: modal.action })}
          onCancel={() => setModal(null)}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
