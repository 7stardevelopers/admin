import React from 'react';
import { motion } from 'framer-motion';

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyText?: string;
  onRowClick?: (row: T) => void;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div
            className="skeleton-shimmer"
            style={{
              height: 14,
              width: i === 0 ? '60%' : i % 2 === 0 ? '80%' : '50%',
            }}
          />
        </td>
      ))}
    </tr>
  );
}

export function DataTable<T extends { id?: string }>({
  columns, data, isLoading, emptyText = 'No data found', onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="glass-card" style={{
      borderRadius: '16px',
      overflow: 'hidden',
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'rgba(255,178,56,0.04)' }}>
              {columns.map((col) => (
                <th key={col.key} style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '10px',
                  fontFamily: 'var(--mono)',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--amber)',
                  borderBottom: 'var(--glass-border)',
                  whiteSpace: 'nowrap',
                }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--muted)' }}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
                  >
                    <span style={{ fontSize: '32px', opacity: 0.5 }}>⬜</span>
                    <span style={{ fontSize: '14px' }}>{emptyText}</span>
                  </motion.div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <motion.tr
                  key={(row as any).id ?? i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.035, 0.5), duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => onRowClick?.(row)}
                  whileHover={{ backgroundColor: 'rgba(255,178,56,0.05)' }}
                  style={{
                    borderBottom: '1px solid rgba(255,178,56,0.06)',
                    background: 'transparent',
                    cursor: onRowClick ? 'pointer' : 'default',
                  }}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={{ padding: '12px 16px', color: 'var(--ink)', verticalAlign: 'middle' }}>
                      {col.render(row)}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
