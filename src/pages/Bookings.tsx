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
import { Search } from 'lucide-react';

const STATUSES: Array<BookingStatus | ''> = ['', 'PENDING', 'ACCEPTED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'];

export default function Bookings() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);
  const [page, setPage]     = useState(1);
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', page, status, search],
    queryFn: async () => {
      const res = await bookingsApi.getAll({ page, limit: 15, ...(status && { status }), ...(search && { search }) });
      return res.data;
    },
  });

  const bookings: any[] = data?.data?.items ?? [];
  const totalPages = data?.data?.total ? Math.ceil(data.data.total / 15) : 1;

  const columns = [
    {
      key: 'id', header: 'Booking ID',
      render: (r: any) => (
        <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--amber)' }}>
          #{(r.booking_id ?? '').slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'service', header: 'Service',
      render: (r: any) => <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.service_name ?? '—'}</span>,
    },
    {
      key: 'customer', header: 'Customer',
      render: (r: any) => (
        <div>
          <p style={{ color: 'var(--ink)', fontSize: '13px' }}>{r.customer_name ?? '—'}</p>
          <p style={{ color: 'var(--muted)', fontSize: '11px', fontFamily: 'var(--mono)' }}>{r.customer_phone ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'provider', header: 'Provider',
      render: (r: any) => r.provider_name
        ? <span style={{ fontSize: '13px' }}>{r.provider_name}</span>
        : <span style={{ color: 'var(--muted)', fontSize: '12px', fontStyle: 'italic' }}>Unassigned</span>,
    },
    {
      key: 'amount', header: 'Amount',
      render: (r: any) => (
        <span style={{ fontWeight: 700, color: 'var(--amber)', fontFamily: 'var(--mono)' }}>
          {formatCurrency(r.total_amount)}
        </span>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (r: any) => <Badge status={r.status} />,
    },
    {
      key: 'scheduledAt', header: 'Scheduled',
      render: (r: any) => (
        <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
          {formatDateTime(r.scheduled_at)}
        </span>
      ),
    },
  ];

  return (
    <PageTransition>
      <DashboardLayout title="Bookings" subtitle="All platform bookings">
        {/* Filter tabs + search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
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
          <div style={{ position: 'relative', width: '220px', flexShrink: 0 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search service, customer…"
              className="input-base"
              style={{ padding: '8px 12px 8px 30px', fontSize: '12px', width: '100%' }}
            />
          </div>
        </div>

        <DataTable columns={columns} data={bookings} isLoading={isLoading} emptyText="No bookings found" />
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </DashboardLayout>
    </PageTransition>
  );
}
