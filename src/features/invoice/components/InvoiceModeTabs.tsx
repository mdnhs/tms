import { useLanguage } from "@/contexts/LanguageContext";
import { InvoiceMode } from "../types";

interface InvoiceModeTabsProps {
  mode: InvoiceMode;
  onModeChange: (mode: InvoiceMode) => void;
}

const MODES: InvoiceMode[] = ["customer", "craftsman"];

export function InvoiceModeTabs({ mode, onModeChange }: InvoiceModeTabsProps) {
  const { t } = useLanguage();

  return (
    <div className="flex gap-1.5 mb-4 no-print p-1 bg-muted rounded-xl w-fit">
      {MODES.map((m) => (
        <button
          key={m}
          onClick={() => onModeChange(m)}
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
  );
}
