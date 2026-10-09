import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVectr } from '@/context/VectrContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PageTransition } from '@/components/PageTransition';
import { FloatingLabel } from '@/components/effects/FloatingLabel';
import { couponsApi } from '@/lib/api';
import { formatDate, formatPaise, toPaise } from '@/lib/utils';
import type { Coupon } from '@/types';
import { Plus, X, Tag } from 'lucide-react';

// Money fields (FLAT value, minOrderAmount, maxDiscount) are entered in RUPEES
// and sent as PAISE. PERCENT/GPAY value is a percentage and is sent as-is.
type CouponForm = {
  code: string;
  title: string;
  type: 'FLAT' | 'PERCENT' | 'GPAY';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  maxUses?: number;
  expiresAt: string;
};

function CreateCouponModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<CouponForm>({ defaultValues: { type: 'FLAT' } });
  const [serverError, setServerError] = useState('');
  const type = watch('type');

  const mutation = useMutation({
    mutationFn: (d: CouponForm) => couponsApi.create({
      code: d.code.trim().toUpperCase(),
      title: d.title,
      type: d.type,
      value: d.type === 'FLAT' ? toPaise(d.value) : Number(d.value), // FLAT: rupees → paise; %: as-is
      min_order_amount: d.minOrderAmount ? toPaise(d.minOrderAmount) : 0,
      max_discount: d.maxDiscount ? toPaise(d.maxDiscount) : undefined,
      max_uses: d.maxUses ? Number(d.maxUses) : 1000,
      expires_at: new Date(d.expiresAt).toISOString(),
    }),
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: any) => setServerError(e.response?.data?.message ?? 'Failed to create coupon'),
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="glass-card"
        style={{
          padding: '28px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto',
          background: 'rgba(255,255,255,0.95)',
          boxShadow: '0 24px 64px rgba(15,23,42,0.20), inset 0 1px 0 rgba(255,255,255,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--mono)' }}>Create Coupon</h2>
          <motion.button
            whileHover={{ rotate: 90, color: 'var(--amber)' }}
            whileTap={{ scale: 0.85 }}
            onClick={onClose}
            style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={18} />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FloatingLabel
                label="Code *"
                error={errors.code?.message}
                {...register('code', { required: 'Required', minLength: { value: 3, message: 'Min 3 chars' } })}
                style={{ textTransform: 'uppercase' }}
              />
              <FloatingLabel
                as="select"
                label="Type *"
                {...register('type', { required: true })}
              >
                <option value="FLAT">Flat (₹)</option>
                <option value="PERCENT">Percent (%)</option>
                <option value="GPAY">GPay (%)</option>
              </FloatingLabel>
            </div>
            <FloatingLabel label="Title *" error={errors.title?.message} {...register('title', { required: 'Required' })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FloatingLabel
                type="number"
                label={type === 'FLAT' ? 'Value (₹) *' : 'Value (%) *'}
                error={errors.value?.message}
                step={type === 'FLAT' ? '0.01' : '1'}
                {...register('value', { required: 'Required', min: 1, ...(type !== 'FLAT' && { max: 100 }) })}
              />
              <FloatingLabel type="number" step="0.01" label="Min Order Amount (₹)" {...register('minOrderAmount')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FloatingLabel type="number" step="0.01" label="Max Discount (₹)" hint={type === 'FLAT' ? 'Not used for Flat' : undefined} {...register('maxDiscount')} />
              <FloatingLabel type="number" label="Max Uses" hint="Default 1000" {...register('maxUses')} />
            </div>
            <FloatingLabel
              type="datetime-local"
              label="Expires At *"
              error={errors.expiresAt?.message}
              {...register('expiresAt', { required: 'Required' })}
            />
          </div>
          {serverError && <p style={{ color: '#f87171', fontSize: '13px', marginTop: '10px' }}>{serverError}</p>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <Button type="button" variant="glass" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
              Cancel
            </Button>
            <Button type="submit" variant="amber" loading={mutation.isPending} style={{ flex: 1, justifyContent: 'center' }}>
              {mutation.isPending ? 'Creating…' : 'Create Coupon'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Coupons() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);
  const [showCreate, setShowCreate]     = useState(false);
  const [togglingId, setTogglingId]     = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const res = await couponsApi.getAll();
      const rows = res.data?.data ?? res.data ?? [];
      return (Array.isArray(rows) ? rows : []).map((r: any): Coupon => ({
        id: r.coupon_id,
        code: r.code,
        title: r.title,
        type: r.type,
        value: r.value,
        minOrderAmount: r.min_order_amount,
        maxDiscount: r.max_discount,
        maxUses: r.max_uses,
        usedCount: r.used_count,
        expiresAt: r.expires_at,
        isActive: r.is_active,
        color: r.color,
        createdAt: r.created_at,
      }));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      couponsApi.update(id, { is_active: isActive }),
    onSettled: () => {
      setTogglingId(null);
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponsApi.remove(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coupons'] }); setDeleteTarget(null); },
  });

  const coupons: Coupon[] = Array.isArray(data) ? data : [];
  const now = Date.now();

  const columns = [
    {
      key: 'code', header: 'Code',
      render: (c: Coupon) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tag size={13} style={{ color: 'var(--amber)' }} />
          <span style={{ fontWeight: 700, fontFamily: 'var(--mono)', fontSize: '13px' }}>{c.code}</span>
        </div>
      ),
    },
    { key: 'title', header: 'Title', render: (c: Coupon) => <span style={{ fontSize: '13px' }}>{c.title}</span> },
    {
      key: 'value', header: 'Value',
      render: (c: Coupon) => (
        <span style={{ fontSize: '13px', fontFamily: 'var(--mono)' }}>
          {c.type === 'FLAT' ? formatPaise(c.value) : `${c.value}%`}
          {c.maxDiscount ? <span style={{ color: 'var(--muted)' }}> (cap {formatPaise(c.maxDiscount)})</span> : null}
        </span>
      ),
    },
    {
      key: 'minOrder', header: 'Min Order',
      render: (c: Coupon) => <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{c.minOrderAmount ? formatPaise(c.minOrderAmount) : '—'}</span>,
    },
    {
      key: 'used', header: 'Used',
      render: (c: Coupon) => <span style={{ fontSize: '12px', fontFamily: 'var(--mono)' }}>{c.usedCount}/{c.maxUses}</span>,
    },
    {
      key: 'expires', header: 'Expires',
      render: (c: Coupon) => {
        const expired = new Date(c.expiresAt).getTime() < now;
        return (
          <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: expired ? '#f87171' : 'var(--muted)' }}>
            {formatDate(c.expiresAt)}{expired ? ' (expired)' : ''}
          </span>
        );
      },
    },
    {
      key: 'status', header: 'Status',
      render: (c: Coupon) => (
        <motion.span
          animate={{
            color: c.isActive ? '#34d399' : '#f87171',
            background: c.isActive ? 'rgba(52,211,153,0.10)' : 'rgba(248,113,113,0.10)',
            borderColor: c.isActive ? 'rgba(52,211,153,0.28)' : 'rgba(248,113,113,0.28)',
          }}
          style={{
            padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 700,
            fontFamily: 'var(--mono)', letterSpacing: '0.06em', border: '1px solid transparent',
          }}
        >
          {c.isActive ? 'ACTIVE' : 'INACTIVE'}
        </motion.span>
      ),
    },
    {
      key: 'actions', header: '',
      render: (c: Coupon) => (
        <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
          <Button
            variant={c.isActive ? 'danger' : 'amber'}
            size="sm"
            loading={togglingId === c.id && toggleMutation.isPending}
            onClick={() => { setTogglingId(c.id); toggleMutation.mutate({ id: c.id, isActive: !c.isActive }); }}
          >
            {c.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button variant="glass" size="sm" onClick={() => setDeleteTarget(c)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageTransition>
      <DashboardLayout title="Coupons" subtitle="Create and manage promotional codes">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <Button variant="amber" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> New Coupon
          </Button>
        </div>

        <DataTable columns={columns} data={coupons} isLoading={isLoading} emptyText="No coupons yet" />

        <AnimatePresence>
          {showCreate && (
            <CreateCouponModal
              onClose={() => setShowCreate(false)}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ['coupons'] })}
            />
          )}
        </AnimatePresence>

        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Coupon"
          message={`Permanently deactivate "${deleteTarget?.code}"? Customers will no longer be able to apply it.`}
          confirmLabel="Delete Coupon"
          confirmStyle="danger"
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
