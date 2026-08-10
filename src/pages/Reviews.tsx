import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useVectr } from '@/context/VectrContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PageTransition } from '@/components/PageTransition';
import { reviewsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Review } from '@/types';
import { Trash2, Star, Search } from 'lucide-react';

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((s, i) => (
        <motion.span
          key={s}
          initial={{ opacity: 0, scale: 0.4, rotate: -90 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: i * 0.08, type: 'spring', stiffness: 320, damping: 18 }}
          style={{ display: 'inline-flex' }}
        >
          <Star
            size={12}
            style={{
              color: s <= rating ? 'var(--amber)' : 'var(--muted)',
              fill: s <= rating ? 'var(--amber)' : 'none',
              filter: s <= rating ? 'drop-shadow(0 0 4px rgba(37,99,235,0.4))' : 'none',
            }}
          />
        </motion.span>
      ))}
      <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '4px', fontFamily: 'var(--mono)' }}>{rating}/5</span>
    </div>
  );
}

const RATING_FILTERS = ['', '5', '4', '3', '2', '1'];

export default function Reviews() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);
  const [page, setPage]             = useState(1);
  const [ratingFilter, setRating]   = useState('');
  const [search, setSearch]         = useState('');
  const [deleteTarget, setDelete]   = useState<any | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', page, ratingFilter, search],
    queryFn: async () => {
      const res = await reviewsApi.getAll({ page, limit: 15, ...(ratingFilter && { rating: ratingFilter }), ...(search && { search }) });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reviewsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reviews'] }); setDelete(null); },
  });

  const reviews: any[] = data?.data?.items ?? [];
  const totalPages = data?.data?.total ? Math.ceil(data.data.total / 15) : 1;

  const columns = [
    {
      key: 'reviewer', header: 'Reviewer',
      render: (r: any) => <span style={{ fontWeight: 600, fontSize: '13px' }}>{r.from_user_name ?? '—'}</span>,
    },
    {
      key: 'provider', header: 'Provider Reviewed',
      render: (r: any) => <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{r.to_user_name ?? '—'}</span>,
    },
    {
      key: 'service', header: 'Service',
      render: (r: any) => <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{r.service_name ?? '—'}</span>,
    },
    { key: 'rating', header: 'Rating', render: (r: any) => <StarRating rating={r.rating} /> },
    {
      key: 'comment', header: 'Comment',
      render: (r: any) => r.comment
        ? <span style={{ fontSize: '12px', color: 'var(--muted)', maxWidth: '220px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.comment}</span>
        : <span style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic' }}>No comment</span>,
    },
    {
      key: 'date', header: 'Date',
      render: (r: any) => <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{formatDate(r.created_at)}</span>,
    },
    {
      key: 'actions', header: '',
      render: (r: any) => (
        <motion.button
          onClick={(e) => { e.stopPropagation(); setDelete(r); }}
          whileHover={{ scale: 1.1, color: '#ef4444', background: 'rgba(239,68,68,0.16)' }}
          whileTap={{ scale: 0.9 }}
          style={{ padding: '6px', borderRadius: '8px', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: 'none', cursor: 'pointer' }}
        >
          <Trash2 size={14} />
        </motion.button>
      ),
    },
  ];

  return (
    <PageTransition>
      <DashboardLayout title="Reviews" subtitle="Moderate platform reviews">
        {/* Rating filter + search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>Rating:</span>
          {RATING_FILTERS.map((r) => {
            const active = ratingFilter === r;
            return (
              <motion.button
                key={r || 'all'}
                onClick={() => { setRating(r); setPage(1); }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  position: 'relative',
                  padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                  fontFamily: 'var(--mono)', cursor: 'pointer',
                  border: 'var(--glass-border)', background: 'var(--glass-bg)',
                  color: active ? 'var(--amber)' : 'var(--muted)',
                  letterSpacing: '0.04em',
                  overflow: 'hidden',
                }}
              >
                {active && (
                  <motion.span
                    layoutId="reviewFilter"
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
                <span style={{ position: 'relative', zIndex: 1 }}>{r ? `${r} ⭐` : 'All'}</span>
              </motion.button>
            );
          })}
          </div>
          <div style={{ position: 'relative', width: '220px', flexShrink: 0 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reviewer, provider…"
              className="input-base"
              style={{ padding: '8px 12px 8px 30px', fontSize: '12px', width: '100%' }}
            />
          </div>
        </div>

        <DataTable columns={columns} data={reviews} isLoading={isLoading} emptyText="No reviews found" />
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}

        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Review"
          message={`Delete ${deleteTarget?.from_user_name ?? 'this'}'s review? The provider's rating will be recalculated.`}
          confirmLabel="Delete Review"
          confirmStyle="danger"
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.review_id)}
          onCancel={() => setDelete(null)}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
