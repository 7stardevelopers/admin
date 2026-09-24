import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageTransition } from '@/components/PageTransition';
import { GlowCard } from '@/components/effects/GlowCard';
import { Button } from '@/components/ui/Button';
import { supportApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { ArrowLeft, Send } from 'lucide-react';

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH'];

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(37,99,235,0.14)',
  backdropFilter: 'blur(24px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
  borderRadius: '18px',
  padding: '24px',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 8px 32px rgba(15,23,42,0.10)',
};

export default function SupportTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['support-ticket', id],
    queryFn: async () => (await supportApi.getById(id as string)).data.data,
    refetchInterval: 8000,
  });

  const replyMutation = useMutation({
    mutationFn: (content: string) => supportApi.reply(id as string, content),
    onSuccess: () => {
      setReply('');
      queryClient.invalidateQueries({ queryKey: ['support-ticket', id] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (data: { status?: string; priority?: string }) => supportApi.updateStatus(id as string, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['support-ticket', id] }),
  });

  if (isLoading) return (
    <PageTransition>
      <DashboardLayout title="Support Ticket">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
          <div className="spinner" />
        </div>
      </DashboardLayout>
    </PageTransition>
  );

  if (!ticket) return (
    <PageTransition>
      <DashboardLayout title="Support Ticket">
        <p style={{ color: 'var(--muted)' }}>Ticket not found.</p>
      </DashboardLayout>
    </PageTransition>
  );

  const messages = ticket.messages ?? [];

  return (
    <PageTransition>
      <DashboardLayout title="Support Ticket">
        <motion.button
          onClick={() => navigate('/support')}
          whileHover={{ x: -4, color: 'var(--amber)' }}
          whileTap={{ scale: 0.97 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            color: 'var(--muted)', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: '13px', marginBottom: '24px',
          }}
        >
          <ArrowLeft size={16} /> Back to Tickets
        </motion.button>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
          {/* Left: ticket info + controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <GlowCard style={cardStyle}>
              <p style={{ fontSize: '11px', fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--amber)', marginBottom: '10px' }}>
                Ticket
              </p>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{ticket.subject}</h2>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>From: {ticket.user_name} ({ticket.user_phone})</p>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Category: {ticket.category ?? 'OTHER'}</p>
              <p style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>Opened {formatDateTime(ticket.created_at)}</p>
            </GlowCard>

            <GlowCard style={cardStyle}>
              <p style={{ fontSize: '11px', fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--amber)', marginBottom: '12px' }}>
                Status
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '11px', color: 'var(--muted)' }}>Status</label>
                <select
                  className="input-base"
                  value={ticket.status}
                  onChange={(e) => statusMutation.mutate({ status: e.target.value })}
                  style={{ padding: '8px 10px', fontSize: '13px' }}
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <label style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>Priority</label>
                <select
                  className="input-base"
                  value={ticket.priority}
                  onChange={(e) => statusMutation.mutate({ priority: e.target.value })}
                  style={{ padding: '8px 10px', fontSize: '13px' }}
                >
                  {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </GlowCard>
          </div>

          {/* Right: message thread */}
          <GlowCard style={{ ...cardStyle, display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
              {messages.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '13px' }}>No messages yet.</p>
              ) : messages.map((m: any) => {
                const isStaff = m.sender_role === 'ADMIN' || m.sender_role === 'SUPPORT';
                return (
                  <div key={m.message_id} style={{ alignSelf: isStaff ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                    <div style={{
                      padding: '10px 14px', borderRadius: '14px', fontSize: '13px', lineHeight: 1.5,
                      background: isStaff ? 'rgba(37,99,235,0.12)' : 'rgba(15,23,42,0.05)',
                      border: isStaff ? '1px solid rgba(37,99,235,0.25)' : '1px solid rgba(15,23,42,0.08)',
                    }}>
                      {m.content}
                    </div>
                    <p style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', textAlign: isStaff ? 'right' : 'left' }}>
                      {m.sender_name ?? (isStaff ? 'Support' : 'Customer')} · {formatDateTime(m.created_at)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <textarea
                className="input-base"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type a reply…"
                rows={2}
                style={{ flex: 1, resize: 'none', padding: '10px 12px', fontSize: '13px' }}
              />
              <Button
                variant="amber"
                loading={replyMutation.isPending}
                disabled={!reply.trim()}
                onClick={() => reply.trim() && replyMutation.mutate(reply.trim())}
              >
                <Send size={14} />
              </Button>
            </div>
          </GlowCard>
        </div>
      </DashboardLayout>
    </PageTransition>
  );
}
