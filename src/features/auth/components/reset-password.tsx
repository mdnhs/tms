import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { resetPassword } from '@/lib/auth-client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Scissors, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function ResetPassword() {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Extract token from URL hash or query params
    const hash = window.location.hash;
    const search = window.location.search;
    const urlParams = new URLSearchParams(hash.replace('#', '?'));
    const queryParams = new URLSearchParams(search);
    const t = urlParams.get('token') || queryParams.get('token');
    if (t) setToken(t);
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    setLoading(true);
    const result = await resetPassword({ newPassword: password, token });
    setLoading(false);

    if (result.error) {
      setError(result.error.message || 'Failed to reset password');
    } else {
      toast({ title: t('passwordResetSuccess') });
      router.replace('/login');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">{t('loggingIn')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto mb-4 flex items-center justify-center">
            <Scissors className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('resetPassword')}</h1>
        </div>

        <form onSubmit={handleReset} className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('newPassword')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="newPassword"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-9"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmNewPassword')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="pl-9"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('sendingResetLink') : t('resetPassword')}
          </Button>

          <div className="text-center">
            <button type="button" onClick={() => router.push('/login')} className="text-xs text-primary hover:underline font-medium">
              {t('backToLogin')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
