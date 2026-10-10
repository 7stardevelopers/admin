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
import { formatDateTime, formatPaise, fromPaise, toPaise } from '@/lib/utils';
import { TrendingUp, CreditCard, RefreshCw, CheckCircle, RotateCcw, Search } from 'lucide-react';

const STATUS_FILTERS = ['', 'PAID', 'PENDING', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'REFUND_FAILED'];

// Refunds are only possible on captured payments that still have a refundable
// balance (booking and subscription payments alike — keyed by payment_id).
const REFUNDABLE_STATUSES = ['PAID', 'PARTIALLY_REFUNDED', 'REFUND_FAILED'];
const isRefundable = (r: any) => REFUNDABLE_STATUSES.includes(r.status) && !!r.payment_id;
/** Remaining refundable balance in paise. */
const refundableRemaining = (r: any) =>
  Math.max(0, Number(r?.amount ?? 0) - Number(r?.refund_amount ?? 0));

export default function Payments() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);
  const [page, setPage]             = useState(1);
  const [statusFilter, setStatus]   = useState('');
  const [search, setSearch]         = useState('');
  const [refundModal, setRefundModal] = useState<any | null>(null);
  const [refundRupees, setRefundRupees] = useState(''); // optional partial amount, in RUPEES
  const [refundError, setRefundError]   = useState<string | null>(null);
  const [deductWorker, setDeductWorker] = useState(false); // worker bears the refund (completed jobs only)
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, statusFilter],
    queryFn: async () => {
      const res = await paymentsApi.getAll({ page, limit: 15, ...(statusFilter && { status: statusFilter }) });
      return res.data;
    },
  });

  const refundMutation = useMutation({
    // amountPaise undefined => backend refunds everything still refundable.
    mutationFn: ({ paymentId, amountPaise, deduct }: { paymentId: string; amountPaise?: number; deduct: boolean }) =>
      paymentsApi.refund(paymentId, amountPaise, deduct),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payments'] }); closeRefund(); },
    onError: (e: any) => setRefundError(e.response?.data?.message ?? 'Refund failed'),
  });

  const openRefund = (r: any) => { setRefundModal(r); setRefundRupees(''); setRefundError(null); setDeductWorker(false); };
  const closeRefund = () => { setRefundModal(null); setRefundRupees(''); setRefundError(null); setDeductWorker(false); };
  const submitRefund = () => {
    if (!refundModal) return;
    const remaining = refundableRemaining(refundModal);
    let amountPaise: number | undefined;
    if (refundRupees.trim() !== '') {
      amountPaise = toPaise(refundRupees);
      if (!(amountPaise > 0)) { setRefundError('Enter a positive amount, or leave blank for a full refund'); return; }
      if (amountPaise > remaining) { setRefundError(`Amount exceeds refundable balance of ${formatPaise(remaining)}`); return; }
      if (amountPaise === remaining) amountPaise = undefined; // same as full refund
    }
    setRefundError(null);
    refundMutation.mutate({
      paymentId: refundModal.payment_id, amountPaise,
      deduct: deductWorker && refundModal.booking_status === 'COMPLETED',
    });
  };

  const allPayments: any[] = data?.data?.items ?? [];
  const payments = search
    ? allPayments.filter((r) => {
        const q = search.toLowerCase();
        return (r.payment_id ?? '').toLowerCase().includes(q)
          || (r.service_name ?? '').toLowerCase().includes(q)
          || (r.customer_name ?? '').toLowerCase().includes(q)
          || (r.customer_phone ?? '').includes(q);
      })
    : allPayments;
  const totalPages = data?.data?.total ? Math.ceil(data.data.total / 15) : 1;
  const rawStats = data?.data?.stats;
  // Backend stats are paise; formatted with formatPaise below.
  const stats = rawStats ? {
    totalRevenue:       Number(rawStats.total_revenue ?? 0),
    netRevenue:         Number(rawStats.total_revenue ?? 0) - Number(rawStats.total_refunded ?? 0),
    totalRefunded:      Number(rawStats.total_refunded ?? 0),
    successfulPayments: rawStats.paid_count,
  } : null;

  const columns = [
    {
      key: 'id', header: 'Payment ID',
      render: (r: any) => (
        <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--amber)' }}>
          #{(r.payment_id ?? '').slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'booking', header: 'Service',
      render: (r: any) => (
        <div>
          <p style={{ fontWeight: 600, fontSize: '13px' }}>
            {r.purpose === 'SUBSCRIPTION' || (!r.booking_id && !r.service_name)
              ? 'Subscription'
              : (r.service_name ?? '—')}
            {r.booking_id ? (
              <span style={{ marginLeft: 6, fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                #{String(r.booking_id).slice(-6).toUpperCase()}
              </span>
            ) : null}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
            {r.customer_name ?? '—'}{r.customer_phone ? ` · ${r.customer_phone}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'amount', header: 'Amount',
      render: (r: any) => (
        <div>
          <p style={{ fontWeight: 700, color: 'var(--amber)', fontFamily: 'var(--mono)' }}>{formatPaise(r.amount)}</p>
          {r.refund_amount ? (
            <p style={{ fontSize: '11px', color: '#f87171', fontFamily: 'var(--mono)' }}>−{formatPaise(r.refund_amount)} refunded</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'method', header: 'Method',
      render: (r: any) => (
        <span style={{ fontSize: '12px', fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--muted)' }}>{r.payment_method ?? '—'}</span>
      ),
    },
    { key: 'status', header: 'Status', render: (r: any) => <Badge status={r.status} /> },
    {
      key: 'paidAt', header: 'Paid At',
      render: (r: any) => (r.paid_at ?? r.created_at)
        ? <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{formatDateTime(r.paid_at ?? r.created_at)}</span>
        : <span style={{ color: 'var(--muted)', fontSize: '12px' }}>—</span>,
    },
    {
      key: 'actions', header: '',
      render: (r: any) => isRefundable(r) ? (
        <ClickSpark color="#f87171">
          <motion.button
            onClick={(e) => { e.stopPropagation(); openRefund(r); }}
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
            <StatsCard title="Total Revenue"  value={formatPaise(stats.totalRevenue)}  icon={TrendingUp}  gradient="linear-gradient(135deg,#2563EB,#14B8A6)" />
            <StatsCard title="Net Revenue"    value={formatPaise(stats.netRevenue)}    icon={CreditCard}  gradient="linear-gradient(135deg,#10b981,#059669)" />
            <StatsCard title="Total Refunded" value={formatPaise(stats.totalRefunded)} icon={RefreshCw}   gradient="linear-gradient(135deg,#ef4444,#dc2626)" />
            <StatsCard title="Successful"     value={stats.successfulPayments}            icon={CheckCircle} gradient="linear-gradient(135deg,#4F46E5,#7C3AED)" />
          </StaggerList>
        )}

        {/* Filter tabs + search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
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
                      background: 'rgba(37,99,235,0.15)',
                      border: '1px solid var(--amber)',
                      borderRadius: '20px',
                      zIndex: 0,
                    }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{s ? s.replace(/_/g, ' ') : 'All'}</span>
              </motion.button>
            );
          })}
          </div>
          <div style={{ position: 'relative', width: '220px', flexShrink: 0 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, service…"
              className="input-base"
              style={{ padding: '8px 12px 8px 30px', fontSize: '12px', width: '100%' }}
            />
          </div>
        </div>

        <DataTable columns={columns} data={payments} isLoading={isLoading} emptyText="No payments found" />
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}

        <ConfirmModal
          isOpen={!!refundModal}
          title="Issue Refund"
          message={`Refund up to ${formatPaise(refundableRemaining(refundModal))} to ${refundModal?.customer_name ?? 'customer'}? This cannot be undone.`}
          confirmLabel={refundRupees.trim() ? 'Issue Partial Refund' : 'Issue Full Refund'}
          confirmStyle="danger"
          isLoading={refundMutation.isPending}
          onConfirm={submitRefund}
          onCancel={closeRefund}
        >
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>
              Partial amount (₹) — leave blank for full refund
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={refundRupees}
              onChange={(e) => { setRefundRupees(e.target.value); setRefundError(null); }}
              placeholder={fromPaise(refundableRemaining(refundModal)).toFixed(2)}
              className="input-base"
              style={{ padding: '8px 12px', fontSize: '13px', width: '100%' }}
            />
            {refundModal?.booking_status === 'COMPLETED' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={deductWorker} onChange={(e) => setDeductWorker(e.target.checked)} />
                Also deduct this amount from the worker's wallet
              </label>
            )}
            {refundError && (
              <p style={{ marginTop: '8px', fontSize: '12px', color: '#f87171' }}>{refundError}</p>
            )}
          </div>
        </ConfirmModal>
      </DashboardLayout>
    </PageTransition>
  );
}
