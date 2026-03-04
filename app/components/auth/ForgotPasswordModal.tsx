'use client';

import { useState } from 'react';
import { X, Mail, ArrowRight, ArrowLeft, KeyRound, Lock, CheckCircle } from 'lucide-react';
import { getXsrfToken } from '@/app/lib/get-xsrf';

const FORGOT_PASSWORD_API = '/api/auth/forgot-password';
const RESEND_OTP_API = '/api/auth/resend-otp';
const VERIFY_OTP_API = '/api/auth/verify-otp';
const SET_PASSWORD_API = '/api/auth/set-password';

type Step = 1 | 2 | 3;

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
  t?: (key: string) => string;
}

const defaults: Record<string, string> = {
  'forgotPassword.title': 'Reset password',
  'forgotPassword.subtitle': 'Enter your email to receive an OTP',
  'forgotPassword.enterOtp': 'Enter the OTP sent to your email',
  'forgotPassword.setNewPassword': 'Set your new password',
  'forgotPassword.passwordReset': 'Password reset successfully',
  'forgotPassword.canLogin': 'You can now sign in with your new password.',
  'forgotPassword.email': 'Email',
  'forgotPassword.emailPlaceholder': 'you@example.com',
  'forgotPassword.sendOtp': 'Send OTP',
  'forgotPassword.sending': 'Sending...',
  'forgotPassword.sentTo': 'OTP sent to',
  'forgotPassword.otp': 'OTP',
  'forgotPassword.otpPlaceholder': 'Enter 6-digit OTP',
  'forgotPassword.resendOtp': 'Resend OTP',
  'forgotPassword.verifyOtp': 'Verify OTP',
  'forgotPassword.verifying': 'Verifying...',
  'forgotPassword.newPassword': 'New password',
  'forgotPassword.newPasswordPlaceholder': 'At least 6 characters',
  'forgotPassword.confirmPassword': 'Confirm password',
  'forgotPassword.confirmPasswordPlaceholder': 'Confirm new password',
  'forgotPassword.setPassword': 'Set password',
  'forgotPassword.updating': 'Updating...',
  'forgotPassword.backToLogin': 'Back to sign in',
  'forgotPassword.passwordMismatch': 'Passwords do not match',
  'forgotPassword.passwordTooShort': 'Password must be at least 6 characters',
  'forgotPassword.errorSend': 'Failed to send OTP',
  'forgotPassword.errorResend': 'Failed to resend OTP',
  'forgotPassword.errorVerify': 'Invalid or expired OTP',
  'forgotPassword.errorSetPassword': 'Failed to set password',
};

