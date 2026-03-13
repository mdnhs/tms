'use client';
import { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { Plus, Trash2, Tag, Edit2, Check, X, LayoutGrid, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/Pagination';
import { Skeleton } from '@/components/ui/skeleton';

const CAT_GRADIENTS = [
  { bg: 'from-sky-400/15 to-blue-500/10', icon: 'from-sky-400 to-blue-600', border: 'border-sky-200/60 dark:border-sky-900/40' },
  { bg: 'from-violet-400/15 to-purple-500/10', icon: 'from-violet-400 to-purple-600', border: 'border-violet-200/60 dark:border-violet-900/40' },
  { bg: 'from-emerald-400/15 to-teal-500/10', icon: 'from-emerald-400 to-teal-600', border: 'border-emerald-200/60 dark:border-emerald-900/40' },
  { bg: 'from-amber-400/15 to-orange-500/10', icon: 'from-amber-400 to-orange-500', border: 'border-amber-200/60 dark:border-amber-900/40' },
  { bg: 'from-rose-400/15 to-red-500/10', icon: 'from-rose-400 to-red-600', border: 'border-rose-200/60 dark:border-rose-900/40' },
  { bg: 'from-fuchsia-400/15 to-pink-500/10', icon: 'from-fuchsia-400 to-pink-600', border: 'border-fuchsia-200/60 dark:border-fuchsia-900/40' },
  { bg: 'from-cyan-400/15 to-sky-500/10', icon: 'from-cyan-400 to-sky-600', border: 'border-cyan-200/60 dark:border-cyan-900/40' },
  { bg: 'from-lime-400/15 to-green-500/10', icon: 'from-lime-400 to-green-600', border: 'border-lime-200/60 dark:border-lime-900/40' },
];

export default function Categories() {
  const { reloadData } = useData();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Array<{ category: string }>>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/products-page-data', { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load categories');
        if (cancelled) return;
        setCategories(data.categories || []);
        setProducts(data.products || []);
      } catch (err) {
        if (!cancelled) {
          toast({ title: t('error'), description: err instanceof Error ? err.message : 'Request failed', variant: 'destructive' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadData();
    return () => { cancelled = true; };
  }, [t, toast]);

  const handleAdd = () => {
    const name = newCategory.trim();
    if (!name) return;
    if (categories.includes(name)) {
      toast({ title: t('categoryExists'), variant: 'destructive' });
      return;
    }
    void (async () => {
      setIsAdding(true);
      try {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add category');
        setCategories(prev => [...prev, name]);
        setNewCategory('');
        void reloadData();
        toast({ title: t('categoryAdded') });
      } catch (err) {
        toast({ title: t('error'), description: err instanceof Error ? err.message : 'Request failed', variant: 'destructive' });
      } finally {
        setIsAdding(false);
      }
    })();
  };

  const startEdit = (cat: string) => {
    setEditingCat(cat);
    setEditValue(cat);
  };

  const saveEdit = () => {
    const name = editValue.trim();
    if (!name || !editingCat) return;
    if (name !== editingCat && categories.includes(name)) {
      toast({ title: t('categoryExists'), variant: 'destructive' });
      return;
    }
    void (async () => {
      setIsEditing(true);
      try {
        const res = await fetch('/api/categories', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ oldName: editingCat, newName: name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update category');
        setCategories(prev => prev.map(category => category === editingCat ? name : category));
        setProducts(prev => prev.map(product => product.category === editingCat ? { ...product, category: name } : product));
        setEditingCat(null);
        void reloadData();
        toast({ title: t('categoryUpdated') });
      } catch (err) {
        toast({ title: t('error'), description: err instanceof Error ? err.message : 'Request failed', variant: 'destructive' });
      } finally {
        setIsEditing(false);
      }
    })();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    void (async () => {
      setIsDeleting(true);
      try {
        const res = await fetch(`/api/categories?name=${encodeURIComponent(deleteTarget)}`, { method: 'DELETE', credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete category');
        setCategories(prev => prev.filter(category => category !== deleteTarget));
        setDeleteTarget(null);
        void reloadData();
        toast({ title: t('categoryDeleted') });
      } catch (err) {
        toast({ title: t('error'), description: err instanceof Error ? err.message : 'Request failed', variant: 'destructive' });
      } finally {
        setIsDeleting(false);
      }
    })();
  };

  const { page, setPage, pageData: pagedCategories, totalPages, totalItems, from, to } = usePagination(categories, 10);

  return (
    <div className="space-y-4 md:space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          {t('categories_menu')}
        </h1>
        <div className="text-xs md:text-sm text-muted-foreground mt-0.5">
          {loading ? <Skeleton className="h-4 w-20 inline-block" /> : categories.length} {t('categoriesCount')}
        </div>
      </div>

      {/* Add input */}
      <div className="flex gap-2 max-w-md">
        <Input
          placeholder={t('newCategoryPlaceholder')}
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="rounded-xl bg-card"
        />
        <Button
          onClick={handleAdd}
          disabled={isAdding}
          className="shrink-0 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/25 hover:opacity-90 transition-all"
        >
          {isAdding ? <Spinner className="animate-spin" /> : <><Plus className="w-4 h-4 mr-1.5" /> {t('add')}</>}
        </Button>
      </div>

      {/* Main Grid Area */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-4 animate-pulse space-y-3 h-32">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 opacity-60">
                <Scissors className="w-4.5 h-4.5 text-muted-foreground" />
              </div>
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2 opacity-60" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        /* Empty state */
        <div className="py-16 text-center text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
            <Tag className="w-7 h-7 opacity-40" />
          </div>
          <p className="text-sm font-medium">{t('noData')}</p>
        </div>
      ) : (
        /* Category Cards */
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-4">
          {pagedCategories.map((cat, index) => {
            const g = CAT_GRADIENTS[index % CAT_GRADIENTS.length];
            const productCount = products.filter(p => p.category === cat).length;

            return (
              <div
                key={cat}
                className={`bg-gradient-to-br ${g.bg} rounded-2xl border ${g.border} p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group`}
              >
                {editingCat === cat ? (
                  <div className="space-y-2">
                    <Input
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingCat(null); }}
                      className="h-8 text-sm rounded-lg"
                      autoFocus
                    />
                    <div className="flex gap-1.5">
                      <button
                        onClick={saveEdit}
                        disabled={isEditing}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors"
                      >
                        {isEditing ? <Spinner className="animate-spin" /> : <><Check className="w-3.5 h-3.5" /> সংরক্ষণ</>}
                      </button>
                      <button
                        onClick={() => setEditingCat(null)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 text-xs font-medium transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> বাতিল
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${g.icon} flex items-center justify-center shadow-sm`}>
                        <Tag className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(cat)}
                          className="p-1.5 bg-background/70 hover:bg-background rounded-lg transition-colors border border-border/40"
                        >
                          <Edit2 className="w-3 h-3 text-foreground" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          className="p-1.5 bg-background/70 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border border-border/40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="font-semibold text-foreground text-sm md:text-base leading-tight">{cat}</p>
                    <p className="text-xs text-muted-foreground mt-1">{productCount} {t('productsCount')}</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} from={from} to={to} onPageChange={setPage} />

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteCategory')}</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget}" — {t('deleteCategoryDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
              {isDeleting ? <Spinner className="animate-spin" /> : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
