'use client';

import { useState } from 'react';
import { X, Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import { completeAuthSessionAndRedirect } from '@/app/lib/complete-auth-session';
import { SocialAuthButtons } from '@/app/components/auth/SocialAuthButtons';
import { runFacebookSocialLogin, runGoogleSocialLogin } from '@/lib/social-login-flow';

const REGISTER_API = '/api/auth/register';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  redirectAfterLogin?: string;
  t?: (key: string) => string;
}

const defaults: Record<string, string> = {
  'register.title': 'Create account',
  'register.subtitle': 'Join Naad Official for spiritual guidance and services',
  'register.fullName': 'Full name',
  'register.fullNamePlaceholder': 'Your name',
  'register.email': 'Email',
  'register.emailPlaceholder': 'you@example.com',
  'register.phone': 'Phone',
  'register.phonePlaceholder': 'Optional',
  'register.password': 'Password',
  'register.passwordPlaceholder': 'At least 8 characters',
  'register.confirmPassword': 'Confirm password',
  'register.confirmPasswordPlaceholder': 'Confirm your password',
  'register.passwordMismatch': 'Passwords do not match',
  'register.passwordWeak': 'Password must be at least 8 characters with uppercase, lowercase, number and special character',
  'register.acceptTerms': 'I agree to the',
  'register.termsOfService': 'Terms of service',
  'register.privacyPolicy': 'Privacy policy',
  'register.and': 'and',
  'register.acceptTermsRequired': 'You must accept the terms',
  'register.createAccount': 'Create account',
  'register.creatingAccount': 'Creating...',
  'register.alreadyHaveAccount': 'Already have an account?',
  'register.signIn': 'Sign in',
  'register.passwordMinLength': 'At least 8 characters',
  'register.passwordUppercase': 'One uppercase letter',
  'register.passwordLowercase': 'One lowercase letter',
  'register.passwordNumber': 'One number',
  'register.passwordSpecial': 'One special character',
  'register.or': 'or continue with',
  'register.google': 'Continue with Google',
  'register.facebook': 'Continue with Facebook',
  'register.socialError': 'Sign up failed',
};

export function RegisterModal({
  isOpen,
  onClose,
  onSwitchToLogin,
  redirectAfterLogin = '/dashboard',
  t = (k) => defaults[k] ?? k,
}: RegisterModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'GOOGLE' | 'FACEBOOK' | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState('');

  const busy = loading || socialLoading != null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validatePassword = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      isValid:
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /\d/.test(password) &&
        /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  };

  const passwordValidation = validatePassword(formData.password);

  const finishAndRedirect = async (data: unknown) => {
    const err = await completeAuthSessionAndRedirect(data, redirectAfterLogin);
    if (err) {
      setError(err === 'Login failed' ? t('register.socialError') : err);
      return;
    }
    setRedirecting(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError(t('register.passwordMismatch'));
      return;
    }
    if (!passwordValidation.isValid) {
      setError(t('register.passwordWeak'));
      return;
    }
    if (!formData.acceptTerms) {
      setError(t('register.acceptTermsRequired'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(REGISTER_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setError(data?.message ?? 'Registration failed');
        return;
      }
      onClose();
      onSwitchToLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: 'GOOGLE' | 'FACEBOOK') => {
    setError('');
    if (!formData.acceptTerms) {
      setError(t('register.acceptTermsRequired'));
      return;
    }
    setSocialLoading(provider);
    try {
      const result =
        provider === 'GOOGLE' ? await runGoogleSocialLogin() : await runFacebookSocialLogin();
      if (!result.ok) {
        setError(result.message || t('register.socialError'));
        return;
      }
      await finishAndRedirect(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('register.socialError'));
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
      <div className="auth-modal-content auth-modal-content-large" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="auth-modal-close" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>
        <div className="auth-modal-header">
          <h2>{t('register.title')}</h2>
          <p className="auth-modal-subtitle">{t('register.subtitle')}</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label htmlFor="register-name" className="auth-form-label">
              <User size={18} />
              {t('register.fullName')}
            </label>
            <input
              id="register-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('register.fullNamePlaceholder')}
              className="auth-form-input"
              required
              disabled={busy}
            />
          </div>
          <div className="auth-form-group">
            <label htmlFor="register-email" className="auth-form-label">
              <Mail size={18} />
              {t('register.email')}
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('register.emailPlaceholder')}
              className="auth-form-input"
              required
              disabled={busy}
            />
          </div>
          <div className="auth-form-group">
            <label htmlFor="register-phone" className="auth-form-label">
              <Phone size={18} />
              {t('register.phone')}
            </label>
            <input
              id="register-phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder={t('register.phonePlaceholder')}
              className="auth-form-input"
              disabled={busy}
            />
          </div>
          <div className="auth-form-group">
            <label htmlFor="register-password" className="auth-form-label">
              <Lock size={18} />
              {t('register.password')}
            </label>
            <div className="auth-password-wrapper">
              <input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder={t('register.passwordPlaceholder')}
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
            {formData.password && (
              <div className="auth-password-strength">
                {[
                  [passwordValidation.minLength, t('register.passwordMinLength')],
                  [passwordValidation.hasUpper, t('register.passwordUppercase')],
                  [passwordValidation.hasLower, t('register.passwordLowercase')],
                  [passwordValidation.hasNumber, t('register.passwordNumber')],
                  [passwordValidation.hasSpecial, t('register.passwordSpecial')],
                ].map(([ok, label], i) => (
                  <div key={i} className={`auth-strength-item ${ok ? 'valid' : ''}`}>
                    <CheckCircle size={14} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="auth-form-group">
            <label htmlFor="register-confirm-password" className="auth-form-label">
              <Lock size={18} />
              {t('register.confirmPassword')}
            </label>
            <div className="auth-password-wrapper">
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder={t('register.confirmPasswordPlaceholder')}
                className={`auth-form-input ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'auth-input-error' : ''}`}
                required
                disabled={busy}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={busy}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <div className="auth-form-error-small">{t('register.passwordMismatch')}</div>
            )}
          </div>
          <div className="auth-form-group">
            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="auth-checkbox-input"
                required
                disabled={busy}
              />
              <span>
                {t('register.acceptTerms')}{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="auth-terms-link">
                  {t('register.termsOfService')}
                </a>{' '}
                {t('register.and')}{' '}
                <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="auth-terms-link">
                  {t('register.privacyPolicy')}
                </a>
              </span>
            </label>
          </div>
          {error && <div className="auth-form-error">{error}</div>}
          <button
            type="submit"
            className="auth-btn-primary auth-btn-full"
            disabled={busy || !passwordValidation.isValid || !formData.acceptTerms}
          >
            {loading ? t('register.creatingAccount') : t('register.createAccount')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <SocialAuthButtons
          orLabel={t('register.or')}
          googleLabel={t('register.google')}
          facebookLabel={t('register.facebook')}
          loadingLabel={t('register.creatingAccount')}
          busy={busy}
          socialLoading={socialLoading}
          onGoogle={() => void handleSocial('GOOGLE')}
          onFacebook={() => void handleSocial('FACEBOOK')}
        />

        <div className="auth-footer">
          <p>
            {t('register.alreadyHaveAccount')}{' '}
            <button type="button" className="auth-link" onClick={onSwitchToLogin}>
              {t('register.signIn')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
