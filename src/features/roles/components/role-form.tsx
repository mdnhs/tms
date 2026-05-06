'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApiQuery, useInvalidate } from '@/hooks/use-api-query';
import { queryKeys } from '@/lib/query-keys';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  Shield, ArrowLeft, Save,
  LayoutDashboard, Users, Package, Tag, ShoppingCart,
  ClipboardList, BarChart3, Settings, Hammer, FileText, Wallet,
  Eye, Edit3, Trash, CheckSquare, Square,
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  { key: 'craftsman_wages',   icon: Wallet,          labelKey: 'craftsmanWages',    actions: ['view'] },
  { key: 'settings',          icon: Settings,        labelKey: 'settings',          actions: ['view', 'edit'] },
];

const ACTION_COL: Record<PermActions, { label: string; activeColor: string; inactiveColor: string; icon: any; headerBg: string }> = {
  view:   { label: 'permissionView',   activeColor: 'bg-sky-500',    inactiveColor: 'bg-muted',  icon: Eye,   headerBg: 'text-sky-600 dark:text-sky-400' },
  edit:   { label: 'permissionEdit',   activeColor: 'bg-amber-500',  inactiveColor: 'bg-muted',  icon: Edit3, headerBg: 'text-amber-600 dark:text-amber-400' },
  delete: { label: 'permissionDelete', activeColor: 'bg-red-500',    inactiveColor: 'bg-muted',  icon: Trash, headerBg: 'text-red-600 dark:text-red-400' },
};

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

interface RoleFormProps {
  roleId?: string;
}

