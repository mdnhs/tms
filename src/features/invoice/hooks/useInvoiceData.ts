import { useState, useEffect } from "react";
import { Customer, Order, Product } from "@/types";
import { InvoiceProductRow, InvoiceStaffRow } from "../types";

interface InvoiceData {
  loading: boolean;
  order: Order | undefined;
  customers: Customer[];
  products: Product[];
  staffList: Array<{ id: string; name: string; phone?: string }>;
}

export function useInvoiceData(id: string | undefined): InvoiceData {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | undefined>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [staffList, setStaffList] = useState<
    Array<{ id: string; name: string; phone?: string }>
  >([]);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/invoice-data/${id}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load invoice");
        if (cancelled) return;
        setOrder(data.order);
        setCustomers(data.customers || []);
        setProducts(
          (data.products || []).map((product: InvoiceProductRow) => ({
            id: product.id,
            name: product.name,
            nameBn: product.name_bn || product.nameBn,
          })),
        );
        setStaffList(
          (data.staff || []).map((staff: InvoiceStaffRow) => ({
            id: staff.id,
            name: staff.name,
            phone: staff.phone || undefined,
          })),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { loading, order, customers, products, staffList };
}
