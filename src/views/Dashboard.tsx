'use client';
import { useEffect, useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { ORDER_STATUS_LABELS, OrderStatus } from '@/types';
import {
  ShoppingCart, Clock, CheckCircle, Truck, TrendingUp, ArrowRight,
  CreditCard, Users, Package, Plus, Scissors, AlertCircle,
  CalendarDays, Zap, Star,
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

interface DashboardMonthlyPoint {
  month: string;
  revenue: number;
  orders: number;
}

interface DashboardStatusPoint {
  status: string;
  name: string;
  value: number;
}

interface DashboardTopCustomer {
  name: string;
  total: number;
  count: number;
}

interface DashboardUrgentOrder {
  id: string;
  customerName: string;
  deliveryDate: string;
  daysLeft: number;
}

interface DashboardRecentOrder {
  id: string;
  customerName: string;
  productNames: string[];
  totalPrice: number;
  dueAmount: number;
  status: OrderStatus;
  deliveryDate: string;
  itemsCount: number;
}

interface DashboardSummary {
  totals: {
    todayOrders: number;
    pendingOrders: number;
    readyOrders: number;
    deliveredOrders: number;
    totalDue: number;
    totalRevenue: number;
    totalCollected: number;
    totalOrders: number;
  };
  monthlyData: DashboardMonthlyPoint[];
  statusData: DashboardStatusPoint[];
  topCustomers: DashboardTopCustomer[];
  urgentOrders: DashboardUrgentOrder[];
  recentOrders: DashboardRecentOrder[];
}

const STATUS_META: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  in_production: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  ready: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  delivered: { bg: 'bg-slate-100 dark:bg-slate-800/50', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
};

const PIE_COLORS = [
  'hsl(38 95% 52%)',
  'hsl(217 91% 55%)',
  'hsl(152 68% 42%)',
  'hsl(0 78% 54%)',
  'hsl(262 83% 58%)',
];

const EMPTY_SUMMARY: DashboardSummary = {
  totals: {
    todayOrders: 0,
    pendingOrders: 0,
    readyOrders: 0,
    deliveredOrders: 0,
    totalDue: 0,
    totalRevenue: 0,
    totalCollected: 0,
    totalOrders: 0,
  },
  monthlyData: [],
  statusData: [],
  topCustomers: [],
  urgentOrders: [],
  recentOrders: [],
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${meta.bg} ${meta.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {ORDER_STATUS_LABELS[status] || status}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 md:space-y-6 animate-pulse">
      <div className="rounded-2xl border border-border bg-card p-5 md:p-7">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="mt-3 h-8 w-56 rounded bg-muted" />
        <div className="mt-2 h-4 w-40 rounded bg-muted" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 md:gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border bg-card p-4 md:p-5">
            <div className="h-9 w-9 rounded-xl bg-muted" />
            <div className="mt-4 h-7 w-20 rounded bg-muted" />
            <div className="mt-2 h-3 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-5 gap-3 md:gap-4">
        <div className="md:col-span-3 h-72 rounded-2xl border border-border bg-card" />
        <div className="md:col-span-2 h-72 rounded-2xl border border-border bg-card" />
      </div>
      <div className="grid md:grid-cols-3 gap-3 md:gap-4">
        <div className="h-64 rounded-2xl border border-border bg-card" />
        <div className="h-64 rounded-2xl border border-border bg-card" />
        <div className="h-64 rounded-2xl border border-border bg-card" />
      </div>
      <div className="h-80 rounded-2xl border border-border bg-card" />
    </div>
  );
}

export default function Dashboard() {
  const { settings } = useData();
  const { t, language } = useLanguage();
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const cur = settings.currency || '৳';

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/dashboard-summary', { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load dashboard');
        if (!cancelled) {
          setSummary((data.summary || EMPTY_SUMMARY) as DashboardSummary);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard');
          setSummary(EMPTY_SUMMARY);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  const {
    todayOrders,
    pendingOrders,
    readyOrders,
    deliveredOrders,
    totalDue,
    totalRevenue,
    totalCollected,
    totalOrders,
  } = summary.totals;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return language === 'bn' ? 'শুভ সকাল' : 'Good morning';
    if (hour < 17) return language === 'bn' ? 'শুভ অপরাহ্ন' : 'Good afternoon';
    return language === 'bn' ? 'শুভ সন্ধ্যা' : 'Good evening';
  }, [language]);

  const shopName = settings.shopNameBn || settings.shopName || (language === 'bn' ? 'আমার শপ' : 'My Shop');

  const statCards = [
    {
      label: language === 'bn' ? 'আজকের অর্ডার' : "Today's Orders",
      value: todayOrders,
      icon: ShoppingCart,
      gradient: 'from-sky-400 via-blue-500 to-indigo-600',
      shadow: 'shadow-blue-400/40',
      decoration: 'from-white/10 to-transparent',
    },
    {
      label: language === 'bn' ? 'মোট রাজস্ব' : 'Total Revenue',
      value: `${cur}${totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
      shadow: 'shadow-emerald-400/40',
      decoration: 'from-white/10 to-transparent',
    },
    {
      label: language === 'bn' ? 'বাকি পেমেন্ট' : 'Total Due',
      value: `${cur}${totalDue.toLocaleString()}`,
      icon: CreditCard,
      gradient: 'from-rose-400 via-red-500 to-orange-500',
      shadow: 'shadow-rose-400/40',
      decoration: 'from-white/10 to-transparent',
    },
    {
      label: language === 'bn' ? 'পেন্ডিং' : 'Pending',
      value: pendingOrders,
      icon: Clock,
      gradient: 'from-amber-400 via-orange-400 to-yellow-500',
      shadow: 'shadow-amber-400/40',
      decoration: 'from-white/10 to-transparent',
    },
    {
      label: language === 'bn' ? 'ডেলিভারি রেডি' : 'Ready',
      value: readyOrders,
      icon: CheckCircle,
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
      shadow: 'shadow-violet-400/40',
      decoration: 'from-white/10 to-transparent',
    },
    {
      label: language === 'bn' ? 'ডেলিভার্ড' : 'Delivered',
      value: deliveredOrders,
      icon: Truck,
      gradient: 'from-slate-500 via-slate-600 to-gray-700',
      shadow: 'shadow-slate-400/40',
      decoration: 'from-white/10 to-transparent',
    },
  ];

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-5 md:space-y-6 animate-fade-in">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-card to-accent/5 border border-primary/20 p-5 md:p-7">
        <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-32 h-32 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scissors className="w-4 h-4 text-primary/60" />
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{greeting}</p>
            </div>
            <h1 className="text-xl md:text-3xl font-bold text-foreground leading-tight">{shopName}</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1.5 text-primary text-xs font-semibold">
                <Zap className="w-3 h-3" />
                {todayOrders} {language === 'bn' ? 'আজ' : 'today'}
              </div>
              {pendingOrders > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-500/10 rounded-full px-3 py-1.5 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                  <Clock className="w-3 h-3" />
                  {pendingOrders} {language === 'bn' ? 'পেন্ডিং' : 'pending'}
                </div>
              )}
              {readyOrders > 0 && (
                <div className="flex items-center gap-1.5 bg-emerald-500/10 rounded-full px-3 py-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <CheckCircle className="w-3 h-3" />
                  {readyOrders} {language === 'bn' ? 'রেডি' : 'ready'}
                </div>
              )}
            </div>
          </div>

          <Link
            href="/create-order"
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md shadow-primary/25 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'bn' ? 'নতুন অর্ডার' : 'New Order'}</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 md:gap-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${card.gradient} p-4 md:p-5 shadow-lg ${card.shadow} group hover:-translate-y-0.5 transition-all duration-200`}
          >
            <div className="absolute -bottom-3 -right-3 opacity-[0.12] pointer-events-none">
              <card.icon className="w-20 h-20 text-white" strokeWidth={1.5} />
            </div>
            <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${card.decoration}`} />
            <div className="flex items-start justify-between relative z-10">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <card.icon className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div className="mt-3 relative z-10">
              <p className="text-xl md:text-2xl font-bold text-white leading-none">{card.value}</p>
              <p className="text-[11px] md:text-xs text-white/70 mt-1 font-medium">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-5 gap-3 md:gap-4">
        <div className="md:col-span-3 bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground text-sm md:text-base">{t('monthlyRevenue')}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{language === 'bn' ? 'গত ৭ মাস' : 'Last 7 months'}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-xl text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              {cur}{totalRevenue.toLocaleString()}
            </div>
          </div>
          {summary.monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={summary.monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '12px' }}
                  cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 2' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }} activeDot={{ r: 5, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--card))' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <TrendingUp className="w-8 h-8 opacity-20" />
              <p className="text-sm">{t('noData')}</p>
            </div>
          )}
        </div>

        <div className="md:col-span-2 bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground text-sm md:text-base">{t('orderStatusBreakdown')}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{totalOrders} {language === 'bn' ? 'মোট' : 'total'}</p>
          </div>
          {summary.statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={summary.statusData} dataKey="value" cx="50%" cy="50%" outerRadius={52} innerRadius={28} paddingAngle={3} strokeWidth={0}>
                    {summary.statusData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {summary.statusData.map((item, index) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="text-[11px] text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Package className="w-8 h-8 opacity-20" />
              <p className="text-sm">{t('noData')}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3.5 border-b border-border bg-rose-500/5 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{language === 'bn' ? 'জরুরি ডেলিভারি' : 'Urgent Deliveries'}</p>
              <p className="text-[10px] text-muted-foreground">{language === 'bn' ? 'পরবর্তী ৩ দিনে' : 'Next 3 days'}</p>
            </div>
            {summary.urgentOrders.length > 0 && (
              <span className="text-xs font-bold bg-rose-500 text-white w-5 h-5 rounded-full flex items-center justify-center">{summary.urgentOrders.length}</span>
            )}
          </div>
          {summary.urgentOrders.length === 0 ? (
            <div className="px-4 py-8 flex flex-col items-center gap-2 text-muted-foreground">
              <CheckCircle className="w-8 h-8 opacity-20 text-emerald-500" />
              <p className="text-xs">{language === 'bn' ? 'কোনো জরুরি অর্ডার নেই' : 'No urgent orders'}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {summary.urgentOrders.map((order) => {
                const isOverdue = order.daysLeft < 0;
                return (
                  <Link key={order.id} href="/orders" className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400/20 to-rose-600/10 flex items-center justify-center text-xs font-bold text-rose-600 shrink-0">
                      {order.customerName.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{order.customerName}</p>
                      <p className="text-[10px] text-muted-foreground">{order.deliveryDate}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${isOverdue ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {isOverdue ? (language === 'bn' ? 'দেরি' : 'Late') : `${order.daysLeft}d`}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3.5 border-b border-border bg-violet-500/5 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
              <Star className="w-3.5 h-3.5 text-violet-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{language === 'bn' ? 'শীর্ষ গ্রাহক' : 'Top Customers'}</p>
              <p className="text-[10px] text-muted-foreground">{language === 'bn' ? 'সর্বোচ্চ রাজস্ব' : 'By revenue'}</p>
            </div>
          </div>
          {summary.topCustomers.length === 0 ? (
            <div className="px-4 py-8 flex flex-col items-center gap-2 text-muted-foreground">
              <Users className="w-8 h-8 opacity-20" />
              <p className="text-xs">{t('noData')}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {summary.topCustomers.map((customer, index) => (
                <div key={`${customer.name}-${index}`} className="flex items-center gap-3 px-4 py-2.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    index === 0 ? 'bg-amber-400/20 text-amber-600' :
                    index === 1 ? 'bg-slate-300/30 text-slate-600' :
                    index === 2 ? 'bg-orange-400/20 text-orange-600' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{customer.name}</p>
                    <p className="text-[10px] text-muted-foreground">{customer.count} {language === 'bn' ? 'অর্ডার' : 'orders'}</p>
                  </div>
                  <span className="text-xs font-bold text-primary shrink-0">{cur}{customer.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
          <div className="mb-3">
            <h3 className="font-semibold text-foreground text-sm">{language === 'bn' ? 'মাসিক অর্ডার' : 'Orders / Month'}</h3>
            <p className="text-xs text-muted-foreground">{language === 'bn' ? 'গত ৭ মাস' : 'Last 7 months'}</p>
          </div>
          {summary.monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={summary.monthlyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '11px' }} />
                <Bar dataKey="orders" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <CalendarDays className="w-8 h-8 opacity-20" />
              <p className="text-xs">{t('noData')}</p>
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-border/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">{language === 'bn' ? 'সংগ্রহের হার' : 'Collection rate'}</span>
              <span className="font-bold text-foreground">{totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700"
                style={{ width: `${totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-4 md:px-5 py-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="w-3.5 h-3.5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground text-sm md:text-base">{t('recentOrders')}</h2>
          </div>
          <Link href="/orders" className="flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-80 transition-opacity">
            {t('viewAll')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {summary.recentOrders.length === 0 ? (
          <div className="px-5 py-12 flex flex-col items-center gap-3 text-muted-foreground">
            <ShoppingCart className="w-10 h-10 opacity-20" />
            <p className="text-sm">{t('noData')}</p>
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-border/60">
              {summary.recentOrders.map((order) => (
                <Link key={order.id} href="/orders" className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 active:bg-muted/30 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/15 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                    {order.customerName.charAt(0) || '#'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{order.customerName}</p>
                      <p className="text-sm font-bold text-foreground shrink-0">{cur}{order.totalPrice.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-between mt-1 gap-2">
                      <p className="text-[11px] text-muted-foreground truncate">
                        {(order.productNames[0] || '-')}{order.itemsCount > 1 ? ` +${order.itemsCount - 1}` : ''}
                      </p>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-muted-foreground text-xs">
                    <th className="text-left px-5 py-3 font-semibold">{t('orderId')}</th>
                    <th className="text-left px-5 py-3 font-semibold">{t('customerName')}</th>
                    <th className="text-left px-5 py-3 font-semibold">{t('productName')}</th>
                    <th className="text-left px-5 py-3 font-semibold">{t('total')}</th>
                    <th className="text-left px-5 py-3 font-semibold">{t('due')}</th>
                    <th className="text-left px-5 py-3 font-semibold">{t('status')}</th>
                    <th className="text-left px-5 py-3 font-semibold">{language === 'bn' ? 'ডেলিভারি' : 'Delivery'}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors group">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded-lg text-muted-foreground">#{order.id.slice(-6).toUpperCase()}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                            {order.customerName.charAt(0) || '?'}
                          </div>
                          <span className="font-medium text-foreground">{order.customerName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground max-w-[130px] truncate text-xs">
                        {order.productNames.join(', ') || '-'}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-foreground">{cur}{order.totalPrice.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        {order.dueAmount > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold text-xs">{cur}{order.dueAmount.toLocaleString()}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                            <CheckCircle className="w-3 h-3" /> {language === 'bn' ? 'পরিশোধ' : 'Paid'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={order.status} /></td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">
                        {order.deliveryDate
                          ? <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{order.deliveryDate}</span>
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