export default function RoleForm({ roleId }: RoleFormProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();

  const invalidate = useInvalidate();
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState('');
  const [formNameBn, setFormNameBn] = useState('');
  const [formPermissions, setFormPermissions] = useState<PermissionsMap>({});

  const isEdit = !!roleId;

  interface RoleData { roles: Array<{ name: string; name_bn?: string; permissions: any }> }
  const { data: roleData, isLoading: loading } = useApiQuery<RoleData>(
    queryKeys.roleDetail(roleId || ''),
    `/api/shop-roles?id=${encodeURIComponent(roleId || '')}`,
    isEdit,
  );

  useEffect(() => {
    if (roleData?.roles?.[0]) {
      const role = roleData.roles[0];
      setFormName(role.name);
      setFormNameBn(role.name_bn || '');
      setFormPermissions(normalizePermissions(role.permissions));
    }
  }, [roleData]);

  const toggleAction = (menuKey: string, action: PermActions) => {
    setFormPermissions(prev => {
      const current = prev[menuKey] || [];
      if (action === 'view' && current.includes('view')) {
        const next = { ...prev };
        delete next[menuKey];
        return next;
      }
      if (action !== 'view' && !current.includes('view')) {
        return { ...prev, [menuKey]: ['view', action] };
      }
      if (current.includes(action)) {
        const updated = current.filter(a => a !== action);
        if (updated.length === 0) {
          const next = { ...prev };
          delete next[menuKey];
          return next;
        }
        return { ...prev, [menuKey]: updated };
      }
      return { ...prev, [menuKey]: [...current, action] };
    });
  };

  // Toggle entire row on/off
  const toggleRow = (menuKey: string, available: PermActions[]) => {
    setFormPermissions(prev => {
      const current = prev[menuKey] || [];
      if (current.length > 0) {
        const next = { ...prev };
        delete next[menuKey];
        return next;
      }
      return { ...prev, [menuKey]: [...available] };
    });
  };

  const selectAll = () => {
    const all: PermissionsMap = {};
    MENU_PERMISSIONS.forEach(({ key, actions }) => { all[key] = [...actions]; });
    setFormPermissions(all);
  };

  const clearAll = () => setFormPermissions({});

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const body = { name: formName.trim(), name_bn: formNameBn.trim(), permissions: formPermissions };
      const res = await fetch('/api/shop-roles', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(isEdit ? { id: roleId, ...body } : body),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      invalidate('role');
      toast({ title: isEdit ? t('roleUpdated') : t('roleCreated') });
      router.push('/roles');
    } catch (err: any) {
      toast({ title: t('error'), description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const enabledCount = Object.keys(formPermissions).length;
  const pct = Math.round((enabledCount / MENU_PERMISSIONS.length) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/roles')}
          className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary shrink-0" />
            {isEdit ? t('editRole') : t('addRole')}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{t('roleDialogDesc')}</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !formName.trim()}
          className="rounded-xl gap-1.5 bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/25 hover:opacity-90 shrink-0"
        >
          {saving
            ? <Spinner className="w-4 h-4 animate-spin" />
            : <Save className="w-4 h-4" />
          }
          {isEdit ? t('update') : t('save')}
        </Button>
      </div>

      {/* Name fields */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">{t('roleName')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('roleName')} (EN)</Label>
            <Input
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="e.g. Manager"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('roleNameBn')} (BN)</Label>
            <Input
              value={formNameBn}
              onChange={e => setFormNameBn(e.target.value)}
              placeholder="যেমন: ম্যানেজার"
              className="rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">

        {/* Section header */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">{t('menuPermissions')}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="text-[11px] font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                {t('selectAll')}
              </button>
              <span className="text-muted-foreground/40">|</span>
              <button
                onClick={clearAll}
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <Square className="w-3.5 h-3.5" />
                {t('clearAll')}
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-foreground shrink-0">
              {enabledCount}/{MENU_PERMISSIONS.length}
            </span>
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_64px_64px_64px] px-5 py-2 bg-muted/40 border-b border-border">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{t('menu')}</span>
          {(['view', 'edit', 'delete'] as PermActions[]).map(a => {
            const col = ACTION_COL[a];
            const AIcon = col.icon;
            return (
              <div key={a} className="flex flex-col items-center gap-0.5">
                <AIcon className={`w-3.5 h-3.5 ${col.headerBg}`} />
                <span className={`text-[9px] font-bold uppercase tracking-wide ${col.headerBg}`}>
                  {t(col.label as any)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Permission rows */}
        <div className="divide-y divide-border/60">
          {MENU_PERMISSIONS.map(({ key, icon: Icon, labelKey, actions: available }) => {
            const current = formPermissions[key] || [];
            const isEnabled = current.length > 0;
            return (
              <div
                key={key}
                className={`grid grid-cols-[1fr_64px_64px_64px] px-5 py-3 items-center transition-colors ${
                  isEnabled ? 'bg-primary/5' : 'hover:bg-muted/30'
                }`}
              >
                {/* Menu label — click to toggle entire row */}
                <button
                  onClick={() => toggleRow(key, available)}
                  className="flex items-center gap-2.5 text-left group/row"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                    isEnabled ? 'bg-primary/15' : 'bg-muted group-hover/row:bg-muted/70'
                  }`}>
                    <Icon className={`w-3.5 h-3.5 transition-colors ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <span className={`text-sm font-medium transition-colors ${isEnabled ? 'text-foreground' : 'text-muted-foreground group-hover/row:text-foreground'}`}>
                    {t(labelKey as any)}
                  </span>
                </button>

                {/* Action toggles */}
                {(['view', 'edit', 'delete'] as PermActions[]).map(action => {
                  const col = ACTION_COL[action];
                  const isActive = current.includes(action);
                  const isAvailable = available.includes(action);
                  if (!isAvailable) {
                    return <div key={action} className="flex justify-center"><span className="text-muted-foreground/20 text-base">—</span></div>;
                  }
                  return (
                    <div key={action} className="flex justify-center">
                      <button
                        onClick={() => toggleAction(key, action)}
                        className={`w-6 h-6 rounded-md transition-all flex items-center justify-center ${
                          isActive
                            ? `${col.activeColor} shadow-sm`
                            : 'bg-muted/60 hover:bg-muted'
                        }`}
                      >
                        {isActive && (
                          <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="2,6 5,9 10,3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom save */}
      <div className="flex justify-end gap-3 pb-4">
        <Button variant="outline" onClick={() => router.push('/roles')} className="rounded-xl">
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !formName.trim()}
          className="rounded-xl gap-1.5 bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/25 hover:opacity-90"
        >
          {saving
            ? <Spinner className="w-4 h-4 animate-spin" />
            : <Save className="w-4 h-4" />
          }
          {isEdit ? t('update') : t('save')}
        </Button>
      </div>
    </div>
  );
}
