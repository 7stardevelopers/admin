import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { bookingsApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import type { Booking } from '@/types';

const PAGE_SIZE = 50;

interface ChatMessage {
  message_id: string;
  from_id: string;
  text: string;
  created_at: string;
  seen_at?: string | null;
}

interface ChatTranscriptModalProps {
  booking: Booking | null;
  onClose: () => void;
}

/** Read-only booking chat for admin/support. Customers and workers lose access once the booking ends. */
export function ChatTranscriptModal({ booking, onClose }: ChatTranscriptModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading]   = useState(false);
  const [hasMore, setHasMore]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const load = async (before?: string) => {
    if (!booking) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bookingsApi.getMessages(booking.id, { limit: PAGE_SIZE, ...(before && { before }) });
      const page: ChatMessage[] = res.data?.data ?? [];
      setMessages(prev => (before ? [...page, ...prev] : page));
      setHasMore(page.length >= PAGE_SIZE);
    } catch (e: any) {
      setError(e?.response?.data?.data ?? e?.message ?? 'Could not load chat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMessages([]);
    setHasMore(false);
    if (booking) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.id]);

  const customerId = booking?.customer?.id ?? booking?.customerId;
  const senderName = (m: ChatMessage) =>
    m.from_id === customerId ? (booking?.customer?.name ?? 'Customer') : (booking?.provider?.user?.name ?? 'Expert');

  return (
    <AnimatePresence>
      {booking && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            padding: '16px',
          }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 8 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="gradient-border"
            style={{
              padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '85vh',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 24px 64px rgba(15,23,42,0.25), inset 0 1px 0 rgba(255,255,255,0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--mono)' }}>
                  Chat · #{booking.id.slice(-8).toUpperCase()}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                  {booking.customer?.name ?? 'Customer'} ↔ {booking.provider?.user?.name ?? 'Expert'} · {booking.status} · read-only
                </p>
              </div>
              <motion.button
                whileHover={{ rotate: 90, color: 'var(--amber)' }} whileTap={{ scale: 0.85 }}
                onClick={onClose} aria-label="Close"
                style={{ color: 'var(--muted)', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                <X size={18} />
              </motion.button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {hasMore && (
                <button
                  onClick={() => load(messages[0]?.message_id)} disabled={loading}
                  style={{
                    alignSelf: 'center', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer', background: 'var(--glass-bg)', border: 'var(--glass-border)',
                    color: 'var(--amber)',
                  }}
                >
                  Load older
                </button>
              )}
              {error && <p style={{ color: '#ef4444', fontSize: '13px' }}>{error}</p>}
              {!loading && !error && messages.length === 0 && (
                <p style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
                  No messages in this booking.
                </p>
              )}
              {messages.map((m) => {
                const fromCustomer = m.from_id === customerId;
                return (
                  <div key={m.message_id} style={{ alignSelf: fromCustomer ? 'flex-start' : 'flex-end', maxWidth: '80%' }}>
                    <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '3px', textAlign: fromCustomer ? 'left' : 'right' }}>
                      {senderName(m)} · {formatDateTime(m.created_at)}
                    </p>
                    <div style={{
                      padding: '9px 12px', borderRadius: '12px', fontSize: '13px', lineHeight: 1.5,
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--ink)',
                      background: fromCustomer ? 'var(--glass-bg)' : 'rgba(37,99,235,0.12)',
                      border: 'var(--glass-border)',
                    }}>
                      {m.text}
                    </div>
                  </div>
                );
              })}
              {loading && messages.length === 0 && (
                <p style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>Loading…</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
