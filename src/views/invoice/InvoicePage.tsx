import { useParams } from "next/navigation";
import Link from "next/link";
import { useRef, useState } from "react";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import { useInvoiceData } from "./hooks/useInvoiceData";
import { getStaffName, formatInvoiceNo, getProduct } from "./utils";
import { InvoiceMode } from "./types";
import { InvoiceToolbar } from "./components/InvoiceToolbar";
import { InvoiceModeTabs } from "./components/InvoiceModeTabs";
import { CraftsmanInvoice } from "./components/CraftsmanInvoice";
import { CustomerInvoice } from "./components/CustomerInvoice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check } from "lucide-react";

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
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(
    null,
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
    <div className="max-w-2xl mx-auto animate-fade-in pb-8">
      <InvoiceToolbar onDownloadPdf={handleDownloadPdf}>
        {mode === "craftsman" && order.items.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5 h-9"
              >
                {selectedItemIndex !== null
                  ? getProduct(products, order.items[selectedItemIndex].productId)
                      ?.nameBn || t("productWise")
                  : t("allProducts")}
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t("productWiseInvoice")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedItemIndex(null)}>
                <Check
                  className={`mr-2 h-4 w-4 ${selectedItemIndex === null ? "opacity-100" : "opacity-0"}`}
                />
                {t("allProducts")}
              </DropdownMenuItem>
              {order.items.map((item, index) => {
                const product = getProduct(products, item.productId);
                return (
                  <DropdownMenuItem
                    key={`${item.productId}-${index}`}
                    onClick={() => setSelectedItemIndex(index)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${selectedItemIndex === index ? "opacity-100" : "opacity-0"}`}
                    />
                    <span className="truncate">
                      {product?.nameBn || product?.name || `Product ${index + 1}`}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </InvoiceToolbar>

      {canCustomer && canCraftsman && (
        <InvoiceModeTabs mode={mode} onModeChange={setMode} />
      )}

      {mode === "craftsman" ? (
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
