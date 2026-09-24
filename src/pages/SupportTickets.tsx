import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useVectr } from '@/context/VectrContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { PageTransition } from '@/components/PageTransition';
import { supportApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { LifeBuoy } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  OPEN:        '#60a5fa',
  IN_PROGRESS: '#fbbf24',
  RESOLVED:    '#34d399',
  CLOSED:      '#9ca3af',
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW:    '#9ca3af',
  MEDIUM: '#60a5fa',
  HIGH:   '#f87171',
};

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 700,
      fontFamily: 'var(--mono)', letterSpacing: '0.06em',
      background: `${color}18`, color, border: `1px solid ${color}40`,
    }}>
      {label}
    </span>
  );
}

const STATUS_FILTERS = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function SupportTickets() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['support-tickets', statusFilter],
    queryFn: async () => {
      const res = await supportApi.getAll(statusFilter ? { status: statusFilter } : undefined);
      const rows = res.data?.data ?? res.data ?? [];
      return Array.isArray(rows) ? rows : [];
    },
  });

  const tickets: any[] = data ?? [];

  const columns = [
    {
      key: 'subject', header: 'Subject',
      render: (t: any) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '13px' }}>{t.subject}</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{t.category ?? 'OTHER'}</div>
        </div>
      ),
    },
    {
      key: 'user', header: 'From',
      render: (t: any) => (
        <div>
          <div style={{ fontSize: '13px' }}>{t.user_name ?? '—'}</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{t.user_phone ?? ''}</div>
        </div>
      ),
    },
    {
      key: 'priority', header: 'Priority',
      render: (t: any) => <Pill label={t.priority ?? 'MEDIUM'} color={PRIORITY_COLORS[t.priority] ?? '#9ca3af'} />,
    },
    {
      key: 'status', header: 'Status',
      render: (t: any) => <Pill label={t.status} color={STATUS_COLORS[t.status] ?? '#9ca3af'} />,
    },
    {
      key: 'created', header: 'Created',
      render: (t: any) => <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{formatDateTime(t.created_at)}</span>,
    },
  ];

  return (
    <PageTransition>
      <DashboardLayout title="Support Tickets" subtitle="Customer and provider support inbox">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <LifeBuoy size={15} style={{ color: 'var(--amber)' }} />
          {STATUS_FILTERS.map((s) => {
            const active = statusFilter === s;
            return (
              <motion.button
                key={s || 'all'}
                onClick={() => setStatusFilter(s)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                  fontFamily: 'var(--mono)', cursor: 'pointer',
                  border: active ? '1px solid var(--amber)' : 'var(--glass-border)',
                  background: active ? 'rgba(37,99,235,0.15)' : 'var(--glass-bg)',
                  color: active ? 'var(--amber)' : 'var(--muted)',
                }}
              >
                {s || 'All'}
              </motion.button>
            );
          })}
        </div>

        <DataTable
          columns={columns}
          data={tickets}
          isLoading={isLoading}
          emptyText="No support tickets"
          onRowClick={(t: any) => navigate(`/support/${t.ticket_id}`)}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
