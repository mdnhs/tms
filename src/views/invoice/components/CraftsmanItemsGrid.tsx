import { useLanguage } from "@/context/LanguageContext";
import { Order, Product } from "@/types";
import { CraftsmanMeasurementBox } from "./CraftsmanMeasurementBox";
import { getProduct, formatOrderId } from "../utils";

interface CraftsmanItemsGridProps {
  order: Order;
  products: Product[];
  compact?: boolean;
  hideMeasurements?: boolean;
}

export function CraftsmanItemsGrid({
  order,
  products,
  compact = false,
  hideMeasurements = false,
}: CraftsmanItemsGridProps) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-2 gap-2">
      {order.items.map((item, index) => {
        const product = getProduct(products, item.productId);
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
                  {formatOrderId(order.id)}
                </p>
              </div>
              <div className="rounded-full border border-slate-300 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                {t("qty")}: {item.quantity}
              </div>
            </div>

            {!hideMeasurements && (
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
            )}
          </div>
        );
      })}
    </div>
  );
}
