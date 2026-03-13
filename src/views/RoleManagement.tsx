'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/Pagination';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  Shield, Plus, Pencil, Trash2,
  LayoutDashboard, Users, Package, Tag, ShoppingCart,
  ClipboardList, BarChart3, Settings, Hammer, FileText,
  Eye, Edit3, Trash, Scissors,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

type PermActions = 'view' | 'edit' | 'delete';
type PermissionsMap = Record<string, PermActions[]>;

const MENU_PERMISSIONS: { key: string; icon: any; labelKey: string; actions: PermActions[] }[] = [
  { key: 'dashboard',         icon: LayoutDashboard, labelKey: 'dashboard',        actions: ['view'] },
  { key: 'customers',         icon: Users,           labelKey: 'customers',         actions: ['view', 'edit', 'delete'] },
  { key: 'products',          icon: Package,         labelKey: 'products',          actions: ['view', 'edit', 'delete'] },
  { key: 'categories',        icon: Tag,             labelKey: 'categories_menu',   actions: ['view', 'edit', 'delete'] },
  { key: 'create_order',      icon: ShoppingCart,    labelKey: 'createOrder',       actions: ['view', 'edit'] },
  { key: 'orders',            icon: ClipboardList,   labelKey: 'orders',            actions: ['view', 'edit', 'delete'] },
  { key: 'customer_invoice',  icon: FileText,        labelKey: 'customerInvoice',   actions: ['view'] },
  { key: 'craftsman_invoice', icon: Hammer,          labelKey: 'craftsmanInvoice',  actions: ['view'] },
  { key: 'reports',           icon: BarChart3,       labelKey: 'reports',           actions: ['view'] },
  { key: 'craftsman_view',    icon: Hammer,          labelKey: 'craftsmanView',     actions: ['view'] },
  { key: 'settings',          icon: Settings,        labelKey: 'settings',          actions: ['view', 'edit'] },
];

const ROLE_GRADIENTS = [
  'from-violet-400 to-purple-600',
  'from-sky-400 to-blue-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-red-600',
  'from-fuchsia-400 to-pink-600',
  'from-cyan-400 to-sky-600',
  'from-lime-400 to-green-600',
];
function roleGradient(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return ROLE_GRADIENTS[h % ROLE_GRADIENTS.length];
}

