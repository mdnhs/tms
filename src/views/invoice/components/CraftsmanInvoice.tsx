import { forwardRef } from "react";
import { Scissors } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Customer, Order, Product, ShopSettings } from "@/types";
import { CraftsmanSlip } from "./CraftsmanSlip";
import { CraftsmanItemsGrid } from "./CraftsmanItemsGrid";
import { formatShortDateBn } from "../utils";

interface CraftsmanInvoiceProps {
  order: Order;
  customer: Customer;
  products: Product[];
  invoiceNo: string;
  assignedStaffName: string;
  settings: ShopSettings;
}

export const CraftsmanInvoice = forwardRef<
  HTMLDivElement,
  CraftsmanInvoiceProps
>(function CraftsmanInvoice(
  { order, customer, products, invoiceNo, assignedStaffName, settings },
  ref,
) {
  const { t } = useLanguage();

  const shopName = settings.shopNameBn || settings.shopName || "S";
  const deliveryDateText = order.deliveryDate
    ? formatShortDateBn(order.deliveryDate)
    : "";

  const sharedSlipProps = {
    orderId: order.id,
    customerName: customer.name,
    invoiceNo,
    createdAt: order.createdAt,
    assignedStaffName,
    deliveryDateText,
    shopName,
    shopPhone: settings.shopPhone,
    shopAddress: settings.shopAddress,
    shopLogo: settings.shopLogo,
    title: t("craftsmanInvoice"),
    orderLabel: t("order"),
    customerNameLabel: t("customerName"),
    assignedToLabel: t("assignedTo"),
    deliveryDateLabel: t("deliveryDate"),
    showDeliveryDateField: true,
  };

  return (
    <div
      ref={ref}
      className="print-area invoice-bn-tight invoice-ink bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      <div className="h-1 bg-slate-900" />

      <CraftsmanSlip showShopHeader {...sharedSlipProps}>
        <CraftsmanItemsGrid order={order} products={products} />
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
        {...sharedSlipProps}
        showShopHeader={false}
        footer={
          <div className="grid grid-cols-2 gap-4 mt-4 pt-2">
            <div className="flex flex-col justify-end min-h-[44px]">
              <p className="text-[10px] text-slate-500 mb-3 font-bangla">
                {t("wages")}
              </p>
              <div className="pt-1 text-xs font-medium text-slate-700">
                --------------------------------------------
              </div>
            </div>
            <div className="flex flex-col justify-end items-end min-h-[44px]">
              <p className="text-[10px] text-slate-500 mb-3 font-bangla">
                {t("signature")}
              </p>
              <div className="pt-1 text-right text-xs font-medium text-slate-700">
                --------------------------------------------
              </div>
            </div>
          </div>
        }
      >
        <CraftsmanItemsGrid
          order={order}
          products={products}
          compact
          hideMeasurements
        />
      </CraftsmanSlip>
    </div>
  );
});
