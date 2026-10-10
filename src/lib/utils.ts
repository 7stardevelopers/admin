// ── Date formatters ──────────────────────────────────────────────────────────
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// ── Currency ─────────────────────────────────────────────────────────────────
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);

// ── Money units ──────────────────────────────────────────────────────────────
// The backend stores and returns ALL money as integer PAISE (₹499 = 49900).
// Display with formatPaise(); convert form input (rupees) with toPaise() before
// sending, and prefill edit forms with fromPaise(). Never pass paise straight
// to formatCurrency(), and never convert the same value twice.
export const fromPaise = (paise: number | string | null | undefined): number => {
  const n = Number(paise ?? 0);
  return Number.isFinite(n) ? n / 100 : 0;
};

export const toPaise = (rupees: number | string | null | undefined): number => {
  const n = Number(rupees ?? 0);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};

/** Format an integer-paise amount as INR, showing decimals only when not whole rupees. */
export const formatPaise = (paise: number | string | null | undefined): string => {
  const rupees = fromPaise(paise);
  const whole = Number.isInteger(rupees);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(rupees);
};

// ── Text helpers ──────────────────────────────────────────────────────────────
export const getInitials = (name: string): string =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export const truncate = (str: string, max = 40): string =>
  str.length > max ? str.slice(0, max) + '…' : str;
