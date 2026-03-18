import { useState, useEffect, useRef } from "react";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme, COLOR_THEMES, type ColorTheme, type FontSize, type BorderRadius, type Density } from "@/context/ThemeContext";
import { ShopSettings } from "@/types";
import {
  Save, Store, FileText, Bell, Palette, RotateCcw, RefreshCw,
  Wallet, AlertTriangle, User, Lock, Mail, Database, AlertCircle,
  Settings as SettingsIcon, Moon, Sun, Check, Upload,
  MessageSquare, ShieldAlert, Zap, ZapOff, Globe,
  AlignJustify, LayoutGrid, Maximize2,
  Square, RectangleHorizontal, Circle,
  Download, Trash2, RotateCw, Users, Package, ShoppingCart, UserCog,
  FileUp, FileCheck2, FileX2, ChevronDown, ChevronUp,
  Cloud, CloudOff, Wifi, WifiOff, Copy, ExternalLink, Key, Link2,
  Eye, EyeOff, Scissors,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { useSession, changeEmail, changePassword as authChangePassword } from "@/lib/auth-client";
import { normalizeBangladeshMobile } from "@/lib/bd-phone";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Tab = 'shop' | 'invoice' | 'notifications' | 'appearance' | 'account' | 'data';

function ValueSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5 animate-pulse", className)}>
      <div className="w-3 h-3 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <Scissors className="w-2 h-2 text-primary/40" />
      </div>
      <Skeleton className="h-4 w-12 bg-primary/10" />
    </div>
  );
}
const SEED_PROGRESS_STEPS = [
  'Connecting to Supabase',
  'Clearing old shop data',
  'Creating demo catalog',
  'Creating staff and customers',
  'Creating demo orders',
  'Finishing setup',
] as const;

const TABS: { key: Tab; icon: any; labelKey: string }[] = [
  { key: 'shop',          icon: Store,          labelKey: 'shopInfo' },
  { key: 'invoice',       icon: FileText,       labelKey: 'invoice' },
  { key: 'notifications', icon: Bell,           labelKey: 'notifications' },
  { key: 'appearance',    icon: Palette,        labelKey: 'appearance' },
  { key: 'account',       icon: User,           labelKey: 'account' },
  { key: 'data',          icon: Database,       labelKey: 'dataManagement' },
];

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-2xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, desc }: { icon: any; title: string; desc?: string }) {
  return (
    <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
    </div>
  );
}

function FieldRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-4 px-5 border-b border-border/60 last:border-0">
      <div className="sm:w-44 shrink-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onCheckedChange }: { label: string; desc?: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 px-5 border-b border-border/60 last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function Settings() {
  const { settings, updateSettings, reloadData, dataLoading } = useData();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme, colorTheme, setColorTheme, fontSize, setFontSize, borderRadius, setBorderRadius, density, setDensity, reduceMotion, setReduceMotion } = useTheme();
  const { toast } = useToast();

  const saveAppearance = (patch: Partial<typeof settings>) => {
    updateSettings({ ...settings, theme, colorTheme, fontSize, borderRadius, density, reduceMotion, language, ...patch }).catch(() => {});
  };

  const handleToggleTheme = () => { toggleTheme(); saveAppearance({ theme: theme === 'dark' ? 'light' : 'dark' }); };
  const handleSetColorTheme = (c: ColorTheme) => { setColorTheme(c); saveAppearance({ colorTheme: c }); };
  const handleSetFontSize = (f: FontSize) => { setFontSize(f); saveAppearance({ fontSize: f }); };
  const handleSetBorderRadius = (r: BorderRadius) => { setBorderRadius(r); saveAppearance({ borderRadius: r }); };
  const handleSetDensity = (d: Density) => { setDensity(d); saveAppearance({ density: d }); };
  const handleSetReduceMotion = (v: boolean) => { setReduceMotion(v); saveAppearance({ reduceMotion: v }); };
  const handleSetLanguage = (lang: 'bn' | 'en') => { setLanguage(lang); saveAppearance({ language: lang }); };
  const [form, setForm] = useState<ShopSettings>({ ...settings });
  const [activeTab, setActiveTab] = useState<Tab>('shop');
  const session = useSession();
  const [smsBalance, setSmsBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const currentEmail = session.data?.user?.email || '';
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedConfirm, setSeedConfirm] = useState(false);
  const [seedProgressStep, setSeedProgressStep] = useState(0);
  const [dataUnlocked, setDataUnlocked] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [clearScope, setClearScope] = useState<string | null>(null);
  const [clearLoading, setClearLoading] = useState(false);
  const [resetSettingsConfirm, setResetSettingsConfirm] = useState(false);
  const [resetSettingsLoading, setResetSettingsLoading] = useState(false);

  // Import state
  type MergeMode = 'replace' | 'merge';
  interface ImportFile {
    exportedAt?: string;
    shopName?: string;
    data: {
      customers?: any[]; products?: any[]; categories?: any[];
      orders?: any[]; orderHistory?: any[]; staff?: any[]; roles?: any[];
      settings?: Record<string, any>;
    };
  }
  const [importFile, setImportFile] = useState<ImportFile | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState('');
  const [importMergeMode, setImportMergeMode] = useState<MergeMode>('replace');
  const [importOptions, setImportOptions] = useState({
    includeCustomers: true,
    includeProducts: true,
    includeOrders: true,
    includeStaff: true,
    includeSettings: false,
  });
  const [importLoading, setImportLoading] = useState(false);
  const [importSummary, setImportSummary] = useState<Record<string, number> | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Supabase cloud DB state
  const [sbUrl, setSbUrl] = useState(settings.supabaseUrl || '');
  const [sbAnonKey, setSbAnonKey] = useState(settings.supabaseAnonKey || '');
  const [sbServiceKey, setSbServiceKey] = useState(settings.supabaseServiceRoleKey || '');
  const [sbProjectId, setSbProjectId] = useState(settings.supabaseProjectId || '');
  const [sbUseCloud, setSbUseCloud] = useState(!!settings.useCloudDb);
  const [sbTestLoading, setSbTestLoading] = useState(false);
  const [sbTestResult, setSbTestResult] = useState<{ connected: boolean; tablesExist: boolean; message: string } | null>(null);
  const [sbSetupLoading, setSbSetupLoading] = useState(false);
  const [sbSetupResult, setSbSetupResult] = useState<{ success: boolean; message: string; sql?: string } | null>(null);
  const [sbMigrateLoading, setSbMigrateLoading] = useState(false);
  const [sbMigrateResult, setSbMigrateResult] = useState<{ success: boolean; summary?: Record<string, number>; errors?: string[] } | null>(null);
  const [sbShowSql, setSbShowSql] = useState(false);
  const [sbSaveLoading, setSbSaveLoading] = useState(false);
  const [sbShowFields, setSbShowFields] = useState<Record<string, boolean>>({});
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Sync form when DB settings load (settings starts as DEFAULT_SETTINGS, then updates from DB)
  useEffect(() => {
    if (!dataLoading) {
      setForm({ ...settings });
      setSbUrl(settings.supabaseUrl || '');
      setSbAnonKey(settings.supabaseAnonKey || '');
      setSbServiceKey(settings.supabaseServiceRoleKey || '');
      setSbProjectId(settings.supabaseProjectId || '');
      setSbUseCloud(!!settings.useCloudDb);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoading]);

  useEffect(() => {
    if (!seedLoading) {
      setSeedProgressStep(0);
      return;
    }

    const interval = window.setInterval(() => {
      setSeedProgressStep((current) => Math.min(current + 1, SEED_PROGRESS_STEPS.length - 1));
    }, 900);

    return () => window.clearInterval(interval);
  }, [seedLoading]);
  const pinErrorRef = useRef(false);

  const handlePinDigit = (digit: string) => {
    if (pinErrorRef.current) return;
    setPinInput(prev => {
      if (prev.length >= 4) return prev;
      const next = prev + digit;
      if (next.length === 4) {
        if (next === '1497') {
          setDataUnlocked(true);
          setPinInput('');
          setPinError(false);
          pinErrorRef.current = false;
        } else {
          setPinError(true);
          pinErrorRef.current = true;
          setTimeout(() => {
            setPinInput('');
            setPinError(false);
            pinErrorRef.current = false;
          }, 800);
        }
        return next;
      }
      return next;
    });
  };

  const handlePinBackspace = () => {
    if (pinErrorRef.current) return;
    setPinInput(p => p.slice(0, -1));
    setPinError(false);
  };

  useEffect(() => {
    if (activeTab !== 'data' || dataUnlocked) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handlePinDigit(e.key);
      } else if (e.key === 'Backspace') {
        handlePinBackspace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, dataUnlocked]);

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) return;
    setEmailLoading(true);
    try {
      const result = await changeEmail({ newEmail: newEmail.trim() });
      if (result.error) throw new Error(result.error.message);
      toast({ title: t('emailUpdated'), description: t('emailUpdateDesc') });
      setNewEmail('');
    } catch (err: any) {
      toast({ title: t('emailUpdateFailed'), description: err.message, variant: 'destructive' });
    } finally { setEmailLoading(false); }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) { toast({ title: t('passwordTooShort'), variant: 'destructive' }); return; }
    if (newPassword !== confirmPassword) { toast({ title: t('passwordMismatch'), variant: 'destructive' }); return; }
    if (!currentPassword) { toast({ title: t('passwordRequired') || 'Current password required', variant: 'destructive' }); return; }
    setPasswordLoading(true);
    try {
      const result = await authChangePassword({ currentPassword, newPassword });
      if (result.error) throw new Error(result.error.message);
      toast({ title: t('passwordUpdated') });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      toast({ title: t('passwordUpdateFailed'), description: err.message, variant: 'destructive' });
    } finally { setPasswordLoading(false); }
  };

  const checkSmsBalance = async () => {
    const apiKey = form.smsApiKey || settings.smsApiKey;
    if (!apiKey) { toast({ title: t('apiKeyRequired'), description: t('apiKeyRequiredDesc'), variant: "destructive" }); return; }
    setBalanceLoading(true);
    try {
      const res = await fetch('/api/sms/balance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey }), credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      if (data?.result?.balance !== undefined) {
        const balance = data.result.balance;
        setSmsBalance(balance);
        const threshold = form.smsBalanceThreshold || settings.smsBalanceThreshold || 50;
        if (Number(balance) <= threshold) {
          toast({ title: `⚠️ ${t('balanceLow')}`, description: `${t('currentBalance')} ৳${balance}`, variant: "destructive" });
        } else {
          toast({ title: t('balanceCheckSuccess') });
        }
      } else {
        setSmsBalance(data?.result?.raw || '?');
        toast({ title: t('balanceInfoReceived') });
      }
    } catch (err: any) {
      toast({ title: t('balanceCheckFailed'), description: err.message, variant: "destructive" });
    } finally { setBalanceLoading(false); }
  };

  const handleSeedDemo = async () => {
    setSeedLoading(true); setSeedConfirm(false); setSeedProgressStep(0);
    try {
      const res = await fetch('/api/seed-demo', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Seed failed');
      setSeedProgressStep(SEED_PROGRESS_STEPS.length - 1);
      await reloadData();
      toast({ title: 'ডেমো ডেটা আমদানি সফল', description: `${data.summary.customers} customers, ${data.summary.orders} orders, ${data.summary.staff} staff` });
    } catch (err: any) {
      toast({ title: 'Import Failed', description: err.message, variant: 'destructive' });
    } finally { setSeedLoading(false); }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await fetch('/api/data-export', { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shop-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t('exportSuccess') || 'Export successful' });
    } catch (err: any) {
      toast({ title: t('exportFailed') || 'Export failed', description: err.message, variant: 'destructive' });
    } finally { setExportLoading(false); }
  };

  const handleClearData = async (scope: string) => {
    setClearLoading(true);
    try {
      const res = await fetch('/api/data-clear', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scope }), credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Clear failed');
      toast({ title: t('clearSuccess') || 'Data cleared successfully' });
      setClearScope(null);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      toast({ title: t('clearFailed') || 'Clear failed', description: err.message, variant: 'destructive' });
    } finally { setClearLoading(false); }
  };

  const handleResetSettings = async () => {
    setResetSettingsLoading(true);
    try {
      const res = await fetch('/api/data-reset-settings', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      updateSettings(data.settings);
      setForm(data.settings);
      toast({ title: t('resetSettingsSuccess') || 'Settings reset to defaults' });
      setResetSettingsConfirm(false);
    } catch (err: any) {
      toast({ title: t('resetSettingsFailed') || 'Reset failed', description: err.message, variant: 'destructive' });
    } finally { setResetSettingsLoading(false); }
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImportSummary(null);
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!parsed?.data || typeof parsed.data !== 'object') throw new Error('Invalid backup file format');
        setImportFile(parsed);
      } catch (err: any) {
        setImportFile(null);
        setImportError(err.message || 'Could not parse file');
      }
    };
    reader.readAsText(file);
    // reset so same file can be re-selected
    e.target.value = '';
  };

  // ── Supabase handlers ──────────────────────────────────────
  const sbCredentials = () => ({ url: sbUrl.trim(), anonKey: sbAnonKey.trim(), serviceRoleKey: sbServiceKey.trim() });
  const sbConfigured = sbUrl.trim() && sbAnonKey.trim();

  const handleSbTestConnection = async () => {
    setSbTestLoading(true); setSbTestResult(null);
    try {
      const res = await fetch('/api/supabase/test-connection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(sbCredentials()) });
      const data = await res.json();
      setSbTestResult(data);
    } catch (err: any) {
      setSbTestResult({ connected: false, tablesExist: false, message: err.message });
    } finally { setSbTestLoading(false); }
  };

  const handleSbSetupTables = async () => {
    setSbSetupLoading(true); setSbSetupResult(null);
    try {
      const res = await fetch('/api/supabase/setup-tables', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ url: sbUrl.trim(), anonKey: sbAnonKey.trim(), serviceRoleKey: sbServiceKey.trim() }),
      });
      const data = await res.json();
      setSbSetupResult(data);
    } catch (err: any) {
      setSbSetupResult({ success: false, message: err.message });
    } finally { setSbSetupLoading(false); }
  };

  const handleSbMigrate = async () => {
    setSbMigrateLoading(true); setSbMigrateResult(null);
    try {
      const res = await fetch('/api/supabase/migrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(sbCredentials()) });
      const data = await res.json();
      setSbMigrateResult(data);
      if (data.success) {
        toast({ title: 'Migration complete' });
      } else {
        toast({ title: 'Migration had errors', variant: 'destructive' });
      }
    } catch (err: any) {
      setSbMigrateResult({ success: false, errors: [err.message] });
      toast({ title: 'Migration failed', description: err.message, variant: 'destructive' });
    } finally { setSbMigrateLoading(false); }
  };

  const handleSbSaveConfig = async () => {
    setSbSaveLoading(true);
    try {
      const updated = {
        ...settings,
        supabaseUrl: sbUrl.trim(),
        supabaseAnonKey: sbAnonKey.trim(),
        supabaseServiceRoleKey: sbServiceKey.trim(),
        supabaseProjectId: sbProjectId.trim(),
        useCloudDb: sbUseCloud,
      };
      await updateSettings(updated);
      setForm(updated);
      toast({ title: 'Cloud database settings saved' });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally { setSbSaveLoading(false); }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImportLoading(true);
    setImportSummary(null);
    try {
      const res = await fetch('/api/data-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: importFile.data, options: { mergeMode: importMergeMode, ...importOptions } }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Import failed');
      setImportSummary(result.summary);
      toast({ title: 'Import successful' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      toast({ title: 'Import failed', description: err.message, variant: 'destructive' });
    } finally { setImportLoading(false); }
  };

  const [saveLoading, setSaveLoading] = useState(false);
  const handleSave = async () => {
    const shopPhone = form.shopPhone.trim();
    const normalizedShopPhone = shopPhone ? normalizeBangladeshMobile(shopPhone) : '';
    if (shopPhone && !normalizedShopPhone) {
      toast({ title: t('invalidBdMobile'), variant: 'destructive' });
      return;
    }

    setSaveLoading(true);
    try {
      const nextForm = { ...form, shopPhone: normalizedShopPhone || '', theme, colorTheme, fontSize, borderRadius, density, reduceMotion, language };
      await updateSettings(nextForm);
      setForm(nextForm);
      toast({ title: t('settingsSaved'), description: t('settingsSavedDesc') });
    } catch (err) {
      toast({
        title: t('error'),
        description: err instanceof Error ? err.message : 'Request failed',
        variant: 'destructive',
      });
    } finally {
      setSaveLoading(false);
    }
  };


  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(f => ({ ...f, shopLogo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            {t('settings')}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs md:text-sm text-muted-foreground">{t('settingsDesc')}</p>
            {dataLoading && <ValueSkeleton className="opacity-60" />}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={() => setForm({ ...settings })} className="rounded-xl gap-1.5 hidden sm:flex">
            <RotateCcw className="w-4 h-4" /> {t('reset')}
          </Button>
          <Button onClick={handleSave} disabled={saveLoading} className="rounded-xl gap-1.5 bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/25 hover:opacity-90">
            {saveLoading ? <Spinner className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">{t('saveSettings')}</span>
          </Button>
        </div>
      </div>

      {/* Tab nav — scrollable horizontal chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key !== 'data') { setDataUnlocked(false); setPinInput(''); setPinError(false); }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/25'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t(tab.labelKey as any)}
            </button>
          );
        })}
      </div>

      {/* ── Shop Info ── */}
      {activeTab === 'shop' && (
        <div className="space-y-3">
          <SectionCard>
            <SectionHeader icon={Store} title={t('shopInfo')} desc={t('shopInfoDesc')} />

            {/* Logo upload */}
            <div className="px-5 py-4 border-b border-border/60 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                {form.shopLogo
                  ? <img src={form.shopLogo} alt="Logo" className="w-full h-full object-cover" />
                  : <Store className="w-6 h-6 text-muted-foreground/40" />
                }
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">{t('shopLogo')}</p>
                <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  {t('uploadLogo')}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                <p className="text-[11px] text-muted-foreground mt-1">PNG, JPG · max 500KB</p>
              </div>
            </div>

            <FieldRow label={t('shopNameEn')}>
              <Input value={form.shopName} onChange={e => setForm(f => ({ ...f, shopName: e.target.value }))} className="rounded-xl" />
            </FieldRow>
            <FieldRow label={t('shopNameBnLabel')}>
              <Input value={form.shopNameBn} onChange={e => setForm(f => ({ ...f, shopNameBn: e.target.value }))} className="rounded-xl" />
            </FieldRow>
            <FieldRow label={t('address')} desc={t('shopAddressPlaceholder')}>
              <Input value={form.shopAddress} onChange={e => setForm(f => ({ ...f, shopAddress: e.target.value }))} placeholder={t('shopAddressPlaceholder')} className="rounded-xl" />
            </FieldRow>
            <FieldRow label={t('phone')}>
              <Input value={form.shopPhone} onChange={e => setForm(f => ({ ...f, shopPhone: e.target.value }))} placeholder="01XXXXXXXXX" className="rounded-xl" />
            </FieldRow>
            <FieldRow label={t('currency')}>
              <Input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} placeholder="৳" className="rounded-xl max-w-[120px]" />
            </FieldRow>
          </SectionCard>
        </div>
      )}

      {/* ── Invoice ── */}
      {activeTab === 'invoice' && (
        <SectionCard>
          <SectionHeader icon={FileText} title={t('invoiceSettings')} />
          <FieldRow label={t('invoicePrefix')} desc={t('invoicePrefixDesc')}>
            <Input value={form.invoicePrefix} onChange={e => setForm(f => ({ ...f, invoicePrefix: e.target.value }))} placeholder="INV-" className="rounded-xl max-w-[160px]" />
          </FieldRow>
          <FieldRow label={t('defaultAdvance')} desc={t('defaultAdvanceDesc')}>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={form.defaultAdvancePercent}
                onChange={e => setForm(f => ({ ...f, defaultAdvancePercent: Number(e.target.value) }))}
                className="rounded-xl max-w-[120px]"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </FieldRow>
          <ToggleRow
            label={t('autoPrint')}
            desc={t('autoPrintDesc')}
            checked={form.enablePrintAutoOpen}
            onCheckedChange={v => setForm(f => ({ ...f, enablePrintAutoOpen: v }))}
          />
        </SectionCard>
      )}

      {/* ── Notifications ── */}
      {activeTab === 'notifications' && (
        <div className="space-y-3">
          <SectionCard>
            <SectionHeader icon={Bell} title={t('notifications')} />
            <ToggleRow
              label={t('smsNotification')}
              desc={t('smsNotificationDesc')}
              checked={form.enableSMS}
              onCheckedChange={v => setForm(f => ({ ...f, enableSMS: v }))}
            />
          </SectionCard>

          {form.enableSMS && (
            <SectionCard>
              <SectionHeader icon={MessageSquare} title={t('smsProviderSettings')} />
              <FieldRow label={t('smsApiKey')} desc={t('smsApiKeyDesc')}>
                <Input type="password" value={form.smsApiKey} onChange={e => setForm(f => ({ ...f, smsApiKey: e.target.value }))} placeholder={t('smsApiKeyPlaceholder')} className="rounded-xl" />
              </FieldRow>
              <FieldRow label={t('smsSenderId')} desc={t('smsSenderIdDesc')}>
                <Input value={form.smsSenderId} onChange={e => setForm(f => ({ ...f, smsSenderId: e.target.value }))} placeholder={t('smsSenderIdPlaceholder')} className="rounded-xl" />
              </FieldRow>

              {/* Balance checker */}
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{t('smsBalance')}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={checkSmsBalance} disabled={balanceLoading || !form.smsApiKey} className="rounded-xl gap-1.5 text-xs">
                    {balanceLoading ? <Spinner className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    {t('checkBalance')}
                  </Button>
                </div>
                {smsBalance !== null && (
                  <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                    Number(smsBalance) <= (form.smsBalanceThreshold || 50)
                      ? 'bg-destructive/10 border-destructive/30'
                      : 'bg-success/10 border-success/30'
                  }`}>
                    {Number(smsBalance) <= (form.smsBalanceThreshold || 50)
                      ? <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                      : <Check className="w-4 h-4 text-success shrink-0" />
                    }
                    <span className="text-xs text-muted-foreground">{t('currentBalance')}</span>
                    <span className={`text-lg font-bold ${Number(smsBalance) <= (form.smsBalanceThreshold || 50) ? 'text-destructive' : 'text-success'}`}>
                      ৳{smsBalance}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Label className="text-xs text-muted-foreground shrink-0">{t('lowBalanceThreshold')}</Label>
                  <Input type="number" min={0} value={form.smsBalanceThreshold} onChange={e => setForm(f => ({ ...f, smsBalanceThreshold: Number(e.target.value) || 0 }))} placeholder="50" className="h-8 text-sm max-w-[120px] rounded-lg" />
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {/* ── Appearance ── */}
      {activeTab === 'appearance' && (
        <div className="space-y-3">

          {/* Theme & Color */}
          <SectionCard>
            <SectionHeader icon={Palette} title={t('colorTheme')} desc={t('colorThemeDesc')} />

            {/* Dark / Light toggle */}
            <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-slate-800' : 'bg-amber-100'}`}>
                  {theme === 'dark' ? <Moon className="w-4 h-4 text-slate-300" /> : <Sun className="w-4 h-4 text-amber-500" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t('darkMode')}</p>
                  <p className="text-xs text-muted-foreground">{t('darkModeDesc')}</p>
                </div>
              </div>
              <Switch checked={theme === 'dark'} onCheckedChange={handleToggleTheme} />
            </div>

            {/* Color swatches */}
            <div className="px-5 py-4">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {(Object.keys(COLOR_THEMES) as ColorTheme[]).map(key => {
                  const isActive = colorTheme === key;
                  const nameKey = `theme${key.charAt(0).toUpperCase() + key.slice(1)}` as any;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSetColorTheme(key)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-muted/20 hover:border-muted-foreground/40'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full shadow-inner flex items-center justify-center relative" style={{ backgroundColor: COLOR_THEMES[key].preview }}>
                        {isActive && (
                          <div className="w-full h-full rounded-full flex items-center justify-center bg-black/20">
                            <Check className="w-4 h-4 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-foreground">{t(nameKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </SectionCard>

          {/* Font size */}
          <SectionCard>
            <SectionHeader icon={AlignJustify} title={t('fontSize')} desc={t('fontSizeDesc')} />
            <div className="px-5 py-4">
              <div className="grid grid-cols-3 gap-2.5">
                {([
                  { size: 'small',      label: 'fontSizeSmall',      sample: 'text-sm',  sampleText: 'Aa' },
                  { size: 'medium',     label: 'fontSizeMedium',     sample: 'text-base',sampleText: 'Aa' },
                  { size: 'large',      label: 'fontSizeLarge',      sample: 'text-xl',  sampleText: 'Aa' },
                ] as { size: FontSize; label: string; sample: string; sampleText: string }[]).map(({ size, label, sample, sampleText }) => {
                  const isActive = fontSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => handleSetFontSize(size)}
                      className={`relative flex flex-col items-center gap-1.5 py-5 rounded-xl border-2 transition-all ${
                        isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-muted/20 hover:border-muted-foreground/40'
                      }`}
                    >
                      {isActive && <div className="absolute top-2 right-2"><Check className="w-3 h-3 text-primary" strokeWidth={3} /></div>}
                      <span className={`${sample} font-bold text-foreground leading-none`}>{sampleText}</span>
                      <span className="text-xs text-muted-foreground">{t(label as any)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </SectionCard>

          {/* Border Radius */}
          <SectionCard>
            <SectionHeader icon={Circle} title={t('borderRadius')} desc={t('borderRadiusDesc')} />
            <div className="px-5 py-4">
              <div className="grid grid-cols-4 gap-2.5">
                {([
                  { value: 'sharp',   label: 'radiusSharp',   previewClass: 'rounded-none',  icon: Square },
                  { value: 'default', label: 'radiusDefault', previewClass: 'rounded',        icon: RectangleHorizontal },
                  { value: 'rounded', label: 'radiusRounded', previewClass: 'rounded-xl',     icon: RectangleHorizontal },
                  { value: 'pill',    label: 'radiusPill',    previewClass: 'rounded-full',   icon: Circle },
                ] as { value: BorderRadius; label: string; previewClass: string; icon: any }[]).map(({ value, label, previewClass }) => {
                  const isActive = borderRadius === value;
                  return (
                    <button
                      key={value}
                      onClick={() => handleSetBorderRadius(value)}
                      className={`relative flex flex-col items-center gap-2.5 py-4 px-2 rounded-xl border-2 transition-all ${
                        isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-muted/20 hover:border-muted-foreground/40'
                      }`}
                    >
                      {isActive && <div className="absolute top-1.5 right-1.5"><Check className="w-3 h-3 text-primary" strokeWidth={3} /></div>}
                      <div className={`w-9 h-6 border-2 ${isActive ? 'border-primary bg-primary/20' : 'border-muted-foreground/40 bg-muted'} ${previewClass}`} />
                      <span className="text-[10px] font-medium text-muted-foreground">{t(label as any)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </SectionCard>

          {/* Layout Density */}
          <SectionCard>
            <SectionHeader icon={LayoutGrid} title={t('layoutDensity')} desc={t('layoutDensityDesc')} />
            <div className="px-5 py-4">
              <div className="grid grid-cols-3 gap-2.5">
                {([
                  { value: 'compact',     label: 'densityCompact',     rows: [2, 2, 2, 2] },
                  { value: 'default',     label: 'densityDefault',     rows: [3, 3, 3] },
                  { value: 'comfortable', label: 'densityComfortable', rows: [4, 4] },
                ] as { value: Density; label: string; rows: number[] }[]).map(({ value, label, rows }) => {
                  const isActive = density === value;
                  return (
                    <button
                      key={value}
                      onClick={() => handleSetDensity(value as Density)}
                      className={`relative flex flex-col items-center gap-2.5 py-4 px-3 rounded-xl border-2 transition-all ${
                        isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-muted/20 hover:border-muted-foreground/40'
                      }`}
                    >
                      {isActive && <div className="absolute top-1.5 right-1.5"><Check className="w-3 h-3 text-primary" strokeWidth={3} /></div>}
                      <div className="w-10 flex flex-col gap-px">
                        {rows.map((h, i) => (
                          <div key={i} className={`w-full rounded-sm ${isActive ? 'bg-primary/40' : 'bg-muted-foreground/25'}`} style={{ height: `${h}px` }} />
                        ))}
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">{t(label as any)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </SectionCard>

          {/* Language */}
          <SectionCard>
            <SectionHeader icon={Globe} title={t('language')} desc={t('languageDesc')} />
            <div className="px-5 py-4">
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { value: 'bn', flag: '🇧🇩', label: t('bangla') },
                  { value: 'en', flag: '🇬🇧', label: t('english') },
                ] as { value: string; flag: string; label: string }[]).map(({ value, flag, label }) => {
                  const isActive = language === value;
                  return (
                    <button
                      key={value}
                      onClick={() => handleSetLanguage(value as 'bn' | 'en')}
                      className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all ${
                        isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-muted/20 hover:border-muted-foreground/40'
                      }`}
                    >
                      {isActive && <div className="absolute top-2 right-2"><Check className="w-3 h-3 text-primary" strokeWidth={3} /></div>}
                      <span className="text-2xl">{flag}</span>
                      <span className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </SectionCard>

          {/* Reduce Motion */}
          <SectionCard>
            <SectionHeader icon={reduceMotion ? ZapOff : Zap} title={t('reduceMotion')} desc={t('reduceMotionDesc')} />
            <ToggleRow
              label={t('reduceMotion')}
              desc={reduceMotion ? t('reduceMotionOn') : t('reduceMotionOff')}
              checked={reduceMotion}
              onCheckedChange={handleSetReduceMotion}
            />
          </SectionCard>

        </div>
      )}

      {/* ── Account ── */}
      {activeTab === 'account' && (
        <div className="space-y-3">
          {/* Current account info */}
          <SectionCard>
            <SectionHeader icon={User} title={t('accountInfo')} />
            <div className="px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{currentEmail || '—'}</p>
                <p className="text-xs text-muted-foreground">{t('currentEmail')}</p>
              </div>
            </div>
          </SectionCard>

          {/* Change Email */}
          <SectionCard>
            <SectionHeader icon={Mail} title={t('changeEmail')} />
            <div className="p-5 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('newEmail')}</Label>
                <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder={t('newEmailPlaceholder')} className="rounded-xl" />
              </div>
              <Button onClick={handleUpdateEmail} disabled={emailLoading || !newEmail.trim()} size="sm" className="rounded-xl gap-1.5">
                {emailLoading ? <Spinner className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                {t('updateEmail')}
              </Button>
            </div>
          </SectionCard>

          {/* Change Password */}
          <SectionCard>
            <SectionHeader icon={Lock} title={t('changePassword')} />
            <div className="p-5 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('currentPassword') || 'Current Password'}</Label>
                <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('newPassword')}</Label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={t('newPasswordPlaceholder')} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('confirmPassword')}</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t('confirmPasswordPlaceholder')} className="rounded-xl" />
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {t('passwordMismatch')}
                </p>
              )}
              <Button onClick={handleUpdatePassword} disabled={passwordLoading || !newPassword || !currentPassword} size="sm" className="rounded-xl gap-1.5">
                {passwordLoading ? <Spinner className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                {t('updatePassword')}
              </Button>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── Data Management ── */}
      {activeTab === 'data' && (
        !dataUnlocked ? (
          /* ── PIN gate ── */
          <SectionCard>
            <SectionHeader icon={Lock} title={t('dataManagement')} desc={t('dataManagementLockDesc')} />
            <div className="flex flex-col items-center py-10 px-6 gap-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${pinError ? 'bg-destructive/10' : 'bg-muted'}`}>
                <Lock className={`w-7 h-7 transition-colors ${pinError ? 'text-destructive' : 'text-muted-foreground'}`} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{t('enterPin')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('enterPinDesc')}</p>
              </div>

              {/* PIN dots display */}
              <div className="flex gap-3">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${
                    i < pinInput.length
                      ? pinError ? 'bg-destructive border-destructive' : 'bg-primary border-primary'
                      : 'bg-transparent border-muted-foreground/40'
                  }`} />
                ))}
              </div>

              {pinError && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1.5 -mt-2">
                  <AlertCircle className="w-3.5 h-3.5" /> {t('incorrectPin')}
                </p>
              )}

              {/* PIN numpad */}
              <div className="grid grid-cols-3 gap-2.5 w-56">
                {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, idx) => {
                  if (key === '') return <div key={idx} />;
                  return (
                    <button
                      key={idx}
                      onClick={() => key === '⌫' ? handlePinBackspace() : handlePinDigit(key)}
                      className={`h-12 rounded-xl text-base font-semibold transition-all active:scale-95 ${
                        key === '⌫'
                          ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          : 'bg-muted/60 hover:bg-muted text-foreground'
                      } ${pinError ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
            </div>
          </SectionCard>
        ) : (
          /* ── Unlocked content ── */
          <div className="space-y-3">
            {/* Unlock banner */}
            <div className="bg-success/5 border border-success/20 rounded-2xl px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-success/15 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-success" strokeWidth={3} />
                </div>
                <span className="text-xs font-semibold text-success">{t('dataUnlocked')}</span>
              </div>
              <button
                onClick={() => { setDataUnlocked(false); setPinInput(''); }}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <Lock className="w-3 h-3" /> {t('lock')}
              </button>
            </div>

            {/* ── Export Backup ── */}
            <SectionCard>
              <SectionHeader icon={Download} title={t('exportData') || 'Export Backup'} desc={t('exportDataDesc') || 'Download all your shop data as a JSON file'} />
              <div className="p-5">
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  {t('exportDataInfo') || 'Exports customers, orders, products, categories, staff, roles, and settings into a single JSON file that you can keep as a backup.'}
                </p>
                <Button onClick={handleExport} disabled={exportLoading} className="rounded-xl gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-sm shadow-primary/25">
                  {exportLoading ? <Spinner className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {exportLoading ? (t('exporting') || 'Exporting…') : (t('downloadBackup') || 'Download Backup')}
                </Button>
              </div>
            </SectionCard>

            {/* ── Reset Settings ── */}
            <SectionCard>
              <SectionHeader icon={RotateCw} title={t('resetSettings') || 'Reset Settings'} desc={t('resetSettingsDesc') || 'Restore all shop settings to factory defaults'} />
              <div className="p-5 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('resetSettingsInfo') || 'Resets shop name, address, invoice settings, SMS settings, and appearance options to their default values. Your orders and customer data are not affected.'}
                </p>
                {!resetSettingsConfirm ? (
                  <Button variant="outline" size="sm" onClick={() => setResetSettingsConfirm(true)} className="rounded-xl gap-1.5">
                    <RotateCw className="w-3.5 h-3.5" /> {t('resetSettings') || 'Reset Settings'}
                  </Button>
                ) : (
                  <div className="space-y-2.5 p-3 bg-warning/10 border border-warning/30 rounded-xl">
                    <p className="text-xs font-semibold text-warning-foreground flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
                      {t('resetSettingsConfirmMsg') || 'This will overwrite your current shop settings.'}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleResetSettings} disabled={resetSettingsLoading} className="rounded-xl gap-1.5 bg-warning text-warning-foreground hover:bg-warning/90">
                        {resetSettingsLoading ? <Spinner className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
                        {resetSettingsLoading ? (t('resetting') || 'Resetting…') : (t('confirmReset') || 'Yes, Reset')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setResetSettingsConfirm(false)} disabled={resetSettingsLoading} className="rounded-xl">
                        {t('cancel')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* ── Clear Data ── */}
            <SectionCard>
              <SectionHeader icon={Trash2} title={t('clearData') || 'Clear Data'} desc={t('clearDataDesc') || 'Permanently delete selected data from your shop'} />
              <div className="p-5 space-y-3">
                {([
                  { scope: 'orders',    label: t('clearOrders')    || 'Clear Orders',              icon: ShoppingCart, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800' },
                  { scope: 'customers', label: t('clearCustomers') || 'Clear Customers',            icon: Users,        color: 'text-blue-600',  bg: 'bg-blue-50 dark:bg-blue-950/30',  border: 'border-blue-200 dark:border-blue-800' },
                  { scope: 'products',  label: t('clearProducts')  || 'Clear Products & Categories',icon: Package,      color: 'text-purple-600',bg: 'bg-purple-50 dark:bg-purple-950/30',border: 'border-purple-200 dark:border-purple-800' },
                  { scope: 'staff',     label: t('clearStaff')     || 'Clear Staff & Roles',        icon: UserCog,      color: 'text-teal-600',  bg: 'bg-teal-50 dark:bg-teal-950/30',  border: 'border-teal-200 dark:border-teal-800' },
                  { scope: 'all',       label: t('clearAll')       || 'Clear All Data',             icon: Trash2,       color: 'text-destructive',bg: 'bg-destructive/5',               border: 'border-destructive/20' },
                ] as { scope: string; label: string; icon: any; color: string; bg: string; border: string }[]).map(({ scope, label, icon: Icon, color, bg, border }) => (
                  <div key={scope} className={`rounded-xl border p-3.5 ${bg} ${border}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                        <span className={`text-sm font-semibold ${color}`}>{label}</span>
                      </div>
                      {clearScope !== scope ? (
                        <Button size="sm" variant="outline" onClick={() => setClearScope(scope)} className={`rounded-xl h-7 px-3 text-xs border ${border} ${color} hover:opacity-90 bg-transparent`}>
                          {t('clear') || 'Clear'}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-medium text-muted-foreground">{t('areYouSure') || 'Sure?'}</span>
                          <Button size="sm" variant="destructive" onClick={() => handleClearData(scope)} disabled={clearLoading} className="rounded-xl h-7 px-3 text-xs gap-1">
                            {clearLoading ? <Spinner className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            {t('yes') || 'Yes'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setClearScope(null)} disabled={clearLoading} className="rounded-xl h-7 px-3 text-xs">
                            {t('no') || 'No'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* ── Import Backup ── */}
            <SectionCard>
              <SectionHeader icon={FileUp} title={t('importData') || 'Import Backup'} desc={t('importDataDesc') || 'Restore data from a previously exported JSON backup'} />
              <div className="p-5 space-y-4">

                {/* File drop zone */}
                <button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  className={`w-full flex flex-col items-center gap-2.5 py-7 rounded-xl border-2 border-dashed transition-all
                    ${importFile ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/30'}`}
                >
                  {importFile ? (
                    <>
                      <FileCheck2 className="w-7 h-7 text-primary" />
                      <span className="text-sm font-semibold text-primary">{importFileName}</span>
                      <span className="text-xs text-muted-foreground">
                        {importFile.shopName && `${importFile.shopName} · `}
                        {importFile.exportedAt ? new Date(importFile.exportedAt).toLocaleDateString() : ''}
                      </span>
                    </>
                  ) : (
                    <>
                      <FileUp className="w-7 h-7 text-muted-foreground/50" />
                      <span className="text-sm font-medium text-muted-foreground">{t('chooseBackupFile') || 'Choose backup JSON file'}</span>
                      <span className="text-xs text-muted-foreground/60">{t('clickToSelectFile') || 'Click to select'}</span>
                    </>
                  )}
                </button>
                <input ref={importInputRef} type="file" accept=".json,application/json" onChange={handleImportFileChange} className="hidden" />

                {importError && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                    <FileX2 className="w-4 h-4 text-destructive shrink-0" />
                    <p className="text-xs text-destructive font-medium">{importError}</p>
                  </div>
                )}

                {importFile && (
                  <>
                    {/* Preview counts */}
                    <div className="grid grid-cols-4 gap-2">
                      {([
                        { key: 'customers',  icon: Users,        label: 'Customers',  count: importFile.data.customers?.length ?? 0 },
                        { key: 'products',   icon: Package,      label: 'Products',   count: importFile.data.products?.length ?? 0 },
                        { key: 'orders',     icon: ShoppingCart, label: 'Orders',     count: importFile.data.orders?.length ?? 0 },
                        { key: 'staff',      icon: UserCog,      label: 'Staff',      count: (importFile.data.staff?.length ?? 0) + (importFile.data.roles?.length ?? 0) },
                      ] as { key: string; icon: any; label: string; count: number }[]).map(({ key, icon: Icon, label, count }) => (
                        <div key={key} className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-muted/30 border border-border">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-base font-bold text-foreground">{count}</span>
                          <span className="text-[10px] text-muted-foreground">{label}</span>
                        </div>
                      ))}
                    </div>

                    {/* What to import */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-foreground">{t('whatToImport') || 'What to import'}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { key: 'includeCustomers', label: t('customers') || 'Customers' },
                          { key: 'includeProducts',  label: t('products')  || 'Products & Categories' },
                          { key: 'includeOrders',    label: t('orders')    || 'Orders' },
                          { key: 'includeStaff',     label: t('staff')     || 'Staff & Roles' },
                          { key: 'includeSettings',  label: t('shopInfo')  || 'Shop Settings' },
                        ] as { key: keyof typeof importOptions; label: string }[]).map(({ key, label }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setImportOptions(o => ({ ...o, [key]: !o[key] }))}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all text-left
                              ${importOptions[key] ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-muted/20 text-muted-foreground'}`}
                          >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                              ${importOptions[key] ? 'border-primary bg-primary' : 'border-muted-foreground/40'}`}>
                              {importOptions[key] && <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />}
                            </div>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Merge mode */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-foreground">{t('importMode') || 'Import mode'}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { value: 'replace', label: t('importReplace') || 'Replace', desc: t('importReplaceDesc') || 'Wipe selected data first' },
                          { value: 'merge',   label: t('importMerge')   || 'Merge',   desc: t('importMergeDesc')   || 'Skip existing records' },
                        ] as { value: MergeMode; label: string; desc: string }[]).map(({ value, label, desc }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setImportMergeMode(value)}
                            className={`flex flex-col gap-0.5 px-3.5 py-3 rounded-xl border-2 text-left transition-all
                              ${importMergeMode === value ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:border-muted-foreground/40'}`}
                          >
                            <span className={`text-xs font-semibold ${importMergeMode === value ? 'text-primary' : 'text-foreground'}`}>{label}</span>
                            <span className="text-[10px] text-muted-foreground leading-tight">{desc}</span>
                          </button>
                        ))}
                      </div>
                      {importMergeMode === 'replace' && (
                        <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-xl">
                          <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground">{t('importReplaceWarning') || 'Selected tables will be wiped before importing. This cannot be undone.'}</p>
                        </div>
                      )}
                    </div>

                    {/* Import summary */}
                    {importSummary && (
                      <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-xl">
                        <Check className="w-4 h-4 text-success shrink-0" strokeWidth={3} />
                        <p className="text-xs text-success font-semibold">
                          Import complete —&nbsp;
                          {Object.entries(importSummary).map(([k, v]) => `${v} ${k}`).join(', ')}
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleImport}
                      disabled={importLoading || !Object.values(importOptions).some(Boolean)}
                      className="rounded-xl gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-sm shadow-primary/25 w-full"
                    >
                      {importLoading ? <Spinner className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                      {importLoading ? (t('importing') || 'Importing…') : (t('startImport') || 'Start Import')}
                    </Button>
                  </>
                )}
              </div>
            </SectionCard>

            {/* ── Import Demo Data ── */}
            <SectionCard>
              <SectionHeader icon={Database} title="ডেমো ডেটা আমদানি / Import Demo Data" desc="Populate your Supabase database with realistic Bangladeshi demo data" />
              <div className="p-5 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Fills your Supabase shop database with products, categories, customers, orders, staff, and roles. Useful for testing and exploring features.
                </p>
                {seedLoading && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-primary animate-spin shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Importing demo data to Supabase</p>
                        <p className="text-xs text-muted-foreground">{SEED_PROGRESS_STEPS[seedProgressStep]}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2 rounded-full bg-primary/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                          style={{ width: `${((seedProgressStep + 1) / SEED_PROGRESS_STEPS.length) * 100}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Step {seedProgressStep + 1} of {SEED_PROGRESS_STEPS.length}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-xl border border-destructive/20">
                  <ShieldAlert className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-xs text-destructive font-medium">
                    This will replace ALL existing shop data. This action cannot be undone.
                  </p>
                </div>
                {!seedConfirm ? (
                  <Button variant="outline" size="sm" onClick={() => setSeedConfirm(true)} className="rounded-xl gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive/60">
                    <Database className="w-3.5 h-3.5" /> Import Demo Data
                  </Button>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-sm font-semibold text-destructive">Are you sure? All existing data will be deleted.</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={handleSeedDemo} disabled={seedLoading} className="rounded-xl gap-1.5">
                        {seedLoading ? <Spinner className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                        {seedLoading ? 'Importing…' : 'Yes, Import Demo Data'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setSeedConfirm(false)} disabled={seedLoading} className="rounded-xl">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        )
      )}

      {/* Bottom save (shop/invoice/notifications tabs only) */}
      {(['shop', 'invoice', 'notifications'] as Tab[]).includes(activeTab) && (
        <div className="flex gap-2 justify-end pt-1 pb-4 sm:hidden">
          <Button variant="outline" onClick={() => setForm({ ...settings })} className="rounded-xl gap-1.5 flex-1">
            <RotateCcw className="w-4 h-4" /> {t('reset')}
          </Button>
          <Button onClick={handleSave} disabled={saveLoading} className="rounded-xl gap-1.5 flex-1 bg-gradient-to-r from-primary to-primary/80">
            {saveLoading ? <Spinner className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('saveSettings')}
          </Button>
        </div>
      )}
    </div>
  );
}
