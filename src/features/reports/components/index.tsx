'use client';
import { useMemo, useState } from 'react';
import { useApiQuery } from '@/hooks/use-api-query';
import { queryKeys } from '@/lib/query-keys';
import { usePagination } from '@/hooks/use-pagination';
import Pagination from '@/components/Pagination';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Customer, ORDER_STATUS_LABELS, Order, Product } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, List, Users, CalendarIcon, BarChart3, TrendingUp, Wallet, AlertCircle, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import html2pdf from 'html2pdf.js';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_BADGE: Record<string, string> = {
  pending:       'bg-warning/15 text-warning border-warning/30',
  in_production: 'bg-primary/15 text-primary border-primary/30',
  ready:         'bg-success/15 text-success border-success/30',
  delivered:     'bg-muted text-muted-foreground border-border',
  cancelled:     'bg-destructive/15 text-destructive border-destructive/30',
};

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

function nameInitials(name: string) {
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
}

function SummarySkeleton() {
  return (
    <div className="flex items-center gap-1.5 animate-pulse">
      <div className="w-3.5 h-3.5 rounded-full bg-current opacity-20 flex items-center justify-center shrink-0">
        <Scissors className="w-2 h-2" />
      </div>
      <Skeleton className="h-5 w-16 bg-current opacity-20" />
    </div>
  );
}

