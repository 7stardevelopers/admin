import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useVectr } from '@/context/VectrContext';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { PageTransition } from '@/components/PageTransition';
import { bookingsApi } from '@/lib/api';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import type { Booking, BookingStatus } from '@/types';

const STATUSES: Array<BookingStatus | ''> = ['', 'PENDING', 'ACCEPTED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'];

export default function Bookings() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);
  const [page, setPage]     = useState(1);
  const [status, setStatus] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', page, status],
    queryFn: async () => {
      const res = await bookingsApi.getAll({ page, limit: 15, ...(status && { status }) });
      return res.data;
    },
  });

  const bookings: Booking[] = data?.data ?? [];
  const pagination = data?.pagination;

  const columns = [
    {
      key: 'id', header: 'Booking ID',
      render: (r: Booking) => (
        <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--amber)' }}>
          #{r.id.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'service', header: 'Service',
      render: (r: Booking) => <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.service.name}</span>,
    },
    {
      key: 'customer', header: 'Customer',
      render: (r: Booking) => (
        <div>
          <p style={{ color: 'var(--ink)', fontSize: '13px' }}>{r.customer.name}</p>
          <p style={{ color: 'var(--muted)', fontSize: '11px', fontFamily: 'var(--mono)' }}>{r.customer.phone}</p>
        </div>
      ),
    },
    {
      key: 'provider', header: 'Provider',
      render: (r: Booking) => r.provider
        ? <span style={{ fontSize: '13px' }}>{r.provider.user.name}</span>
        : <span style={{ color: 'var(--muted)', fontSize: '12px', fontStyle: 'italic' }}>Unassigned</span>,
    },
    {
      key: 'amount', header: 'Amount',
      render: (r: Booking) => (
        <span style={{ fontWeight: 700, color: 'var(--amber)', fontFamily: 'var(--mono)' }}>
          {formatCurrency(r.totalAmount)}
        </span>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (r: Booking) => <Badge status={r.status} />,
    },
    {
      key: 'scheduledAt', header: 'Scheduled',
      render: (r: Booking) => (
        <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
          {formatDateTime(r.scheduledAt)}
        </span>
      ),
    },
  ];

  return (
    <PageTransition>
      <DashboardLayout title="Bookings" subtitle="All platform bookings">
        {/* Filter tabs — animated pills with shared active layout */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {STATUSES.map((s) => {
            const active = status === s;
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
                    layoutId="bookingFilter"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
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

        <DataTable columns={columns} data={bookings} isLoading={isLoading} emptyText="No bookings found" />
        {pagination && <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />}
      </DashboardLayout>
    </PageTransition>
  );
}
