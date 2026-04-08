import { useMemo, useState } from 'react';
import { useApiQuery } from '@/hooks/use-api-query';
import { queryKeys } from '@/lib/query-keys';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Customer, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, Order, OrderStatus, Product } from '@/types';
import {
  Hammer, FileText, Calendar, Ruler,
  Clock, Wrench, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, Package, Scissors,
  Phone, Filter, User, StickyNote,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/context/DataContext';

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
  pending:       { bg: 'bg-warning/10 border-warning/20',  icon: Clock,        iconColor: 'text-warning', value: 'text-warning', bar: 'bg-warning' },
  in_production: { bg: 'bg-primary/10 border-primary/20',  icon: Wrench,       iconColor: 'text-primary', value: 'text-primary', bar: 'bg-primary' },
  ready:         { bg: 'bg-success/10 border-success/20',  icon: CheckCircle2, iconColor: 'text-success', value: 'text-success', bar: 'bg-success' },
};

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'in_production', 'ready'];

function ValueSkeleton() {
  return (
    <div className="flex items-center gap-1.5 animate-pulse">
      <div className="w-3.5 h-3.5 rounded-full bg-current opacity-20 flex items-center justify-center shrink-0">
        <Scissors className="w-2 h-2" />
      </div>
      <Skeleton className="h-5 w-12 bg-current opacity-20" />
    </div>
  );
}

function getDaysLeft(deliveryDate: string) {
  return Math.ceil((new Date(deliveryDate).getTime() - Date.now()) / 86400000);
}

