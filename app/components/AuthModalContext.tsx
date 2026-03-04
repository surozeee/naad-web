'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { LoginModal } from './auth/LoginModal';
import { RegisterModal } from './auth/RegisterModal';
import { ForgotPasswordModal } from './auth/ForgotPasswordModal';

type AuthModalContextValue = {
  openLogin: (redirect?: string) => void;
  openRegister: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) return null;
  return ctx;
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [loginRedirect, setLoginRedirect] = useState('/dashboard');

  const openLogin = useCallback((redirect = '/dashboard') => {
    setLoginRedirect(redirect);
    setShowRegisterModal(false);
    setShowForgotPasswordModal(false);
    setShowLoginModal(true);
  }, []);

  const openRegister = useCallback(() => {
    setShowLoginModal(false);
    setShowForgotPasswordModal(false);
    setShowRegisterModal(true);
  }, []);

  useEffect(() => {
    if (showLoginModal || showRegisterModal || showForgotPasswordModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showLoginModal, showRegisterModal, showForgotPasswordModal]);

  return (
    <AuthModalContext.Provider value={{ openLogin, openRegister }}>
      {children}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        redirectAfterLogin={loginRedirect}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
        onForgotPassword={() => {
          setShowLoginModal(false);
          setShowForgotPasswordModal(true);
        }}
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        onBackToLogin={() => {
          setShowForgotPasswordModal(false);
          setShowLoginModal(true);
        }}
      />
    </AuthModalContext.Provider>
  );
}
