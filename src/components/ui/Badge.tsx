import React from 'react';

const STATUS_MAP: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:     { bg: 'rgba(251,191,36,0.12)',   color: '#fbbf24', label: 'Pending'     },
  ACCEPTED:    { bg: 'rgba(96,165,250,0.12)',   color: '#60a5fa', label: 'Accepted'    },
  EN_ROUTE:    { bg: 'rgba(167,139,250,0.12)',  color: '#a78bfa', label: 'En Route'    },
  IN_PROGRESS: { bg: 'rgba(79,70,229,0.15)',    color: '#818cf8', label: 'In Progress' },
  COMPLETED:   { bg: 'rgba(52,211,153,0.12)',   color: '#34d399', label: 'Completed'   },
  CANCELLED:   { bg: 'rgba(248,113,113,0.12)',  color: '#f87171', label: 'Cancelled'   },
  REJECTED:    { bg: 'rgba(107,114,128,0.15)',  color: '#9ca3af', label: 'Rejected'    },
  // Payment
  SUCCESS:     { bg: 'rgba(52,211,153,0.12)',   color: '#34d399', label: 'Success'     },
  FAILED:      { bg: 'rgba(248,113,113,0.12)',  color: '#f87171', label: 'Failed'      },
  REFUNDED:    { bg: 'rgba(251,146,60,0.12)',   color: '#fb923c', label: 'Refunded'    },
  // Provider
  VERIFIED:    { bg: 'rgba(52,211,153,0.12)',   color: '#34d399', label: 'Verified'    },
  SUSPENDED:   { bg: 'rgba(248,113,113,0.12)',  color: '#f87171', label: 'Suspended'   },
  ACTIVE:      { bg: 'rgba(52,211,153,0.12)',   color: '#34d399', label: 'Active'      },
  INACTIVE:    { bg: 'rgba(107,114,128,0.15)',  color: '#9ca3af', label: 'Inactive'    },
};

interface BadgeProps {
  status: string;
  label?: string;
}

export function Badge({ status, label }: BadgeProps) {
  const s = STATUS_MAP[status] ?? { bg: 'rgba(100,116,139,0.2)', color: '#94a3b8', label: status };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: '999px',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.04em',
      fontFamily: 'var(--mono)',
      background: s.bg,
      color: s.color,
      whiteSpace: 'nowrap',
    }}>
      {label ?? s.label}
    </span>
  );
}
