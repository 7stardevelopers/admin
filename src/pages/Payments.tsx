import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useVectr } from '@/context/VectrContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { StatsCard } from '@/components/ui/StatsCard';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PageTransition } from '@/components/PageTransition';
import { StaggerList } from '@/components/effects/StaggerList';
import { ClickSpark } from '@/components/effects/ClickSpark';
import { paymentsApi } from '@/lib/api';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import type { Payment } from '@/types';
import { TrendingUp, CreditCard, RefreshCw, CheckCircle, RotateCcw } from 'lucide-react';

const STATUS_FILTERS = ['', 'SUCCESS', 'FAILED', 'REFUNDED', 'PENDING'];

export default function Payments() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);
  const [page, setPage]             = useState(1);
  const [statusFilter, setStatus]   = useState('');
  const [refundModal, setRefundModal] = useState<Payment | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, statusFilter],
    queryFn: async () => {
      const res = await paymentsApi.getAll({ page, limit: 15, ...(statusFilter && { status: statusFilter }) });
      return res.data;
    },
  });

  const refundMutation = useMutation({
    mutationFn: (bookingId: string) => paymentsApi.refund(bookingId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payments'] }); setRefundModal(null); },
  });

  const payments: Payment[] = data?.data ?? [];
  const pagination = data?.pagination;
  const stats = data?.stats;

  const columns = [
    {
      key: 'id', header: 'Payment ID',
      render: (r: Payment) => (
        <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--amber)' }}>
          #{r.id.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'booking', header: 'Service',
      render: (r: Payment) => (
        <div>
          <p style={{ fontWeight: 600, fontSize: '13px' }}>{r.booking.service.name}</p>
          <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
            {r.booking.customer.name} · {r.booking.customer.phone}
          </p>
        </div>
      ),
    },
    {
      key: 'amount', header: 'Amount',
      render: (r: Payment) => (
        <div>
          <p style={{ fontWeight: 700, color: 'var(--amber)', fontFamily: 'var(--mono)' }}>{formatCurrency(r.amount)}</p>
          {r.refundAmount && (
            <p style={{ fontSize: '11px', color: '#f87171', fontFamily: 'var(--mono)' }}>−{formatCurrency(r.refundAmount)} refunded</p>
          )}
        </div>
      ),
    },
    {
      key: 'method', header: 'Method',
      render: (r: Payment) => (
        <span style={{ fontSize: '12px', fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--muted)' }}>{r.method}</span>
      ),
    },
    { key: 'status', header: 'Status', render: (r: Payment) => <Badge status={r.status} /> },
    {
      key: 'paidAt', header: 'Paid At',
      render: (r: Payment) => r.paidAt
        ? <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{formatDateTime(r.paidAt)}</span>
        : <span style={{ color: 'var(--muted)', fontSize: '12px' }}>—</span>,
    },
    {
      key: 'actions', header: '',
      render: (r: Payment) => r.status === 'SUCCESS' ? (
        <ClickSpark color="#f87171">
          <motion.button
            onClick={(e) => { e.stopPropagation(); setRefundModal(r); }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
              borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              color: '#f87171', background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.2)', cursor: 'pointer',
            }}
          >
            <RotateCcw size={12} /> Refund
          </motion.button>
        </ClickSpark>
      ) : null,
    },
  ];

  return (
    <PageTransition>
      <DashboardLayout title="Payments" subtitle="Revenue and transaction management">
        {/* Stats */}
        {stats && (
          <StaggerList
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '14px',
              marginBottom: '24px',
            }}
          >
            <StatsCard title="Total Revenue"  value={formatCurrency(stats.totalRevenue)}  icon={TrendingUp}  gradient="linear-gradient(135deg,#ffb238,#ff8a1e)" />
            <StatsCard title="Net Revenue"    value={formatCurrency(stats.netRevenue)}    icon={CreditCard}  gradient="linear-gradient(135deg,#10b981,#059669)" />
            <StatsCard title="Total Refunded" value={formatCurrency(stats.totalRefunded)} icon={RefreshCw}   gradient="linear-gradient(135deg,#ef4444,#dc2626)" />
            <StatsCard title="Successful"     value={stats.successfulPayments}            icon={CheckCircle} gradient="linear-gradient(135deg,#4F46E5,#7C3AED)" />
          </StaggerList>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {STATUS_FILTERS.map((s) => {
            const active = statusFilter === s;
            return (
              <motion.button
                key={s || 'all'}
                onClick={() => { setStatus(s); setPage(1); }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  position: 'relative',
                  padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                  fontFamily: 'var(--mono)', cursor: 'pointer',
                  border: 'var(--glass-border)', background: 'var(--glass-bg)',
                  color: active ? 'var(--amber)' : 'var(--muted)',
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                  overflow: 'hidden',
                }}
              >
                {active && (
                  <motion.span
                    layoutId="paymentFilter"
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

        <DataTable columns={columns} data={payments} isLoading={isLoading} emptyText="No payments found" />
        {pagination && <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />}

        <ConfirmModal
          isOpen={!!refundModal}
          title="Issue Refund"
          message={`Refund ${formatCurrency(refundModal?.amount ?? 0)} to ${refundModal?.booking.customer.name}? This cannot be undone.`}
          confirmLabel="Issue Refund"
          confirmStyle="danger"
          isLoading={refundMutation.isPending}
          onConfirm={() => refundModal && refundMutation.mutate(refundModal.bookingId)}
          onCancel={() => setRefundModal(null)}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
