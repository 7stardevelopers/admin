import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useVectr } from '@/context/VectrContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PageTransition } from '@/components/PageTransition';
import { payoutsApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Banknote, Download } from 'lucide-react';

/**
 * Worker payouts. Twice a week the backend queues an APPROVED payout for every
 * worker with enough balance (notes "AUTO <date>"); workers can also request one
 * (PENDING). Admin sends the money from the bank, then marks it PROCESSED —
 * that is what debits the worker's wallet. Amounts from the API are paise.
 */
const TABS = [
  { status: 'APPROVED',  label: 'To transfer' },
  { status: 'PENDING',   label: 'Requested'   },
  { status: 'PROCESSED', label: 'Paid'        },
  { status: 'REJECTED',  label: 'Rejected'    },
];

const STATUS_COLORS: Record<string, string> = {
  APPROVED:  '#60a5fa',
  PENDING:   '#fbbf24',
  PROCESSED: '#34d399',
  REJECTED:  '#f87171',
};

type Action = { ids: string[]; status: 'APPROVED' | 'PROCESSED' | 'REJECTED' } | null;

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 700,
      fontFamily: 'var(--mono)', letterSpacing: '0.06em',
      background: `${color}18`, color, border: `1px solid ${color}40`,
    }}>
      {label}
    </span>
  );
}

