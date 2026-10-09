import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVectr } from '@/context/VectrContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PageTransition } from '@/components/PageTransition';
import { GlowCard } from '@/components/effects/GlowCard';
import { identityReportsApi, providersApi } from '@/lib/api';
import { formatDateTime, timeAgo, getInitials } from '@/lib/utils';
import { ShieldAlert, CheckCircle, XCircle, RotateCcw, Ban, LifeBuoy, User, Phone } from 'lucide-react';

/**
 * Customer tapped "No, someone else" when matching the worker at their door
 * with the worker's locked profile photo. The door code was withheld and an
 * URGENT safety ticket opened; this page is where admin decides what happened.
 */
type ReportStatus = 'OPEN' | 'ACTION_TAKEN' | 'DISMISSED';

const PER_PAGE = 10;
const FILTERS: { value: '' | ReportStatus; label: string }[] = [
  { value: 'OPEN',         label: 'Open' },
  { value: 'ACTION_TAKEN', label: 'Action taken' },
  { value: 'DISMISSED',    label: 'Dismissed' },
  { value: '',             label: 'All' },
];

const STATUS_STYLE: Record<ReportStatus, { bg: string; color: string; label: string }> = {
  OPEN:         { bg: 'rgba(248,113,113,0.12)', color: '#ef4444', label: 'Open' },
  ACTION_TAKEN: { bg: 'rgba(52,211,153,0.12)',  color: '#10b981', label: 'Action taken' },
  DISMISSED:    { bg: 'rgba(107,114,128,0.15)', color: '#6b7280', label: 'Dismissed' },
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(37,99,235,0.14)',
  backdropFilter: 'blur(24px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
  borderRadius: '18px',
  padding: '20px',
};

const btn = (color: string, bg: string): React.CSSProperties => ({
  padding: '8px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 700,
  cursor: 'pointer', color, background: bg, border: `1px solid ${color}40`,
  display: 'inline-flex', alignItems: 'center', gap: '6px',
});

function StatusPill({ status }: { status: ReportStatus }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.OPEN;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
      fontFamily: 'var(--mono)', background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
}

function ReportCard({ r, onResolve, onSuspend, busy }: {
  r: any;
  onResolve: (status: ReportStatus, note: string) => void;
  onSuspend: () => void;
  busy: boolean;
}) {
  const navigate = useNavigate();
  const [note, setNote] = useState<string>(r.admin_note ?? '');
  const repeat = Number(r.provider_report_count ?? 0);

  return (
    <GlowCard style={{ ...cardStyle, borderColor: r.status === 'OPEN' ? 'rgba(239,68,68,0.35)' : cardStyle.border as string }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} color="#ef4444" />
          <span style={{ fontWeight: 700, fontSize: '14px' }}>Customer says a different person came</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusPill status={r.status} />
          <span title={formatDateTime(r.created_at)} style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
            {timeAgo(r.created_at)}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '16px' }}>
        {/* Assigned worker — the face the customer compared against */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          {r.provider_photo ? (
            <img src={r.provider_photo} alt={r.provider_name ?? 'Worker'}
              style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(239,68,68,0.4)' }} />
          ) : (
            <div style={{
              width: 84, height: 84, borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#14B8A6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '22px',
            }}>{getInitials(r.provider_name ?? 'W')}</div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--mono)', letterSpacing: '0.06em' }}>ASSIGNED WORKER</div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>{r.provider_name ?? '—'}</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Phone size={11} /> {r.provider_phone ?? '—'}
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              {r.provider_status && <Badge status={r.provider_status} />}
              {repeat > 1 && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444' }}>{repeat} reports total</span>
              )}
            </div>
          </div>
        </div>

        {/* Booking + customer */}
        <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--mono)', letterSpacing: '0.06em' }}>BOOKING</div>
          <div style={{ fontWeight: 600 }}>{r.service_name ?? 'Service'}</div>
          <div style={{ color: 'var(--muted)', fontSize: '12px' }}>
            {r.scheduled_at ? `Scheduled ${formatDateTime(r.scheduled_at)}` : '—'}
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {r.booking_status && <Badge status={r.booking_status} />}
            <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{String(r.booking_id).slice(0, 8)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <User size={12} /> <span style={{ fontWeight: 600 }}>{r.customer_name ?? 'Customer'}</span>
            <span style={{ color: 'var(--muted)', fontSize: '12px' }}>· {r.customer_phone ?? '—'}</span>
          </div>
          {r.identity_confirmed_at && (
            <div style={{ fontSize: '11px', color: '#f59e0b' }}>
              Customer later confirmed it was the right worker ({formatDateTime(r.identity_confirmed_at)})
            </div>
          )}
        </div>
      </div>

      {r.customer_note && (
        <div style={{ marginTop: '14px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(239,68,68,0.06)', fontSize: '13px' }}>
          <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>CUSTOMER SAID</span>
          <div style={{ marginTop: '2px' }}>{r.customer_note}</div>
        </div>
      )}

      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Admin note — what you found, who you called, action taken…"
        rows={2}
        maxLength={2000}
        style={{
          width: '100%', marginTop: '14px', padding: '10px 12px', borderRadius: '10px', fontSize: '13px',
          border: 'var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--ink)', resize: 'vertical',
          fontFamily: 'inherit',
        }}
      />
      {r.resolved_at && (
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
          Resolved {formatDateTime(r.resolved_at)}{r.resolved_by_name ? ` by ${r.resolved_by_name}` : ''}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
        {r.status === 'OPEN' ? (
          <>
            <motion.button whileTap={{ scale: 0.96 }} disabled={busy} style={btn('#10b981', 'rgba(16,185,129,0.08)')}
              onClick={() => onResolve('ACTION_TAKEN', note)}>
              <CheckCircle size={14} /> Wrong worker went · action taken
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }} disabled={busy} style={btn('#6b7280', 'rgba(107,114,128,0.08)')}
              onClick={() => onResolve('DISMISSED', note)}>
              <XCircle size={14} /> Dismiss · it was the right worker
            </motion.button>
          </>
        ) : (
          <>
            <motion.button whileTap={{ scale: 0.96 }} disabled={busy} style={btn('#2563EB', 'rgba(37,99,235,0.08)')}
              onClick={() => onResolve(r.status, note)}>
              Save note
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }} disabled={busy} style={btn('#6b7280', 'rgba(107,114,128,0.08)')}
              onClick={() => onResolve('OPEN', note)}>
              <RotateCcw size={14} /> Reopen
            </motion.button>
          </>
        )}
        {r.provider_id && r.provider_status !== 'SUSPENDED' && (
          <motion.button whileTap={{ scale: 0.96 }} disabled={busy} style={btn('#ef4444', 'rgba(239,68,68,0.08)')} onClick={onSuspend}>
            <Ban size={14} /> Suspend worker
          </motion.button>
        )}
        {r.provider_id && (
          <motion.button whileTap={{ scale: 0.96 }} style={btn('#2563EB', 'rgba(37,99,235,0.06)')}
            onClick={() => navigate(`/providers/${r.provider_id}`)}>
            <User size={14} /> Worker profile
          </motion.button>
        )}
        {r.ticket_id && (
          <motion.button whileTap={{ scale: 0.96 }} style={btn('#2563EB', 'rgba(37,99,235,0.06)')}
            onClick={() => navigate(`/support/${r.ticket_id}`)}>
            <LifeBuoy size={14} /> Support ticket
          </motion.button>
        )}
      </div>
    </GlowCard>
  );
}

