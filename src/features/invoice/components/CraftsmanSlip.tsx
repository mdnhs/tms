import { CraftsmanSlipProps } from "../types";
import { InvoiceHeader } from "./InvoiceHeader";
import { CraftsmanInfoField } from "./CraftsmanInfoField";
import { formatOrderId } from "../utils";

export function CraftsmanSlip({
  compact = false,
  showShopHeader = false,
  showDeliveryDateField = false,
  orderId,
  customerName,
  invoiceNo,
  referenceNo,
  createdAt,
  assignedStaffName,
  deliveryDateText,
  shopName,
  shopPhone,
  shopAddress,
  shopLogo,
  title,
  orderLabel,
  customerNameLabel,
  assignedToLabel,
  deliveryDateLabel,
  rangeTitle,
  rangeValue,
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
          referenceNo={referenceNo}
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
          rangeTitle={showDeliveryDateField ? rangeTitle : undefined}
          rangeValue={showDeliveryDateField ? rangeValue : undefined}
          showDeliveryDate={showDeliveryDateField}
          showRangeField={showDeliveryDateField}
        />
      ) : null}

      {!showShopHeader && rangeTitle ? (
        <div className="mb-2 flex items-center gap-2">
          <p className="text-[10px] font-semibold text-slate-500 font-bangla shrink-0">
            {rangeTitle}:
          </p>
          <div className="min-h-6 rounded border border-slate-400 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-900 font-bangla flex items-center">
            {rangeValue || ""}
          </div>
        </div>
      ) : null}

      <div
        className={`grid grid-cols-2 gap-2.5 ${showShopHeader ? "mt-2.5 mb-3" : "mb-3"}`}
      >
        <CraftsmanInfoField
          compact={!showShopHeader || compact}
          label={orderLabel}
          value={formatOrderId(orderId)}
          secondaryValue={
            customerName
              ? `${customerNameLabel || "Customer"}: ${customerName}`
              : undefined
          }
          borderless
        />
        <CraftsmanInfoField
          compact={!showShopHeader || compact}
          label={assignedToLabel}
          value={assignedStaffName}
          inputStyle
          borderless
        />
      </div>

      <div className={compact ? "mt-2.5" : ""}>{children}</div>
      {footer}
    </div>
  );
}
