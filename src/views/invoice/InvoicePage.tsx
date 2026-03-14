import { useParams } from "next/navigation";
import Link from "next/link";
import { useRef, useState } from "react";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import { useInvoiceData } from "./hooks/useInvoiceData";
import { getStaffName, formatInvoiceNo } from "./utils";
import { InvoiceMode } from "./types";
import { InvoiceToolbar } from "./components/InvoiceToolbar";
import { InvoiceModeTabs } from "./components/InvoiceModeTabs";
import { CraftsmanInvoice } from "./components/CraftsmanInvoice";
import { CustomerInvoice } from "./components/CustomerInvoice";

export default function InvoicePage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const { settings, hasActionPermission, userType } = useData();
  const { t } = useLanguage();

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
    html2pdf()
      .set({
        margin: [10, 12, 10, 12],
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
    <div className="max-w-2xl mx-auto animate-fade-in pb-8">
      <InvoiceToolbar onDownloadPdf={handleDownloadPdf} />

      {canCustomer && canCraftsman && (
        <InvoiceModeTabs mode={mode} onModeChange={setMode} />
      )}

      {mode === "craftsman" ? (
        <CraftsmanInvoice
          ref={printRef}
          order={order}
          products={products}
          invoiceNo={invoiceNo}
          assignedStaffName={assignedStaffName || ""}
          settings={settings}
        />
      ) : (
        <CustomerInvoice
          ref={printRef}
          order={order}
          customer={customer}
          products={products}
          invoiceNo={invoiceNo}
          settings={settings}
        />
      )}
    </div>
  );
}