const ACTION_STYLE: Record<PermActions, { bg: string; text: string; icon: any }> = {
  view:   { bg: 'bg-sky-100 dark:bg-sky-900/30',       text: 'text-sky-700 dark:text-sky-300',     icon: Eye },
  edit:   { bg: 'bg-amber-100 dark:bg-amber-900/30',   text: 'text-amber-700 dark:text-amber-300', icon: Edit3 },
  delete: { bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-700 dark:text-red-300',     icon: Trash },
};

interface ShopRole {
  id: string;
  shop_id: string;
  name: string;
  name_bn: string;
  permissions: PermissionsMap;
  created_at: string;
  updated_at: string;
}

function normalizePermissions(raw: unknown): PermissionsMap {
  if (Array.isArray(raw)) {
    const map: PermissionsMap = {};
    for (const key of raw) {
      if (typeof key === 'string') {
        const def = MENU_PERMISSIONS.find(m => m.key === key);
        map[key] = def ? [...def.actions] : ['view'];
      }
    }
    return map;
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as PermissionsMap;
  return {};
}

export default function RoleManagement() {
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [roles, setRoles] = useState<ShopRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ShopRole | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/shop-roles', { credentials: 'include' }).then(r => r.json());
      if (res.roles) {
        setRoles(res.roles.map((r: any) => ({ ...r, permissions: normalizePermissions(r.permissions) })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/shop-roles?id=${deleteTarget.id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRoles(prev => prev.filter(role => role.id !== deleteTarget.id));
      toast({ title: t('roleDeleted') });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (err: any) {
      toast({ title: t('error'), description: err.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const { page, setPage, pageData: pagedRoles, totalPages, totalItems, from, to } = usePagination(roles, 10);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            {t('roleManagement')}
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-0.5">{t('roleManagementDesc')}</p>
        </div>
        <Button
          onClick={() => router.push('/roles/new')}
          className="rounded-xl gap-1.5 bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/25 hover:opacity-90 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t('addRole')}</span>
        </Button>
      </div>

      {/* Main Grid Area */}
      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card/50 shadow-sm animate-pulse overflow-hidden space-y-4">
              <div className="h-1 bg-muted w-full" />
              <div className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 opacity-60">
                    <Scissors className="w-4.5 h-4.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3 opacity-60" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6 opacity-60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : roles.length === 0 ? (
        /* Empty state */
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Shield className="h-7 w-7 opacity-40" />
            </div>
            <p className="text-base font-semibold">{t('noRoles')}</p>
            <p className="text-sm mt-1 opacity-60">{t('noRolesDesc')}</p>
            <Button onClick={() => router.push('/roles/new')} className="mt-5 rounded-xl gap-1.5">
              <Plus className="h-4 w-4" /> {t('addRole')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {pagedRoles.map(role => {
            const enabledMenus = Object.keys(role.permissions);
            const pct = Math.round((enabledMenus.length / MENU_PERMISSIONS.length) * 100);
            const grad = roleGradient(role.name);
            const initials = role.name.slice(0, 2).toUpperCase();

            // Collect all unique actions across all menus
            const allActions = new Set<PermActions>();
            enabledMenus.forEach(k => role.permissions[k].forEach(a => allActions.add(a)));

            return (
              <div
                key={role.id}
                className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all group overflow-hidden"
              >
                {/* Top accent */}
                <div className={`h-1 bg-gradient-to-r ${grad}`} />

                <div className="p-4">
                  {/* Role identity row */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground leading-tight truncate">{role.name}</p>
                      {role.name_bn && (
                        <p className="text-xs text-muted-foreground mt-0.5">{role.name_bn}</p>
                      )}
                    </div>
                    {/* Hover-reveal actions */}
                    <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => router.push(`/roles/${role.id}`)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setDeleteTarget(role); setDeleteDialogOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Coverage bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">{t('menuPermissions')}</span>
                      <span className="text-[10px] font-semibold text-foreground">{enabledMenus.length}/{MENU_PERMISSIONS.length}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Permission rows */}
                  {enabledMenus.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">{t('noPermissions')}</p>
                  ) : (
                    <div className="space-y-1">
                      {enabledMenus.slice(0, 5).map(menuKey => {
                        const actions = role.permissions[menuKey];
                        const def = MENU_PERMISSIONS.find(m => m.key === menuKey);
                        const Icon = def?.icon;
                        return (
                          <div key={menuKey} className="flex items-center gap-2">
                            {Icon && (
                              <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center shrink-0">
                                <Icon className="w-3 h-3 text-muted-foreground" />
                              </div>
                            )}
                            <span className="text-xs text-foreground flex-1 min-w-0 truncate">
                              {def ? t(def.labelKey as any) : menuKey}
                            </span>
                            <div className="flex gap-0.5 shrink-0">
                              {actions.map(action => {
                                const s = ACTION_STYLE[action];
                                const AIcon = s.icon;
                                return (
                                  <span key={action} className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                                    <AIcon className="w-2.5 h-2.5" />
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      {enabledMenus.length > 5 && (
                        <p className="text-[10px] text-muted-foreground pt-0.5">
                          +{enabledMenus.length - 5} {t('more')}…
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {Array.from(allActions).map(action => {
                      const s = ACTION_STYLE[action];
                      const AIcon = s.icon;
                      return (
                        <span key={action} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                          <AIcon className="w-2.5 h-2.5" />
                          {t(`permission${action.charAt(0).toUpperCase() + action.slice(1)}` as any)}
                        </span>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => router.push(`/roles/${role.id}`)}
                    className="text-[10px] font-semibold text-primary hover:underline"
                  >
                    {t('edit')} →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} from={from} to={to} onPageChange={setPage} />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteRole')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteRoleDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
              {isDeleting ? <Spinner className="animate-spin" /> : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
