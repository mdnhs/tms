import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Customer, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, Order, OrderStatus, Product } from '@/types';
import {
  Hammer, FileText, Calendar, Ruler,
  Clock, Wrench, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, Package,
} from 'lucide-react';

/* ── helpers ─────────────────────────────────────────── */
const AVATAR_COLORS = [
  'from-violet-400 to-purple-600',
  'from-sky-400 to-blue-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-red-600',
  'from-fuchsia-400 to-pink-600',
  'from-cyan-400 to-sky-600',
  'from-lime-400 to-green-600',
];
function avatarGradient(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

type StatusIconComponent = typeof Clock | typeof Wrench | typeof CheckCircle2;

const STATUS_STYLES: Record<string, { bg: string; icon: StatusIconComponent; iconColor: string; value: string; bar: string }> = {
  pending:       { bg: 'bg-warning/10 border-warning/20',   icon: Clock,        iconColor: 'text-warning',  value: 'text-warning',  bar: 'bg-warning' },
  in_production: { bg: 'bg-primary/10 border-primary/20',  icon: Wrench,       iconColor: 'text-primary',  value: 'text-primary',  bar: 'bg-primary' },
  ready:         { bg: 'bg-success/10 border-success/20',  icon: CheckCircle2, iconColor: 'text-success',  value: 'text-success',  bar: 'bg-success' },
};

/* ── component ───────────────────────────────────────── */
export default function CraftsmanDashboard() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [staffList, setStaffList] = useState<Array<{ id: string; name: string }>>([]);
  const [userType, setUserType] = useState<'owner' | 'staff'>('owner');
  const [staffId, setStaffId] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/orders-list-data', { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load craftsman dashboard');
        if (cancelled) return;
        setOrders(data.orders || []);
        setCustomers(data.customers || []);
        setProducts(data.products || []);
        setStaffList(data.staff || []);
        setUserType(data.userType === 'staff' ? 'staff' : 'owner');
        setStaffId(data.staffId || null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadData();
    return () => { cancelled = true; };
  }, []);

  const getStaffName = (id: string) => staffList.find(s => s.id === id)?.name || t('notAssigned');
  const getCustomer = (id: string) => customers.find(customer => customer.id === id);
  const getProduct = (id: string) => products.find(product => product.id === id);

  const assignedOrders = useMemo(
    () => orders.filter(o => {
      if (!o.assignedTo || o.status === 'delivered' || o.status === 'cancelled') return false;
      // Staff can only see their own assigned orders
      if (userType === 'staff' && staffId) return o.assignedTo === staffId;
      return true;
    }),
    [orders, userType, staffId],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { pending: 0, in_production: 0, ready: 0 };
    assignedOrders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });
    return counts;
  }, [assignedOrders]);

  const overdueCount = useMemo(() =>
    assignedOrders.filter(o =>
      o.deliveryDate && Math.ceil((new Date(o.deliveryDate).getTime() - Date.now()) / 86400000) <= 0
    ).length,
  [assignedOrders]);

  const groupedByCraftsman = useMemo(() => {
    const groups: Record<string, typeof assignedOrders> = {};
    assignedOrders.forEach(o => {
      const key = o.assignedTo!;
      if (!groups[key]) groups[key] = [];
      groups[key].push(o);
    });
    // Sort groups: most orders first
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [assignedOrders]);

  const toggleExpand = (orderId: string) =>
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));

  const total = assignedOrders.length;

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-10 w-56 rounded bg-muted" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 rounded-2xl border border-border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Hammer className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            {t('craftsmanDashboard')}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{t('craftsmanDashboardDesc')}</p>
        </div>
        {total > 0 && (
          <div className="shrink-0 text-right">
            <p className="text-2xl font-bold text-foreground">{total}</p>
            <p className="text-xs text-muted-foreground">{t('ordersCount')}</p>
          </div>
        )}
      </div>

      {/* ── Status cards ── */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {(['pending', 'in_production', 'ready'] as OrderStatus[]).map(status => {
          const s = STATUS_STYLES[status];
          const Icon = s.icon;
          const count = statusCounts[status] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={status} className={`rounded-2xl border ${s.bg} px-3 md:px-4 pt-3 pb-4`}>
              <div className="flex items-center justify-between mb-1">
                <Icon className={`w-4 h-4 ${s.iconColor}`} />
                <span className={`text-[10px] font-semibold ${s.value} opacity-70`}>{pct}%</span>
              </div>
              <p className={`text-2xl md:text-3xl font-bold ${s.value} leading-none mb-1`}>{count}</p>
              <p className={`text-[10px] font-medium ${s.value} opacity-70 mb-2`}>{ORDER_STATUS_LABELS[status]}</p>
              {/* Mini progress bar */}
              <div className="h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div className={`h-full rounded-full ${s.bar} transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Overdue alert ── */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/25 rounded-2xl px-4 py-3">
          <div className="w-7 h-7 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-semibold text-destructive">
              {overdueCount} {t('ordersCount')} {t('overdue')}
            </p>
            <p className="text-xs text-destructive/70">{t('deliveryDate')} exceeded</p>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {assignedOrders.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground">
          <div className="w-20 h-20 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-4">
            <Hammer className="w-9 h-9 opacity-25" />
          </div>
          <p className="text-base font-semibold">{t('noAssignedOrders')}</p>
          <p className="text-sm mt-1 opacity-60">{t('craftsmanDashboardDesc')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByCraftsman.map(([staffId, groupOrders]) => {
            const name = getStaffName(staffId);
            const grad = avatarGradient(name);
            const groupOverdue = groupOrders.filter(o =>
              o.deliveryDate && Math.ceil((new Date(o.deliveryDate).getTime() - Date.now()) / 86400000) <= 0
            ).length;

            return (
              <div key={staffId}>

                {/* ── Craftsman section header ── */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-base shadow-md shrink-0`}>
                    {name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground">{name}</p>
                      {groupOverdue > 0 && (
                        <span className="text-[10px] font-semibold bg-destructive/15 text-destructive px-2 py-0.5 rounded-full">
                          {groupOverdue} {t('overdue')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">{groupOrders.length} {t('ordersCount')}</p>
                      {/* status breakdown */}
                      <div className="flex items-center gap-1.5">
                        {(['pending', 'in_production', 'ready'] as OrderStatus[]).map(st => {
                          const cnt = groupOrders.filter(o => o.status === st).length;
                          if (!cnt) return null;
                          const s = STATUS_STYLES[st];
                          return (
                            <span key={st} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${ORDER_STATUS_COLORS[st]}`}>
                              {ORDER_STATUS_LABELS[st]} {cnt}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Order cards ── */}
                <div className="space-y-2.5 md:pl-13">
                  {groupOrders.map((order, idx) => {
                    const customer = getCustomer(order.customerId);
                    const daysLeft = order.deliveryDate
                      ? Math.ceil((new Date(order.deliveryDate).getTime() - Date.now()) / 86400000)
                      : null;
                    const isOverdue = daysLeft !== null && daysLeft <= 0;
                    const isUrgent = daysLeft !== null && daysLeft > 0 && daysLeft <= 2;
                    const hasMeasurements = order.items.some(item => item.measurements.length > 0);
                    const isExpanded = expandedOrders[order.id] ?? false;

                    return (
                      <div
                        key={order.id}
                        className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${
                          isOverdue ? 'border-destructive/40 bg-destructive/5' : idx % 2 === 0 ? 'bg-card border-border' : 'bg-muted/25 border-border'
                        }`}
                      >
                        {/* Urgency top stripe */}
                        {(isOverdue || isUrgent) && (
                          <div className={`h-0.5 w-full ${isOverdue ? 'bg-destructive' : 'bg-warning'}`} />
                        )}

                        {/* Main card body */}
                        <div className="px-4 py-3.5">
                          <div className="flex items-start justify-between gap-3 mb-2.5">

                            {/* Customer + product info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <p className="text-sm font-bold text-foreground">{customer?.name || '-'}</p>
                                <code className="text-[10px] text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded font-mono">
                                  #{order.id.slice(-6).toUpperCase()}
                                </code>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {order.items.map((item, i) => {
                                  const p = getProduct(item.productId);
                                  return (
                                    <span key={i} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                                      <Package className="w-2.5 h-2.5" />
                                      {p?.nameBn || p?.name || '-'}
                                      {item.quantity > 1 && <span className="font-semibold">×{item.quantity}</span>}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Status badge */}
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${ORDER_STATUS_COLORS[order.status]}`}>
                              {ORDER_STATUS_LABELS[order.status]}
                            </span>
                          </div>

                          {/* Delivery date row */}
                          {order.deliveryDate && (
                            <div className="flex items-center gap-2 mb-2.5">
                              <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
                                isOverdue ? 'bg-destructive/15 text-destructive font-semibold' :
                                isUrgent  ? 'bg-warning/15 text-warning font-semibold' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                <Calendar className="w-3 h-3 shrink-0" />
                                {order.deliveryDate}
                                {daysLeft !== null && (
                                  <span className="font-bold ml-0.5">
                                    · {isOverdue ? t('overdue') : `${daysLeft}d`}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Expandable measurements */}
                          {hasMeasurements && (
                            <button
                              onClick={() => toggleExpand(order.id)}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-xs font-semibold text-muted-foreground"
                            >
                              <div className="flex items-center gap-1.5">
                                <Ruler className="w-3.5 h-3.5 text-primary" />
                                <span className="text-primary">{t('stepMeasurement')}</span>
                              </div>
                              {isExpanded
                                ? <ChevronUp className="w-3.5 h-3.5" />
                                : <ChevronDown className="w-3.5 h-3.5" />
                              }
                            </button>
                          )}

                          {/* Measurement chips — collapsed by default */}
                          {hasMeasurements && isExpanded && (
                            <div className="mt-2 space-y-3">
                              {order.items.map((item, itemIdx) => {
                                if (item.measurements.length === 0) return null;
                                const p = getProduct(item.productId);
                                return (
                                  <div key={itemIdx}>
                                    {order.items.length > 1 && p && (
                                      <div className="flex items-center gap-1.5 mb-2">
                                        <div className="w-1 h-4 rounded-full bg-primary" />
                                        <p className="text-xs font-bold text-primary">{p.nameBn || p.name}</p>
                                      </div>
                                    )}
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5">
                                      {item.measurements.map(m => (
                                        <div key={m.fieldId} className="bg-card border border-border/60 rounded-xl p-2 text-center shadow-sm">
                                          <p className="text-[9px] text-muted-foreground leading-tight mb-1">{m.fieldNameBn}</p>
                                          <p className="text-sm font-bold text-foreground">{m.value || '—'}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Special notes */}
                          {order.specialNotes && (
                            <div className="mt-2.5 flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 rounded-xl px-3 py-2">
                              <span className="text-base leading-none mt-0.5">📝</span>
                              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{order.specialNotes}</p>
                            </div>
                          )}
                        </div>

                        {/* Card footer */}
                        <div className="px-4 py-2.5 border-t border-border/60 flex items-center justify-between">
                          <p className="text-[11px] text-muted-foreground">
                            {customer?.phone && <span className="font-mono">{customer.phone}</span>}
                          </p>
                          <Link
                            href={`/invoice/${order.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {t('craftsmanInvoice')}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