/* ── component ───────────────────────────────────────── */
export default function CraftsmanDashboard() {
  const { t } = useLanguage();
  const { settings } = useData();
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all' | 'overdue'>('all');
  const cur = settings.currency;

  interface OrdersListData {
    orders: Order[];
    customers: Customer[];
    products: Product[];
    staff: Array<{ id: string; name: string }>;
    userType: string;
    staffId: string | null;
  }
  const { data: pageData, isLoading: loading } = useApiQuery<OrdersListData>(
    queryKeys.orders, '/api/orders-list-data'
  );
  const orders = pageData?.orders || [];
  const customers = pageData?.customers || [];
  const products = pageData?.products || [];
  const staffList = pageData?.staff || [];
  const userType = pageData?.userType === 'staff' ? 'staff' as const : 'owner' as const;
  const staffIdFromData = pageData?.staffId || null;

  const getStaffName = (id: string) => staffList.find(s => s.id === id)?.name || t('notAssigned');
  const getCustomer = (id: string) => customers.find(customer => customer.id === id);
  const getProduct = (id: string) => products.find(product => product.id === id);

  const assignedOrders = useMemo(
    () => orders.filter(o => {
      if (!o.assignedTo || o.status === 'delivered' || o.status === 'cancelled') return false;
      if (userType === 'staff' && staffIdFromData) return o.assignedTo === staffIdFromData;
      return true;
    }),
    [orders, userType, staffIdFromData],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { pending: 0, in_production: 0, ready: 0 };
    assignedOrders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });
    return counts;
  }, [assignedOrders]);

  const overdueOrders = useMemo(() =>
    assignedOrders.filter(o => o.deliveryDate && getDaysLeft(o.deliveryDate) <= 0),
    [assignedOrders],
  );

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return assignedOrders;
    if (statusFilter === 'overdue') return overdueOrders;
    return assignedOrders.filter(o => o.status === statusFilter);
  }, [assignedOrders, overdueOrders, statusFilter]);

  // Sort: overdue first, then by delivery date ascending
  const sortedFilteredOrders = useMemo(() =>
    [...filteredOrders].sort((a, b) => {
      const aOverdue = a.deliveryDate ? getDaysLeft(a.deliveryDate) <= 0 : false;
      const bOverdue = b.deliveryDate ? getDaysLeft(b.deliveryDate) <= 0 : false;
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      if (a.deliveryDate && b.deliveryDate) return new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
      if (a.deliveryDate) return -1;
      if (b.deliveryDate) return 1;
      return 0;
    }),
    [filteredOrders],
  );

  const groupedByCraftsman = useMemo(() => {
    const groups: Record<string, typeof sortedFilteredOrders> = {};
    sortedFilteredOrders.forEach(o => {
      const key = o.assignedTo!;
      if (!groups[key]) groups[key] = [];
      groups[key].push(o);
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [sortedFilteredOrders]);

  const toggleExpand = (orderId: string) =>
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));

  const total = assignedOrders.length;

  return (
    <div className="space-y-4 md:space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Hammer className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            {t('craftsmanDashboard')}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{t('craftsmanDashboardDesc')}</p>
        </div>
      </div>

      {/* ── Status summary cards ── */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {ACTIVE_STATUSES.map(status => {
          const s = STATUS_STYLES[status];
          const Icon = s.icon;
          const count = statusCounts[status] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isActive = statusFilter === status;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(prev => prev === status ? 'all' : status)}
              className={`rounded-2xl border ${s.bg} px-3 md:px-4 pt-3 pb-4 text-left transition-all ${
                isActive ? 'ring-2 ring-offset-1 ring-offset-background ring-current scale-[1.02] shadow-md' : 'hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon className={`w-4 h-4 ${s.iconColor}`} />
                <div className={`text-[10px] font-semibold ${s.value} opacity-70`}>
                  {loading ? <Skeleton className="h-3 w-6 bg-current opacity-20" /> : `${pct}%`}
                </div>
              </div>
              <div className={`text-2xl md:text-3xl font-bold ${s.value} leading-none mb-1`}>
                {loading ? <ValueSkeleton /> : count}
              </div>
              <p className={`text-[10px] font-medium ${s.value} opacity-70 mb-2`}>{ORDER_STATUS_LABELS[status]}</p>
              <div className="h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div className={`h-full rounded-full ${s.bar} transition-all`} style={{ width: `${loading ? 0 : pct}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Overdue alert (clickable filter) ── */}
      {!loading && overdueOrders.length > 0 && (
        <button
          onClick={() => setStatusFilter(prev => prev === 'overdue' ? 'all' : 'overdue')}
          className={`w-full flex items-center gap-3 bg-destructive/10 border border-destructive/25 rounded-2xl px-4 py-3 transition-all text-left ${
            statusFilter === 'overdue' ? 'ring-2 ring-destructive/50 ring-offset-1 ring-offset-background shadow-md' : 'hover:bg-destructive/15'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-destructive">
              {overdueOrders.length} {t('ordersCount')} {t('overdue')}
            </p>
            <p className="text-xs text-destructive/70">{t('deliveryDate')} exceeded</p>
          </div>
          <div className="text-2xl font-bold text-destructive">{overdueOrders.length}</div>
        </button>
      )}

      {/* ── Active filter indicator ── */}
      {!loading && statusFilter !== 'all' && (
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">
            {statusFilter === 'overdue' ? t('overdue') : ORDER_STATUS_LABELS[statusFilter]}
          </span>
          <span className="text-xs text-muted-foreground">
            — {sortedFilteredOrders.length} / {total} {t('ordersCount')}
          </span>
          <button
            onClick={() => setStatusFilter('all')}
            className="ml-auto text-[11px] font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 px-2.5 py-1 rounded-lg transition-colors"
          >
            {t('clear')}
          </button>
        </div>
      )}

      {/* ── Main content / Skeletons ── */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2].map(i => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center shrink-0 opacity-60">
                  <Scissors className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-1/3 opacity-60" />
                </div>
              </div>
              <div className="space-y-2.5 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-2.5 md:pl-13">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-36 rounded-2xl border border-border bg-card/50 animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : assignedOrders.length === 0 ? (
        /* Empty state */
        <div className="py-20 text-center text-muted-foreground">
          <div className="w-20 h-20 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-4">
            <Hammer className="w-9 h-9 opacity-25" />
          </div>
          <p className="text-base font-semibold">{t('noAssignedOrders')}</p>
          <p className="text-sm mt-1 opacity-60">{t('craftsmanDashboardDesc')}</p>
        </div>
      ) : sortedFilteredOrders.length === 0 ? (
        /* Filtered empty */
        <div className="py-16 text-center text-muted-foreground">
          <div className="w-14 h-14 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-3">
            <Filter className="w-6 h-6 opacity-30" />
          </div>
          <p className="text-sm font-medium">
            {statusFilter === 'overdue' ? t('overdue') : ORDER_STATUS_LABELS[statusFilter]} — কোনো অর্ডার নেই
          </p>
          <button
            onClick={() => setStatusFilter('all')}
            className="mt-2 text-xs font-medium text-primary hover:underline"
          >
            সব দেখুন
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByCraftsman.map(([sId, groupOrders]) => {
            const name = getStaffName(sId);
            const grad = avatarGradient(name);
            const groupOverdue = groupOrders.filter(o =>
              o.deliveryDate && getDaysLeft(o.deliveryDate) <= 0
            ).length;
            const groupPending = groupOrders.filter(o => o.status === 'pending').length;
            const groupInProd = groupOrders.filter(o => o.status === 'in_production').length;
            const groupReady = groupOrders.filter(o => o.status === 'ready').length;

            return (
              <div key={sId}>
                {/* ── Craftsman section header ── */}
                <div className="flex items-center gap-3 mb-3 sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-2 -mx-1 px-1 rounded-xl">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-base shadow-md shrink-0`}>
                    {name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground">{name}</p>
                      <span className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {groupOrders.length} {t('ordersCount')}
                      </span>
                      {groupOverdue > 0 && (
                        <span className="text-[10px] font-semibold bg-destructive/15 text-destructive px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {groupOverdue} {t('overdue')}
                        </span>
                      )}
                    </div>
                    {/* Mini status chips */}
                    <div className="flex items-center gap-1.5 mt-1">
                      {groupPending > 0 && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/20">
                          {ORDER_STATUS_LABELS.pending} {groupPending}
                        </span>
                      )}
                      {groupInProd > 0 && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                          {ORDER_STATUS_LABELS.in_production} {groupInProd}
                        </span>
                      )}
                      {groupReady > 0 && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-success/15 text-success border border-success/20">
                          {ORDER_STATUS_LABELS.ready} {groupReady}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Order cards ── */}
                <div className="space-y-2.5 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-2.5 md:pl-13">
                  {groupOrders.map(order => {
                    const customer = getCustomer(order.customerId);
                    const daysLeft = order.deliveryDate ? getDaysLeft(order.deliveryDate) : null;
                    const isOverdue = daysLeft !== null && daysLeft <= 0;
                    const isUrgent = daysLeft !== null && daysLeft > 0 && daysLeft <= 2;
                    const hasMeasurements = order.items.some(item => item.measurements.length > 0);
                    const isExpanded = expandedOrders[order.id] ?? false;

                    return (
                      <div
                        key={order.id}
                        className={`rounded-2xl border shadow-sm overflow-hidden transition-all ${
                          isOverdue
                            ? 'border-destructive/40 bg-destructive/[0.03]'
                            : isUrgent
                              ? 'border-warning/40 bg-warning/[0.03]'
                              : 'bg-card border-border hover:border-border/80 hover:shadow-md'
                        }`}
                      >
                        {/* Urgency top stripe */}
                        {(isOverdue || isUrgent) && (
                          <div className={`h-1 w-full ${isOverdue ? 'bg-gradient-to-r from-destructive to-destructive/60' : 'bg-gradient-to-r from-warning to-warning/60'}`} />
                        )}

                        {/* Main card body */}
                        <div className="px-4 py-3.5">
                          {/* Top row: customer + status */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                                  <p className="text-sm font-bold text-foreground">{customer?.name || '-'}</p>
                                </div>
                                <code className="text-[10px] text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded font-mono">
                                  #{order.id.slice(-6).toUpperCase()}
                                </code>
                              </div>

                              {/* Products */}
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

                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${ORDER_STATUS_COLORS[order.status]}`}>
                              {ORDER_STATUS_LABELS[order.status]}
                            </span>
                          </div>

                          {/* Info row: delivery + price */}
                          <div className="flex items-center gap-2 flex-wrap mb-3">
                            {order.deliveryDate && (
                              <div className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
                                isOverdue ? 'bg-destructive/15 text-destructive font-semibold' :
                                isUrgent  ? 'bg-warning/15 text-warning font-semibold' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                <Calendar className="w-3 h-3 shrink-0" />
                                {order.deliveryDate}
                                {daysLeft !== null && (
                                  <span className="font-bold">
                                    · {isOverdue ? `${Math.abs(daysLeft)}d ${t('overdue')}` : `${daysLeft} ${t('daysLeft')}`}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                              <span className="font-semibold text-foreground">{cur}{order.totalPrice.toLocaleString()}</span>
                              {order.dueAmount > 0 && (
                                <span className="text-destructive font-medium ml-1">
                                  ({t('due')}: {cur}{order.dueAmount.toLocaleString()})
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Expandable measurements */}
                          {hasMeasurements && (
                            <button
                              onClick={() => toggleExpand(order.id)}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-xs font-semibold ${
                                isExpanded
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <Ruler className="w-3.5 h-3.5 text-primary" />
                                <span className="text-primary">{t('stepMeasurement')}</span>
                                <span className="text-[10px] opacity-60 font-normal ml-1">
                                  ({order.items.reduce((a, item) => a + item.measurements.length, 0)} fields)
                                </span>
                              </div>
                              {isExpanded
                                ? <ChevronUp className="w-3.5 h-3.5" />
                                : <ChevronDown className="w-3.5 h-3.5" />
                              }
                            </button>
                          )}

                          {/* Measurement chips */}
                          {hasMeasurements && isExpanded && (
                            <div className="mt-2.5 space-y-3">
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
                              <StickyNote className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{order.specialNotes}</p>
                            </div>
                          )}
                        </div>

                        {/* Card footer */}
                        <div className="px-4 py-2.5 border-t border-border/60 bg-muted/20 flex items-center justify-between">
                          {customer?.phone ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              <span className="font-mono">{customer.phone}</span>
                            </span>
                          ) : (
                            <span />
                          )}
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
