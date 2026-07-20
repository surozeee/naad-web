'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Footer from '@/app/components/Footer';
import { useLocale } from '@/app/components/LocaleProvider';
import { getCmsPageSeed } from '@/app/lib/cms-page-seed';
import { fetchCmsPageByName, type CmsPageContent } from '@/app/lib/public-cms';

type Props = {
  name: string;
  fallbackTitle?: string;
};

export default function CmsPageView({ name, fallbackTitle }: Props) {
  const { language } = useLocale();
  const initialSeed = getCmsPageSeed(name, language);
  const [content, setContent] = useState<CmsPageContent | null>(initialSeed);
  const [loading, setLoading] = useState(!initialSeed);
  const [notFound, setNotFound] = useState(!initialSeed);

  useEffect(() => {
    let cancelled = false;
    const seed = getCmsPageSeed(name, language);
    // Show locale seed immediately on language change / first paint
    if (seed) {
      setContent(seed);
      setNotFound(false);
      setLoading(true);
    } else {
      setLoading(true);
      setNotFound(false);
    }

    fetchCmsPageByName(name, language)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setNotFound(!seed);
          setContent(seed);
        } else {
          setNotFound(false);
          setContent(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(!seed);
          setContent(seed);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [name, language]);

  const title = content?.title || fallbackTitle || name;

  return (
    <div className="naad-site naad-cms-shell">
      <header className="naad-horoscope-intro naad-cms-intro">
        <nav className="naad-cms-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden>/</span>
          <span>{title}</span>
        </nav>
        <h1>{title}</h1>
        {loading ? <p className="naad-cms-status">Updating…</p> : null}
      </header>

      <div className="naad-section-inner naad-cms-content">
        {notFound || (!loading && !content) ? (
          <div className="naad-cms-empty">
            <p>
              This page is not available yet. Content is loaded from the CMS slug{' '}
              <strong>{name}</strong>.
            </p>
            <Link href="/" className="naad-btn-primary">
              Back to home
            </Link>
          </div>
        ) : null}

        {content?.cssContent ? (
          <style dangerouslySetInnerHTML={{ __html: content.cssContent }} />
        ) : null}

        {content?.htmlContent ? (
          <div
            className="naad-cms-body"
            dangerouslySetInnerHTML={{ __html: content.htmlContent }}
          />
        ) : null}

        {content && !content.htmlContent && !notFound ? (
          <div className="naad-cms-empty">
            <p>No content has been published for this page yet.</p>
          </div>
        ) : null}
      </div>

      <Footer />
    </div>
  );
}
