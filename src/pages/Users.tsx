import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useVectr } from '@/context/VectrContext';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { PageTransition } from '@/components/PageTransition';
import { FloatingLabel } from '@/components/effects/FloatingLabel';
import { usersApi } from '@/lib/api';
import { formatDate, getInitials } from '@/lib/utils';

export default function Users() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users-all', page, search],
    queryFn: async () => {
      const res = await usersApi.getAll({ page, per_page: 20, ...(search && { search }) });
      return res.data;
    },
  });

  const users: any[] = Array.isArray(data?.data?.items) ? data.data.items : (Array.isArray(data?.data) ? data.data : []);
  const total = data?.data?.total ?? 0;
  const totalPages = total ? Math.ceil(total / 20) : 1;

  const columns = [
    {
      key: 'user', header: 'User',
      render: (r: any) => (
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
            {getInitials(r.name ?? r.user_id ?? 'U')}
          </motion.div>
          <div>
            <p style={{ fontWeight: 600, fontSize: '13px' }}>{r.name ?? r.user_id}</p>
            <p style={{ fontSize: '11px', color: 'var(--muted)' }}>{r.email ?? '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone', header: 'Phone',
      render: (r: any) => (
        <span style={{ fontFamily: 'var(--mono)', fontSize: '13px' }}>{r.phone ?? '—'}</span>
      ),
    },
    {
      key: 'role', header: 'Role',
      render: (r: any) => (
        <span style={{
          padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
          fontFamily: 'var(--mono)', letterSpacing: '0.04em',
          background: 'rgba(79,70,229,0.12)', color: '#818cf8',
          border: '1px solid rgba(79,70,229,0.2)',
        }}>
          {r.role ?? 'CUSTOMER'}
        </span>
      ),
    },
    {
      key: 'joined', header: 'Joined',
      render: (r: any) => (
        <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{formatDate(r.created_at)}</span>
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
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </DashboardLayout>
    </PageTransition>
  );
}
