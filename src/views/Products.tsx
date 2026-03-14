'use client';
import { useState, useRef, useMemo } from 'react';
import { useApiQuery, useInvalidate } from '@/hooks/use-api-query';
import { queryKeys } from '@/lib/query-keys';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { Product, MeasurementField } from '@/types';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/Pagination';
import { Plus, Edit2, Trash2, X, Search, Ruler, Package, Tag, ImageIcon, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
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

const CARD_GRADIENTS = [
  'from-sky-400/20 to-blue-500/10',
  'from-violet-400/20 to-purple-500/10',
  'from-emerald-400/20 to-teal-500/10',
  'from-amber-400/20 to-orange-500/10',
  'from-rose-400/20 to-red-500/10',
  'from-fuchsia-400/20 to-pink-500/10',
  'from-cyan-400/20 to-sky-500/10',
  'from-lime-400/20 to-green-500/10',
];

const ICON_GRADIENTS = [
  'from-sky-400 to-blue-600',
  'from-violet-400 to-purple-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-red-600',
  'from-fuchsia-400 to-pink-600',
  'from-cyan-400 to-sky-600',
  'from-lime-400 to-green-600',
];

function cardGradient(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  const idx = Math.abs(h) % CARD_GRADIENTS.length;
  return { card: CARD_GRADIENTS[idx], icon: ICON_GRADIENTS[idx] };
}

function ProductSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse shadow-sm">
          <div className="h-28 md:h-36 bg-muted flex items-center justify-center opacity-60">
            <Scissors className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="p-3 md:p-4 space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2 opacity-60" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Products() {
  const { hasActionPermission, settings } = useData();
  const { t } = useLanguage();
  const { toast } = useToast();
  const invalidate = useInvalidate();
  const cur = settings.currency;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', nameBn: '', category: '', basePrice: '', image: '' });
  const [fields, setFields] = useState<MeasurementField[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const formRef = useRef<HTMLFormElement>(null);
  useEnterNavigation(formRef);

  interface ProductsPageData {
    products: Product[];
    categories: string[];
  }
  const { data: pageData, isLoading: loading } = useApiQuery<ProductsPageData>(
    queryKeys.products, '/api/products-page-data'
  );
  const products = pageData?.products || [];
  const categories = pageData?.categories || [];

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.nameBn.includes(search);
      return matchCat && matchSearch;
    });
  }, [products, activeCategory, search]);

  const { page, setPage, pageData: pagedProducts, totalPages, totalItems, from, to } = usePagination(filtered, 10);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', nameBn: '', category: '', basePrice: '', image: '' });
    setFields([]);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, nameBn: p.nameBn, category: p.category, basePrice: p.basePrice.toString(), image: p.image || '' });
    setFields([...p.measurementFields]);
    setShowForm(true);
  };

  const addField = () => setFields(f => [...f, { id: Date.now().toString(), name: '', nameBn: '' }]);
  const updateField = (i: number, key: keyof MeasurementField, val: string) =>
    setFields(f => f.map((field, idx) => idx === i ? { ...field, [key]: val } : field));
  const removeField = (i: number) => setFields(f => f.filter((_, idx) => idx !== i));

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.basePrice) return;
    const data = {
      name: form.name,
      nameBn: form.nameBn || form.name,
      category: form.category,
      basePrice: Number(form.basePrice),
      image: form.image || undefined,
      measurementFields: fields.filter(f => f.name),
    };
    setIsSubmitting(true);
    try {
      if (editing) {
        const res = await fetch('/api/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...editing, ...data }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to update product');
        toast({ title: t('productUpdated') });
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to create product');
        toast({ title: t('productAdded') });
      }
      invalidate('product');
      setShowForm(false);
    } catch (err) {
      toast({ title: t('error'), description: err instanceof Error ? err.message : 'Request failed', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products?id=${deleteTarget.id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete product');
      invalidate('product');
      toast({ title: t('productDeleted') });
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
            <Package className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            {t('products')}
          </h1>
          <div className="text-xs md:text-sm text-muted-foreground mt-0.5">
            {loading ? <Skeleton className="h-4 w-20 inline-block" /> : products.length} {t('productsCount')}
          </div>
        </div>
        {hasActionPermission('products', 'edit') && (
          <>
            <Button onClick={openAdd} size="sm" className="md:hidden shrink-0 bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/25">
              <Plus className="w-4 h-4" />
            </Button>
            <Button onClick={openAdd} className="hidden md:inline-flex shrink-0 bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/25 hover:opacity-90 hover:-translate-y-0.5 transition-all">
              <Plus className="w-4 h-4 mr-1.5" /> {t('newProduct')}
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

      {/* Category filter tabs */}
      {(loading || categories.length > 0) && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-xl shrink-0" />
            ))
          ) : (
            <>
              <button
                onClick={() => setActiveCategory('all')}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  activeCategory === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                }`}
              >
                সব ({products.length})
              </button>
              {categories.map(cat => {
                const count = products.filter(p => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      activeCategory === cat
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                        : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/30 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <form
            ref={formRef}
            onClick={e => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="bg-card rounded-t-3xl md:rounded-2xl border border-border p-5 md:p-6 w-full md:max-w-lg space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto safe-area-bottom"
          >
            <div className="w-10 h-1 bg-muted rounded-full mx-auto md:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-base">{editing ? t('editProduct') : t('newProduct')}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Image upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('productImage')}</Label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl border border-dashed border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {form.image
                    ? <img src={form.image} alt="Product" className="w-full h-full object-cover" />
                    : <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  }
                </div>
                <div className="flex-1 space-y-1">
                  <Input type="file" accept="image/*" onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => setForm(f => ({ ...f, image: reader.result as string }));
                    reader.readAsDataURL(file);
                  }} className="rounded-xl text-xs" />
                  {form.image && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, image: '' }))} className="text-[11px] text-destructive hover:underline">
                      ছবি মুছুন
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('nameEn')}</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Shirt" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('nameBn')}</Label>
                <Input value={form.nameBn} onChange={e => setForm(f => ({ ...f, nameBn: e.target.value }))} placeholder="শার্ট" className="rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('category')}</Label>
                <Select value={form.category} onValueChange={val => setForm(f => ({ ...f, category: val }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder={t('selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('basePrice')}</Label>
                <Input type="number" value={form.basePrice} onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))} placeholder="800" className="rounded-xl" />
              </div>
            </div>

            {/* Measurement Fields */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5" /> {t('measurementFields')}
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addField} className="h-7 text-xs rounded-lg">
                  <Plus className="w-3 h-3 mr-1" /> {t('add')}
                </Button>
              </div>
              {fields.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2 bg-muted/40 rounded-xl">{t('noMeasurementFields')}</p>
              )}
              <div className="space-y-2">
                {fields.map((f, i) => (
                  <div key={f.id} className="flex gap-2 items-center bg-muted/30 rounded-xl p-2">
                    <span className="text-xs text-muted-foreground w-4 shrink-0 text-center">{i + 1}</span>
                    <Input placeholder="Name (EN)" value={f.name} onChange={e => updateField(i, 'name', e.target.value)} className="flex-1 h-8 text-xs rounded-lg" />
                    <Input placeholder="নাম (বাংলা)" value={f.nameBn} onChange={e => updateField(i, 'nameBn', e.target.value)} className="flex-1 h-8 text-xs rounded-lg" />
                    <button type="button" onClick={() => removeField(i)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
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
        <ProductSkeleton />
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="py-16 text-center text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
            <Package className="w-7 h-7 opacity-40" />
          </div>
          <p className="text-sm font-medium">{t('noData')}</p>
          {search && <p className="text-xs mt-1">"{search}" — কোনো পণ্য পাওয়া যায়নি</p>}
        </div>
      ) : (
        /* Product Cards */
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-4">
          {pagedProducts.map(p => {
            const { card, icon } = cardGradient(p.name);
            return (
              <div key={p.id} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
                {/* Image / Placeholder */}
                {p.image ? (
                  <div className="relative h-28 md:h-36 overflow-hidden">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    {p.category && (
                      <span className="absolute top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-sm">
                        {p.category}
                      </span>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {hasActionPermission('products', 'edit') && (
                        <button onClick={() => openEdit(p)} className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm transition-colors">
                          <Edit2 className="w-3 h-3 text-foreground" />
                        </button>
                      )}
                      {hasActionPermission('products', 'delete') && (
                        <button onClick={() => setDeleteTarget(p)} className="p-1.5 bg-white/90 hover:bg-red-50 rounded-lg shadow-sm transition-colors">
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`relative h-28 md:h-36 bg-gradient-to-br ${card} flex items-center justify-center`}>
                    {p.category && (
                      <span className="absolute top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-background/60 text-foreground backdrop-blur-sm border border-border/50">
                        {p.category}
                      </span>
                    )}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${icon} flex items-center justify-center shadow-lg`}>
                      <span className="text-2xl font-bold text-white">{(p.nameBn || p.name).charAt(0)}</span>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {hasActionPermission('products', 'edit') && (
                        <button onClick={() => openEdit(p)} className="p-1.5 bg-background/80 hover:bg-background rounded-lg shadow-sm transition-colors border border-border/50">
                          <Edit2 className="w-3 h-3 text-foreground" />
                        </button>
                      )}
                      {hasActionPermission('products', 'delete') && (
                        <button onClick={() => setDeleteTarget(p)} className="p-1.5 bg-background/80 hover:bg-red-50 rounded-lg shadow-sm transition-colors border border-border/50">
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Body */}
                <div className="p-3 md:p-4">
                  <h3 className="font-semibold text-foreground font-bangla text-sm md:text-base leading-tight">{p.nameBn}</h3>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 mb-2">{p.name}</p>

                  <div className="flex items-center justify-between mb-3">
                    <p className="text-base md:text-lg font-bold text-primary">{cur}{p.basePrice.toLocaleString()}</p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Ruler className="w-3 h-3" />
                      <span>{p.measurementFields.length}</span>
                    </div>
                  </div>

                  {p.measurementFields.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.measurementFields.slice(0, 4).map(f => (
                        <span key={f.id} className="text-[10px] bg-primary/8 text-primary px-1.5 py-0.5 rounded-md font-medium border border-primary/15">
                          {f.nameBn || f.name}
                        </span>
                      ))}
                      {p.measurementFields.length > 4 && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">
                          +{p.measurementFields.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && <Pagination page={page} totalPages={totalPages} totalItems={totalItems} from={from} to={to} onPageChange={setPage} />}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteProduct')}</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.nameBn || deleteTarget?.name}" — {t('deleteProductDesc')}
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
