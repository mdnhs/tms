'use client';
import { useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { ORDER_STATUS_LABELS } from '@/types';
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

/* ── helpers ────────────────────────────────────────────────── */
const STATUS_META: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending:       { label: 'Pending',       bg: 'bg-amber-100 dark:bg-amber-900/30',   text: 'text-amber-700 dark:text-amber-400',   dot: 'bg-amber-500' },
  in_production: { label: 'In Production', bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-700 dark:text-blue-400',     dot: 'bg-blue-500' },
  ready:         { label: 'Ready',         bg: 'bg-emerald-100 dark:bg-emerald-900/30',text: 'text-emerald-700 dark:text-emerald-400',dot: 'bg-emerald-500' },
  delivered:     { label: 'Delivered',     bg: 'bg-slate-100 dark:bg-slate-800/50',   text: 'text-slate-600 dark:text-slate-400',   dot: 'bg-slate-400' },
  cancelled:     { label: 'Cancelled',     bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-600 dark:text-red-400',       dot: 'bg-red-500' },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status}
    </span>
  );
}

const PIE_COLORS = [
  'hsl(38 95% 52%)',
  'hsl(217 91% 55%)',
  'hsl(152 68% 42%)',
  'hsl(0 78% 54%)',
  'hsl(262 83% 58%)',
];

/* ── component ──────────────────────────────────────────────── */
export default function Dashboard() {
  const { orders, customers, getCustomer, getProduct, settings } = useData();
  const { t, language } = useLanguage();
  const cur = settings.currency || '৳';

  /* derived metrics */
  const today = new Date().toDateString();
  const todayOrders   = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const readyOrders   = orders.filter(o => o.status === 'ready');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const totalDue      = orders.reduce((s, o) => s + o.dueAmount, 0);
  const totalRevenue  = orders.reduce((s, o) => s + o.totalPrice, 0);
  const totalCollected = orders.reduce((s, o) => s + o.advancePaid + (o.totalPrice - o.dueAmount - o.advancePaid), 0);

  /* greeting */
  const hour = new Date().getHours();
  const greeting = hour < 12
    ? (language === 'bn' ? 'শুভ সকাল' : 'Good morning')
    : hour < 17
    ? (language === 'bn' ? 'শুভ অপরাহ্ন' : 'Good afternoon')
    : (language === 'bn' ? 'শুভ সন্ধ্যা' : 'Good evening');

  const shopName = settings.shopNameBn || settings.shopName || (language === 'bn' ? 'আমার শপ' : 'My Shop');

  /* monthly revenue for area chart */
  const monthlyData = useMemo(() => {
    const map: Record<string, { revenue: number; orders: number }> = {};
    orders.forEach(o => {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { revenue: 0, orders: 0 };
      map[key].revenue += o.totalPrice;
      map[key].orders  += 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([month, v]) => ({
        month: month.slice(5), // show MM only
        ...v,
      }));
  }, [orders]);

  /* status breakdown for pie */
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([status, value]) => ({
      status,
      name: ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status,
      value,
    }));
  }, [orders]);

  /* top customers */
  const topCustomers = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    orders.forEach(o => {
      const c = getCustomer(o.customerId);
      if (!c) return;
      if (!map[c.id]) map[c.id] = { name: c.name, total: 0, count: 0 };
      map[c.id].total += o.totalPrice;
      map[c.id].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [orders, getCustomer]);

  /* urgent orders (due within 3 days and not delivered/cancelled) */
  const urgentOrders = useMemo(() => {
    const threeDays = Date.now() + 3 * 86400000;
    return orders
      .filter(o => {
        if (o.status === 'delivered' || o.status === 'cancelled') return false;
        if (!o.deliveryDate) return false;
        return new Date(o.deliveryDate).getTime() <= threeDays;
      })
      .slice(0, 5);
  }, [orders]);

  const recentOrders = orders.slice(0, 6);

  /* stat cards data */
  const statCards = [
    {
      label: language === 'bn' ? 'আজকের অর্ডার' : "Today's Orders",
      value: todayOrders.length,
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
      value: pendingOrders.length,
      icon: Clock,
      gradient: 'from-amber-400 via-orange-400 to-yellow-500',
      shadow: 'shadow-amber-400/40',
      decoration: 'from-white/10 to-transparent',
    },
    {
      label: language === 'bn' ? 'ডেলিভারি রেডি' : 'Ready',
      value: readyOrders.length,
      icon: CheckCircle,
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
      shadow: 'shadow-violet-400/40',
      decoration: 'from-white/10 to-transparent',
    },
    {
      label: language === 'bn' ? 'ডেলিভার্ড' : 'Delivered',
      value: deliveredOrders.length,
      icon: Truck,
      gradient: 'from-slate-500 via-slate-600 to-gray-700',
      shadow: 'shadow-slate-400/40',
      decoration: 'from-white/10 to-transparent',
    },
  ];

  return (
    <div className="space-y-5 md:space-y-6 animate-fade-in">

      {/* ── Hero banner ─────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-card to-accent/5 border border-primary/20 p-5 md:p-7">
        {/* decorative blobs */}
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

            {/* quick pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1.5 text-primary text-xs font-semibold">
                <Zap className="w-3 h-3" />
                {todayOrders.length} {language === 'bn' ? 'আজ' : 'today'}
              </div>
              {pendingOrders.length > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-500/10 rounded-full px-3 py-1.5 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                  <Clock className="w-3 h-3" />
                  {pendingOrders.length} {language === 'bn' ? 'পেন্ডিং' : 'pending'}
                </div>
              )}
              {readyOrders.length > 0 && (
                <div className="flex items-center gap-1.5 bg-emerald-500/10 rounded-full px-3 py-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <CheckCircle className="w-3 h-3" />
                  {readyOrders.length} {language === 'bn' ? 'রেডি' : 'ready'}
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

      {/* ── Stat cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 md:gap-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${card.gradient} p-4 md:p-5 shadow-lg ${card.shadow} group hover:-translate-y-0.5 transition-all duration-200`}
          >
            {/* large background decoration */}
            <div className="absolute -bottom-3 -right-3 opacity-[0.12] pointer-events-none">
              <card.icon className="w-20 h-20 text-white" strokeWidth={1.5} />
            </div>
            {/* shimmer bar */}
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

      {/* ── Charts row ──────────────────────────────────────────── */}
      <div className="grid md:grid-cols-5 gap-3 md:gap-4">

        {/* Revenue area chart — wider */}
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
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.25} />
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

        {/* Status donut — narrower */}
        <div className="md:col-span-2 bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground text-sm md:text-base">{t('orderStatusBreakdown')}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{orders.length} {language === 'bn' ? 'মোট' : 'total'}</p>
          </div>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" cx="50%" cy="50%" outerRadius={52} innerRadius={28} paddingAngle={3} strokeWidth={0}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              {/* legend */}
              <div className="space-y-1.5 mt-2">
                {statusData.map((d, i) => (
                  <div key={d.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-[11px] text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-foreground">{d.value}</span>
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

      {/* ── Bottom row: Urgent + Top customers + Recent orders ─── */}
      <div className="grid md:grid-cols-3 gap-3 md:gap-4">

        {/* Urgent deliveries */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3.5 border-b border-border bg-rose-500/5 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{language === 'bn' ? 'জরুরি ডেলিভারি' : 'Urgent Deliveries'}</p>
              <p className="text-[10px] text-muted-foreground">{language === 'bn' ? 'পরবর্তী ৩ দিনে' : 'Next 3 days'}</p>
            </div>
            {urgentOrders.length > 0 && (
              <span className="text-xs font-bold bg-rose-500 text-white w-5 h-5 rounded-full flex items-center justify-center">{urgentOrders.length}</span>
            )}
          </div>
          {urgentOrders.length === 0 ? (
            <div className="px-4 py-8 flex flex-col items-center gap-2 text-muted-foreground">
              <CheckCircle className="w-8 h-8 opacity-20 text-emerald-500" />
              <p className="text-xs">{language === 'bn' ? 'কোনো জরুরি অর্ডার নেই' : 'No urgent orders'}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {urgentOrders.map(order => {
                const customer = getCustomer(order.customerId);
                const daysLeft = Math.ceil((new Date(order.deliveryDate).getTime() - Date.now()) / 86400000);
                const isOverdue = daysLeft < 0;
                return (
                  <Link key={order.id} href="/orders" className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400/20 to-rose-600/10 flex items-center justify-center text-xs font-bold text-rose-600 shrink-0">
                      {customer?.name.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{customer?.name || '-'}</p>
                      <p className="text-[10px] text-muted-foreground">{order.deliveryDate}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${isOverdue ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {isOverdue ? (language === 'bn' ? 'দেরি' : 'Late') : `${daysLeft}d`}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Top customers */}
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
          {topCustomers.length === 0 ? (
            <div className="px-4 py-8 flex flex-col items-center gap-2 text-muted-foreground">
              <Users className="w-8 h-8 opacity-20" />
              <p className="text-xs">{t('noData')}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {topCustomers.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3 px-4 py-2.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    i === 0 ? 'bg-amber-400/20 text-amber-600' :
                    i === 1 ? 'bg-slate-300/30 text-slate-600' :
                    i === 2 ? 'bg-orange-400/20 text-orange-600' :
                               'bg-muted text-muted-foreground'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.count} {language === 'bn' ? 'অর্ডার' : 'orders'}</p>
                  </div>
                  <span className="text-xs font-bold text-primary shrink-0">{cur}{c.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders per month mini bar */}
        <div className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
          <div className="mb-3">
            <h3 className="font-semibold text-foreground text-sm">{language === 'bn' ? 'মাসিক অর্ডার' : 'Orders / Month'}</h3>
            <p className="text-xs text-muted-foreground">{language === 'bn' ? 'গত ৭ মাস' : 'Last 7 months'}</p>
          </div>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barSize={14}>
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
          {/* collection rate */}
          <div className="mt-3 pt-3 border-t border-border/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">{language === 'bn' ? 'সংগ্রহের হার' : 'Collection rate'}</span>
              <span className="font-bold text-foreground">{totalRevenue > 0 ? Math.round(((totalRevenue - totalDue) / totalRevenue) * 100) : 0}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700"
                style={{ width: `${totalRevenue > 0 ? Math.round(((totalRevenue - totalDue) / totalRevenue) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent orders ────────────────────────────────────────── */}
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

        {recentOrders.length === 0 ? (
          <div className="px-5 py-12 flex flex-col items-center gap-3 text-muted-foreground">
            <ShoppingCart className="w-10 h-10 opacity-20" />
            <p className="text-sm">{t('noData')}</p>
          </div>
        ) : (
          <>
            {/* Mobile list */}
            <div className="md:hidden divide-y divide-border/60">
              {recentOrders.map(order => {
                const customer = getCustomer(order.customerId);
                const product = order.items[0] ? getProduct(order.items[0].productId) : null;
                return (
                  <Link key={order.id} href="/orders" className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 active:bg-muted/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/15 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                      {customer?.name.charAt(0) || '#'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{customer?.name || '-'}</p>
                        <p className="text-sm font-bold text-foreground shrink-0">{cur}{order.totalPrice.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center justify-between mt-1 gap-2">
                        <p className="text-[11px] text-muted-foreground truncate">
                          {product?.nameBn || '-'}{order.items.length > 1 ? ` +${order.items.length - 1}` : ''}
                        </p>
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Desktop table */}
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
                  {recentOrders.map(order => {
                    const customer = getCustomer(order.customerId);
                    const productName = order.items.map(i => getProduct(i.productId)?.nameBn).filter(Boolean).join(', ') || '-';
                    return (
                      <tr key={order.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors group">
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded-lg text-muted-foreground">#{order.id.slice(-6).toUpperCase()}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                              {customer?.name.charAt(0) || '?'}
                            </div>
                            <span className="font-medium text-foreground">{customer?.name || '-'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground max-w-[130px] truncate text-xs">{productName}</td>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