function downloadCsv(rows: any[]) {
  // Bank bulk-transfer sheet: one line per payout, amounts in rupees.
  const header = ['payout_id', 'worker', 'phone', 'account_name', 'account_number', 'ifsc', 'amount_inr'];
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((r) => [
    r.payout_id, r.provider_name, r.provider_phone, r.bank_account_name,
    r.bank_account, r.bank_ifsc, (Number(r.amount) / 100).toFixed(2),
  ].map(esc).join(','));
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `payouts-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const actionButton = (color: string): React.CSSProperties => ({
  padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
  color, background: `${color}14`, border: `1px solid ${color}40`,
});

export default function Payouts() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('APPROVED');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<Action>(null);
  const [result, setResult] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['payouts', status],
    queryFn: async () => {
      const res = await payoutsApi.getAll(status);
      const rows = res.data?.data ?? res.data ?? [];
      return Array.isArray(rows) ? rows : [];
    },
  });
  const payouts: any[] = data ?? [];
  useEffect(() => { setSelected(new Set()); }, [status]);

  const selectedRows = useMemo(() => payouts.filter((p) => selected.has(p.payout_id)), [payouts, selected]);
  const selectedTotal = selectedRows.reduce((s, p) => s + Number(p.amount || 0), 0);

  const mutation = useMutation({
    mutationFn: ({ ids, status: next }: NonNullable<Action>) => payoutsApi.bulkUpdate(ids, next),
    onSuccess: (res) => {
      const failed = res.data?.data?.failed ?? [];
      setResult(failed.length ? `${failed.length} payout(s) could not be updated: ${failed[0].error}` : null);
      setSelected(new Set());
      setAction(null);
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
    },
    onError: (e: any) => {
      setResult(e?.response?.data?.message ?? 'Update failed');
      setAction(null);
    },
  });

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const allSelected = payouts.length > 0 && selected.size === payouts.length;
  const canAct = status === 'APPROVED' || status === 'PENDING';

  const columns = [
    ...(canAct ? [{
      key: 'select', header: '',
      render: (p: any) => (
        <input
          type="checkbox"
          aria-label={`Select payout for ${p.provider_name ?? 'worker'}`}
          checked={selected.has(p.payout_id)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggle(p.payout_id)}
        />
      ),
    }] : []),
    {
      key: 'worker', header: 'Worker',
      render: (p: any) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '13px' }}>{p.provider_name ?? '—'}</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{p.provider_phone ?? ''}</div>
        </div>
      ),
    },
    {
      key: 'amount', header: 'Amount',
      render: (p: any) => <span style={{ fontWeight: 700, fontFamily: 'var(--mono)' }}>{formatCurrency(Number(p.amount) / 100)}</span>,
    },
    {
      key: 'bank', header: 'Bank account',
      render: (p: any) => (
        <div style={{ fontSize: '12px', fontFamily: 'var(--mono)' }}>
          <div>{p.bank_account ?? '—'}</div>
          <div style={{ color: 'var(--muted)' }}>{p.bank_ifsc ?? ''}{p.bank_account_name ? ` · ${p.bank_account_name}` : ''}</div>
        </div>
      ),
    },
    {
      key: 'source', header: 'Source',
      render: (p: any) => String(p.notes ?? '').startsWith('AUTO')
        ? <Pill label="SCHEDULED" color="#a78bfa" />
        : <Pill label="REQUESTED" color="#fbbf24" />,
    },
    {
      key: 'status', header: 'Status',
      render: (p: any) => <Pill label={p.status} color={STATUS_COLORS[p.status] ?? '#9ca3af'} />,
    },
    {
      key: 'created', header: 'Created',
      render: (p: any) => <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{formatDateTime(p.created_at)}</span>,
    },
    ...(canAct ? [{
      key: 'actions', header: '',
      render: (p: any) => (
        <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
          {status === 'PENDING' && (
            <button style={actionButton('#60a5fa')} onClick={() => setAction({ ids: [p.payout_id], status: 'APPROVED' })}>Approve</button>
          )}
          <button style={actionButton('#34d399')} onClick={() => setAction({ ids: [p.payout_id], status: 'PROCESSED' })}>Mark paid</button>
          <button style={actionButton('#f87171')} onClick={() => setAction({ ids: [p.payout_id], status: 'REJECTED' })}>Reject</button>
        </div>
      ),
    }] : []),
  ];

  const actionRows = action ? payouts.filter((p) => action.ids.includes(p.payout_id)) : [];
  const actionTotal = actionRows.reduce((s, p) => s + Number(p.amount || 0), 0);
  const actionText: Record<string, string> = {
    PROCESSED: `Confirm you have transferred ${formatCurrency(actionTotal / 100)} to ${actionRows.length} worker(s). Their wallets will be debited.`,
    APPROVED:  `Approve ${actionRows.length} payout request(s) for transfer?`,
    REJECTED:  `Reject ${actionRows.length} payout(s)? The money stays in the workers' wallets.`,
  };

  return (
    <PageTransition>
      <DashboardLayout title="Worker Payouts" subtitle="Scheduled every Mon & Thu — transfer from the bank, then mark paid">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Banknote size={15} style={{ color: 'var(--amber)' }} />
          {TABS.map((t) => {
            const active = status === t.status;
            return (
              <motion.button
                key={t.status}
                onClick={() => setStatus(t.status)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                  fontFamily: 'var(--mono)', cursor: 'pointer',
                  border: active ? '1px solid var(--amber)' : 'var(--glass-border)',
                  background: active ? 'rgba(37,99,235,0.15)' : 'var(--glass-bg)',
                  color: active ? 'var(--amber)' : 'var(--muted)',
                }}
              >
                {t.label}
              </motion.button>
            );
          })}
        </div>

        {canAct && payouts.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => setSelected(allSelected ? new Set() : new Set(payouts.map((p) => p.payout_id)))}
              />
              Select all
            </label>
            {selected.size > 0 && (
              <>
                <span style={{ fontSize: '12px', fontFamily: 'var(--mono)' }}>
                  {selected.size} selected · {formatCurrency(selectedTotal / 100)}
                </span>
                <button style={actionButton('#a78bfa')} onClick={() => downloadCsv(selectedRows)}>
                  <Download size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />Bank CSV
                </button>
                {status === 'PENDING' && (
                  <button style={actionButton('#60a5fa')} onClick={() => setAction({ ids: [...selected], status: 'APPROVED' })}>Approve selected</button>
                )}
                <button style={actionButton('#34d399')} onClick={() => setAction({ ids: [...selected], status: 'PROCESSED' })}>Mark selected paid</button>
              </>
            )}
          </div>
        )}

        {result && (
          <div style={{ marginBottom: '12px', fontSize: '12px', color: '#f87171' }}>{result}</div>
        )}

        <DataTable
          columns={columns}
          data={payouts}
          isLoading={isLoading}
          emptyText={status === 'APPROVED' ? 'Nothing to transfer right now' : 'No payouts'}
        />

        <ConfirmModal
          isOpen={!!action}
          title={action?.status === 'PROCESSED' ? 'Mark as paid' : action?.status === 'APPROVED' ? 'Approve payouts' : 'Reject payouts'}
          message={action ? actionText[action.status] : ''}
          confirmLabel={action?.status === 'PROCESSED' ? 'Yes, transferred' : action?.status === 'APPROVED' ? 'Approve' : 'Reject'}
          confirmStyle={action?.status === 'REJECTED' ? 'danger' : 'success'}
          isLoading={mutation.isPending}
          onConfirm={() => action && mutation.mutate(action)}
          onCancel={() => setAction(null)}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
