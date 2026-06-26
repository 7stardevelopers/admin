import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/ui/StatsCard';
import { PageTransition } from '@/components/PageTransition';
import { StaggerList } from '@/components/effects/StaggerList';
import { dashboardApi, paymentsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useVectr } from '@/context/VectrContext';
import { ShoppingBag, TrendingUp, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import type { DashboardStats, Payment } from '@/types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#fbbf24', '#60a5fa', '#34d399', '#f87171', '#a78bfa', '#fb923c'];

export default function Dashboard() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await dashboardApi.getStats();
      return res.data.data;
    },
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['payments-all-dashboard'],
    queryFn: async () => {
      const res = await paymentsApi.getAll({ limit: 100 });
      return res.data;
    },
  });

  const payments: Payment[] = paymentsData?.data ?? [];

  // Build last-7-days revenue chart
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
    const dayPayments = payments.filter((p) => {
      const pd = new Date(p.paidAt ?? p.createdAt);
      return pd.toDateString() === d.toDateString() && p.status === 'SUCCESS';
    });
    const revenue = dayPayments.reduce((sum, p) => sum + p.amount, 0);
    return { label, revenue };
  });

  // Pie data
  const pieData = stats ? [
    { name: 'Completed', value: stats.completed },
    { name: 'Pending',   value: stats.pending   },
    { name: 'Cancelled', value: stats.cancelled  },
    { name: 'Other',     value: Math.max(0, stats.total - stats.completed - stats.pending - stats.cancelled) },
  ].filter((d) => d.value > 0) : [];

  const cards = [
    {
      title: 'Total Bookings',
      value: isLoading ? '…' : (stats?.total ?? 0).toLocaleString(),
      icon: ShoppingBag,
      gradient: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
      trend: { value: 12, label: 'vs last month' },
    },
    {
      title: 'Total Revenue',
      value: isLoading ? '…' : formatCurrency(stats?.totalRevenue ?? 0),
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg,#ffb238,#ff8a1e)',
      trend: { value: 8, label: 'vs last month' },
    },
    {
      title: 'Completed',
      value: isLoading ? '…' : (stats?.completed ?? 0).toLocaleString(),
      icon: CheckCircle,
      gradient: 'linear-gradient(135deg,#10b981,#059669)',
      trend: { value: 15, label: 'vs last month' },
    },
    {
      title: 'Pending',
      value: isLoading ? '…' : (stats?.pending ?? 0).toLocaleString(),
      icon: Clock,
      gradient: 'linear-gradient(135deg,#a78bfa,#7C3AED)',
    },
    {
      title: 'Cancelled',
      value: isLoading ? '…' : (stats?.cancelled ?? 0).toLocaleString(),
      icon: XCircle,
      gradient: 'linear-gradient(135deg,#ef4444,#dc2626)',
      trend: { value: -3, label: 'vs last month' },
    },
    {
      title: 'Platform Fee (15%)',
      value: isLoading ? '…' : formatCurrency((stats?.totalRevenue ?? 0) * 0.15),
      icon: DollarSign,
      gradient: 'linear-gradient(135deg,#06b6d4,#0891b2)',
    },
  ];

  const chartStyle: React.CSSProperties = {
    background: 'rgba(7,9,14,0.50)',
    border: '1px solid rgba(255,178,56,0.10)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '18px',
    padding: '24px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.3)',
  };

  const liveIndicator = (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: 'var(--mono)', fontSize: 11,
      color: 'var(--amber)', letterSpacing: '0.15em',
    }}>
      <motion.span
        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--amber)',
          boxShadow: '0 0 8px var(--amber)',
        }}
      />
      LIVE
    </span>
  );

  return (
    <PageTransition>
      <DashboardLayout
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening today."
        headerRight={liveIndicator}
      >
        {/* Stats grid */}
        <StaggerList
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          {cards.map((card) => <StatsCard key={card.title} {...card} />)}
        </StaggerList>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          {/* Revenue chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={chartStyle}
          >
            <p style={{ fontSize: '12px', fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--amber)', marginBottom: '16px' }}>
              Revenue — Last 7 Days
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={last7} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ffb238" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ffb238" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(237,241,246,0.06)" />
                <XAxis dataKey="label" tick={{ fill: '#97a1ae', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#97a1ae', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#0c1018', border: '1px solid rgba(237,241,246,0.1)', borderRadius: '10px' }}
                  labelStyle={{ color: '#edf1f6', fontSize: 12 }}
                  formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#ffb238" strokeWidth={2}
                  fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Pie chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={chartStyle}
          >
            <p style={{ fontSize: '12px', fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--amber)', marginBottom: '16px' }}>
              Booking Status
            </p>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(v) => <span style={{ color: 'var(--muted)', fontSize: 11 }}>{v}</span>}
                  />
                  <Tooltip
                    contentStyle={{ background: '#0c1018', border: '1px solid rgba(237,241,246,0.1)', borderRadius: '10px' }}
                    formatter={(v) => [v, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
                No booking data
              </div>
            )}
          </motion.div>
        </div>
      </DashboardLayout>
    </PageTransition>
  );
}
