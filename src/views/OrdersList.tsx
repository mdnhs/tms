import { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { ORDER_STATUS_LABELS, OrderStatus, Order, OrderItem } from '@/types';
import { Search, FileText, ChevronDown, Pencil, Banknote, Trash2, History, Clock, Edit3, CreditCard, PlusCircle, XCircle, ClipboardList, Plus, CalendarDays, Hammer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/Pagination';

const STATUSES: (OrderStatus | 'all')[] = ['all', 'pending', 'in_production', 'ready', 'delivered', 'cancelled'];

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  all:           { badge: 'bg-muted text-muted-foreground border-border',                dot: 'bg-muted-foreground' },
  pending:       { badge: 'bg-warning/15 text-warning border-warning/30',               dot: 'bg-warning' },
  in_production: { badge: 'bg-primary/15 text-primary border-primary/30',               dot: 'bg-primary' },
  ready:         { badge: 'bg-success/15 text-success border-success/30',               dot: 'bg-success' },
  delivered:     { badge: 'bg-muted text-muted-foreground border-border',               dot: 'bg-muted-foreground' },
  cancelled:     { badge: 'bg-destructive/15 text-destructive border-destructive/30',   dot: 'bg-destructive' },
};

const ACTION_ICONS = {
  created: PlusCircle,
  edited: Edit3,
  status_changed: Clock,
  payment_collected: CreditCard,
  deleted: XCircle,
};

const ACTION_COLORS = {
  created: 'text-success',
  edited: 'text-primary',
  status_changed: 'text-warning',
  payment_collected: 'text-success',
  deleted: 'text-destructive',
};

function nameInitials(name?: string) {
  if (!name) return '#';
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : name[0];
}

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

function avatarGradient(name?: string) {
  if (!name) return AVATAR_COLORS[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export default function OrdersList() {
  const { orders, getCustomer, getProduct, updateOrder, updateOrderStatus, deleteOrder, addOrderHistory, getOrderHistory, hasActionPermission, staffList, getStaffName, userType, staffId } = useData();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [editAdvancePaid, setEditAdvancePaid] = useState(0);
  const [editDeliveryDate, setEditDeliveryDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');

  const [payOrder, setPayOrder] = useState<Order | null>(null);
  const [payAmount, setPayAmount] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [historyOrderId, setHistoryOrderId] = useState<string | null>(null);

  const STATUS_LABELS: Record<string, string> = { all: t('all'), pending: t('pending'), in_production: t('in_production'), ready: t('ready'), delivered: t('delivered'), cancelled: t('cancelled') };

  // Base orders for this user (staff see only their assigned orders)
  const visibleOrders = userType === 'staff' && staffId
    ? orders.filter(o => o.assignedTo === staffId)
    : orders;

  const openEdit = (order: Order) => {
    setEditOrder(order);
    setEditItems(order.items.map(item => ({ ...item, measurements: [...item.measurements] })));
    setEditAdvancePaid(order.advancePaid);
    setEditDeliveryDate(order.deliveryDate);
    setEditNotes(order.specialNotes || '');
    setEditAssignedTo(order.assignedTo || '');
  };

  const updateEditItem = (idx: number, field: 'quantity' | 'unitPrice', value: number) => {
    setEditItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value, totalPrice: field === 'quantity' ? value * item.unitPrice : item.quantity * value } : item));
  };

  const updateEditMeasurement = (itemIdx: number, measIdx: number, value: string) => {
    setEditItems(prev => prev.map((item, i) => i === itemIdx
      ? { ...item, measurements: item.measurements.map((m, j) => j === measIdx ? { ...m, value } : m) }
      : item
    ));
  };

  const saveEdit = () => {
    if (!editOrder) return;
    const totalPrice = editItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const dueAmount = Math.max(0, totalPrice - editAdvancePaid);
    const changes: Record<string, { from: string; to: string }> = {};
    if (editOrder.advancePaid !== editAdvancePaid) changes[t('changeAdvance')] = { from: `৳${editOrder.advancePaid}`, to: `৳${editAdvancePaid}` };
    if (editOrder.deliveryDate !== editDeliveryDate) changes[t('changeDeliveryDate')] = { from: editOrder.deliveryDate, to: editDeliveryDate };
    if ((editOrder.specialNotes || '') !== editNotes) changes[t('changeNotes')] = { from: editOrder.specialNotes || '-', to: editNotes || '-' };
    if ((editOrder.assignedTo || '') !== editAssignedTo) {
      changes[t('assignedTo')] = { from: getStaffName(editOrder.assignedTo || '') || t('notAssigned'), to: getStaffName(editAssignedTo) || t('notAssigned') };
    }

    addOrderHistory(editOrder.id, 'edited', t('orderEdited'), Object.keys(changes).length > 0 ? changes : undefined);
    updateOrder({
      ...editOrder,
      items: editItems,
      totalPrice,
      advancePaid: editAdvancePaid,
      dueAmount,
      deliveryDate: editDeliveryDate,
      specialNotes: editNotes || undefined,
      assignedTo: editAssignedTo || undefined,
    });
    setEditOrder(null);
    toast({ title: t('orderUpdated') });
  };

  const openPay = (order: Order) => {
    setPayOrder(order);
    setPayAmount('');
  };

  const collectPayment = () => {
    if (!payOrder) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0 || amount > payOrder.dueAmount) return;
    addOrderHistory(payOrder.id, 'payment_collected', `৳${amount.toLocaleString('bn-BD')} ${t('paymentCollectedLog')}`, {
      [t('changePaid')]: { from: `৳${payOrder.advancePaid}`, to: `৳${payOrder.advancePaid + amount}` },
      [t('changeDue')]: { from: `৳${payOrder.dueAmount}`, to: `৳${payOrder.dueAmount - amount}` },
    });
    updateOrder({
      ...payOrder,
      advancePaid: payOrder.advancePaid + amount,
      dueAmount: payOrder.dueAmount - amount,
    });
    setPayOrder(null);
    toast({ title: `৳${amount.toLocaleString('bn-BD')} ${t('paymentCollected')}` });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteOrder(deleteTarget.id);
    setDeleteTarget(null);
    toast({ title: t('orderDeleted'), variant: 'destructive' });
  };

  const filtered = orders.filter(o => {
    // Staff can only see orders assigned to them
    if (userType === 'staff' && staffId && o.assignedTo !== staffId) return false;
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search) {
      const customer = getCustomer(o.customerId);
      const matchName = customer?.name.includes(search);
      const matchPhone = customer?.phone.includes(search);
      const matchId = o.id.includes(search);
      if (!matchName && !matchPhone && !matchId) return false;
    }
    return true;
  });

  const { page, setPage, pageData: pagedOrders, totalPages, totalItems, from, to } = usePagination(filtered, 10);

  const historyEntries = historyOrderId ? getOrderHistory(historyOrderId) : [];

  return (
    <div className="space-y-4 md:space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            {t('orders')}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{visibleOrders.length} {t('ordersCount')}</p>
        </div>
        <Link href="/create-order">
          <Button size="sm" className="shrink-0 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/25 hover:opacity-90 transition-all gap-1.5">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('newOrder')}</span>
          </Button>
        </Link>
      </div>

      {/* Search + Filter row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('searchOrderPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl bg-card"
          />
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap shrink-0 ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/25'
                : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {s !== 'all' && statusFilter !== s && (
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[s]?.dot}`} />
            )}
            {STATUS_LABELS[s]}
            {s !== 'all' && (
              <span className={`text-[10px] px-1 rounded-full ${statusFilter === s ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                {visibleOrders.filter(o => o.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-2.5">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <div className="w-14 h-14 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
              <ClipboardList className="w-6 h-6 opacity-40" />
            </div>
            <p className="text-sm font-medium">{t('noOrderFound')}</p>
          </div>
        ) : (
          pagedOrders.map((order, idx) => {
            const customer = getCustomer(order.customerId);
            const productNames = order.items.map(item => getProduct(item.productId)?.nameBn || '').filter(Boolean).join(', ');
            const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
            const grad = avatarGradient(customer?.name);
            const st = STATUS_STYLES[order.status] || STATUS_STYLES.delivered;
            return (
              <div key={order.id} className={`rounded-2xl border border-border shadow-sm overflow-hidden ${idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'}`}>
                {/* Card top */}
                <div className="px-4 pt-3.5 pb-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                      {nameInitials(customer?.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-tight">{customer?.name || '-'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{productNames || '-'} ×{totalQty}</p>
                      {order.assignedTo && getStaffName(order.assignedTo) && (
                        <p className="text-[10px] text-primary/80 mt-0.5 flex items-center gap-1">
                          <Hammer className="w-2.5 h-2.5" /> {getStaffName(order.assignedTo)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="font-mono text-[10px] text-muted-foreground">#{order.id.slice(-6)}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.badge}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                </div>

                {/* Amounts + delivery row */}
                <div className="px-4 pb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground">{t('total')}</p>
                      <p className="text-sm font-bold text-foreground">৳{order.totalPrice.toLocaleString('bn-BD')}</p>
                    </div>
                    {order.dueAmount > 0 ? (
                      <div>
                        <p className="text-[10px] text-muted-foreground">{t('due')}</p>
                        <p className="text-sm font-bold text-destructive">৳{order.dueAmount.toLocaleString('bn-BD')}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[10px] text-muted-foreground">{t('paid')}</p>
                        <p className="text-sm font-bold text-success">✓</p>
                      </div>
                    )}
                  </div>
                  {order.deliveryDate && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted rounded-lg px-2 py-1">
                      <CalendarDays className="w-3 h-3" />
                      {order.deliveryDate}
                    </div>
                  )}
                </div>

                {/* Status selector + actions */}
                <div className="border-t border-border px-3 py-2 flex items-center gap-1">
                  <div className="relative mr-1">
                    <select
                      value={order.status}
                      onChange={e => { updateOrderStatus(order.id, e.target.value as OrderStatus); toast({ title: t('statusUpdated') }); }}
                      className={`appearance-none text-[10px] font-semibold pl-2 pr-5 py-1 rounded-full border cursor-pointer bg-transparent ${st.badge}`}
                    >
                      {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                  </div>
                  <div className="flex-1 flex items-center justify-end gap-0.5">
                    {hasActionPermission('orders', 'edit') && (
                      <button onClick={() => openEdit(order)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title={t('edit')}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {hasActionPermission('orders', 'edit') && order.dueAmount > 0 && (
                      <button onClick={() => openPay(order)} className="p-1.5 rounded-lg hover:bg-success/10 transition-colors text-success" title={t('payment')}>
                        <Banknote className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => setHistoryOrderId(order.id)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title={t('history')}>
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <Link href={`/invoice/${order.id}`} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary" title={t('invoice')}>
                      <FileText className="w-3.5 h-3.5" />
                    </Link>
                    {hasActionPermission('orders', 'delete') && (
                      <button onClick={() => setDeleteTarget(order)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title={t('delete')}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl border border-border overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="bg-card px-5 py-16 text-center text-muted-foreground">
            <div className="w-14 h-14 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
              <ClipboardList className="w-6 h-6 opacity-40" />
            </div>
            <p className="text-sm font-medium">{t('noOrderFound')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">{t('order')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('customerName')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('productName')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('assignedTo')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('deliveryDate')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('total')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('due')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('status')}</th>
                  <th className="text-right px-4 py-3 font-medium">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {pagedOrders.map((order, idx) => {
                  const customer = getCustomer(order.customerId);
                  const productNames = order.items.map(item => {
                    const p = getProduct(item.productId);
                    return `${p?.nameBn || p?.name || '-'} ×${item.quantity}`;
                  }).join(', ');
                  const grad = avatarGradient(customer?.name);
                  const st = STATUS_STYLES[order.status] || STATUS_STYLES.delivered;
                  return (
                    <tr key={order.id} className={`transition-colors group hover:bg-primary/5 ${idx % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-foreground">#{order.id.slice(-6)}</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(order.createdAt).toLocaleDateString('bn-BD')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                            {nameInitials(customer?.name)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground leading-tight">{customer?.name || '-'}</p>
                            <p className="text-[11px] text-muted-foreground">{customer?.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="truncate text-sm text-foreground">{productNames}</p>
                        {order.items.length > 1 && (
                          <p className="text-[11px] text-primary mt-0.5">{order.items.length} {t('items')}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {order.assignedTo && getStaffName(order.assignedTo) ? (
                          <div className="flex items-center gap-1.5">
                            <Hammer className="w-3 h-3 text-primary/70 shrink-0" />
                            <span className="text-xs font-medium text-primary">{getStaffName(order.assignedTo)}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {order.deliveryDate ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarDays className="w-3 h-3 shrink-0" />
                            {order.deliveryDate}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-foreground">৳{order.totalPrice.toLocaleString('bn-BD')}</span>
                      </td>
                      <td className="px-4 py-3">
                        {order.dueAmount > 0 ? (
                          <span className="text-sm font-semibold text-destructive">৳{order.dueAmount.toLocaleString('bn-BD')}</span>
                        ) : (
                          <span className="text-xs font-medium text-success">✓ {t('paid')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative inline-block">
                          <select
                            value={order.status}
                            onChange={e => { updateOrderStatus(order.id, e.target.value as OrderStatus); toast({ title: t('statusUpdatedFull') }); }}
                            className={`appearance-none text-xs font-semibold pl-2.5 py-1 pr-6 rounded-full border cursor-pointer bg-transparent ${st.badge}`}
                          >
                            {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {hasActionPermission('orders', 'edit') && (
                            <button onClick={() => openEdit(order)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title={t('edit')}>
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {hasActionPermission('orders', 'edit') && order.dueAmount > 0 && (
                            <button onClick={() => openPay(order)} className="p-1.5 rounded-lg hover:bg-success/10 text-success transition-colors" title={t('payment')}>
                              <Banknote className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => setHistoryOrderId(order.id)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title={t('history')}>
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <Link href={`/invoice/${order.id}`} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title={t('invoice')}>
                            <FileText className="w-3.5 h-3.5" />
                          </Link>
                          {hasActionPermission('orders', 'delete') && (
                            <button onClick={() => setDeleteTarget(order)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title={t('delete')}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} from={from} to={to} onPageChange={setPage} />

      {/* Edit Order Dialog */}
      <Dialog open={!!editOrder} onOpenChange={open => !open && setEditOrder(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editOrder')}</DialogTitle>
            <DialogDescription>{t('editOrderDesc')}</DialogDescription>
          </DialogHeader>
          {editOrder && (
            <div className="space-y-4">
              {editItems.map((item, itemIdx) => {
                const product = getProduct(item.productId);
                return (
                  <div key={itemIdx} className="border border-border rounded-lg p-3 space-y-3">
                    <p className="text-xs font-semibold text-primary">{product?.nameBn || product?.name}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">{t('quantity')}</label>
                        <Input type="number" min={1} value={item.quantity} onChange={e => updateEditItem(itemIdx, 'quantity', Number(e.target.value) || 1)} className="h-8 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">{t('unitPriceLabel')}</label>
                        <Input type="number" min={0} value={item.unitPrice} onChange={e => updateEditItem(itemIdx, 'unitPrice', Number(e.target.value) || 0)} className="h-8 text-sm" />
                      </div>
                    </div>
                    {item.measurements.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {item.measurements.map((m, measIdx) => (
                          <div key={m.fieldId}>
                            <label className="text-xs text-muted-foreground">{m.fieldNameBn}</label>
                            <Input value={m.value} onChange={e => updateEditMeasurement(itemIdx, measIdx, e.target.value)} className="h-8 text-sm" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('totalPrice')}</span>
                  <span className="font-bold">৳{editItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0).toLocaleString('bn-BD')}</span>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('advancePaid')}</label>
                  <Input type="number" min={0} value={editAdvancePaid} onChange={e => setEditAdvancePaid(Math.max(0, Number(e.target.value) || 0))} />
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-border">
                  <span className="text-muted-foreground">{t('due')}</span>
                  <span className={`font-bold ${Math.max(0, editItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0) - editAdvancePaid) > 0 ? 'text-destructive' : 'text-success'}`}>
                    ৳{Math.max(0, editItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0) - editAdvancePaid).toLocaleString('bn-BD')}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('deliveryDate')}</label>
                <Input type="date" value={editDeliveryDate} onChange={e => setEditDeliveryDate(e.target.value)} />
              </div>

              {staffList.filter(s => s.isActive).length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('assignCraftsman')}</label>
                  <select
                    value={editAssignedTo}
                    onChange={e => setEditAssignedTo(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">{t('notAssigned')}</option>
                    {staffList.filter(s => s.isActive).map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('specialNotes')}</label>
                <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOrder(null)}>{t('cancel')}</Button>
            <Button onClick={saveEdit}>{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Collection Dialog */}
      <Dialog open={!!payOrder} onOpenChange={open => !open && setPayOrder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('collectPayment')}</DialogTitle>
            <DialogDescription>{t('collectPaymentDesc')}</DialogDescription>
          </DialogHeader>
          {payOrder && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{t('totalPrice')}</span><span>৳{payOrder.totalPrice.toLocaleString('bn-BD')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('paid')}</span><span>৳{payOrder.advancePaid.toLocaleString('bn-BD')}</span></div>
                <div className="flex justify-between font-medium border-t border-border pt-1"><span className="text-destructive">{t('due')}</span><span className="text-destructive">৳{payOrder.dueAmount.toLocaleString('bn-BD')}</span></div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('paymentAmount')}</label>
                <Input
                  type="number"
                  min={1}
                  max={payOrder.dueAmount}
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  placeholder={`${t('maxAmount')} ৳${payOrder.dueAmount.toLocaleString('bn-BD')}`}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPayAmount(String(payOrder.dueAmount))} className="text-xs">{t('fullDue')}</Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOrder(null)}>{t('cancel')}</Button>
            <Button onClick={collectPayment} disabled={!payAmount || Number(payAmount) <= 0 || Number(payAmount) > (payOrder?.dueAmount || 0)}>{t('collect')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order History Dialog */}
      <Dialog open={!!historyOrderId} onOpenChange={open => !open && setHistoryOrderId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-4 h-4" /> {t('orderHistory')}
            </DialogTitle>
            <DialogDescription>#{historyOrderId?.slice(-6)} — {t('allChangesLog')}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {historyEntries.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">{t('noHistory')}</div>
            ) : (
              <div className="relative pl-6 space-y-0">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                {historyEntries.map((entry) => {
                  const Icon = ACTION_ICONS[entry.action] || Clock;
                  const colorClass = ACTION_COLORS[entry.action] || 'text-muted-foreground';
                  return (
                    <div key={entry.id} className="relative pb-4">
                      <div className={`absolute -left-6 top-0.5 w-[22px] h-[22px] rounded-full bg-card border-2 border-border flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="pl-2">
                        <p className="text-sm font-medium text-foreground">{entry.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.performedBy && (
                            <span className="font-medium text-foreground/70">{entry.performedBy} · </span>
                          )}
                          {new Date(entry.timestamp).toLocaleDateString('bn-BD')} — {new Date(entry.timestamp).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {entry.changes && Object.keys(entry.changes).length > 0 && (
                          <div className="mt-1.5 space-y-1">
                            {Object.entries(entry.changes).map(([key, val]) => (
                              <div key={key} className="flex items-center gap-1.5 text-xs">
                                <span className="text-muted-foreground">{key}:</span>
                                <span className="line-through text-muted-foreground/60">{val.from}</span>
                                <span className="text-foreground">→</span>
                                <span className="font-medium text-foreground">{val.to}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteOrder')}</AlertDialogTitle>
            <AlertDialogDescription>
              #{deleteTarget?.id.slice(-6)} — {t('deleteOrderDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