export function ForgotPasswordModal({
  isOpen,
  onClose,
  onBackToLogin,
  t = (k) => defaults[k] ?? k,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [uuid, setUuid] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const headers = (): Record<string, string> => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    const xsrf = getXsrfToken();
    if (xsrf) h['X-XSRF-TOKEN'] = xsrf;
    return h;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(FORGOT_PASSWORD_API, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setError(data?.message ?? t('forgotPassword.errorSend'));
        return;
      }
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(RESEND_OTP_API, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) setError(data?.message ?? t('forgotPassword.errorResend'));
      else setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(VERIFY_OTP_API, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; data?: { uuid?: string }; uuid?: string };
      if (!res.ok) {
        setError(data?.message ?? t('forgotPassword.errorVerify'));
        return;
      }
      const verifiedUuid = data?.data?.uuid ?? data?.uuid ?? '';
      if (!verifiedUuid) {
        setError(t('forgotPassword.errorVerify'));
        return;
      }
      setUuid(verifiedUuid);
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError(t('forgotPassword.passwordMismatch'));
      return;
    }
    if (newPassword.length < 6) {
      setError(t('forgotPassword.passwordTooShort'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(SET_PASSWORD_API, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ uuid, otp: otp.trim(), newPassword, confirmPassword }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setError(data?.message ?? t('forgotPassword.errorSetPassword'));
        return;
      }
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setEmail('');
    setOtp('');
    setUuid('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
  };

  const handleBackToLogin = () => {
    resetFlow();
    onBackToLogin();
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="auth-modal-close" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>
        <div className="auth-modal-header">
          <h2>{t('forgotPassword.title')}</h2>
          <p className="auth-modal-subtitle">
            {step === 1 && t('forgotPassword.subtitle')}
            {step === 2 && t('forgotPassword.enterOtp')}
            {step === 3 && t('forgotPassword.setNewPassword')}
            {success && t('forgotPassword.passwordReset')}
          </p>
        </div>

        {error && (
          <div className="auth-form" style={{ marginBottom: 8 }}>
            <p role="alert" className="auth-form-error">
              {error}
            </p>
          </div>
        )}

        {success ? (
          <div className="auth-form">
            <div className="auth-success-message">
              <CheckCircle size={48} className="auth-success-icon" />
              <h3>{t('forgotPassword.passwordReset')}</h3>
              <p>{t('forgotPassword.canLogin')}</p>
            </div>
          </div>
        ) : step === 1 ? (
          <form onSubmit={handleSendOtp} className="auth-form">
            <div className="auth-form-group">
              <label htmlFor="forgot-email" className="auth-form-label">
                <Mail size={18} />
                {t('forgotPassword.email')}
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('forgotPassword.emailPlaceholder')}
                className="auth-form-input"
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="auth-btn-primary auth-btn-full"
              disabled={loading || !email.trim()}
            >
              {loading ? t('forgotPassword.sending') : t('forgotPassword.sendOtp')}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        ) : step === 2 ? (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <p className="auth-form-muted">
              {t('forgotPassword.sentTo')}: <strong>{email}</strong>
            </p>
            <div className="auth-form-group">
              <label htmlFor="forgot-otp" className="auth-form-label">
                <KeyRound size={18} />
                {t('forgotPassword.otp')}
              </label>
              <input
                id="forgot-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder={t('forgotPassword.otpPlaceholder')}
                className="auth-form-input"
                required
                disabled={loading}
              />
            </div>
            <button
              type="button"
              className="auth-link"
              onClick={handleResendOtp}
              disabled={loading}
              style={{ marginBottom: 12, fontSize: 14 }}
            >
              {loading ? t('forgotPassword.sending') : t('forgotPassword.resendOtp')}
            </button>
            <button
              type="submit"
              className="auth-btn-primary auth-btn-full"
              disabled={loading || !otp.trim()}
            >
              {loading ? t('forgotPassword.verifying') : t('forgotPassword.verifyOtp')}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSetPassword} className="auth-form">
            <div className="auth-form-group">
              <label htmlFor="forgot-new-password" className="auth-form-label">
                <Lock size={18} />
                {t('forgotPassword.newPassword')}
              </label>
              <input
                id="forgot-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('forgotPassword.newPasswordPlaceholder')}
                className="auth-form-input"
                required
                minLength={6}
                disabled={loading}
              />
            </div>
            <div className="auth-form-group">
              <label htmlFor="forgot-confirm-password" className="auth-form-label">
                <Lock size={18} />
                {t('forgotPassword.confirmPassword')}
              </label>
              <input
                id="forgot-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('forgotPassword.confirmPasswordPlaceholder')}
                className="auth-form-input"
                required
                minLength={6}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="auth-btn-primary auth-btn-full"
              disabled={loading || !newPassword || !confirmPassword}
            >
              {loading ? t('forgotPassword.updating') : t('forgotPassword.setPassword')}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <button type="button" className="auth-link" onClick={handleBackToLogin}>
            <ArrowLeft size={16} style={{ marginRight: 4, display: 'inline' }} />
            {t('forgotPassword.backToLogin')}
          </button>
        </div>
      </div>
    </div>
  );
}
