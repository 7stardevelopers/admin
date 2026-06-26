import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVectr } from '@/context/VectrContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { PageTransition } from '@/components/PageTransition';
import { GlowCard } from '@/components/effects/GlowCard';
import { FloatingLabel } from '@/components/effects/FloatingLabel';
import { StaggerList } from '@/components/effects/StaggerList';
import { announcementsApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import type { Announcement } from '@/types';
import { Megaphone, Send, CheckCircle, Users, User, UserCheck } from 'lucide-react';

type AnnouncementForm = { title: string; body: string; targetRole: string };

const targetColors: Record<string, string> = {
  ALL: '#818cf8', CUSTOMER: '#34d399', PROVIDER: '#ffb238',
};

export default function Announcements() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);
  const [successMsg, setSuccessMsg] = useState('');
  const [serverError, setServerError] = useState('');
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AnnouncementForm>({
    defaultValues: { targetRole: 'ALL' },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await announcementsApi.getAll({ limit: 50 });
      return res.data.data ?? res.data ?? [];
    },
  });

  const sendMutation = useMutation({
    mutationFn: (d: AnnouncementForm) => announcementsApi.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      reset({ targetRole: 'ALL' });
      setServerError('');
      setSuccessMsg('Announcement sent successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (e: any) => setServerError(e.response?.data?.message ?? 'Failed to send announcement'),
  });

  const announcements: Announcement[] = Array.isArray(data) ? data : [];

  const targetIcon = (role: string) => {
    switch (role) {
      case 'CUSTOMER': return <User size={11} />;
      case 'PROVIDER': return <UserCheck size={11} />;
      default: return <Users size={11} />;
    }
  };

  return (
    <PageTransition>
      <DashboardLayout title="Announcements" subtitle="Send notifications to users and providers">
        {/* Send form — GlowCard wrapper */}
        <GlowCard
          className="glass-card"
          style={{
            padding: '24px',
            marginBottom: '28px',
            borderRadius: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <motion.div
              whileHover={{ rotate: 8, scale: 1.08 }}
              style={{
                width: 32, height: 32, borderRadius: '8px',
                background: 'rgba(255,178,56,0.10)',
                border: '1px solid rgba(255,178,56,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Megaphone size={16} style={{ color: 'var(--amber)' }} />
            </motion.div>
            <p style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--mono)', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--amber)' }}>
              Send Announcement
            </p>
          </div>

          <form onSubmit={handleSubmit((d) => sendMutation.mutate(d))}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <FloatingLabel
                label="Title *"
                error={errors.title?.message}
                {...register('title', { required: 'Title is required' })}
              />
              <FloatingLabel
                as="textarea"
                rows={3}
                label="Message *"
                error={errors.body?.message}
                {...register('body', { required: 'Message is required' })}
              />
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <FloatingLabel as="select" label="Target Audience" defaultValue="ALL" {...register('targetRole')}>
                    <option value="ALL">All Users</option>
                    <option value="CUSTOMER">Customers Only</option>
                    <option value="PROVIDER">Providers Only</option>
                  </FloatingLabel>
                </div>
                <Button type="submit" variant="amber" loading={sendMutation.isPending}>
                  {sendMutation.isPending ? 'Sending…' : (<><Send size={15} /> Send</>)}
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '13px' }}
                >
                  {serverError}
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                  style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <CheckCircle size={14} /> {successMsg}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </GlowCard>

        {/* History */}
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '11px', fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--amber)' }}>
            Announcement History
          </p>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
            No announcements sent yet
          </div>
        ) : (
          <StaggerList
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {announcements.map((a) => {
              const color = targetColors[a.targetRole] ?? '#94a3b8';
              return (
                <motion.div
                  key={a.id}
                  whileHover={{ y: -2, boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}
                  className="glass-card"
                  style={{
                    padding: '16px 20px',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <p style={{ fontWeight: 700, fontSize: '14px', flex: 1 }}>{a.title}</p>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 700,
                      fontFamily: 'var(--mono)', letterSpacing: '0.05em',
                      color, background: `${color}18`, border: `1px solid ${color}30`,
                    }}>
                      {targetIcon(a.targetRole)} {a.targetRole}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>{a.body}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>by {a.sentBy ?? 'Admin'}</span>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                      {formatDateTime(a.createdAt)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </StaggerList>
        )}
      </DashboardLayout>
    </PageTransition>
  );
}
