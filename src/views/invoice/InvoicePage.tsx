import { useParams } from "next/navigation";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import { useInvoiceData } from "./hooks/useInvoiceData";
import { getStaffName, formatInvoiceNo, getProduct } from "./utils";
import { InvoiceMode } from "./types";
import { InvoiceToolbar } from "./components/InvoiceToolbar";
import { InvoiceModeTabs } from "./components/InvoiceModeTabs";
import { CraftsmanInvoice } from "./components/CraftsmanInvoice";
import { CustomerInvoice } from "./components/CustomerInvoice";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BANGLADESH_RANGES = [
  { value: "dhaka", bn: "ঢাকা রেঞ্জ", en: "Dhaka Range" },
  { value: "chittagong", bn: "চট্টগ্রাম রেঞ্জ", en: "Chittagong Range" },
  { value: "rajshahi", bn: "রাজশাহী রেঞ্জ", en: "Rajshahi Range" },
  { value: "khulna", bn: "খুলনা রেঞ্জ", en: "Khulna Range" },
  { value: "barishal", bn: "বরিশাল রেঞ্জ", en: "Barishal Range" },
  { value: "sylhet", bn: "সিলেট রেঞ্জ", en: "Sylhet Range" },
  { value: "rangpur", bn: "রংপুর রেঞ্জ", en: "Rangpur Range" },
  { value: "mymensingh", bn: "ময়মনসিংহ রেঞ্জ", en: "Mymensingh Range" },
];

export default function InvoicePage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const { settings, hasActionPermission, userType } = useData();
  const { t, language } = useLanguage();

  const { loading, order, customers, products, staffList } =
    useInvoiceData(id);

  const canCustomer =
    userType === "owner" || hasActionPermission("customer_invoice", "view");
  const canCraftsman =
    userType === "owner" || hasActionPermission("craftsman_invoice", "view");

  const printRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<InvoiceMode>(
    canCustomer ? "customer" : "craftsman",
  );
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(
    null,
  );
  const [craftsmanNote, setCraftsmanNote] = useState("");
  const [selectedRange, setSelectedRange] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Initialize from saved order data
  useEffect(() => {
    if (order && !initialized) {
      setReferenceNo(order.refNo || "");
      setCraftsmanNote(order.invoiceNote || "");
      setSelectedRange(order.invoiceRange || "");
      setInitialized(true);
    }
  }, [order, initialized]);

  const handleSaveInvoiceFields = async () => {
    if (!order) return;
    setSaving(true);
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: order.id,
          customerId: order.customerId,
          items: order.items,
          totalPrice: order.totalPrice,
          advancePaid: order.advancePaid,
          dueAmount: order.dueAmount,
          deliveryDate: order.deliveryDate,
          specialNotes: order.specialNotes,
          status: order.status,
          assignedTo: order.assignedTo,
          refNo: referenceNo,
          invoiceNote: craftsmanNote,
          invoiceRange: selectedRange,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const customer = order
    ? customers.find((entry) => entry.id === order.customerId)
    : undefined;

  const assignedStaffName = order?.assignedTo
    ? getStaffName(staffList, order.assignedTo)
    : undefined;

  const prefix = settings.invoicePrefix || "INV-";
  const invoiceNo = order ? formatInvoiceNo(prefix, order.id) : "";

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    const html2pdf = (await import("html2pdf.js")).default;
    const suffix = mode === "craftsman" ? "-craftsman" : "";
    const productSuffix =
      selectedItemIndex !== null
        ? `-${order?.items[selectedItemIndex].productId.slice(-4)}`
        : "";
    html2pdf()
      .set({
        margin: [10, 12, 10, 12],
        filename: `${invoiceNo}${suffix}${productSuffix}.pdf`,
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

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-8">
      <InvoiceToolbar onDownloadPdf={handleDownloadPdf}>
        {mode === "craftsman" && order.items.length > 1 && (
          <Select
            value={selectedItemIndex !== null ? String(selectedItemIndex) : "all"}
            onValueChange={(val) => setSelectedItemIndex(val === "all" ? null : Number(val))}
          >
            <SelectTrigger className="h-9 rounded-xl font-bangla w-auto gap-1.5 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-bangla">
                {t("allProducts")}
              </SelectItem>
              {order.items.map((item, index) => {
                const product = getProduct(products, item.productId);
                return (
                  <SelectItem
                    key={`${item.productId}-${index}`}
                    value={String(index)}
                    className="font-bangla"
                  >
                    {language === "bn"
                      ? product?.nameBn || product?.name || `Product ${index + 1}`
                      : product?.name || product?.nameBn || `Product ${index + 1}`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </InvoiceToolbar>

      {canCustomer && canCraftsman && (
        <InvoiceModeTabs mode={mode} onModeChange={setMode} />
      )}

      {mode === "craftsman" ? (
        <div className="flex gap-4 items-start">
          <div className="w-[672px] shrink-0">
            <CraftsmanInvoice
              ref={printRef}
              order={
                selectedItemIndex !== null
                  ? { ...order, items: [order.items[selectedItemIndex]] }
                  : order
              }
              customer={customer}
              products={products}
              invoiceNo={invoiceNo}
              referenceNo={referenceNo}
              assignedStaffName={assignedStaffName || ""}
              settings={settings}
              note={craftsmanNote}
              rangeValue={
                selectedRange
                  ? (language === "bn"
                      ? BANGLADESH_RANGES.find((r) => r.value === selectedRange)?.bn
                      : BANGLADESH_RANGES.find((r) => r.value === selectedRange)?.en) || ""
                  : ""
              }
            />
          </div>
          <div className="flex-1 sticky top-4 space-y-4 rounded-2xl border border-border bg-card p-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground font-bangla">
                {t("referenceNo")}
              </label>
              <input
                type="text"
                className="mt-1 w-full text-sm font-bangla bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={t("referenceNoPlaceholder")}
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground font-bangla">
                {t("range")}
              </label>
              <Select value={selectedRange} onValueChange={setSelectedRange}>
                <SelectTrigger className="mt-1 rounded-xl font-bangla">
                  <SelectValue placeholder={t("range")} />
                </SelectTrigger>
                <SelectContent>
                  {BANGLADESH_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value} className="font-bangla">
                      {language === "bn" ? range.bn : range.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground font-bangla">
                {t("notes")}
              </label>
              <textarea
                className="mt-1 w-full text-sm font-bangla bg-background border border-border rounded-xl px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-ring leading-relaxed"
                rows={4}
                placeholder={t("notesPlaceholder")}
                value={craftsmanNote}
                onChange={(e) => setCraftsmanNote(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSaveInvoiceFields}
              disabled={saving}
              className="w-full rounded-xl gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? t("saving") : saved ? t("saved") : t("save")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 items-start">
          <div className="w-[672px] shrink-0">
            <CustomerInvoice
              ref={printRef}
              order={order}
              customer={customer}
              products={products}
              invoiceNo={invoiceNo}
              referenceNo={referenceNo}
              settings={settings}
            />
          </div>
          <div className="flex-1 sticky top-4 space-y-4 rounded-2xl border border-border bg-card p-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground font-bangla">
                {t("referenceNo")}
              </label>
              <input
                type="text"
                className="mt-1 w-full text-sm font-bangla bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={t("referenceNoPlaceholder")}
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSaveInvoiceFields}
              disabled={saving}
              className="w-full rounded-xl gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? t("saving") : saved ? t("saved") : t("save")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
