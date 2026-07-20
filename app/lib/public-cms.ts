/**
 * Public CMS + contact helpers (browser → Next BFF → backend).
 * Falls back to local EN/NE/HI seed content with CSS on startup / when API empty.
 */

import { getCmsPageSeed, normalizeCmsLocale } from '@/app/lib/cms-page-seed';

export interface CmsPageContent {
  name: string;
  language: string;
  title: string;
  htmlContent?: string;
  cssContent?: string;
}

export interface SupportEmailRequest {
  email: string;
  name: string;
  mobileNumber?: string;
  isCompany: boolean;
  companyName?: string;
  address?: string;
  subject?: string;
  message?: string;
  recaptchaToken?: string;
}

function toAcceptLanguage(locale: string): string {
  return normalizeCmsLocale(locale);
}

export async function fetchCmsPageByName(
  name: string,
  locale = 'en'
): Promise<CmsPageContent | null> {
  const lang = normalizeCmsLocale(locale);
  const seed = getCmsPageSeed(name, lang);

  try {
    const params = new URLSearchParams({ name: name.trim() });
    const res = await fetch(`/api/public/page/content-by-name?${params}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Accept-Language': lang,
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const json = (await res.json().catch(() => ({}))) as {
        data?: CmsPageContent | null;
        fromSeed?: boolean;
      };
      const remote = json?.data;
      if (remote?.title || remote?.htmlContent) {
        return {
          name: remote.name || name,
          language: remote.language || lang.toUpperCase(),
          title: remote.title || seed?.title || name,
          htmlContent: remote.htmlContent || seed?.htmlContent,
          cssContent: remote.cssContent || seed?.cssContent,
        };
      }
    }
  } catch {
    // fall through to seed
  }

  return seed;
}

export async function submitPublicSupportEmail(body: SupportEmailRequest): Promise<void> {
  const res = await fetch('/api/public/support-email/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(json.message || 'Failed to send message. Please try again.');
  }
}
