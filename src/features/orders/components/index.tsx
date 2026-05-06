"use client";
import { MeasurementInput } from "@/components/MeasurementInput";
import Pagination from "@/components/Pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/DataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApiQuery, useInvalidate } from "@/hooks/use-api-query";
import { useToast } from "@/hooks/use-toast";
import {
  MeasurementHistoryEntry,
  useMeasurementSuggestions,
} from "@/hooks/use-measurement-history";
import { usePagination } from "@/hooks/use-pagination";
import { queryKeys } from "@/lib/query-keys";
import {
  Customer,
  Order,
  ORDER_STATUS_LABELS,
  OrderHistoryEntry,
  OrderItem,
  OrderStatus,
  Product,
} from "@/types";
import {
  Banknote,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Clock,
  CreditCard,
  Edit3,
  FileText,
  Hammer,
  History,
  Pencil,
  Plus,
  PlusCircle,
  Scissors,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";

type StaffMember = {
  id: string;
  name: string;
  phone?: string;
  role: string;
  isActive: boolean;
};

const STATUSES: (OrderStatus | "all")[] = [
  "all",
  "pending",
  "in_production",
  "ready",
  "delivered",
  "cancelled",
];
const statusValues = [
  "all",
  "pending",
  "in_production",
  "ready",
  "delivered",
  "cancelled",
] as const;

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  all: {
    badge: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
  pending: {
    badge: "bg-warning/15 text-warning border-warning/30",
    dot: "bg-warning",
  },
  in_production: {
    badge: "bg-primary/15 text-primary border-primary/30",
    dot: "bg-primary",
  },
  ready: {
    badge: "bg-success/15 text-success border-success/30",
    dot: "bg-success",
  },
  delivered: {
    badge: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
  cancelled: {
    badge: "bg-destructive/15 text-destructive border-destructive/30",
    dot: "bg-destructive",
  },
};

const ACTION_ICONS = {
  created: PlusCircle,
  edited: Edit3,
  status_changed: Clock,
  payment_collected: CreditCard,
  deleted: XCircle,
};

const ACTION_COLORS = {
  created: "text-success",
  edited: "text-primary",
  status_changed: "text-warning",
  payment_collected: "text-success",
  deleted: "text-destructive",
};

function nameInitials(name?: string) {
  if (!name) return "#";
  const parts = name.trim().split(" ");
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : name[0];
}

const AVATAR_COLORS = [
  "from-violet-400 to-purple-600",
  "from-sky-400 to-blue-600",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-red-600",
  "from-fuchsia-400 to-pink-600",
  "from-cyan-400 to-sky-600",
  "from-lime-400 to-green-600",
];

function avatarGradient(name?: string) {
  if (!name) return AVATAR_COLORS[0];
  let h = 0;
  for (let i = 0; i < name.length; i++)
    h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export default function OrdersList() {
  const { reloadData, hasActionPermission } = useData();
  const { t } = useLanguage();
  const { toast } = useToast();

  const invalidate = useInvalidate();

  interface OrdersPageData {
    orders: Order[];
    customers: Customer[];
    products: Product[];
    staff: StaffMember[];
    measurementHistory: MeasurementHistoryEntry[];
    userType: string;
    staffId: string | null;
  }

  const {
    data: pageData,
    isLoading: loading,
    error: queryError,
  } = useApiQuery<OrdersPageData>(queryKeys.orders, "/api/orders-list-data");
  const orders = pageData?.orders || [];
  const customers = pageData?.customers || [];
  const products = pageData?.products || [];
  const staffList = pageData?.staff || [];
  const userType =
    pageData?.userType === "staff" ? ("staff" as const) : ("owner" as const);
  const staffId = pageData?.staffId || null;
  const error = queryError?.message || "";

  const { getSuggestions } = useMeasurementSuggestions(
    pageData?.measurementHistory || [],
  );
  const [search, setSearch] = useQueryState("search", {
    defaultValue: "",
    shallow: true,
    clearOnDefault: true,
  });
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringLiteral(statusValues)
      .withDefault("all")
      .withOptions({ shallow: true }),
  );
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [updatingAssignedId, setUpdatingAssignedId] = useState<string | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [editAdvancePaid, setEditAdvancePaid] = useState(0);
  const [editDeliveryDate, setEditDeliveryDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");

  const [payOrder, setPayOrder] = useState<Order | null>(null);
  const [payAmount, setPayAmount] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [historyOrderId, setHistoryOrderId] = useState<string | null>(null);
  const [historyEntries, setHistoryEntries] = useState<OrderHistoryEntry[]>([]);

  const STATUS_LABELS: Record<string, string> = {
    all: t("all"),
    pending: t("pending"),
    in_production: t("in_production"),
    ready: t("ready"),
    delivered: t("delivered"),
    cancelled: t("cancelled"),
  };

  const getCustomer = (id: string) =>
    customers.find((customer) => customer.id === id);
  const getProduct = (id: string) =>
    products.find((product) => product.id === id);
  const getStaffName = (id: string) =>
    staffList.find((staff) => staff.id === id)?.name;
  const activeStaffList = staffList.filter((staff) => staff.isActive);

  const visibleOrders =
    userType === "staff" && staffId
      ? orders.filter((order) => order.assignedTo === staffId)
      : orders;

  const filtered = visibleOrders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (!search) return true;
    const customer = getCustomer(order.customerId);
    const matchName = customer?.name.includes(search);
    const matchPhone = customer?.phone.includes(search);
    const matchId = order.id.includes(search);
    return Boolean(matchName || matchPhone || matchId);
  });

  const {
    page,
    setPage,
    pageData: pagedOrders,
    totalPages,
    totalItems,
    from,
    to,
  } = usePagination(filtered, 10);

  const openEdit = (order: Order) => {
    setEditOrder(order);
    setEditItems(
      order.items.map((item) => ({
        ...item,
        measurements: [...item.measurements],
      })),
    );
    setEditAdvancePaid(order.advancePaid);
    setEditDeliveryDate(order.deliveryDate);
    setEditNotes(order.specialNotes || "");
    setEditAssignedTo(order.assignedTo || "");
  };

  const updateEditItem = (
    idx: number,
    field: "quantity" | "unitPrice",
    value: number,
  ) => {
    setEditItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              [field]: value,
              totalPrice:
                field === "quantity"
                  ? value * item.unitPrice
                  : item.quantity * value,
            }
          : item,
      ),
    );
  };

  const updateEditMeasurement = (
    itemIdx: number,
    measIdx: number,
    value: string,
  ) => {
    setEditItems((prev) =>
      prev.map((item, i) =>
        i === itemIdx
          ? {
              ...item,
              measurements: item.measurements.map((m, j) =>
                j === measIdx ? { ...m, value } : m,
              ),
            }
          : item,
      ),
    );
  };

  const saveEdit = async () => {
    if (!editOrder) return;
    setSavingEdit(true);
    const totalPrice = editItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const dueAmount = Math.max(0, totalPrice - editAdvancePaid);
    const nextOrder: Order = {
      ...editOrder,
      items: editItems,
      totalPrice,
      advancePaid: editAdvancePaid,
      dueAmount,
      deliveryDate: editDeliveryDate,
      specialNotes: editNotes || undefined,
      assignedTo: editAssignedTo || undefined,
    };

    const changes: Record<string, { from: string; to: string }> = {};
    if (editOrder.advancePaid !== editAdvancePaid)
      changes[t("changeAdvance")] = {
        from: `৳${editOrder.advancePaid}`,
        to: `৳${editAdvancePaid}`,
      };
    if (editOrder.deliveryDate !== editDeliveryDate)
      changes[t("changeDeliveryDate")] = {
        from: editOrder.deliveryDate,
        to: editDeliveryDate,
      };
    if ((editOrder.specialNotes || "") !== editNotes)
      changes[t("changeNotes")] = {
        from: editOrder.specialNotes || "-",
        to: editNotes || "-",
      };
    if ((editOrder.assignedTo || "") !== editAssignedTo) {
      changes[t("assignedTo")] = {
        from: getStaffName(editOrder.assignedTo || "") || t("notAssigned"),
        to: getStaffName(editAssignedTo) || t("notAssigned"),
      };
    }

    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(nextOrder),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update order");

      await fetch("/api/order-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderId: editOrder.id,
          action: "edited",
          description: t("orderEdited"),
          changes: Object.keys(changes).length > 0 ? changes : undefined,
        }),
      }).catch(() => undefined);

      setEditOrder(null);
      invalidate("order");
      toast({ title: t("orderUpdated") });
    } catch (err) {
      toast({
        title: t("error"),
        description: err instanceof Error ? err.message : "Request failed",
        variant: "destructive",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const openPay = (order: Order) => {
    setPayOrder(order);
    setPayAmount("");
  };

  const collectPayment = async () => {
    if (!payOrder) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0 || amount > payOrder.dueAmount) return;

    setSavingPayment(true);
    const nextOrder: Order = {
      ...payOrder,
      advancePaid: payOrder.advancePaid + amount,
      dueAmount: payOrder.dueAmount - amount,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(nextOrder),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to collect payment");

      await fetch("/api/order-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderId: payOrder.id,
          action: "payment_collected",
          description: `৳${amount.toLocaleString("bn-BD")} ${t("paymentCollectedLog")}`,
          changes: {
            [t("changePaid")]: {
              from: `৳${payOrder.advancePaid}`,
              to: `৳${payOrder.advancePaid + amount}`,
            },
            [t("changeDue")]: {
              from: `৳${payOrder.dueAmount}`,
              to: `৳${payOrder.dueAmount - amount}`,
            },
          },
        }),
      }).catch(() => undefined);

      setPayOrder(null);
      invalidate("order");
      toast({
        title: `৳${amount.toLocaleString("bn-BD")} ${t("paymentCollected")}`,
      });
    } catch (err) {
      toast({
        title: t("error"),
        description: err instanceof Error ? err.message : "Request failed",
        variant: "destructive",
      });
    } finally {
      setSavingPayment(false);
    }
  };

  const handleStatusChange = async (order: Order, status: OrderStatus) => {
    setUpdatingStatusId(order.id);
    const nextOrder = { ...order, status };
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(nextOrder),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      await fetch("/api/order-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderId: order.id,
          action: "status_changed",
          description: "স্ট্যাটাস পরিবর্তন",
          changes: { status: { from: order.status, to: status } },
        }),
      }).catch(() => undefined);

      invalidate("order");
      toast({ title: t("statusUpdatedFull") });
    } catch (err) {
      toast({
        title: t("error"),
        description: err instanceof Error ? err.message : "Request failed",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleAssignedToChange = async (
    order: Order,
    nextAssignedTo: string,
  ) => {
    setUpdatingAssignedId(order.id);
    const nextOrder = {
      ...order,
      assignedTo: nextAssignedTo || undefined,
    };
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(nextOrder),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update assignee");

      await fetch("/api/order-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderId: order.id,
          action: "edited",
          description: t("orderEdited"),
          changes: {
            [t("assignedTo")]: {
              from: getStaffName(order.assignedTo || "") || t("notAssigned"),
              to: getStaffName(nextAssignedTo) || t("notAssigned"),
            },
          },
        }),
      }).catch(() => undefined);

      invalidate("order");
      toast({ title: t("orderUpdated") });
    } catch (err) {
      toast({
        title: t("error"),
        description: err instanceof Error ? err.message : "Request failed",
        variant: "destructive",
      });
    } finally {
      setUpdatingAssignedId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const res = await fetch(`/api/orders?id=${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete order");

      await fetch("/api/order-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderId: deleteTarget.id,
          action: "deleted",
          description: "অর্ডার মুছে ফেলা হয়েছে",
        }),
      }).catch(() => undefined);

      setDeleteTarget(null);
      invalidate("order");
      toast({ title: t("orderDeleted"), variant: "destructive" });
    } catch (err) {
      toast({
        title: t("error"),
        description: err instanceof Error ? err.message : "Request failed",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const openHistory = async (orderId: string) => {
    setHistoryOrderId(orderId);
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `/api/order-history?orderId=${encodeURIComponent(orderId)}`,
        { credentials: "include" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load history");
      setHistoryEntries((data.history || []) as OrderHistoryEntry[]);
    } catch (err) {
      setHistoryEntries([]);
      toast({
        title: t("error"),
        description: err instanceof Error ? err.message : "Request failed",
        variant: "destructive",
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            {t("orders")}
          </h1>
          <div className="text-xs md:text-sm text-muted-foreground mt-0.5">
            {loading ? (
              <Skeleton className="h-4 w-20 inline-block" />
            ) : (
              visibleOrders.length
            )}{" "}
            {t("ordersCount")}
          </div>
        </div>
        <Link href="/create-order">
          <Button
            size="sm"
            className="shrink-0 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/25 hover:opacity-90 transition-all gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("createOrder")}</span>
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("searchOrderPlaceholder")}
            value={search}
            onChange={(e) => void setSearch(e.target.value)}
            className="pl-9 rounded-xl bg-card"
          />
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
            ))
          : STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => void setStatusFilter(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap shrink-0 ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/25"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {s !== "all" && statusFilter !== s && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[s]?.dot}`}
                  />
                )}
                {STATUS_LABELS[s]}
                {s !== "all" && (
                  <span
                    className={`text-[10px] px-1 rounded-full ${statusFilter === s ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    {visibleOrders.filter((o) => o.status === s).length}
                  </span>
                )}
              </button>
            ))}
      </div>

      <div className="md:hidden space-y-2.5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card animate-pulse overflow-hidden"
            >
              <div className="px-4 pt-3.5 pb-3 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 opacity-60">
                  <Scissors className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2 opacity-60" />
                </div>
              </div>
              <div className="px-4 pb-3 flex items-center justify-between border-t border-border/40 pt-3">
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <div className="w-14 h-14 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
              <ClipboardList className="w-6 h-6 opacity-40" />
            </div>
            <p className="text-sm font-medium">{t("noOrderFound")}</p>
          </div>
        ) : (
          pagedOrders.map((order, idx) => {
            const customer = getCustomer(order.customerId);
            const productNames = order.items
              .map((item) => getProduct(item.productId)?.nameBn || "")
              .filter(Boolean)
              .join(", ");
            const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
            const grad = avatarGradient(customer?.name);
            const st = STATUS_STYLES[order.status] || STATUS_STYLES.delivered;
            return (
              <div
                key={order.id}
                className={`rounded-2xl border border-border shadow-sm overflow-hidden ${idx % 2 === 0 ? "bg-card" : "bg-muted/30"}`}
              >
                <div className="px-4 pt-3.5 pb-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}
                    >
                      {nameInitials(customer?.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {customer?.name || "-"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {productNames || "-"} ×{totalQty}
                      </p>
                      {order.assignedTo && getStaffName(order.assignedTo) && (
                        <p className="text-[10px] text-primary/80 mt-0.5 flex items-center gap-1">
                          <Hammer className="w-2.5 h-2.5" />{" "}
                          {getStaffName(order.assignedTo)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      #{order.id.slice(-6)}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.badge}`}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                </div>

                <div className="px-4 pb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground">
                        {t("total")}
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        ৳{order.totalPrice.toLocaleString("bn-BD")}
                      </p>
                    </div>
                    {order.dueAmount > 0 ? (
                      <div>
                        <p className="text-[10px] text-muted-foreground">
                          {t("due")}
                        </p>
                        <p className="text-sm font-bold text-destructive">
                          ৳{order.dueAmount.toLocaleString("bn-BD")}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[10px] text-muted-foreground">
                          {t("paid")}
                        </p>
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

                <div className="border-t border-border px-3 py-2 flex items-center gap-1">
                  <div className="relative mr-1">
                    <select
                      value={order.status}
                      disabled={updatingStatusId === order.id}
                      onChange={(e) =>
                        void handleStatusChange(
                          order,
                          e.target.value as OrderStatus,
                        )
                      }
                      className={`appearance-none text-[10px] font-semibold pl-2 pr-5 py-1 rounded-full border cursor-pointer bg-transparent ${st.badge}`}
                    >
                      {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                  </div>
                  {hasActionPermission("orders", "edit") &&
                    activeStaffList.length > 0 && (
                      <div className="relative mr-1">
                        <select
                          value={order.assignedTo || ""}
                          disabled={updatingAssignedId === order.id}
                          onChange={(e) =>
                            void handleAssignedToChange(order, e.target.value)
                          }
                          className="appearance-none text-[10px] font-semibold pl-2 pr-5 py-1 rounded-full border cursor-pointer bg-card border-border text-foreground"
                        >
                          <option value="">{t("notAssigned")}</option>
                          {activeStaffList.map((staff) => (
                            <option key={staff.id} value={staff.id}>
                              {staff.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                      </div>
                    )}
                  <div className="flex-1 flex items-center justify-end gap-0.5">
                    {hasActionPermission("orders", "edit") && (
                      <button
                        onClick={() => openEdit(order)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        title={t("edit")}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {hasActionPermission("orders", "edit") &&
                      order.dueAmount > 0 && (
                        <button
                          onClick={() => openPay(order)}
                          className="p-1.5 rounded-lg hover:bg-success/10 transition-colors text-success"
                          title={t("payment")}
                        >
                          <Banknote className="w-3.5 h-3.5" />
                        </button>
                      )}
                    <button
                      onClick={() => void openHistory(order.id)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      title={t("history")}
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      href={`/invoice/${order.id}`}
                      className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary"
                      title={t("invoice")}
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </Link>
                    {hasActionPermission("orders", "delete") && (
                      <button
                        onClick={() => setDeleteTarget(order)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                        title={t("delete")}
                      >
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

      <div className="hidden md:block rounded-2xl border border-border overflow-hidden shadow-sm">
        {loading ? (
          <div className="bg-card">
            <div className="h-12 border-b border-border bg-muted/20" />
            <div className="p-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-4 py-4 border-b border-border/50 animate-pulse"
                >
                  <Skeleton className="h-4 w-16 bg-muted" />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 opacity-60">
                      <Scissors className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <Skeleton className="h-4 w-32 bg-muted" />
                  </div>
                  <Skeleton className="h-4 w-40 bg-muted" />
                  <Skeleton className="h-4 w-24 bg-muted" />
                  <Skeleton className="h-6 w-20 rounded-full bg-muted opacity-60" />
                  <div className="flex gap-1">
                    <Skeleton className="h-8 w-8 rounded-lg bg-muted" />
                    <Skeleton className="h-8 w-8 rounded-lg bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card px-5 py-16 text-center text-muted-foreground">
            <div className="w-14 h-14 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
              <ClipboardList className="w-6 h-6 opacity-40" />
            </div>
            <p className="text-sm font-medium">{t("noOrderFound")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">
                    {t("order")}
                  </th>
                  <th className="text-left px-4 py-3 font-medium">
                    {t("customerName")}
                  </th>
                  <th className="text-left px-4 py-3 font-medium">
                    {t("productName")}
                  </th>
                  <th className="text-left px-4 py-3 font-medium">
                    {t("assignedTo")}
                  </th>
                  <th className="text-left px-4 py-3 font-medium">
                    {t("deliveryDate")}
                  </th>
                  <th className="text-left px-4 py-3 font-medium">
                    {t("total")}
                  </th>
                  <th className="text-left px-4 py-3 font-medium">
                    {t("due")}
                  </th>
                  <th className="text-left px-4 py-3 font-medium">
                    {t("status")}
                  </th>
                  <th className="text-right px-4 py-3 font-medium">
                    {t("action")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {pagedOrders.map((order, idx) => {
                  const customer = getCustomer(order.customerId);
                  const productNames = order.items
                    .map((item) => {
                      const p = getProduct(item.productId);
                      return `${p?.nameBn || p?.name || "-"} ×${item.quantity}`;
                    })
                    .join(", ");
                  const grad = avatarGradient(customer?.name);
                  const st =
                    STATUS_STYLES[order.status] || STATUS_STYLES.delivered;
                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors group hover:bg-primary/5 ${idx % 2 === 0 ? "bg-card" : "bg-muted/20"}`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-foreground">
                          #{order.id.slice(-6)}
                        </span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString(
                            "bn-BD",
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}
                          >
                            {nameInitials(customer?.name)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground leading-tight">
                              {customer?.name || "-"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {customer?.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="truncate text-sm text-foreground">
                          {productNames}
                        </p>
                        {order.items.length > 1 && (
                          <p className="text-[11px] text-primary mt-0.5">
                            {order.items.length} {t("items")}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {hasActionPermission("orders", "edit") &&
                        activeStaffList.length > 0 ? (
                          <div className="relative inline-block min-w-[150px]">
                            <select
                              value={order.assignedTo || ""}
                              disabled={updatingAssignedId === order.id}
                              onChange={(e) =>
                                void handleAssignedToChange(
                                  order,
                                  e.target.value,
                                )
                              }
                              className="appearance-none w-full text-xs font-medium pl-2.5 py-1.5 pr-7 rounded-full border cursor-pointer bg-card border-border text-foreground"
                            >
                              <option value="">{t("notAssigned")}</option>
                              {activeStaffList.map((staff) => (
                                <option key={staff.id} value={staff.id}>
                                  {staff.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-muted-foreground" />
                          </div>
                        ) : order.assignedTo &&
                          getStaffName(order.assignedTo) ? (
                          <div className="flex items-center gap-1.5">
                            <Hammer className="w-3 h-3 text-primary/70 shrink-0" />
                            <span className="text-xs font-medium text-primary">
                              {getStaffName(order.assignedTo)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {order.deliveryDate ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarDays className="w-3 h-3 shrink-0" />
                            {order.deliveryDate}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-foreground">
                          ৳{order.totalPrice.toLocaleString("bn-BD")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {order.dueAmount > 0 ? (
                          <span className="text-sm font-semibold text-destructive">
                            ৳{order.dueAmount.toLocaleString("bn-BD")}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-success">
                            ✓ {t("paid")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative inline-block">
                          <select
                            value={order.status}
                            disabled={updatingStatusId === order.id}
                            onChange={(e) =>
                              void handleStatusChange(
                                order,
                                e.target.value as OrderStatus,
                              )
                            }
                            className={`appearance-none text-xs font-semibold pl-2.5 py-1 pr-6 rounded-full border cursor-pointer bg-transparent ${st.badge}`}
                          >
                            {Object.entries(ORDER_STATUS_LABELS).map(
                              ([k, v]) => (
                                <option key={k} value={k}>
                                  {v}
                                </option>
                              ),
                            )}
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          {hasActionPermission("orders", "edit") && (
                            <button
                              onClick={() => openEdit(order)}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title={t("edit")}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {hasActionPermission("orders", "edit") &&
                            order.dueAmount > 0 && (
                              <button
                                onClick={() => openPay(order)}
                                className="p-1.5 rounded-lg hover:bg-success/10 text-success transition-colors"
                                title={t("payment")}
                              >
                                <Banknote className="w-3.5 h-3.5" />
                              </button>
                            )}
                          <button
                            onClick={() => void openHistory(order.id)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title={t("history")}
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/invoice/${order.id}`}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                            title={t("invoice")}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </Link>
                          {hasActionPermission("orders", "delete") && (
                            <button
                              onClick={() => setDeleteTarget(order)}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title={t("delete")}
                            >
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

      {!loading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          from={from}
          to={to}
          onPageChange={setPage}
        />
      )}

      <Dialog
        open={!!editOrder}
        onOpenChange={(open) => !open && setEditOrder(null)}
      >
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("editOrder")}</DialogTitle>
            <DialogDescription>{t("editOrderDesc")}</DialogDescription>
          </DialogHeader>
          {editOrder && (
            <div className="space-y-4">
              {editItems.map((item, itemIdx) => {
                const product = getProduct(item.productId);
                return (
                  <div
                    key={itemIdx}
                    className="border border-border rounded-lg p-3 space-y-3"
                  >
                    <p className="text-xs font-semibold text-primary">
                      {product?.nameBn || product?.name}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          {t("quantity")}
                        </label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateEditItem(
                              itemIdx,
                              "quantity",
                              Number(e.target.value) || 1,
                            )
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          {t("unitPriceLabel")}
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateEditItem(
                              itemIdx,
                              "unitPrice",
                              Number(e.target.value) || 0,
                            )
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    {item.measurements.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {item.measurements.map((m, measIdx) => (
                          <div key={m.fieldId}>
                            <label className="text-xs text-muted-foreground">
                              {m.fieldNameBn}
                            </label>
                            <MeasurementInput
                              value={m.value}
                              onChange={(val) =>
                                updateEditMeasurement(itemIdx, measIdx, val)
                              }
                              suggestions={getSuggestions(m.fieldName)}
                              className="h-8 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("totalPrice")}
                  </span>
                  <span className="font-bold">
                    ৳
                    {editItems
                      .reduce((s, i) => s + i.unitPrice * i.quantity, 0)
                      .toLocaleString("bn-BD")}
                  </span>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("advancePaid")}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={editAdvancePaid}
                    onChange={(e) =>
                      setEditAdvancePaid(
                        Math.max(0, Number(e.target.value) || 0),
                      )
                    }
                  />
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-border">
                  <span className="text-muted-foreground">{t("due")}</span>
                  <span
                    className={`font-bold ${Math.max(0, editItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0) - editAdvancePaid) > 0 ? "text-destructive" : "text-success"}`}
                  >
                    ৳
                    {Math.max(
                      0,
                      editItems.reduce(
                        (s, i) => s + i.unitPrice * i.quantity,
                        0,
                      ) - editAdvancePaid,
                    ).toLocaleString("bn-BD")}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("deliveryDate")}
                </label>
                <Input
                  type="date"
                  value={editDeliveryDate}
                  onChange={(e) => setEditDeliveryDate(e.target.value)}
                />
              </div>

              {staffList.filter((s) => s.isActive).length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("assignedTo")}
                  </label>
                  <select
                    value={editAssignedTo}
                    onChange={(e) => setEditAssignedTo(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">{t("notAssigned")}</option>
                    {staffList
                      .filter((s) => s.isActive)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.role})
                        </option>
                      ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("specialNotes")}
                </label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOrder(null)}>
              {t("cancel")}
            </Button>
            <Button onClick={() => void saveEdit()} disabled={savingEdit}>
              {savingEdit ? <Spinner className="animate-spin" /> : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!payOrder}
        onOpenChange={(open) => !open && setPayOrder(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("collectPayment")}</DialogTitle>
            <DialogDescription>{t("collectPaymentDesc")}</DialogDescription>
          </DialogHeader>
          {payOrder && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("totalPrice")}
                  </span>
                  <span>৳{payOrder.totalPrice.toLocaleString("bn-BD")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("paid")}</span>
                  <span>৳{payOrder.advancePaid.toLocaleString("bn-BD")}</span>
                </div>
                <div className="flex justify-between font-medium border-t border-border pt-1">
                  <span className="text-destructive">{t("due")}</span>
                  <span className="text-destructive">
                    ৳{payOrder.dueAmount.toLocaleString("bn-BD")}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("paymentAmount")}
                </label>
                <Input
                  type="number"
                  min={1}
                  max={payOrder.dueAmount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={`${t("maxAmount")} ৳${payOrder.dueAmount.toLocaleString("bn-BD")}`}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPayAmount(String(payOrder.dueAmount))}
                  className="text-xs"
                >
                  {t("fullDue")}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOrder(null)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => void collectPayment()}
              disabled={
                savingPayment ||
                !payAmount ||
                Number(payAmount) <= 0 ||
                Number(payAmount) > (payOrder?.dueAmount || 0)
              }
            >
              {savingPayment ? (
                <Spinner className="animate-spin" />
              ) : (
                t("collect")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!historyOrderId}
        onOpenChange={(open) => !open && setHistoryOrderId(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-4 h-4" /> {t("orderHistory")}
            </DialogTitle>
            <DialogDescription>
              #{historyOrderId?.slice(-6)} — {t("allChangesLog")}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {historyLoading ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Loading...
              </div>
            ) : historyEntries.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                {t("noHistory")}
              </div>
            ) : (
              <div className="relative pl-6 space-y-0">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                {historyEntries.map((entry) => {
                  const Icon = ACTION_ICONS[entry.action] || Clock;
                  const colorClass =
                    ACTION_COLORS[entry.action] || "text-muted-foreground";
                  return (
                    <div key={entry.id} className="relative pb-4">
                      <div
                        className={`absolute -left-6 top-0.5 w-[22px] h-[22px] rounded-full bg-card border-2 border-border flex items-center justify-center ${colorClass}`}
                      >
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="pl-2">
                        <p className="text-sm font-medium text-foreground">
                          {entry.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.performedBy && (
                            <span className="font-medium text-foreground/70">
                              {entry.performedBy} ·{" "}
                            </span>
                          )}
                          {new Date(entry.timestamp).toLocaleDateString(
                            "bn-BD",
                          )}{" "}
                          —{" "}
                          {new Date(entry.timestamp).toLocaleTimeString(
                            "bn-BD",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </p>
                        {entry.changes &&
                          Object.keys(entry.changes).length > 0 && (
                            <div className="mt-1.5 space-y-1">
                              {Object.entries(entry.changes).map(
                                ([key, val]) => (
                                  <div
                                    key={key}
                                    className="flex items-center gap-1.5 text-xs"
                                  >
                                    <span className="text-muted-foreground">
                                      {key}:
                                    </span>
                                    <span className="line-through text-muted-foreground/60">
                                      {val.from}
                                    </span>
                                    <span className="text-foreground">→</span>
                                    <span className="font-medium text-foreground">
                                      {val.to}
                                    </span>
                                  </div>
                                ),
                              )}
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

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteOrder")}</AlertDialogTitle>
            <AlertDialogDescription>
              #{deleteTarget?.id.slice(-6)} — {t("deleteOrderDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingId === deleteTarget?.id}
            >
              {deletingId === deleteTarget?.id ? (
                <Spinner className="animate-spin" />
              ) : (
                t("delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
