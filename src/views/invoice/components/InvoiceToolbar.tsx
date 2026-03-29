import Link from "next/link";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

interface InvoiceToolbarProps {
  onDownloadPdf: () => void;
  children?: React.ReactNode;
}

export function InvoiceToolbar({
  onDownloadPdf,
  children,
}: InvoiceToolbarProps) {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between mb-5 no-print">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> {t("orderList")}
      </Link>
      <div className="flex items-center gap-2">
        {children}
        <Button
          onClick={onDownloadPdf}
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
  );
}
