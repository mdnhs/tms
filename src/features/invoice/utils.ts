import { Product } from "@/types";

type InvoiceLanguage = "bn" | "en";

export function getProduct(products: Product[], productId: string) {
  return products.find((product) => product.id === productId);
}

export function getStaffName(
  staffList: Array<{ id: string; name: string }>,
  staffId: string,
) {
  return staffList.find((staff) => staff.id === staffId)?.name;
}

export function formatInvoiceNo(prefix: string, orderId: string) {
  return `${prefix}${orderId.slice(-6).toUpperCase()}`;
}

export function formatOrderId(orderId: string) {
  return `#${orderId.slice(-8).toUpperCase()}`;
}

export function formatDate(date: string, language: InvoiceLanguage = "bn") {
  return new Date(date).toLocaleDateString(
    language === "bn" ? "bn-BD" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );
}

export function formatShortDate(
  date: string,
  language: InvoiceLanguage = "bn",
) {
  return new Date(date).toLocaleDateString(
    language === "bn" ? "bn-BD" : "en-US",
  );
}

export function formatDateBn(date: string) {
  return new Date(date).toLocaleDateString("bn-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDateBn(date: string) {
  return new Date(date).toLocaleDateString("bn-BD");
}
