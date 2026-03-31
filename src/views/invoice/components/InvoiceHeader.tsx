import { MapPin, Phone, Calendar } from "lucide-react";
import { InvoiceHeaderProps } from "../types";
import { formatDateBn } from "../utils";

export function InvoiceHeader({
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
  rangeTitle,
  showDeliveryDate,
  showRangeField,
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
            {formatDateBn(createdAt)}
          </p>
        </div>
      </div>
      {showDeliveryDate ? (
        <div className="mt-2 flex items-start gap-3 w-full">
          {showRangeField ? (
            <div className="w-40 shrink-0">
              <p className="text-sm font-semibold text-muted-foreground font-bangla mb-1 ">
                {rangeTitle}
              </p>
              <div className="min-h-8 w-40 rounded-lg border border-slate-400 bg-white px-2 py-1" />
            </div>
          ) : null}
          <div className="w-40 shrink-0 ml-auto">
            <p className="text-sm font-semibold text-muted-foreground font-bangla mb-1 text-right">
              {deliveryDateTitle}
            </p>
            <div className="min-h-8 w-40 rounded-lg border border-slate-400 bg-white px-2 py-1 text-xs font-semibold text-slate-900 flex items-center justify-center">
              {deliveryDateText || (
                <span className="font-mono tracking-tight">
                  {deliveryDateLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
