import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useVectr } from '@/context/VectrContext';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Pagination } from '@/components/ui/Pagination';
import { PageTransition } from '@/components/PageTransition';
import { logsApi } from '@/lib/api';
import { timeAgo, formatDate } from '@/lib/utils';
import type { ActivityLog } from '@/types';
import { Search, Clock, Tag } from 'lucide-react';

const ACTION_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  CREATE:   { bg: 'rgba(52,211,153,0.12)',  color: '#34d399', label: 'Created'   },
  UPDATE:   { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa', label: 'Updated'   },
  DELETE:   { bg: 'rgba(248,113,113,0.12)', color: '#f87171', label: 'Deleted'   },
  SUSPEND:  { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', label: 'Suspended' },
  ACTIVATE: { bg: 'rgba(52,211,153,0.12)',  color: '#34d399', label: 'Activated' },
  APPROVE:  { bg: 'rgba(52,211,153,0.12)',  color: '#34d399', label: 'Approved'  },
  REJECT:   { bg: 'rgba(248,113,113,0.12)', color: '#f87171', label: 'Rejected'  },
  LOGIN:    { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa', label: 'Login'     },
};

const ENTITY_COLORS: Record<string, string> = {
  Service: 'var(--amber)', Category: '#60a5fa', Provider: '#34d399',
  User: '#a78bfa', Booking: '#fb923c', Payment: '#f87171', Review: '#e879f9',
};

const ACTIONS  = ['', 'CREATE', 'UPDATE', 'DELETE', 'SUSPEND', 'ACTIVATE', 'APPROVE', 'REJECT'];
const ENTITIES = ['', 'Service', 'Category', 'Provider', 'User', 'Booking', 'Payment', 'Review'];

const selectStyle: React.CSSProperties = {
  padding: '9px 14px',
  borderRadius: '10px',
  fontSize: '13px',
  color: 'var(--ink)',
  background: 'var(--glass-bg)',
  border: 'var(--glass-border)',
  outline: 'none',
  cursor: 'pointer',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

function ChangesPreview({ changes }: { changes: Record<string, any> | null }) {
  if (!changes || Object.keys(changes).length === 0) return <span style={{ color: 'var(--muted)' }}>—</span>;
  const entries = Object.entries(changes).slice(0, 3);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
      {entries.map(([k, v]) => (
        <span key={k} style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '11px', background: 'rgba(255,255,255,0.04)', border: 'var(--glass-border)', color: 'var(--muted)' }}>
          {k}: <span style={{ color: 'var(--ink)' }}>{String(v)}</span>
        </span>
      ))}
      {Object.keys(changes).length > 3 && (
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>+{Object.keys(changes).length - 3} more</span>
      )}
    </div>
  );
}

export default function Logs() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['logs', page, search, action, entity],
    queryFn: async () => {
      const res = await logsApi.getAll({ page, limit: 25,
        ...(search && { search }),
        ...(action && { action }),
        ...(entity && { entity }),
      });
      return res.data;
    },
  });

  const logs: any[] = data?.data?.items ?? [];
  const total      = data?.data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);

  const headers = ['Time', 'Admin', 'Action', 'Entity', 'Name / ID', 'Changes'];

  return (
    <PageTransition>
      <DashboardLayout title="Audit Logs" subtitle="Track every admin action — who changed what and when">
        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by admin, name, ID…"
              className="input-base"
              style={{ padding: '9px 14px 9px 36px', fontSize: '13px' }}
            />
          </div>
          <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} style={selectStyle}
            onFocus={(e) => { (e.currentTarget as HTMLSelectElement).style.boxShadow = '0 0 0 2px rgba(37,99,235,0.3)'; (e.currentTarget as HTMLSelectElement).style.borderColor = 'rgba(37,99,235,0.4)'; }}
            onBlur={(e) => { (e.currentTarget as HTMLSelectElement).style.boxShadow = 'none'; (e.currentTarget as HTMLSelectElement).style.borderColor = ''; }}>
            <option value="">All Actions</option>
            {ACTIONS.filter(Boolean).map((a) => (
              <option key={a} value={a}>{ACTION_STYLES[a]?.label ?? a}</option>
            ))}
          </select>
          <select value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }} style={selectStyle}
            onFocus={(e) => { (e.currentTarget as HTMLSelectElement).style.boxShadow = '0 0 0 2px rgba(37,99,235,0.3)'; (e.currentTarget as HTMLSelectElement).style.borderColor = 'rgba(37,99,235,0.4)'; }}
            onBlur={(e) => { (e.currentTarget as HTMLSelectElement).style.boxShadow = 'none'; (e.currentTarget as HTMLSelectElement).style.borderColor = ''; }}>
            <option value="">All Entities</option>
            {ENTITIES.filter(Boolean).map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
              <div className="spinner" />
            </div>
          ) : logs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px', gap: '8px' }}
            >
              <span style={{ fontSize: '28px' }}>📋</span>
              <p style={{ color: 'var(--muted)', fontSize: '14px' }}>No logs found</p>
              {(search || action || entity) && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setSearch(''); setAction(''); setEntity(''); }}
                  style={{ color: 'var(--amber)', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Clear filters
                </motion.button>
              )}
            </motion.div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {headers.map((h) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '10px', fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--amber)', borderBottom: 'var(--glass-border)', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => {
                    const aStyle = ACTION_STYLES[log.action] ?? { bg: 'rgba(100,116,139,0.2)', color: '#94a3b8', label: log.action };
                    const eColor = ENTITY_COLORS[log.entity] ?? '#94a3b8';
                    return (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i * 0.025, 0.5), duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ backgroundColor: 'rgba(37,99,235,0.05)' }}
                        style={{ borderBottom: 'var(--glass-border)' }}
                      >
                        {/* Time */}
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)' }}>
                            <Clock size={11} />
                            <span style={{ fontSize: '11px' }}>{timeAgo(log.created_at)}</span>
                          </div>
                          <p style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px', fontFamily: 'var(--mono)' }}>
                            {formatDate(log.created_at)}
                          </p>
                        </td>
                        {/* Admin */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                              background: 'linear-gradient(135deg,#2563EB,#14B8A6)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '11px', fontWeight: 700, color: '#ffffff',
                            }}>
                              {(log.admin_name ?? '?').charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>{log.admin_name ?? 'System'}</span>
                          </div>
                        </td>
                        {/* Action */}
                        <td style={{ padding: '12px 16px' }}>
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: Math.min(i * 0.025 + 0.1, 0.55), type: 'spring', stiffness: 280, damping: 22 }}
                            style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--mono)', background: aStyle.bg, color: aStyle.color }}
                          >
                            {aStyle.label}
                          </motion.span>
                        </td>
                        {/* Entity */}
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: eColor }}>
                            <Tag size={10} />{log.entity}
                          </span>
                        </td>
                        {/* Name/ID */}
                        <td style={{ padding: '12px 16px' }}>
                          {log.entity_id && <p style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--mono)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.entity_id}</p>}
                        </td>
                        {/* Changes */}
                        <td style={{ padding: '12px 16px', maxWidth: '260px' }}>
                          <ChangesPreview changes={log.changes} />
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
              Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total} logs
            </p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </DashboardLayout>
    </PageTransition>
  );
}
