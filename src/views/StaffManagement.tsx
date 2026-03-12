import { useState, useEffect, useCallback } from 'react';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/Pagination';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  Users, Plus, Pencil, Trash2, Shield, UserPlus, KeyRound,
  Phone, CheckCircle2, XCircle, Save, UserCog,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { normalizeBangladeshMobile } from '@/lib/bd-phone';

interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: string;
  role_id: string | null;
  user_id: string | null;
  is_active: boolean;
  salary_amount: number;
  shop_id: string;
  created_at: string;
}

interface ShopRole {
  id: string;
  name: string;
  name_bn: string;
  permissions: string[];
}

/* ── helpers ─────────────────────────────────────────── */
const AVATAR_COLORS = [
  'from-violet-400 to-purple-600',
  'from-sky-400 to-blue-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-red-600',
  'from-fuchsia-400 to-pink-600',
  'from-cyan-400 to-sky-600',
  'from-lime-400 to-green-600',
];
function avatarGradient(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function nameInitials(name: string) {
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
}

export default function StaffManagement() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<ShopRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [credDialogOpen, setCredDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
  const [credTarget, setCredTarget] = useState<StaffMember | null>(null);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRoleId, setFormRoleId] = useState('');
  const [formActive, setFormActive] = useState(true);

  const [credEmail, setCredEmail] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [credLoading, setCredLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/staff-management-data', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load staff management');
      setShopId(data.shopId || null);
      if (data.staff) setStaff(data.staff);
      if (data.roles) setRoles(data.roles.map((r: any) => ({
        ...r,
        permissions: Array.isArray(r.permissions) ? r.permissions : [],
      })));
    } catch (err) {
      console.error(err);
      toast({ title: t('error'), description: err instanceof Error ? err.message : 'Request failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreateDialog = () => {
    setEditingStaff(null);
    setFormName(''); setFormPhone(''); setFormRoleId(''); setFormActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (s: StaffMember) => {
    setEditingStaff(s);
    setFormName(s.name); setFormPhone(s.phone); setFormRoleId(s.role_id || ''); setFormActive(s.is_active);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast({ title: t('staffNameRequired'), variant: 'destructive' });
      return;
    }
    if (!shopId) {
      toast({ title: t('error'), description: 'No shop found', variant: 'destructive' });
      return;
    }
    const trimmedPhone = formPhone.trim();
    const normalizedPhone = trimmedPhone ? normalizeBangladeshMobile(trimmedPhone) : '';
    if (trimmedPhone && !normalizedPhone) {
      toast({ title: t('invalidBdMobile'), variant: 'destructive' });
      return;
    }
    const nextPhone = normalizedPhone || '';

    setSaving(true);
    try {
      const roleName = roles.find(r => r.id === formRoleId)?.name || '';
      if (editingStaff) {
        const res = await fetch('/api/shop-staff', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: editingStaff.id, name: formName.trim(), phone: nextPhone, role_id: formRoleId || null, role: roleName, is_active: formActive }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setStaff(prev => prev.map(member => member.id === editingStaff.id ? data.member : member));
        toast({ title: t('staffUpdated') });
      } else {
        const res = await fetch('/api/shop-staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name: formName.trim(), phone: nextPhone, role_id: formRoleId || null, role: roleName, is_active: formActive }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setStaff(prev => [...prev, data.member]);
        toast({ title: t('staffCreated') });
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: t('error'), description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/shop-staff?id=${deleteTarget.id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStaff(prev => prev.filter(member => member.id !== deleteTarget.id));
      toast({ title: t('staffDeleted') });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (err: any) {
      toast({ title: t('error'), description: err.message, variant: 'destructive' });
    }
  };

  const openCredDialog = (s: StaffMember) => {
    setCredTarget(s);
    setCredEmail(''); setCredPassword('');
    setCredDialogOpen(true);
  };

  const handleCreateCredentials = async () => {
    if (!credTarget || !credEmail.trim() || !credPassword.trim() || !shopId) return;
    if (credPassword.length < 6) {
      toast({ title: t('passwordTooShort'), variant: 'destructive' });
      return;
    }
    setCredLoading(true);
    try {
      const res = await fetch('/api/create-staff-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: credEmail.trim(), password: credPassword, staffId: credTarget.id, shopId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');
      setStaff(prev => prev.map(member => member.id === credTarget.id ? { ...member, user_id: data.userId || member.user_id } : member));
      toast({ title: t('staffAccountCreated') });
      setCredDialogOpen(false);
    } catch (err: any) {
      toast({ title: t('error'), description: err.message, variant: 'destructive' });
    } finally { setCredLoading(false); }
  };

  const getRoleName = (roleId: string | null) => {
    if (!roleId) return null;
    return roles.find(r => r.id === roleId)?.name || null;
  };

  const activeCount = staff.filter(s => s.is_active).length;

  const { page, setPage, pageData: pagedStaff, totalPages, totalItems, from, to } = usePagination(staff, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            {t('staffManagement')}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{t('staffManagementDesc')}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {staff.length > 0 && (
            <div className="text-right hidden sm:block">
              <p className="text-xl font-bold text-foreground">{activeCount}<span className="text-muted-foreground text-sm font-normal">/{staff.length}</span></p>
              <p className="text-xs text-muted-foreground">{t('active')}</p>
            </div>
          )}
          <Button
            onClick={openCreateDialog}
            className="rounded-xl gap-1.5 bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/25 hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('addStaff')}</span>
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {staff.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Users className="w-7 h-7 opacity-40" />
            </div>
            <p className="text-base font-semibold">{t('noStaff')}</p>
            <p className="text-sm mt-1 opacity-60">{t('staffManagementDesc')}</p>
            <Button onClick={openCreateDialog} className="mt-5 rounded-xl gap-1.5">
              <UserPlus className="w-4 h-4" /> {t('addStaff')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {pagedStaff.map(s => {
            const grad = avatarGradient(s.name);
            const roleName = getRoleName(s.role_id);
            return (
              <div
                key={s.id}
                className={`rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all group relative overflow-hidden ${!s.is_active ? 'opacity-60' : ''}`}
              >
                {/* Active indicator strip */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${s.is_active ? 'bg-success' : 'bg-muted-foreground/30'}`} />

                <div className="p-4">
                  {/* Top row: avatar + name + actions */}
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md`}>
                      {nameInitials(s.name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground leading-tight truncate">{s.name}</p>
                      {s.phone ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground font-mono">{s.phone}</span>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground/50 mt-0.5">—</p>
                      )}
                    </div>

                    {/* Hover-reveal actions */}
                    <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!s.user_id && (
                        <button
                          onClick={() => openCredDialog(s)}
                          title={t('createLoginCredentials')}
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => openEditDialog(s)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setDeleteTarget(s); setDeleteDialogOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Role + status row */}
                  <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Shield className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium text-foreground truncate">
                        {roleName || <span className="text-muted-foreground italic">{t('noRole')}</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {s.user_id ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          {t('loginEnabled')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" />
                          {t('noLogin')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} from={from} to={to} onPageChange={setPage} />

      {/* Add/Edit Staff Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-4 h-4 text-primary" />
              {editingStaff ? t('editStaff') : t('addStaff')}
            </DialogTitle>
            <DialogDescription>{t('staffDialogDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t('name')}</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder={t('staffNamePlaceholder')} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t('phone')}</Label>
              <Input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="01XXXXXXXXX" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t('roles')}</Label>
              <Select value={formRoleId} onValueChange={setFormRoleId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={t('selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}{r.name_bn ? ` — ${r.name_bn}` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium">{t('activeStatus')}</p>
                <p className="text-xs text-muted-foreground">{formActive ? t('staffActiveDesc') : t('staffInactiveDesc')}</p>
              </div>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">{t('cancel')}</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formName.trim()}
              className="rounded-xl gap-1.5 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
            >
              {saving
                ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                : <Save className="w-4 h-4" />
              }
              {editingStaff ? t('update') : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Login Credentials Dialog */}
      <Dialog open={credDialogOpen} onOpenChange={setCredDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              {t('createLoginCredentials')}
            </DialogTitle>
            <DialogDescription>
              {t('createCredentialsDesc')} <strong>{credTarget?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t('staffEmail')}</Label>
              <Input type="email" value={credEmail} onChange={e => setCredEmail(e.target.value)} placeholder="staff@example.com" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t('staffPassword')}</Label>
              <Input type="password" value={credPassword} onChange={e => setCredPassword(e.target.value)} placeholder={t('minSixChars')} className="rounded-xl" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCredDialogOpen(false)} className="rounded-xl">{t('cancel')}</Button>
            <Button
              onClick={handleCreateCredentials}
              disabled={credLoading || !credEmail.trim() || !credPassword.trim()}
              className="rounded-xl gap-1.5 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
            >
              {credLoading
                ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                : <KeyRound className="w-4 h-4" />
              }
              {t('createAccount')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteStaff')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteStaffDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
