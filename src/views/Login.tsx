import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import { requestPasswordReset } from '@/lib/auth-client';
import { Scissors, Mail, Lock, User } from 'lucide-react';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const { loginWithEmail, signupWithEmail } = useData();
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  useEnterNavigation(formRef);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await loginWithEmail(email, password);
    setLoading(false);
    if (result.success) {
      toast({ title: t('loginSuccess') });
      router.push('/');
    } else {
      setError(result.error || t('loginError'));
      toast({ title: `❌ ${t('loginError')}`, description: result.error, variant: 'destructive' });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signupWithEmail(email, password, fullName);
    setLoading(false);
    if (result.success) {
      toast({ title: t('signupSuccess') });
      setMode('login');
    } else {
      setError(result.error || t('signupError'));
      toast({ title: `❌ ${t('signupError')}`, description: result.error, variant: 'destructive' });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (result.error) {
      setError(result.error.message || 'Failed to send reset link');
    } else {
      toast({ title: t('resetLinkSent'), description: t('resetLinkSentDesc') });
      setMode('login');
    }
  };

  const getFormHandler = () => {
    if (mode === 'forgot') return handleForgotPassword;
    if (mode === 'signup') return handleSignup;
    return handleEmailLogin;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto mb-4 flex items-center justify-center">
            <Scissors className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {mode === 'forgot' ? t('forgotPassword') : t('loginTitle')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === 'forgot'
              ? t('enterEmailForReset')
              : mode === 'signup'
                ? t('signupSubtitle')
                : t('loginSubtitle')}
          </p>
        </div>

        <form ref={formRef} onSubmit={getFormHandler()} className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4">
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('fullName')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={t('fullNamePlaceholder')}
                  className="pl-9"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="pl-9"
                required
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('passwordPlaceholder')}
                  className="pl-9"
                  required
                  minLength={6}
                />
              </div>
              {mode === 'login' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); }}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    {t('forgotPassword')}
                  </button>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Spinner className="animate-spin" />
            ) : mode === 'forgot' ? (
              t('sendResetLink')
            ) : mode === 'signup' ? (
              t('signup')
            ) : (
              t('login')
            )}
          </Button>

          <div className="text-center">
            {mode === 'forgot' ? (
              <p className="text-xs text-muted-foreground">
                <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-primary hover:underline font-medium">
                  {t('backToLogin')}
                </button>
              </p>
            ) : mode === 'login' ? (
              <p className="text-xs text-muted-foreground">
                {t('dontHaveAccount')}{' '}
                <button type="button" onClick={() => { setMode('signup'); setError(''); }} className="text-primary hover:underline font-medium">
                  {t('signup')}
                </button>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t('alreadyHaveAccount')}{' '}
                <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-primary hover:underline font-medium">
                  {t('login')}
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
