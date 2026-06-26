import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const btnStyle = (active?: boolean): React.CSSProperties => ({
    padding: '6px 10px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    border: active ? '1px solid var(--amber)' : 'var(--glass-border)',
    background: active ? 'rgba(255,178,56,0.15)' : 'var(--glass-bg)',
    color: active ? 'var(--amber)' : 'var(--muted)',
  });

  const iconBtnStyle = (disabled: boolean): React.CSSProperties => ({
    padding: '6px 10px',
    borderRadius: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.3 : 1,
    border: 'var(--glass-border)',
    background: 'var(--glass-bg)',
    color: 'var(--ink)',
    display: 'flex',
    alignItems: 'center',
  });

  // Build page window
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
      <button
        style={iconBtnStyle(page === 1)}
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} style={{ color: 'var(--muted)', padding: '0 4px' }}>…</span>
        ) : (
          <button key={p} style={btnStyle(p === page)} onClick={() => onPageChange(p as number)}>
            {p}
          </button>
        )
      )}

      <button
        style={iconBtnStyle(page === totalPages)}
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
