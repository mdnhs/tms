'use client';
import { useState, useRef, useMemo } from 'react';
import { useApiQuery, useInvalidate } from '@/hooks/use-api-query';
import { queryKeys } from '@/lib/query-keys';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { Customer } from '@/types';
import { Plus, Search, Edit2, Trash2, X, Camera, Phone, MapPin, Users, ShoppingBag, Scissors } from 'lucide-react';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { normalizeBangladeshMobile } from '@/lib/bd-phone';
import { Spinner } from '@/components/ui/spinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

const AVATAR_GRADIENTS = [
  'from-sky-400 to-blue-600',
  'from-violet-400 to-purple-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-red-600',
  'from-fuchsia-400 to-pink-600',
  'from-cyan-400 to-sky-600',
  'from-lime-400 to-green-600',
];

function avatarGradient(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

function MobileSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl border border-border p-3.5 animate-pulse shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0 opacity-60">
              <Scissors className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2 opacity-60" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DesktopSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl border border-border p-4 animate-pulse shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0 opacity-60">
              <Scissors className="w-6 h-6 text-muted-foreground" />
            </div>
            <Skeleton className="h-8 w-16 rounded-lg opacity-40" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2 opacity-60" />
          </div>
          <div className="pt-3 border-t border-border flex justify-between">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Customers() {
  const { hasActionPermission, settings } = useData();
  const { t } = useLanguage();
  const { toast } = useToast();
  const invalidate = useInvalidate();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '', photo: '' });
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useEnterNavigation(formRef);
  const cur = settings.currency;

  interface CustomersPageData {
    customers: Customer[];
    orders: Array<{ id: string; customerId: string; totalPrice: number; status: string }>;
  }
  const { data: pageData, isLoading: loading } = useApiQuery<CustomersPageData>(
    queryKeys.customers, '/api/customers-page-data'
  );
  const customers = pageData?.customers || [];
  const orders = pageData?.orders || [];

  const customerStats = useMemo(() => {
    return customers.map(c => {
      const cOrders = orders.filter(o => o.customerId === c.id);
      const totalSpent = cOrders.reduce((s, o) => s + o.totalPrice, 0);
      const activeOrders = cOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
      return { id: c.id, orderCount: cOrders.length, totalSpent, activeOrders };
    });
  }, [customers, orders]);

  const getStats = (id: string) => customerStats.find(s => s.id === id) ?? { orderCount: 0, totalSpent: 0, activeOrders: 0 };

  const filtered = useMemo(() =>
    customers.filter(c => c.name.includes(search) || c.phone.includes(search)),
    [customers, search]
  );

  const { page, setPage, pageData: pagedCustomers, totalPages, totalItems, from, to } = usePagination(filtered, 10);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', phone: '', address: '', notes: '', photo: '' });
    setShowForm(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone, address: c.address, notes: c.notes || '', photo: c.photo || '' });
    setShowForm(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(f => ({ ...f, photo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    const normalizedPhone = normalizeBangladeshMobile(form.phone);
    if (!normalizedPhone) {
      toast({ title: t('invalidBdMobile'), variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editing) {
        const nextCustomer = { ...editing, ...form, phone: normalizedPhone };
        const res = await fetch('/api/customers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(nextCustomer),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update customer');
        toast({ title: t('customerUpdated') });
      } else {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...form, phone: normalizedPhone }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create customer');
        toast({ title: t('customerAdded') });
      }
      invalidate('customer');
      setShowForm(false);
    } catch (err) {
      toast({
        title: t('error'),
        description: err instanceof Error ? err.message : 'Request failed',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/customers?id=${deleteTarget.id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete customer');
      invalidate('customer');
      toast({ title: t('customerDeleted') });
      setDeleteTarget(null);
    } catch (err) {
      toast({ title: t('error'), description: err instanceof Error ? err.message : 'Request failed', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            {t('customers')}
          </h1>
          <div className="text-xs md:text-sm text-muted-foreground mt-0.5">
            {loading ? <Skeleton className="h-4 w-20 inline-block" /> : customers.length} {t('customersCount')}
          </div>
        </div>
        {hasActionPermission('customers', 'edit') && (
          <>
            <Button onClick={openAdd} size="sm" className="md:hidden shrink-0 bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/25">
              <Plus className="w-4 h-4" />
            </Button>
            <Button onClick={openAdd} className="hidden md:inline-flex shrink-0 bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/25 hover:opacity-90 hover:-translate-y-0.5 transition-all">
              <Plus className="w-4 h-4 mr-1.5" /> {t('newCustomer')}
            </Button>
          </>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder={t('searchByNamePhone')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 pr-9 rounded-xl bg-card"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/30 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <form
            ref={formRef}
            onClick={e => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="bg-card rounded-t-3xl md:rounded-2xl border border-border p-5 md:p-6 w-full md:max-w-md space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto safe-area-bottom"
          >
            {/* Drag handle */}
            <div className="w-10 h-1 bg-muted rounded-full mx-auto md:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-base">{editing ? t('editCustomer') : t('newCustomer')}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Photo Upload */}
            <div className="flex items-center gap-4">
              <label className="cursor-pointer group">
                <div className="w-20 h-20 rounded-2xl bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden shrink-0 group-hover:border-primary/50 transition-colors relative">
                  {form.photo ? (
                    <img src={form.photo} alt="Customer" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Camera className="w-6 h-6 text-muted-foreground mx-auto mb-0.5" />
                      <span className="text-[10px] text-muted-foreground">{t('photoOptional')}</span>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
              <div className="flex-1 space-y-1">
                <p className="text-xs text-muted-foreground">{t('photoOptional')}</p>
                <p className="text-[11px] text-muted-foreground/70">JPG, PNG — ক্লিক করে আপলোড করুন</p>
                {form.photo && (
                  <button type="button" onClick={() => setForm(f => ({ ...f, photo: '' }))} className="text-[11px] text-destructive hover:underline">
                    ছবি মুছুন
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('nameRequired')}</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('customerNamePlaceholder')} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('phoneRequired')}</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="01XXXXXXXXX" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('address')}</Label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder={t('addressPlaceholder')} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('notes')}</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={t('notesPlaceholder')} className="rounded-xl" />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setShowForm(false)}>{t('cancel')}</Button>
              <Button type="submit" className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/20" disabled={isSubmitting}>
                {isSubmitting ? <Spinner className="animate-spin" /> : editing ? t('update') : t('save')}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Main List Area */}
      {loading ? (
        <>
          <div className="md:hidden">
            <MobileSkeleton />
          </div>
          <div className="hidden md:block">
            <DesktopSkeleton />
          </div>
        </>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="py-16 text-center text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
            <Users className="w-7 h-7 opacity-40" />
          </div>
          <p className="text-sm font-medium">{t('noCustomerFound')}</p>
          {search && <p className="text-xs mt-1">"{search}" — কোনো গ্রাহক পাওয়া যায়নি</p>}
        </div>
      ) : (
        <>
          {/* Mobile Card List */}
          <div className="md:hidden space-y-2">
            {pagedCustomers.map(c => {
              const stats = getStats(c.id);
              const grad = avatarGradient(c.name);
              return (
                <div key={c.id} className="bg-card rounded-2xl border border-border p-3.5 shadow-sm active:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    {c.photo ? (
                      <img src={c.photo} alt={c.name} className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-sm" />
                    ) : (
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm`}>
                        {c.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground text-sm truncate">{c.name}</p>
                        {stats.activeOrders > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
                            {stats.activeOrders} চলমান
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />{c.phone}
                        </span>
                        {c.address && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[120px]">
                            <MapPin className="w-3 h-3 shrink-0" />{c.address}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex items-center gap-1">
                        {hasActionPermission('customers', 'edit') && (
                          <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasActionPermission('customers', 'delete') && (
                          <button onClick={() => setDeleteTarget(c)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <ShoppingBag className="w-3 h-3" />
                        <span>{stats.orderCount}</span>
                      </div>
                    </div>
                  </div>
                  {stats.totalSpent > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">মোট খরচ</span>
                      <span className="text-xs font-semibold text-foreground">{cur}{stats.totalSpent.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Card Grid */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {pagedCustomers.map(c => {
              const stats = getStats(c.id);
              const grad = avatarGradient(c.name);
              return (
                <div key={c.id} className="bg-card rounded-2xl border border-border p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
                  {/* Avatar + Actions */}
                  <div className="flex items-start justify-between mb-3">
                    {c.photo ? (
                      <img src={c.photo} alt={c.name} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                    ) : (
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-xl font-bold text-white shadow-sm`}>
                        {c.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {hasActionPermission('customers', 'edit') && (
                        <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {hasActionPermission('customers', 'delete') && (
                        <button onClick={() => setDeleteTarget(c)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-foreground text-sm">{c.name}</p>
                      {stats.activeOrders > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          {stats.activeOrders} চলমান
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3 shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                    {c.address && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{c.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="text-center">
                      <p className="text-xs font-bold text-foreground">{stats.orderCount}</p>
                      <p className="text-[10px] text-muted-foreground">{t('navOrders')}</p>
                    </div>
                    <div className="w-px h-6 bg-border" />
                    <div className="text-center">
                      <p className="text-xs font-bold text-foreground">{cur}{stats.totalSpent.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">মোট খরচ</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination */}
      {!loading && <Pagination page={page} totalPages={totalPages} totalItems={totalItems} from={from} to={to} onPageChange={setPage} />}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteCustomer')}</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" — {t('deleteCustomerDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Spinner className="animate-spin" /> : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
