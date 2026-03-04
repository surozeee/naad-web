'use client';

import { useState } from 'react';
import { X, Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, CheckCircle } from 'lucide-react';

const REGISTER_API = '/api/auth/register';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
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
  'register.termsOfService': 'Terms of Service',
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
};

export function RegisterModal({
  isOpen,
  onClose,
  onSwitchToLogin,
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
  const [error, setError] = useState('');

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

  if (!isOpen) return null;

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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
                disabled={loading}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
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
                disabled={loading}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
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
                disabled={loading}
              />
              <span>
                {t('register.acceptTerms')}{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="auth-terms-link">
                  {t('register.termsOfService')}
                </a>
              </span>
            </label>
          </div>
          {error && <div className="auth-form-error">{error}</div>}
          <button
            type="submit"
            className="auth-btn-primary auth-btn-full"
            disabled={loading || !passwordValidation.isValid || !formData.acceptTerms}
          >
            {loading ? t('register.creatingAccount') : t('register.createAccount')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
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
