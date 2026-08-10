import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVectr } from '@/context/VectrContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { PageTransition } from '@/components/PageTransition';
import { GlowCard } from '@/components/effects/GlowCard';
import { AnimatedCounter } from '@/components/effects/AnimatedCounter';
import { FloatingLabel } from '@/components/effects/FloatingLabel';
import { StaggerList } from '@/components/effects/StaggerList';
import { subscriptionsApi } from '@/lib/api';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { SubscriptionPlan } from '@/types';
import { Plus, Crown, X, Check, Trash2 } from 'lucide-react';

type PlanForm = { name: string; price: number; bookingsIncluded: number; discountPct: number; description?: string };

function CreatePlanModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<PlanForm>();
  const [serverError, setServerError] = useState('');

  const mutation = useMutation({
    mutationFn: (d: PlanForm) => subscriptionsApi.createPlan({
      name: d.name,
      price: Number(d.price),
      bookings_included: Number(d.bookingsIncluded),
      discount_pct: Number(d.discountPct),
      features: d.description ? { description: d.description } : undefined,
    }),

    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: any) => setServerError(e.response?.data?.message ?? 'Failed to create plan'),
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
          padding: '28px', width: '100%', maxWidth: '460px',
          background: 'rgba(255,255,255,0.95)',
          boxShadow: '0 24px 64px rgba(15,23,42,0.20), inset 0 1px 0 rgba(255,255,255,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--mono)' }}>Create Subscription Plan</h2>
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
            <FloatingLabel label="Plan Name *" error={errors.name?.message} {...register('name', { required: 'Required' })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FloatingLabel type="number" label="Price / Month (₹) *" {...register('price', { required: true, min: 1 })} />
              <FloatingLabel type="number" label="Bookings Included *" {...register('bookingsIncluded', { required: true, min: 1 })} />
            </div>
            <FloatingLabel type="number" label="Discount % *" {...register('discountPct', { required: true, min: 0, max: 100 })} />
            <FloatingLabel as="textarea" rows={2} label="Description" {...register('description')} />
          </div>
          {serverError && <p style={{ color: '#f87171', fontSize: '13px', marginTop: '10px' }}>{serverError}</p>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <Button type="button" variant="glass" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
              Cancel
            </Button>
            <Button type="submit" variant="amber" loading={mutation.isPending} style={{ flex: 1, justifyContent: 'center' }}>
              {mutation.isPending ? 'Creating…' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function PlanCard({ plan, onToggle, isToggling, onDelete }: {
  plan: SubscriptionPlan;
  onToggle: () => void;
  isToggling: boolean;
  onDelete: () => void;
}) {
  const features = [
    `${plan.bookingsIncluded} bookings included per month`,
    `${plan.discountPct}% discount on every booking`,
    `${plan.subscriberCount ?? 0} active subscribers`,
    plan.description ?? 'Premium pass benefits',
  ];

  return (
    <GlowCard
      className="glass-card"
      style={{
        padding: '24px',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 320,
      }}
    >
      {/* Top: icon + name + status pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <motion.div
            whileHover={{ rotate: 8, scale: 1.08 }}
            style={{
              width: 38, height: 38, borderRadius: '10px',
              background: 'linear-gradient(135deg,#2563EB,#14B8A6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
            }}
          >
            <Crown size={18} color="#ffffff" />
          </motion.div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--mono)' }}>{plan.name}</h3>
            <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>STAR PASS</p>
          </div>
        </div>
        <motion.span
          animate={{
            color: plan.isActive ? '#34d399' : '#f87171',
            background: plan.isActive ? 'rgba(52,211,153,0.10)' : 'rgba(248,113,113,0.10)',
            borderColor: plan.isActive ? 'rgba(52,211,153,0.28)' : 'rgba(248,113,113,0.28)',
          }}
          transition={{ duration: 0.3 }}
          style={{
            padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 700,
            fontFamily: 'var(--mono)', letterSpacing: '0.08em',
            border: '1px solid transparent',
          }}
        >
          {plan.isActive ? 'ACTIVE' : 'INACTIVE'}
        </motion.span>
      </div>

      {/* Price */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '14px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>₹</span>
        <span style={{ fontSize: '38px', fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--amber)', lineHeight: 1 }}>
          <AnimatedCounter value={plan.price} />
        </span>
        <span style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: '4px' }}>/ month</span>
      </div>

      {/* Feature list */}
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {features.map((f, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--muted)' }}
          >
            <Check size={13} style={{ color: 'var(--amber)', flexShrink: 0 }} />
            <span>{f}</span>
          </motion.li>
        ))}
      </ul>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button
          variant={plan.isActive ? 'danger' : 'amber'}
          loading={isToggling}
          onClick={onToggle}
          style={{ justifyContent: 'center', flex: 1 }}
        >
          {plan.isActive ? 'Deactivate' : 'Activate'}
        </Button>
        <motion.button
          onClick={onDelete}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
            color: '#f87171', background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <Trash2 size={14} />
        </motion.button>
      </div>
    </GlowCard>
  );
}

export default function Subscriptions() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);
  const [showCreate, setShowCreate]   = useState(false);
  const [togglingId, setTogglingId]   = useState<string | null>(null);
  const [deletePlan, setDeletePlan]   = useState<SubscriptionPlan | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const res = await subscriptionsApi.getPlans();
      const payload = res.data.data ?? res.data;
      const rows = payload?.items ?? payload;
      return (Array.isArray(rows) ? rows : []).map((r: any): SubscriptionPlan => ({
        id: r.plan_id ?? r.id,
        name: r.name,
        price: r.price,
        bookingsIncluded: r.bookings_included ?? r.bookingsIncluded,
        discountPct: r.discount_pct ?? r.discountPct,
        description: r.features?.description ?? r.description,
        isActive: r.is_active ?? r.isActive,
        subscriberCount: r.subscriberCount,
        createdAt: r.created_at ?? r.createdAt,
      }));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      subscriptionsApi.updatePlan(id, { is_active: isActive }),
    onSettled: () => {
      setTogglingId(null);
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subscriptionsApi.deletePlan(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subscription-plans'] }); setDeletePlan(null); },
  });

  const plans: SubscriptionPlan[] = Array.isArray(data) ? data : [];

  return (
    <PageTransition>
      <DashboardLayout title="Subscriptions" subtitle="Manage subscription plans for providers">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <Button variant="amber" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Create Plan
          </Button>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner" />
          </div>
        ) : plans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="glass-card"
            style={{ padding: '60px', textAlign: 'center' }}
          >
            <Crown size={48} style={{ color: 'var(--amber)', margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No subscription plans yet</p>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
              Create the first Star Monthly Pass plan to get started.
            </p>
            <Button variant="amber" onClick={() => setShowCreate(true)}>
              Create First Plan
            </Button>
          </motion.div>
        ) : (
          <StaggerList
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isToggling={togglingId === plan.id && toggleMutation.isPending}
                onToggle={() => {
                  setTogglingId(plan.id);
                  toggleMutation.mutate({ id: plan.id, isActive: !plan.isActive });
                }}
                onDelete={() => setDeletePlan(plan)}
              />
            ))}
          </StaggerList>
        )}

        <AnimatePresence>
          {showCreate && (
            <CreatePlanModal
              onClose={() => setShowCreate(false)}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })}
            />
          )}
        </AnimatePresence>

        <ConfirmModal
          isOpen={!!deletePlan}
          title="Delete Plan"
          message={`Permanently delete "${deletePlan?.name}"? Existing subscribers will not be affected.`}
          confirmLabel="Delete Plan"
          confirmStyle="danger"
          isLoading={deleteMutation.isPending}
          onConfirm={() => deletePlan && deleteMutation.mutate(deletePlan.id)}
          onCancel={() => setDeletePlan(null)}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
