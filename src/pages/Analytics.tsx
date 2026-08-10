import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/ui/StatsCard';
import { PageTransition } from '@/components/PageTransition';
import { StaggerList } from '@/components/effects/StaggerList';
import { dashboardApi, paymentsApi, reviewsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useVectr } from '@/context/VectrContext';
import { TrendingUp, Target, Star, BarChart3 } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { Payment } from '@/types';

const CHART_COLORS = ['#ffb238', '#4F46E5', '#34d399', '#f87171', '#a78bfa', '#fb923c'];

export default function Analytics() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const raw = (await dashboardApi.getStats()).data.data;
      return {
        total:        raw.total_bookings,
        completed:    raw.completed_bookings,
        pending:      raw.pending_bookings,
        cancelled:    raw.cancelled_bookings,
        totalRevenue: raw.total_revenue_paise / 100,
      };
    },
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['payments-analytics'],
    queryFn: async () => (await paymentsApi.getAll({ limit: 200 })).data,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews-analytics'],
    queryFn: async () => (await reviewsApi.getAll({ limit: 200 })).data,
  });

  const payments: any[] = paymentsData?.data?.items ?? [];

  // Last 7 days revenue
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
    const dayPayments = payments.filter((p: any) => {
      const pd = new Date(p.paid_at ?? p.created_at);
      return pd.toDateString() === d.toDateString() && p.status === 'SUCCESS';
    });
    return { label, revenue: dayPayments.reduce((s: number, p: any) => s + p.amount, 0) };
  });

  // Booking funnel
  const funnelData = stats ? [
    { label: 'Pending',   value: stats.pending    },
    { label: 'Active',    value: Math.max(0, stats.total - stats.pending - stats.completed - stats.cancelled) },
    { label: 'Completed', value: stats.completed  },
    { label: 'Cancelled', value: stats.cancelled  },
  ] : [];

  // Top services from payments
  const serviceMap: Record<string, number> = {};
  payments.forEach((p: any) => {
    const name = p.service_name ?? 'Unknown';
    serviceMap[name] = (serviceMap[name] ?? 0) + p.amount;
  });
  const topServices = Object.entries(serviceMap)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  // Key metrics
  const totalRevenue = payments.filter((p: any) => p.status === 'SUCCESS').reduce((s: number, p: any) => s + p.amount, 0);
  const completedBookings = stats?.completed ?? 0;
  const totalBookings     = stats?.total ?? 0;
  const conversionRate    = totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : '0';
  const avgBookingValue   = completedBookings > 0 ? totalRevenue / completedBookings : 0;
  const reviews: any[]    = reviewsData?.data?.items ?? reviewsData?.data ?? [];
  const avgRating         = reviews.length > 0
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  // Extra-transparent so the amber line from the 3D world bleeds through.
  const chartCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.70)',
    border: '1px solid rgba(37,99,235,0.14)',
    backdropFilter: 'blur(24px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
    borderRadius: '18px',
    padding: '24px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 8px 32px rgba(15,23,42,0.10)',
  };
  const chartLabel: React.CSSProperties = {
    fontSize: '11px', fontFamily: 'var(--mono)', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--amber)', marginBottom: '16px',
  };
  const tooltipStyle = {
    contentStyle: { background: '#ffffff', border: '1px solid rgba(15,23,42,0.10)', borderRadius: '10px' },
    labelStyle: { color: '#0f172a', fontSize: 11 },
  };

  return (
    <PageTransition>
      <DashboardLayout title="Analytics" subtitle="Platform performance at a glance">
        {/* Key metrics */}
        <StaggerList
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <StatsCard title="Conversion Rate"     value={`${conversionRate}%`}         icon={Target}    gradient="linear-gradient(135deg,#4F46E5,#7C3AED)" />
          <StatsCard title="Avg Booking Value"   value={formatCurrency(avgBookingValue)} icon={TrendingUp} gradient="linear-gradient(135deg,#2563EB,#14B8A6)" />
          <StatsCard title="Avg Rating"          value={String(avgRating)}              icon={Star}      gradient="linear-gradient(135deg,#10b981,#059669)" />
          <StatsCard title="Total Revenue"       value={formatCurrency(totalRevenue)}  icon={BarChart3} gradient="linear-gradient(135deg,#06b6d4,#0891b2)" />
        </StaggerList>

        {/* Revenue trend */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ ...chartCard, marginBottom: '20px' }}
        >
          <p style={chartLabel}>Revenue Trend — Last 7 Days</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={last7Days} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fill="url(#areaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Booking funnel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={chartCard}
          >
            <p style={chartLabel}>Booking Funnel</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnelData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {funnelData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top services */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={chartCard}
          >
            <p style={chartLabel}>Top Services by Revenue</p>
            {topServices.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topServices} layout="vertical" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                    {topServices.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
                No service revenue data yet
              </div>
            )}
          </motion.div>
        </div>
      </DashboardLayout>
    </PageTransition>
  );
}
