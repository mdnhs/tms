'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { Order, Product, ORDER_STATUS_LABELS } from '@/types';
import { Printer, ArrowLeft, Scissors, Phone, MapPin, Mail, CalendarDays, User, CreditCard, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function InvoicePage() {
  const { id } = useParams();
  const { settings } = useData();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<{ name: string; phone: string; address?: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadInvoice = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/invoice-data?id=${id}`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load invoice');
        if (cancelled) return;
        setOrder(data.order);
        setCustomer(data.customer);
        setProducts(data.products || []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load invoice');
          toast({ title: t('error'), description: 'Could not load invoice data', variant: 'destructive' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadInvoice();
    return () => { cancelled = true; };
  }, [id, t, toast]);

  const handlePrint = () => {
    window.print();
  };

  const getProduct = (pid: string) => products.find(p => p.id === pid);
  const cur = settings.currency || '৳';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Top Bar - No print */}
      <div className="flex items-center justify-between print:hidden bg-card border border-border p-4 rounded-2xl shadow-sm">
        <Link href="/orders">
          <Button variant="ghost" size="sm" className="rounded-xl gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('backToOrders')}</span>
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrint}
            className="rounded-xl bg-primary shadow-md shadow-primary/20 gap-2"
            disabled={loading || !!error}
          >
            <Printer className="w-4 h-4" />
            {t('printInvoice')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-6 rounded-2xl border border-destructive/20 text-center">
          <p className="font-semibold">{error}</p>
          <Link href="/orders" className="text-sm underline mt-2 block">Back to orders</Link>
        </div>
      )}

      {loading ? (
        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-pulse">
          <div className="h-32 bg-muted mb-6" />
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-40 w-full" />
            <div className="flex justify-end">
              <Skeleton className="h-24 w-48" />
            </div>
          </div>
        </div>
      ) : order && (
        <div
          ref={printRef}
          className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden print:shadow-none print:border-none print:rounded-none"
        >
          {/* Invoice Header Branding */}
          <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 p-8 md:p-10 border-b border-primary/10 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  {settings.shopLogo ? (
                    <img src={settings.shopLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Scissors className="w-8 h-8 text-primary-foreground" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                    {settings.shopNameBn || settings.shopName || 'MY TAILOR'}
                  </h1>
                  <p className="text-primary font-bold tracking-[0.2em] text-xs mt-1">INVOICE / বিল ভাউচার</p>
                </div>
              </div>

              <div className="text-left md:text-right">
                <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-bold shadow-sm mb-2">
                  #{order.id.slice(-6).toUpperCase()}
                </div>
                <div className="flex items-center md:justify-end gap-2 text-slate-500 dark:text-slate-400 text-sm">
                  <CalendarDays className="w-4 h-4" />
                  <span>{new Date(order.createdAt).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10 space-y-10">
            {/* Customer & Order Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase">
                  <User className="w-3.5 h-3.5" />
                  {language === 'bn' ? 'গ্রাহকের তথ্য' : 'Customer Info'}
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{customer?.name}</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                      <Phone className="w-3.5 h-3.5" />
                      {customer?.phone}
                    </div>
                    {customer?.address && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                        <MapPin className="w-3.5 h-3.5" />
                        {customer.address}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {language === 'bn' ? 'অর্ডারের বিবরণ' : 'Order Summary'}
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-tight">{language === 'bn' ? 'অর্ডার স্ট্যাটাস' : 'Status'}</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{ORDER_STATUS_LABELS[order.status]}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-tight">{language === 'bn' ? 'ডেলিভারি তারিখ' : 'Delivery Date'}</p>
                    <p className="text-sm font-bold text-primary mt-1">{order.deliveryDate || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-900 dark:bg-slate-800 text-white">
                    <th className="px-6 py-4 text-left font-bold">{language === 'bn' ? 'বিবরণ' : 'Item Description'}</th>
                    <th className="px-6 py-4 text-center font-bold">{language === 'bn' ? 'পরিমাণ' : 'Qty'}</th>
                    <th className="px-6 py-4 text-right font-bold">{language === 'bn' ? 'মূল্য' : 'Price'}</th>
                    <th className="px-6 py-4 text-right font-bold">{language === 'bn' ? 'মোট' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.items.map((item, idx) => {
                    const p = getProduct(item.productId);
                    return (
                      <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-900 dark:text-white text-base">{p?.nameBn || p?.name}</p>
                          {item.measurements.length > 0 && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                              {item.measurements.map((m, midx) => (
                                <div key={midx} className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{m.fieldNameBn}:</span>
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{m.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5 text-center font-bold text-slate-700 dark:text-slate-300 text-base">{item.quantity}</td>
                        <td className="px-6 py-5 text-right font-bold text-slate-700 dark:text-slate-300 text-base">{cur}{item.unitPrice.toLocaleString()}</td>
                        <td className="px-6 py-5 text-right font-bold text-slate-900 dark:text-white text-base">{cur}{item.totalPrice.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations & Footer Notes */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
              <div className="md:col-span-3 space-y-6">
                {order.specialNotes && (
                  <div className="bg-amber-50/50 dark:bg-amber-900/10 border-l-4 border-amber-400 p-5 rounded-r-2xl">
                    <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">{language === 'bn' ? 'বিশেষ নোট' : 'Special Notes'}</p>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed italic">"{order.specialNotes}"</p>
                  </div>
                )}

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{language === 'bn' ? 'শর্তাবলী' : 'Terms & Conditions'}</p>
                  <ul className="list-disc list-inside text-[11px] text-slate-500 dark:text-slate-400 space-y-1 leading-relaxed">
                    <li>{language === 'bn' ? 'ডেলিভারি তারিখের ৭ দিনের মধ্যে পোশাক সংগ্রহ করুন।' : 'Please collect your order within 7 days of delivery date.'}</li>
                    <li>{language === 'bn' ? 'বিল ভাউচার ছাড়া কোনো দাবি গ্রহণযোগ্য নয়।' : 'No claims will be entertained without this bill voucher.'}</li>
                    <li>{language === 'bn' ? 'আমাদের সাথে থাকার জন্য ধন্যবাদ!' : 'Thank you for choosing us!'}</li>
                  </ul>
                </div>
              </div>

              <div className="md:col-span-2 space-y-3 pt-4">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-bold px-2">
                  <span>{language === 'bn' ? 'উপ-মোট' : 'Subtotal'}</span>
                  <span>{cur}{order.totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold px-2">
                  <span>{language === 'bn' ? 'পরিশোধিত' : 'Paid'}</span>
                  <span>{cur}{order.advancePaid.toLocaleString()}</span>
                </div>
                <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
                <div className="flex justify-between items-center bg-rose-600 text-white p-4 rounded-2xl shadow-lg shadow-rose-600/20">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 opacity-80" />
                    <span className="text-lg font-black uppercase tracking-tight">{language === 'bn' ? 'বাকি (Due)' : 'Total Due'}</span>
                  </div>
                  <span className="text-2xl font-black">{cur}{order.dueAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left space-y-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{settings.shopNameBn || settings.shopName}</p>
              <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400">
                {settings.shopPhone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{settings.shopPhone}</span>}
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end">
              <div className="w-32 h-1 bg-slate-900 dark:bg-white mb-2" />
              <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{language === 'bn' ? 'কর্তৃপক্ষের স্বাক্ষর' : 'Authorized Signature'}</p>
            </div>
          </div>

          <div className="bg-primary h-2 w-full" />
        </div>
      )}
    </div>
  );
}