function TableSkeleton({ cols = 7 }: { cols?: number }) {
  return (
    <div className="bg-card">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-border/50 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 opacity-60">
            <Scissors className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-2.5 w-1/2 opacity-60" />
          </div>
          <div className="hidden md:flex gap-4">
            {Array.from({ length: cols - 2 }).map((_, j) => (
              <Skeleton key={j} className="h-4 w-16 bg-muted" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const { settings } = useData();
  const { t } = useLanguage();
  const [period, setPeriod] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('orders');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const cur = settings.currency;

  interface OrdersListData {
    orders: Order[];
    customers: Customer[];
    products: Product[];
  }
  const { data: pageData, isLoading: loading } = useApiQuery<OrdersListData>(
    queryKeys.orders, '/api/orders-list-data'
  );
  const orders = pageData?.orders || [];
  const customers = pageData?.customers || [];
  const products = pageData?.products || [];

  const getCustomer = (id: string) => customers.find(customer => customer.id === id);
  const getProduct = (id: string) => products.find(product => product.id === id);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (period === 'custom') {
      if (dateFrom) result = result.filter(o => new Date(o.createdAt) >= dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        result = result.filter(o => new Date(o.createdAt) <= end);
      }
    } else if (period !== 'all') {
      const now = new Date();
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const cutoff = new Date(now.getTime() - days * 86400000);
      result = result.filter(o => new Date(o.createdAt) >= cutoff);
    }
    if (statusFilter !== 'all') result = result.filter(o => o.status === statusFilter);
    return result;
  }, [orders, period, statusFilter, dateFrom, dateTo]);

  const summary = useMemo(() => ({
    totalOrders: filteredOrders.length,
    totalRevenue: filteredOrders.reduce((s, o) => s + o.totalPrice, 0),
    totalAdvance: filteredOrders.reduce((s, o) => s + o.advancePaid, 0),
    totalDue: filteredOrders.reduce((s, o) => s + o.dueAmount, 0),
  }), [filteredOrders]);

  const customerReport = useMemo(() => {
    const map: Record<string, { name: string; phone: string; orders: number; total: number; advance: number; due: number }> = {};
    filteredOrders.forEach(o => {
      const c = getCustomer(o.customerId);
      if (!c) return;
      if (!map[c.id]) map[c.id] = { name: c.name, phone: c.phone, orders: 0, total: 0, advance: 0, due: 0 };
      map[c.id].orders++;
      map[c.id].total += o.totalPrice;
      map[c.id].advance += o.advancePaid;
      map[c.id].due += o.dueAmount;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredOrders, getCustomer]);

  const { page: ordersPage, setPage: setOrdersPage, pageData: pagedOrders, totalPages: ordersTotalPages, totalItems: ordersTotalItems, from: ordersFrom, to: ordersTo } = usePagination(filteredOrders, 10);
  const { page: custPage, setPage: setCustPage, pageData: pagedCustomers, totalPages: custTotalPages, totalItems: custTotalItems, from: custFrom, to: custTo } = usePagination(customerReport, 10);

  const exportCSV = (type: 'orders' | 'customers') => {
    let csv = '';
    if (type === 'orders') {
      const headers = ['#', 'Date', 'Customer', 'Phone', 'Product', 'Qty', 'Unit Price', 'Total', 'Advance', 'Due', 'Status', 'Delivery Date'];
      const rows = filteredOrders.map((o, i) => {
        const c = getCustomer(o.customerId);
        const productNames = o.items.map(item => getProduct(item.productId)?.name).filter(Boolean).join(' + ') || '-';
        const totalQty = o.items.reduce((s, item) => s + item.quantity, 0);
        return [i + 1, format(new Date(o.createdAt), 'yyyy-MM-dd'), c?.name || '-', c?.phone || '-', productNames, totalQty, '-', o.totalPrice, o.advancePaid, o.dueAmount, o.status, o.deliveryDate || '-'].join(',');
      });
      csv = [headers.join(','), ...rows].join('\n');
    } else {
      const headers = ['#', 'Customer', 'Phone', 'Orders', 'Total', 'Advance', 'Due'];
      const rows = customerReport.map((c, i) => [i + 1, c.name, c.phone, c.orders, c.total, c.advance, c.due].join(','));
      csv = [headers.join(','), ...rows].join('\n');
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${type}-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const tableId = activeTab === 'orders' ? 'orders-table' : 'customers-table';
    const el = document.getElementById(tableId);
    if (!el) return;
    html2pdf().set({
      margin: [10, 5],
      filename: `${activeTab}-report-${new Date().toISOString().slice(0, 10)}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const },
    }).from(el).save();
  };

  const STAT_CARDS = [
    { label: t('totalOrders'), value: summary.totalOrders, icon: List, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { label: t('totalRevenue'), value: `${cur}${summary.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-success', bg: 'bg-success/10 border-success/20' },
    { label: t('totalAdvance'), value: `${cur}${summary.totalAdvance.toLocaleString()}`, icon: Wallet, color: 'text-chart-3', bg: 'bg-chart-3/10 border-chart-3/20' },
    { label: t('totalDue'), value: `${cur}${summary.totalDue.toLocaleString()}`, icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
  ];

  return (
    <div className="space-y-4 md:space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            {t('reports')}
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-0.5">{t('reportsDesc')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => exportCSV(activeTab as 'orders' | 'customers')} className="gap-1.5 text-xs rounded-xl" disabled={loading}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} className="gap-1.5 text-xs rounded-xl" disabled={loading}>
            <FileText className="h-3.5 w-3.5" /> PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[130px] h-9 text-xs rounded-xl bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">{t('last7days')}</SelectItem>
            <SelectItem value="30d">{t('last30days')}</SelectItem>
            <SelectItem value="90d">{t('last90days')}</SelectItem>
            <SelectItem value="custom">{t('customDate')}</SelectItem>
            <SelectItem value="all">{t('allTime')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] h-9 text-xs rounded-xl bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatus')}</SelectItem>
            <SelectItem value="pending">{t('pending')}</SelectItem>
            <SelectItem value="in_production">{t('in_production')}</SelectItem>
            <SelectItem value="ready">{t('ready')}</SelectItem>
            <SelectItem value="delivered">{t('delivered')}</SelectItem>
          </SelectContent>
        </Select>

        {period === 'custom' && (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn('w-[130px] justify-start text-left text-xs h-9 rounded-xl', !dateFrom && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                  {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : t('fromDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} autoFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn('w-[130px] justify-start text-left text-xs h-9 rounded-xl', !dateTo && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                  {dateTo ? format(dateTo, 'dd/MM/yyyy') : t('toDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} autoFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-2xl border px-4 py-3 ${bg}`}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className={`text-lg font-bold ${color}`}>
              {loading ? <SummarySkeleton /> : value}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="orders" onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full md:w-auto rounded-xl">
          <TabsTrigger value="orders" className="gap-1.5 flex-1 md:flex-none text-xs md:text-sm rounded-lg">
            <List className="h-3.5 w-3.5" />{t('orderReport')}
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-1.5 flex-1 md:flex-none text-xs md:text-sm rounded-lg">
            <Users className="h-3.5 w-3.5" />{t('customerReport')}
          </TabsTrigger>
        </TabsList>

        {/* ── Orders Tab ── */}
        <TabsContent value="orders" className="space-y-3">

          {/* Mobile cards */}
          <div className="md:hidden space-y-2.5">
            {loading ? (
              <TableSkeleton cols={2} />
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t('noData')}</p>
              </div>
            ) : pagedOrders.map((order, idx) => {
              const customer = getCustomer(order.customerId);
              const productNames = order.items.map(item => getProduct(item.productId)?.nameBn).filter(Boolean).join(', ') || '-';
              const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
              return (
                <div key={order.id} className={`rounded-2xl border border-border shadow-sm overflow-hidden ${idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'}`}>
                  <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{customer?.name || '-'}</p>
                      <p className="text-xs text-muted-foreground truncate">{productNames} ×{totalQty}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="font-mono text-[10px] text-muted-foreground">{format(new Date(order.createdAt), 'dd/MM/yy')}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_BADGE[order.status] || STATUS_BADGE.delivered}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </div>
                  </div>
                  <div className="px-4 pb-3 flex items-center gap-4 border-t border-border/50 pt-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">{t('total')}</p>
                      <p className="font-bold text-foreground">{cur}{order.totalPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('advance')}</p>
                      <p className="font-bold text-chart-3">{cur}{order.advancePaid.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('due')}</p>
                      <p className={`font-bold ${order.dueAmount > 0 ? 'text-destructive' : 'text-success'}`}>
                        {order.dueAmount > 0 ? `${cur}${order.dueAmount.toLocaleString()}` : '✓'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div id="orders-table" className="hidden md:block rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium w-10">#</th>
                    <th className="text-left px-4 py-3 font-medium">{t('date')}</th>
                    <th className="text-left px-4 py-3 font-medium">{t('customerName')}</th>
                    <th className="text-left px-4 py-3 font-medium">{t('productName')}</th>
                    <th className="text-right px-4 py-3 font-medium">{t('qty')}</th>
                    <th className="text-right px-4 py-3 font-medium">{t('total')}</th>
                    <th className="text-right px-4 py-3 font-medium">{t('advance')}</th>
                    <th className="text-right px-4 py-3 font-medium">{t('due')}</th>
                    <th className="text-left px-4 py-3 font-medium">{t('status')}</th>
                    <th className="text-left px-4 py-3 font-medium">{t('deliveryDate')}</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={10} className="p-0"><TableSkeleton cols={10} /></td></tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">{t('noData')}</td></tr>
                  ) : pagedOrders.map((order, i) => {
                    const customer = getCustomer(order.customerId);
                    const productNames = order.items.map(item => getProduct(item.productId)?.nameBn || getProduct(item.productId)?.name).filter(Boolean).join(', ') || '-';
                    const totalQty = order.items.reduce((s, it) => s + it.quantity, 0);
                    return (
                      <tr key={order.id} className={`transition-colors hover:bg-primary/5 ${i % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{ordersFrom + i}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">{format(new Date(order.createdAt), 'dd/MM/yyyy')}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{customer?.name || '-'}</p>
                          <p className="text-[11px] text-muted-foreground">{customer?.phone || ''}</p>
                        </td>
                        <td className="px-4 py-3 max-w-[180px]"><span className="truncate block text-sm">{productNames}</span></td>
                        <td className="px-4 py-3 text-right text-sm">{totalQty}</td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">{cur}{order.totalPrice.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-chart-3 font-medium">{cur}{order.advancePaid.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          {order.dueAmount > 0
                            ? <span className="font-semibold text-destructive">{cur}{order.dueAmount.toLocaleString()}</span>
                            : <span className="text-xs font-medium text-success">✓</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_BADGE[order.status] || STATUS_BADGE.delivered}`}>
                            {ORDER_STATUS_LABELS[order.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">{order.deliveryDate || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                {!loading && filteredOrders.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/40 font-semibold text-sm">
                      <td colSpan={4} className="px-4 py-3 text-right text-muted-foreground">{t('total')}</td>
                      <td className="px-4 py-3 text-right">{filteredOrders.reduce((s, o) => s + o.items.reduce((si, it) => si + it.quantity, 0), 0)}</td>
                      <td className="px-4 py-3 text-right text-foreground">{cur}{summary.totalRevenue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-chart-3">{cur}{summary.totalAdvance.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-destructive">{cur}{summary.totalDue.toLocaleString()}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
          <Pagination page={ordersPage} totalPages={ordersTotalPages} totalItems={ordersTotalItems} from={ordersFrom} to={ordersTo} onPageChange={setOrdersPage} />
        </TabsContent>

        {/* ── Customers Tab ── */}
        <TabsContent value="customers" className="space-y-3">

          {/* Mobile cards */}
          <div className="md:hidden space-y-2.5">
            {loading ? (
              <TableSkeleton cols={2} />
            ) : customerReport.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t('noData')}</p>
              </div>
            ) : pagedCustomers.map((c, idx) => {
              const grad = avatarGradient(c.name);
              return (
                <div key={idx} className={`rounded-2xl border border-border shadow-sm overflow-hidden ${idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'}`}>
                  <div className="px-4 pt-3 pb-2 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {nameInitials(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full shrink-0">{c.orders} {t('ordersCount')}</span>
                  </div>
                  <div className="px-4 pb-3 grid grid-cols-3 gap-3 border-t border-border/50 pt-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground">{t('total')}</p>
                      <p className="text-xs font-bold text-foreground">{cur}{c.total.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">{t('advance')}</p>
                      <p className="text-xs font-bold text-chart-3">{cur}{c.advance.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">{t('due')}</p>
                      <p className={`text-xs font-bold ${c.due > 0 ? 'text-destructive' : 'text-success'}`}>
                        {c.due > 0 ? `${cur}${c.due.toLocaleString()}` : '✓'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div id="customers-table" className="hidden md:block rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium w-10">#</th>
                    <th className="text-left px-4 py-3 font-medium">{t('customerName')}</th>
                    <th className="text-left px-4 py-3 font-medium">{t('phone')}</th>
                    <th className="text-right px-4 py-3 font-medium">{t('totalOrders')}</th>
                    <th className="text-right px-4 py-3 font-medium">{t('totalRevenue')}</th>
                    <th className="text-right px-4 py-3 font-medium">{t('totalAdvance')}</th>
                    <th className="text-right px-4 py-3 font-medium">{t('totalDue')}</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={7} className="p-0"><TableSkeleton cols={7} /></td></tr>
                  ) : customerReport.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">{t('noData')}</td></tr>
                  ) : pagedCustomers.map((c, i) => {
                    const grad = avatarGradient(c.name);
                    return (
                      <tr key={i} className={`transition-colors hover:bg-primary/5 ${i % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{custFrom + i}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                              {nameInitials(c.name)}
                            </div>
                            <span className="font-medium text-foreground">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{c.phone || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{c.orders}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">{cur}{c.total.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-medium text-chart-3">{cur}{c.advance.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          {c.due > 0
                            ? <span className="font-semibold text-destructive">{cur}{c.due.toLocaleString()}</span>
                            : <span className="text-xs font-medium text-success">✓</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {!loading && customerReport.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/40 font-semibold text-sm">
                      <td colSpan={3} className="px-4 py-3 text-right text-muted-foreground">{t('total')}</td>
                      <td className="px-4 py-3 text-right">{summary.totalOrders}</td>
                      <td className="px-4 py-3 text-right text-foreground">{cur}{summary.totalRevenue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-chart-3">{cur}{summary.totalAdvance.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-destructive">{cur}{summary.totalDue.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
          <Pagination page={custPage} totalPages={custTotalPages} totalItems={custTotalItems} from={custFrom} to={custTo} onPageChange={setCustPage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
