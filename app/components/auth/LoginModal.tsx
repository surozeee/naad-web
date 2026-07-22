'use client';

import { useState } from 'react';
import { X, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { getXsrfToken } from '@/app/lib/get-xsrf';
import { completeAuthSessionAndRedirect } from '@/app/lib/complete-auth-session';
import { SocialAuthButtons } from '@/app/components/auth/SocialAuthButtons';
import { runLoginFlow } from '@/lib/login-flow';
import { runFacebookSocialLogin, runGoogleSocialLogin } from '@/lib/social-login-flow';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
  redirectAfterLogin?: string;
  t?: (key: string) => string;
}

const defaults: Record<string, string> = {
  'login.title': 'Sign in',
  'login.subtitle': 'Enter your credentials to access your account',
  'login.email': 'Email',
  'login.emailPlaceholder': 'you@example.com',
  'login.password': 'Password',
  'login.passwordPlaceholder': 'Enter your password',
  'login.forgotPassword': 'Forgot password?',
  'login.login': 'Sign in',
  'login.loggingIn': 'Signing in...',
  'login.error': 'Login failed',
  'login.noAccount': "Don't have an account?",
  'login.signUp': 'Sign up',
  'login.or': 'or continue with',
  'login.google': 'Continue with Google',
  'login.facebook': 'Continue with Facebook',
  'login.termsNotice': 'By continuing you agree to our',
  'login.termsOfService': 'Terms of service',
  'login.and': 'and',
  'login.privacyPolicy': 'Privacy policy',
};

export function LoginModal({
  isOpen,
  onClose,
  onSwitchToRegister,
  onForgotPassword,
  redirectAfterLogin = '/dashboard',
  t = (k) => defaults[k] ?? k,
}: LoginModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'GOOGLE' | 'FACEBOOK' | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState('');

  const busy = loading || socialLoading != null;

  const finishAndRedirect = async (data: unknown) => {
    const err = await completeAuthSessionAndRedirect(data, redirectAfterLogin);
    if (err) {
      setError(err === 'Login failed' ? t('login.error') : err);
      return;
    }
    setRedirecting(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const xsrf = getXsrfToken();
      if (xsrf) headers['X-XSRF-TOKEN'] = xsrf;

      const loginResult = await runLoginFlow(email.trim(), password, headers);
      if (!loginResult.ok) {
        setError(loginResult.message || t('login.error'));
        return;
      }
      await finishAndRedirect(loginResult.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : (t('login.error') ?? 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: 'GOOGLE' | 'FACEBOOK') => {
    setError('');
    setSocialLoading(provider);
    try {
      const result =
        provider === 'GOOGLE' ? await runGoogleSocialLogin() : await runFacebookSocialLogin();
      if (!result.ok) {
        setError(result.message || t('login.error'));
        return;
      }
      await finishAndRedirect(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : (t('login.error') ?? 'Login failed'));
    } finally {
      setSocialLoading(null);
    }
  };

  if (!isOpen) return null;
  if (redirecting) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3 bg-purple-100 dark:bg-purple-900/30">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-300 border-t-purple-700" aria-hidden />
        <p className="text-base font-medium text-purple-800 dark:text-purple-200">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="auth-modal-close" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>
        <div className="auth-modal-header">
          <h2>{t('login.title')}</h2>
          <p className="auth-modal-subtitle">{t('login.subtitle')}</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label htmlFor="login-email" className="auth-form-label">
              <Mail size={18} />
              {t('login.email')}
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.emailPlaceholder')}
              className="auth-form-input"
              required
              disabled={busy}
            />
          </div>
          <div className="auth-form-group">
            <div className="auth-form-label-row">
              <label htmlFor="login-password" className="auth-form-label">
                <Lock size={18} />
                {t('login.password')}
              </label>
              <button type="button" className="auth-forgot-link" onClick={onForgotPassword}>
                {t('login.forgotPassword')}
              </button>
            </div>
            <div className="auth-password-wrapper">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                className="auth-form-input"
                required
                disabled={busy}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={busy}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          {error && <div className="auth-form-error">{error}</div>}
          <button
            type="submit"
            className="auth-btn-primary auth-btn-full"
            disabled={busy || !email || !password}
          >
            {loading ? t('login.loggingIn') : t('login.login')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <SocialAuthButtons
          orLabel={t('login.or')}
          googleLabel={t('login.google')}
          facebookLabel={t('login.facebook')}
          loadingLabel={t('login.loggingIn')}
          busy={busy}
          socialLoading={socialLoading}
          onGoogle={() => void handleSocial('GOOGLE')}
          onFacebook={() => void handleSocial('FACEBOOK')}
        />

        <p className="auth-legal-note">
          {t('login.termsNotice')}{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="auth-terms-link">
            {t('login.termsOfService')}
          </a>{' '}
          {t('login.and')}{' '}
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="auth-terms-link">
            {t('login.privacyPolicy')}
          </a>
          .
        </p>

        <div className="auth-footer">
          <p>
            {t('login.noAccount')}{' '}
            <button type="button" className="auth-link" onClick={onSwitchToRegister}>
              {t('login.signUp')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
