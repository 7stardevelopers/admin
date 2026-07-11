import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useVectr } from '@/context/VectrContext';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { PageTransition } from '@/components/PageTransition';
import { FloatingLabel } from '@/components/effects/FloatingLabel';
import { providersApi } from '@/lib/api';
import { formatDate, getInitials } from '@/lib/utils';
import type { Provider } from '@/types';

export default function Users() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users-all', page, search],
    queryFn: async () => {
      const res = await providersApi.getAll({ page, limit: 20, ...(search && { search }) });
      return res.data;
    },
  });

  const users: Provider[] = data?.data ?? [];
  const pagination = data?.pagination;

  const columns = [
    {
      key: 'user', header: 'User',
      render: (r: Provider) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.div
            whileHover={{ scale: 1.12, rotate: 4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg,#2563EB,#14B8A6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, color: '#ffffff', flexShrink: 0,
              boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
            }}
          >
            {getInitials(r.user?.name ?? 'U')}
          </motion.div>
          <div>
            <p style={{ fontWeight: 600, fontSize: '13px' }}>{r.user?.name}</p>
            <p style={{ fontSize: '11px', color: 'var(--muted)' }}>{r.user?.email ?? '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone', header: 'Phone',
      render: (r: Provider) => (
        <span style={{ fontFamily: 'var(--mono)', fontSize: '13px' }}>{r.user?.phone}</span>
      ),
    },
    {
      key: 'role', header: 'Role',
      render: () => (
        <span style={{
          padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
          fontFamily: 'var(--mono)', letterSpacing: '0.04em',
          background: 'rgba(79,70,229,0.12)', color: '#818cf8',
          border: '1px solid rgba(79,70,229,0.2)',
        }}>
          PROVIDER
        </span>
      ),
    },
    {
      key: 'rating', header: 'Rating',
      render: (r: Provider) => (
        <span style={{ color: 'var(--amber)', fontFamily: 'var(--mono)', fontSize: '13px' }}>
          ⭐ {r.rating.toFixed(1)}
        </span>
      ),
    },
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
  ];

  return (
    <PageTransition>
      <DashboardLayout title="Users" subtitle="Platform users and customers">
        <div style={{ maxWidth: '360px', marginBottom: '20px' }}>
          <FloatingLabel
            label="Search by name or phone"
            value={search}
            onChange={(e: any) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <DataTable columns={columns} data={users} isLoading={isLoading} emptyText="No users found" />
        {pagination && <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />}
      </DashboardLayout>
    </PageTransition>
  );
}