export default function IdentityReports() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'' | ReportStatus>('OPEN');
  const [page, setPage] = useState(1);
  const [suspendTarget, setSuspendTarget] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['identity-reports', status, page],
    queryFn: async () => {
      const res = await identityReportsApi.getAll({ page, per_page: PER_PAGE, ...(status && { status }) });
      return res.data.data as { items: any[]; total: number; open_count: number };
    },
    refetchInterval: 30000,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: ReportStatus; note: string }) =>
      identityReportsApi.resolve(id, { status, admin_note: note }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['identity-reports'] }),
    onError: (e: any) => alert(e.response?.data?.message ?? 'Could not update report'),
  });

  const suspendMutation = useMutation({
    mutationFn: (providerId: string) => providersApi.suspend(providerId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['identity-reports'] }); setSuspendTarget(null); },
    onError: (e: any) => { setSuspendTarget(null); alert(e.response?.data?.message ?? 'Could not suspend worker'); },
  });

  const items = data?.items ?? [];
  const totalPages = data?.total ? Math.ceil(data.total / PER_PAGE) : 1;

  return (
    <PageTransition>
      <DashboardLayout
        title="Identity Reports"
        subtitle={data ? `${data.open_count} open · customers who said a different person came to the door` : 'Customers who said a different person came to the door'}
      >
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {FILTERS.map(f => {
            const active = status === f.value;
            return (
              <motion.button
                key={f.value || 'all'}
                onClick={() => { setStatus(f.value); setPage(1); }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                  fontFamily: 'var(--mono)', cursor: 'pointer', letterSpacing: '0.04em',
                  border: active ? '1px solid var(--amber)' : 'var(--glass-border)',
                  background: active ? 'rgba(37,99,235,0.15)' : 'var(--glass-bg)',
                  color: active ? 'var(--amber)' : 'var(--muted)',
                }}
              >
                {f.label}{f.value === 'OPEN' && data?.open_count ? ` (${data.open_count})` : ''}
              </motion.button>
            );
          })}
        </div>

        {isLoading ? (
          <p style={{ color: 'var(--muted)' }}>Loading…</p>
        ) : items.length === 0 ? (
          <GlowCard style={{ ...cardStyle, textAlign: 'center', padding: '40px' }}>
            <ShieldAlert size={28} color="var(--muted)" style={{ margin: '0 auto' }} />
            <p style={{ color: 'var(--muted)', marginTop: '10px', fontSize: '14px' }}>
              {status === 'OPEN' ? 'No open reports. Every recent door check matched.' : 'No reports here.'}
            </p>
          </GlowCard>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {items.map(r => (
              <ReportCard
                key={r.report_id}
                r={r}
                busy={resolveMutation.isPending}
                onResolve={(s, note) => resolveMutation.mutate({ id: r.report_id, status: s, note })}
                onSuspend={() => setSuspendTarget(r)}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ marginTop: '20px' }}>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}

        <ConfirmModal
          isOpen={!!suspendTarget}
          title="Suspend Worker"
          message={`Suspend ${suspendTarget?.provider_name ?? 'this worker'}? They won't get any new jobs until you activate them again.`}
          confirmLabel="Suspend"
          confirmStyle="danger"
          isLoading={suspendMutation.isPending}
          onConfirm={() => suspendTarget && suspendMutation.mutate(suspendTarget.provider_id)}
          onCancel={() => setSuspendTarget(null)}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
