import { forwardRef } from "react";
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Hash,
  CheckCircle2,
  Ruler,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Customer,
  Order,
  Product,
  ShopSettings,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/types";
import { InvoiceHeader } from "./InvoiceHeader";
import { getProduct, formatOrderId, formatShortDate } from "../utils";

interface CustomerInvoiceProps {
  order: Order;
  customer: Customer;
  products: Product[];
  invoiceNo: string;
  referenceNo?: string;
  settings: ShopSettings;
}

export const CustomerInvoice = forwardRef<HTMLDivElement, CustomerInvoiceProps>(
  function CustomerInvoice(
    { order, customer, products, invoiceNo, referenceNo, settings },
    ref,
  ) {
    const { t, language } = useLanguage();
    const shopName = settings.shopNameBn || settings.shopName || "S";

    return (
      <div
        ref={ref}
        className="print-area invoice-bn-tight invoice-ink bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
      >
        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />

        <InvoiceHeader
          title={t("customerInvoice")}
          invoiceNo={invoiceNo}
          referenceNo={referenceNo}
          shopName={shopName}
          shopAddress={settings.shopAddress}
          shopPhone={settings.shopPhone}
          shopLogo={settings.shopLogo}
          createdAt={order.createdAt}
        />

        {/* Customer + Order Info */}
        <div className="px-8 py-5 grid grid-cols-2 gap-6 border-b border-border bg-muted/20 print-no-break">
          <CustomerInfoSection customer={customer} />
          <OrderInfoSection order={order} settings={settings} />
        </div>

        {/* Products Table */}
        <ProductsTable
          order={order}
          products={products}
          settings={settings}
          language={language}
        />

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

        {/* Payment Summary */}
        <PaymentSummary
          order={order}
          products={products}
          settings={settings}
          language={language}
        />

        {/* Footer */}
        <div className="px-8 py-5 border-t border-border bg-muted/20 text-center space-y-1 print-no-break">
          <p className="text-sm font-medium text-foreground">{t("thankYou")}</p>
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
    );
  },
);

function CustomerInfoSection({ customer }: { customer: Customer }) {
  const { t } = useLanguage();

  return (
    <div>
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
          <p className="text-sm text-muted-foreground">{customer.phone}</p>
        </div>
        {customer.address && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">{customer.address}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderInfoSection({
  order,
  settings,
}: {
  order: Order;
  settings: ShopSettings;
}) {
  const { t, language } = useLanguage();

  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground font-bangla mb-2">
        {t("orderInfo")}
      </p>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <Hash className="w-3 h-3 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground font-mono">
            {formatOrderId(order.id)}
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
              {t("deliveryDate")}: {formatShortDate(order.deliveryDate, language)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductsTable({
  order,
  products,
  settings,
  language,
}: {
  order: Order;
  products: Product[];
  settings: ShopSettings;
  language: "bn" | "en";
}) {
  const { t } = useLanguage();

  return (
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
            <th className="text-right pb-2.5 font-semibold text-foreground w-24">
              {t("price")}
            </th>
            <th className="text-right pb-2.5 font-semibold text-foreground w-24">
              {t("total")}
            </th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => {
            const product = getProduct(products, item.productId);
            return (
              <tr key={i} className="border-b border-border/50 last:border-0">
                <td className="py-3 font-medium">
                  {language === "bn"
                    ? product?.nameBn || product?.name || "-"
                    : product?.name || product?.nameBn || "-"}
                </td>
                <td className="py-3 text-center text-muted-foreground">
                  {item.quantity}
                </td>
                <td className="py-3 text-right text-muted-foreground">
                  {settings.currency}
                  {item.unitPrice.toLocaleString()}
                </td>
                <td className="py-3 text-right font-semibold">
                  {settings.currency}
                  {item.totalPrice.toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PaymentSummary({
  order,
  products,
  settings,
  language,
}: {
  order: Order;
  products: Product[];
  settings: ShopSettings;
  language: "bn" | "en";
}) {
  const { t } = useLanguage();

  return (
    <div className="px-8 py-5 border-t border-border print-no-break">
      <div className="ml-auto max-w-xs space-y-2">
        {order.items.length > 1 && (
          <>
            {order.items.map((item, i) => {
              const product = getProduct(products, item.productId);
              return (
                <div
                  key={i}
                  className="flex justify-between text-xs text-muted-foreground"
                >
                  <span>
                    {language === "bn"
                      ? product?.nameBn || product?.name
                      : product?.name || product?.nameBn}{" "}
                    ×{item.quantity}
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
          <span className="text-muted-foreground">{t("totalPrice")}</span>
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
  );
}
