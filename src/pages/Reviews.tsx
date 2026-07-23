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
import { Trash2, Star } from 'lucide-react';

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
  const [deleteTarget, setDelete]   = useState<Review | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', page, ratingFilter],
    queryFn: async () => {
      const res = await reviewsApi.getAll({ page, limit: 15, ...(ratingFilter && { rating: ratingFilter }) });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reviewsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reviews'] }); setDelete(null); },
  });

  const reviews: Review[] = data?.data ?? [];
  const pagination = data?.pagination;

  const columns = [
    {
      key: 'reviewer', header: 'Reviewer',
      render: (r: Review) => <span style={{ fontWeight: 600, fontSize: '13px' }}>{r.fromUser.name}</span>,
    },
    {
      key: 'provider', header: 'Provider Reviewed',
      render: (r: Review) => <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{r.toUser.name}</span>,
    },
    {
      key: 'service', header: 'Service',
      render: (r: Review) => <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{r.booking.service.name}</span>,
    },
    { key: 'rating', header: 'Rating', render: (r: Review) => <StarRating rating={r.rating} /> },
    {
      key: 'comment', header: 'Comment',
      render: (r: Review) => r.comment
        ? <span style={{ fontSize: '12px', color: 'var(--muted)', maxWidth: '220px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.comment}</span>
        : <span style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic' }}>No comment</span>,
    },
    {
      key: 'date', header: 'Date',
      render: (r: Review) => <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{formatDate(r.createdAt)}</span>,
    },
    {
      key: 'actions', header: '',
      render: (r: Review) => (
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
        {/* Rating filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
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

        <DataTable columns={columns} data={reviews} isLoading={isLoading} emptyText="No reviews found" />
        {pagination && <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />}

        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Review"
          message={`Delete ${deleteTarget?.fromUser.name}'s review? The provider's rating will be recalculated.`}
          confirmLabel="Delete Review"
          confirmStyle="danger"
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDelete(null)}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
