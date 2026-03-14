import { useParams } from "next/navigation";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Customer,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  Order,
  Product,
} from "@/types";
import {
  Printer,
  ArrowLeft,
  Download,
  User,
  Phone,
  MapPin,
  Calendar,
  Hash,
  CheckCircle2,
  Ruler,
  Scissors,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type InvoiceMode = "customer" | "craftsman";

interface InvoiceProductRow {
  id: string;
  name: string;
  name_bn?: string;
  nameBn?: string;
}

interface InvoiceStaffRow {
  id: string;
  name: string;
  phone?: string;
}

interface InvoiceHeaderProps {
  title: string;
  invoiceNo: string;
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  shopLogo?: string;
  createdAt: string;
  deliveryDateText?: string;
  deliveryDateTitle?: string;
  deliveryDateLabel?: string;
  showDeliveryDate?: boolean;
}

function InvoiceHeader({
  title,
  invoiceNo,
  shopName,
  shopAddress,
  shopPhone,
  shopLogo,
  createdAt,
  deliveryDateText,
  deliveryDateTitle,
  deliveryDateLabel,
  showDeliveryDate,
}: InvoiceHeaderProps) {
  return (
    <div className="px-3.5 pt-4 pb-4 border-b border-border print-no-break">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {shopLogo ? (
            <img
              src={shopLogo}
              alt={shopName}
              className="w-14 h-14 rounded-xl object-cover border border-border shadow-sm"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <span className="text-2xl font-bold text-primary">
                {shopName.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-foreground font-bangla">
              {shopName}
            </h1>
            {shopAddress ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" /> {shopAddress}
              </p>
            ) : null}
            {shopPhone ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 shrink-0" /> {shopPhone}
              </p>
            ) : null}
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-[10px] font-semibold text-muted-foreground font-bangla mb-1">
            {title}
          </p>
          <p className="text-lg font-bold text-foreground font-mono">
            {invoiceNo}
          </p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
            <Calendar className="w-3 h-3" />
            {new Date(createdAt).toLocaleDateString("bn-BD", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          {showDeliveryDate ? (
            <div className="mt-1">
              <p className="text-[10px] font-semibold text-muted-foreground font-bangla mb-1 text-right">
                {deliveryDateTitle}
              </p>
              <div className="min-h-8 min-w-36 rounded-lg border border-slate-400 bg-white px-2 py-1 text-xs font-semibold text-slate-900 flex items-center justify-center">
                {deliveryDateText || (
                  <span className="font-mono tracking-tight">
                    {deliveryDateLabel}
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface CraftsmanMeasurementBoxProps {
  label: string;
  value: string;
}

function CraftsmanMeasurementBox({
  label,
  value,
}: CraftsmanMeasurementBoxProps) {
  return (
    <div className="rounded-md bg-slate-50 border border-slate-200 px-1 py-1">
      <p className="text-[10px] leading-tight text-slate-500 font-bangla">
        {label}
      </p>
      <p className="text-[11px] font-semibold text-slate-900 mt-0.5 leading-tight">
        {value || "—"}
      </p>
    </div>
  );
}

interface CraftsmanInfoFieldProps {
  label: string;
  value: string;
  inputStyle?: boolean;
  borderless?: boolean;
  compact?: boolean;
  handwrittenPlaceholder?: string;
}

function CraftsmanInfoField({
  label,
  value,
  inputStyle = false,
  borderless = false,
  compact = false,
  handwrittenPlaceholder,
}: CraftsmanInfoFieldProps) {
  const wrapperClass = borderless
    ? compact
      ? "px-0.5 py-1"
      : "px-0.5 py-1.5"
    : compact
      ? "rounded-lg border border-slate-300 px-2.5 py-1.5"
      : "rounded-lg border border-slate-300 px-2.5 py-1.5";

  const plainValueClass = compact
    ? "text-[11px] font-semibold text-slate-900 mt-0.5"
    : "text-xs font-semibold text-slate-900 mt-0.5";

  const inputClass = compact
    ? "min-h-7 rounded-lg border border-slate-400 bg-white px-2 py-1 text-[11px] font-semibold text-slate-900"
    : "min-h-8 rounded-lg border border-slate-400 bg-white px-2 py-1 text-xs font-semibold text-slate-900";

  return (
    <div className={wrapperClass}>
      <p
        className={`text-[10px] font-semibold text-slate-500 font-bangla ${borderless ? "mb-1" : ""}`}
      >
        {label}
      </p>
      {inputStyle ? (
        <div
          className={`${inputClass} ${handwrittenPlaceholder ? "flex items-center justify-between gap-1" : ""}`}
        >
          <span>{value}</span>
          {handwrittenPlaceholder ? (
            <span className="font-mono text-[10px] text-slate-400 tracking-tight">
              {handwrittenPlaceholder}
            </span>
          ) : null}
        </div>
      ) : (
        <p
          className={
            borderless
              ? `${plainValueClass} ${compact ? "" : ""}`
              : `${compact ? "font-mono text-xs" : "font-mono text-xs"} font-bold text-slate-900 mt-0.5`
          }
        >
          {value}
        </p>
      )}
    </div>
  );
}

interface CraftsmanSlipProps {
  compact?: boolean;
  showShopHeader?: boolean;
  showDeliveryDateField?: boolean;
  orderId: string;
  invoiceNo: string;
  createdAt: string;
  assignedStaffName: string;
  deliveryDateText: string;
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
  shopLogo?: string;
  title: string;
  orderLabel: string;
  assignedToLabel: string;
  deliveryDateLabel: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function CraftsmanSlip({
  compact = false,
  showShopHeader = false,
  showDeliveryDateField = false,
  orderId,
  invoiceNo,
  createdAt,
  assignedStaffName,
  deliveryDateText,
  shopName,
  shopPhone,
  shopAddress,
  shopLogo,
  title,
  orderLabel,
  assignedToLabel,
  deliveryDateLabel,
  children,
  footer,
}: CraftsmanSlipProps) {
  return (
    <div
      className={
        compact
          ? "px-3.5 md:px-4 pt-2.5 pb-3 min-h-[210px]"
          : "px-3.5 md:px-4 pt-3 pb-3.5 min-h-[390px]"
      }
    >
      {showShopHeader ? (
        <InvoiceHeader
          title={title}
          invoiceNo={invoiceNo}
          shopName={shopName}
          shopAddress={shopAddress}
          shopPhone={shopPhone}
          shopLogo={shopLogo}
          createdAt={createdAt}
          deliveryDateText={showDeliveryDateField ? deliveryDateText : ""}
          deliveryDateTitle={
            showDeliveryDateField ? deliveryDateLabel : undefined
          }
          deliveryDateLabel={
            showDeliveryDateField && !deliveryDateText
              ? "...../...../......"
              : undefined
          }
          showDeliveryDate={showDeliveryDateField}
        />
      ) : null}

      {showShopHeader ? (
        <div className="grid grid-cols-2 gap-2.5 mt-2.5 mb-3">
          <CraftsmanInfoField
            label={orderLabel}
            value={`#${orderId.slice(-8).toUpperCase()}`}
            borderless
          />
          <CraftsmanInfoField
            label={assignedToLabel}
            value={assignedStaffName}
            inputStyle
            borderless
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <CraftsmanInfoField
            compact
            label={orderLabel}
            value={`#${orderId.slice(-8).toUpperCase()}`}
            borderless
          />
          <CraftsmanInfoField
            compact
            label={assignedToLabel}
            value={assignedStaffName}
            inputStyle
            borderless
          />
        </div>
      )}

      <div className={compact ? "mt-2.5" : ""}>{children}</div>
      {footer}
    </div>
  );
}

export default function InvoicePage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const { settings, hasActionPermission, userType } = useData();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | undefined>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [staffList, setStaffList] = useState<
    Array<{ id: string; name: string; phone?: string }>
  >([]);

  const canCustomer =
    userType === "owner" || hasActionPermission("customer_invoice", "view");
  const canCraftsman =
    userType === "owner" || hasActionPermission("craftsman_invoice", "view");

  const printRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<InvoiceMode>(
    canCustomer ? "customer" : "craftsman",
  );
  const customer = order
    ? customers.find((entry) => entry.id === order.customerId)
    : undefined;

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/invoice-data/${id}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load invoice");
        if (cancelled) return;
        setOrder(data.order);
        setCustomers(data.customers || []);
        setProducts(
          (data.products || []).map((product: InvoiceProductRow) => ({
            id: product.id,
            name: product.name,
            nameBn: product.name_bn || product.nameBn,
          })),
        );
        setStaffList(
          (data.staff || []).map((staff: InvoiceStaffRow) => ({
            id: staff.id,
            name: staff.name,
            phone: staff.phone || undefined,
          })),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const getProduct = (productId: string) =>
    products.find((product) => product.id === productId);
  const getStaffName = (staffId: string) =>
    staffList.find((staff) => staff.id === staffId)?.name;

  const renderCraftsmanItems = (compact = false) => (
    <div className="grid grid-cols-2 gap-2">
      {order.items.map((item, index) => {
        const product = getProduct(item.productId);
        return (
          <div
            key={`${item.productId}-${index}`}
            className={`rounded-xl border border-slate-200 ${compact ? "px-2 py-1.5" : "px-2.5 py-2"} break-inside-avoid`}
          >
            <div className="flex items-start justify-between gap-1.5 border-b border-dashed border-slate-300 pb-1">
              <div>
                <p className="text-[12px] font-semibold text-slate-900 font-bangla leading-tight">
                  {product?.nameBn || product?.name || "-"}
                </p>
                <p className="text-[10px] text-slate-500">
                  #{order.id.slice(-8).toUpperCase()}
                </p>
              </div>
              <div className="rounded-full border border-slate-300 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                {t("qty")}: {item.quantity}
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1 pt-1.5">
              {item.measurements.length > 0 ? (
                item.measurements.map((measurement) => (
                  <CraftsmanMeasurementBox
                    key={measurement.fieldId}
                    label={measurement.fieldNameBn}
                    value={measurement.value || "—"}
                  />
                ))
              ) : (
                <div className="col-span-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500">
                  {t("stepMeasurement")}: —
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse pb-8">
        <div className="h-10 w-48 rounded bg-muted mb-5" />
        <div className="h-[640px] rounded-2xl border border-border bg-card" />
      </div>
    );
  }

  if (!order || !customer) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>{t("orderNotFound")}</p>
        <Link
          href="/orders"
          className="text-primary hover:underline text-sm mt-2 inline-block"
        >
          {t("goToOrders")}
        </Link>
      </div>
    );
  }

  if (!canCustomer && !canCraftsman) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="font-medium">{t("noPermissions")}</p>
        <Link
          href="/orders"
          className="text-primary hover:underline text-sm mt-2 inline-block"
        >
          {t("goToOrders")}
        </Link>
      </div>
    );
  }

  const assignedStaffName = order.assignedTo
    ? getStaffName(order.assignedTo)
    : undefined;
  const assignedStaff = order.assignedTo
    ? staffList.find((s) => s.id === order.assignedTo)
    : undefined;
  const prefix = settings.invoicePrefix || "INV-";
  const invoiceNo = `${prefix}${order.id.slice(-6).toUpperCase()}`;
  const showDeliveryDateField = Boolean(order.deliveryDate);

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    const html2pdf = (await import("html2pdf.js")).default;
    const suffix = mode === "craftsman" ? "-craftsman" : "";
    html2pdf()
      .set({
        margin: [10, 12, 10, 12], // top, right, bottom, left in mm
        filename: `${invoiceNo}${suffix}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: {
          mode: ["avoid-all", "css", "legacy"],
          before: ".pdf-page-break",
          avoid: ".print-no-break",
        },
      })
      .from(printRef.current)
      .save();
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-8">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 no-print">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t("orderList")}
        </Link>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleDownloadPdf}
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> PDF
          </Button>
          <Button
            onClick={() => window.print()}
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> {t("print")}
          </Button>
        </div>
      </div>

      {/* Mode toggle — only show tabs the user has permission for */}
      {canCustomer && canCraftsman && (
        <div className="flex gap-1.5 mb-4 no-print p-1 bg-muted rounded-xl w-fit">
          {(["customer", "craftsman"] as InvoiceMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                mode === m
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "customer" ? t("customerInvoice") : t("craftsmanInvoice")}
            </button>
          ))}
        </div>
      )}

      {/* ── Invoice Document ── */}
      {mode === "craftsman" ? (
        <div
          ref={printRef}
          className="print-area invoice-bn-tight invoice-ink bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
        >
          <div className="h-1 bg-slate-900" />

          <CraftsmanSlip
            showShopHeader
            showDeliveryDateField={true}
            orderId={order.id}
            invoiceNo={invoiceNo}
            createdAt={order.createdAt}
            assignedStaffName={assignedStaffName || ""}
            deliveryDateText={
              order.deliveryDate
                ? new Date(order.deliveryDate).toLocaleDateString("bn-BD")
                : ""
            }
            shopName={settings.shopNameBn || settings.shopName || "S"}
            shopPhone={settings.shopPhone}
            shopAddress={settings.shopAddress}
            shopLogo={settings.shopLogo}
            title={t("craftsmanInvoice")}
            orderLabel={t("order")}
            assignedToLabel={t("assignedTo")}
            deliveryDateLabel={t("deliveryDate")}
          >
            {renderCraftsmanItems(false)}
          </CraftsmanSlip>

          <div className="px-3.5 md:px-4 py-1.5 bg-slate-50 border-y border-dashed border-slate-400 text-center flex items-center justify-center gap-2">
            <Scissors className="w-4 h-4 text-slate-500" />
            <p className="text-[11px] font-mono tracking-[0.18em] text-slate-500">
              - - - - - - - - - - - - - - - - - - - - - -
            </p>
            <Scissors className="w-4 h-4 text-slate-500 transform scale-x-[-1]" />
          </div>

          <CraftsmanSlip
            compact
            showShopHeader={false}
            orderId={order.id}
            invoiceNo={invoiceNo}
            createdAt={order.createdAt}
            assignedStaffName={assignedStaffName || ""}
            deliveryDateText={
              order.deliveryDate
                ? new Date(order.deliveryDate).toLocaleDateString("bn-BD")
                : ""
            }
            shopName={settings.shopNameBn || settings.shopName || "S"}
            shopPhone={settings.shopPhone}
            shopAddress={settings.shopAddress}
            shopLogo={settings.shopLogo}
            title={t("craftsmanInvoice")}
            orderLabel={t("order")}
            assignedToLabel={t("assignedTo")}
            showDeliveryDateField={true}
            deliveryDateLabel={t("deliveryDate")}
            footer={
              <div className="grid grid-cols-2 gap-4 mt-4 pt-2">
                <div className="flex flex-col justify-end min-h-[44px]">
                  <p className="text-[10px] text-slate-500 mb-3 font-bangla">
                    {t("wages")}
                  </p>
                  <div className="pt-1 text-xs font-medium text-slate-700">
                    ....................
                  </div>
                </div>
                <div className="flex flex-col justify-end items-end min-h-[44px]">
                  <p className="text-[10px] text-slate-500 mb-3 font-bangla">
                    {t("signature")}
                  </p>
                  <div className="w-28 pt-1 text-right text-xs font-medium text-slate-700">
                    ....................
                  </div>
                </div>
              </div>
            }
          >
            {renderCraftsmanItems(true)}
          </CraftsmanSlip>
        </div>
      ) : (
        <div
          ref={printRef}
          className="print-area invoice-bn-tight invoice-ink bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
        >
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />

          <InvoiceHeader
            title={t("customerInvoice")}
            invoiceNo={invoiceNo}
            shopName={settings.shopNameBn || settings.shopName || "S"}
            shopAddress={settings.shopAddress}
            shopPhone={settings.shopPhone}
            shopLogo={settings.shopLogo}
            createdAt={order.createdAt}
          />

          {/* Customer + Order Info */}
          <div className="px-8 py-5 grid grid-cols-2 gap-6 border-b border-border bg-muted/20 print-no-break">
            <div>
              {mode === "customer" ? (
                <>
                  <p className="text-[10px] font-semibold text-muted-foreground font-bangla mb-2">
                    {t("customerInfo")}
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-muted-foreground shrink-0" />
                      <p className="font-semibold text-foreground text-sm">
                        {customer.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        {customer.phone}
                      </p>
                    </div>
                    {customer.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          {customer.address}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-semibold text-muted-foreground font-bangla mb-2">
                    {t("assignCraftsman")}
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-muted-foreground shrink-0" />
                      <p className="font-semibold text-foreground text-sm">
                        {assignedStaffName || t("notAssigned")}
                      </p>
                    </div>
                    {assignedStaff?.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          {assignedStaff.phone}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground font-bangla mb-2">
                {t("orderInfo")}
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3 h-3 text-muted-foreground shrink-0" />
                  <p className="text-sm text-muted-foreground font-mono">
                    #{order.id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${ORDER_STATUS_COLORS[order.status]}`}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
                {order.deliveryDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      {t("deliveryDate")}:{" "}
                      {new Date(order.deliveryDate).toLocaleDateString("bn-BD")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="px-8 py-5">
            <p className="text-[10px] font-semibold text-muted-foreground font-bangla mb-3">
              {t("productName")}
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left pb-2.5 font-semibold text-foreground">
                    {t("productName")}
                  </th>
                  <th className="text-center pb-2.5 font-semibold text-foreground w-16">
                    {t("qty")}
                  </th>
                  {mode === "customer" && (
                    <>
                      <th className="text-right pb-2.5 font-semibold text-foreground w-24">
                        {t("price")}
                      </th>
                      <th className="text-right pb-2.5 font-semibold text-foreground w-24">
                        {t("total")}
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => {
                  const product = getProduct(item.productId);
                  return (
                    <tr
                      key={i}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-3 font-medium">
                        {product?.nameBn || product?.name || "-"}
                      </td>
                      <td className="py-3 text-center text-muted-foreground">
                        {item.quantity}
                      </td>
                      {mode === "customer" && (
                        <>
                          <td className="py-3 text-right text-muted-foreground">
                            {settings.currency}
                            {item.unitPrice.toLocaleString()}
                          </td>
                          <td className="py-3 text-right font-semibold">
                            {settings.currency}
                            {item.totalPrice.toLocaleString()}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Measurements — craftsman mode */}
          {mode === ("craftsman" as InvoiceMode) &&
            order.items.some((item) => item.measurements.length > 0) && (
              <div className="px-8 py-5 border-t border-border bg-muted/10">
                <p className="text-[10px] font-semibold text-muted-foreground font-bangla mb-3 flex items-center gap-1.5">
                  <Ruler className="w-3 h-3" /> {t("stepMeasurement")}
                </p>
                <div className="space-y-4">
                  {order.items.map((item, i) => {
                    const product = getProduct(item.productId);
                    if (item.measurements.length === 0) return null;
                    return (
                      <div key={i} className="print-no-break">
                        {order.items.filter((x) => x.measurements.length > 0)
                          .length > 1 && (
                          <p className="text-xs font-semibold text-primary mb-2">
                            {product?.nameBn || `Item ${i + 1}`}
                          </p>
                        )}
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {item.measurements.map((m) => (
                            <div
                              key={m.fieldId}
                              className="bg-card rounded-xl border border-border px-3 py-2.5 text-center"
                            >
                              <p className="text-[10px] text-muted-foreground font-bangla leading-tight mb-1">
                                {m.fieldNameBn}
                              </p>
                              <p className="font-bold text-sm text-foreground">
                                {m.value || "—"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Special Notes */}
          {order.specialNotes && (
            <div className="px-8 py-4 border-t border-border">
              <p className="text-[10px] font-semibold text-muted-foreground font-bangla mb-1">
                {t("specialNotes")}
              </p>
              <p className="text-sm text-muted-foreground font-bangla italic">
                {order.specialNotes}
              </p>
            </div>
          )}

          {/* Payment Summary — customer mode only */}
          {mode === "customer" && (
            <div className="px-8 py-5 border-t border-border print-no-break">
              <div className="ml-auto max-w-xs space-y-2">
                {order.items.length > 1 && (
                  <>
                    {order.items.map((item, i) => {
                      const product = getProduct(item.productId);
                      return (
                        <div
                          key={i}
                          className="flex justify-between text-xs text-muted-foreground"
                        >
                          <span>
                            {product?.nameBn} ×{item.quantity}
                          </span>
                          <span>
                            {settings.currency}
                            {item.totalPrice.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                    <div className="border-t border-border/50 pt-2" />
                  </>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("totalPrice")}
                  </span>
                  <span className="font-medium text-foreground">
                    {settings.currency}
                    {order.totalPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("advance")}</span>
                  <span className="font-medium text-emerald-600">
                    − {settings.currency}
                    {order.advancePaid.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t-2 border-border">
                  <span className="font-bold text-foreground">{t("due")}</span>
                  <span
                    className={`text-xl font-bold ${order.dueAmount > 0 ? "text-destructive" : "text-emerald-600"}`}
                  >
                    {settings.currency}
                    {order.dueAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-8 py-5 border-t border-border bg-muted/20 text-center space-y-1 print-no-break">
            <p className="text-sm font-medium text-foreground">
              {t("thankYou")}
            </p>
            <p className="text-xs text-muted-foreground">
              {settings.shopNameBn || settings.shopName}
            </p>
            {settings.shopPhone && (
              <p className="text-xs text-muted-foreground">
                {settings.shopPhone}
              </p>
            )}
          </div>

          {/* Bottom accent bar */}
          <div className="h-1 bg-gradient-to-r from-primary/40 via-primary/80 to-primary" />
        </div>
      )}
    </div>
  );
}
