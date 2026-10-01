import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useVectr } from '@/context/VectrContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Pagination } from '@/components/ui/Pagination';
import { PageTransition } from '@/components/PageTransition';
import { callsApi } from '@/lib/api';
import { timeAgo, formatDateTime } from '@/lib/utils';
import { Search, Clock, PhoneCall, PlayCircle, RefreshCw } from 'lucide-react';

const PER_PAGE = 20;

// Matches backend calls_service.EXOTEL_STATUS_MAP
const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  INITIATED:   { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa', label: 'Ringing'     },
  RINGING:     { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa', label: 'Ringing'     },
  IN_PROGRESS: { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa', label: 'In progress' },
  COMPLETED:   { bg: 'rgba(52,211,153,0.12)',  color: '#34d399', label: 'Completed'   },
  'NO-ANSWER': { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', label: 'No answer'   },
  BUSY:        { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', label: 'Busy'        },
  CANCELED:    { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', label: 'Cancelled'   },
  FAILED:      { bg: 'rgba(248,113,113,0.12)', color: '#f87171', label: 'Failed'      },
};

const STATUS_FILTERS = ['', 'COMPLETED', 'NO-ANSWER', 'BUSY', 'FAILED', 'CANCELED', 'INITIATED'];

const TARGET_LABEL: Record<string, string> = {
  PROVIDER: 'Customer → Expert',
  CUSTOMER: 'Expert → Customer',
  DIRECT:   'Admin → User',
};

const selectStyle: React.CSSProperties = {
  padding: '9px 14px',
  borderRadius: '10px',
  fontSize: '13px',
  color: 'var(--ink)',
  background: 'var(--glass-bg)',
  border: 'var(--glass-border)',
  outline: 'none',
  cursor: 'pointer',
};

/** Backend sends naive UTC ("2026-10-02 10:00:00"); mark it as UTC so it renders in local time. */
function asUtc(value?: string | null): string | null {
  if (!value) return null;
  if (/[zZ]$|[+-]\d\d:?\d\d$/.test(value)) return value;
  return value.replace(' ', 'T') + 'Z';
}

function formatDuration(sec?: number | null): string {
  if (sec == null) return '—';
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, '0')}s`;
}

const th: React.CSSProperties = {
  padding: '12px 16px', textAlign: 'left', fontSize: '10px', fontFamily: 'var(--mono)', fontWeight: 700,
  letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--amber)', borderBottom: 'var(--glass-border)',
  whiteSpace: 'nowrap',
};
const td: React.CSSProperties = { padding: '12px 16px', verticalAlign: 'top' };
const mono: React.CSSProperties = { fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' };

export default function CallLogs() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);
  const [copied, setCopied] = useState<string | null>(null);
  const copyId = (id: string) => {
    navigator.clipboard?.writeText(id).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    }).catch(() => {});
  };

  const [page, setPage]           = useState(1);
  const [status, setStatus]       = useState('');
  const [bookingId, setBookingId] = useState('');

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['call-logs', page, status, bookingId],
    queryFn: async () => {
      const res = await callsApi.getLogs({
        page, per_page: PER_PAGE,
        ...(status && { status }),
        ...(bookingId.trim() && { booking_id: bookingId.trim() }),
      });
      return res.data;
    },
    refetchInterval: 30000,   // statuses arrive asynchronously from Exotel
  });

  const calls: any[] = data?.data?.items ?? [];
  const total        = data?.data?.total ?? 0;
  const totalPages   = Math.ceil(total / PER_PAGE);
  const hasFilters   = Boolean(status || bookingId);

  const headers = ['Time', 'Placed by', 'Direction', 'Booking', 'Status', 'Duration', 'Recording', 'Details'];

  return (
    <PageTransition>
      <DashboardLayout title="Call Logs" subtitle="Masked calls between customers and experts (via Exotel)">
        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              value={bookingId}
              onChange={(e) => { setBookingId(e.target.value); setPage(1); }}
              placeholder="Filter by booking ID…"
              className="input-base"
              style={{ padding: '9px 14px 9px 36px', fontSize: '13px' }}
            />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="">All statuses</option>
            {STATUS_FILTERS.filter(Boolean).map((s) => (
              <option key={s} value={s}>{STATUS_STYLES[s]?.label ?? s}</option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            style={{ ...selectStyle, display: 'flex', alignItems: 'center', gap: '6px' }}
            aria-label="Refresh call logs"
          >
            <RefreshCw size={13} style={{ animation: isFetching ? 'spin 1s linear infinite' : undefined }} />
            Refresh
          </button>
        </div>

        {/* Table */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
              <div className="spinner" />
            </div>
          ) : isError ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#f87171', fontSize: '13px' }}>
              Couldn't load call logs — {(error as any)?.response?.data?.message ?? 'please try again'}.
            </div>
          ) : calls.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px', gap: '8px' }}
            >
              <PhoneCall size={28} color="var(--muted)" />
              <p style={{ color: 'var(--muted)', fontSize: '14px' }}>No calls yet</p>
              {hasFilters && (
                <button
                  onClick={() => { setStatus(''); setBookingId(''); }}
                  style={{ color: 'var(--amber)', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Clear filters
                </button>
              )}
            </motion.div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {headers.map((h) => <th key={h} style={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {calls.map((c, i) => {
                    const st = STATUS_STYLES[c.status] ?? { bg: 'rgba(100,116,139,0.2)', color: '#94a3b8', label: c.status ?? '—' };
                    const created = asUtc(c.created_at);
                    return (
                      <motion.tr
                        key={c.call_id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i * 0.025, 0.5), duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ backgroundColor: 'rgba(37,99,235,0.05)' }}
                        style={{ borderBottom: 'var(--glass-border)' }}
                      >
                        <td style={{ ...td, whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)' }}>
                            <Clock size={11} />
                            <span style={{ fontSize: '11px' }}>{created ? timeAgo(created) : '—'}</span>
                          </div>
                          {created && <p style={{ ...mono, fontSize: '10px', marginTop: '2px' }}>{formatDateTime(created)}</p>}
                        </td>
                        <td style={td}>
                          <p style={{ fontSize: '12px', fontWeight: 600 }}>{c.initiated_by_name || 'Unnamed user'}</p>
                          <p style={{ ...mono, fontSize: '10px' }}>{c.initiated_by_role ?? '—'}</p>
                        </td>
                        <td style={{ ...td, whiteSpace: 'nowrap', fontSize: '12px' }}>
                          {TARGET_LABEL[c.target] ?? c.target ?? '—'}
                        </td>
                        <td style={td}>
                          {c.booking_id ? (
                            <button
                              onClick={() => copyId(c.booking_id)}
                              title={`${c.booking_id} — click to copy`}
                              style={{ ...mono, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#60a5fa' }}
                            >
                              {copied === c.booking_id ? 'Copied ✓' : `${String(c.booking_id).slice(0, 8)}…`}
                            </button>
                          ) : <span style={mono}>—</span>}
                        </td>
                        <td style={td}>
                          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--mono)', background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                            {st.label}
                          </span>
                        </td>
                        <td style={{ ...td, ...mono, fontSize: '12px', color: 'var(--ink)' }}>{formatDuration(c.duration_sec)}</td>
                        <td style={td}>
                          {c.recording_url ? (
                            <a href={c.recording_url} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#60a5fa' }}>
                              <PlayCircle size={13} /> Listen
                            </a>
                          ) : <span style={mono}>—</span>}
                        </td>
                        <td style={{ ...td, maxWidth: '280px' }}>
                          {c.error_message
                            ? <p style={{ fontSize: '11px', color: '#f87171', wordBreak: 'break-word' }}>{c.error_message}</p>
                            : <span style={mono}>{c.exotel_call_sid ? `SID ${String(c.exotel_call_sid).slice(0, 10)}…` : '—'}</span>}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
            <p style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total} calls
            </p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </DashboardLayout>
    </PageTransition>
  );
}
