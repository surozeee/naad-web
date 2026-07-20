import { NextResponse } from 'next/server';
import { getCmsPageSeed, normalizeCmsLocale } from '@/app/lib/cms-page-seed';
import { publicBackendRequest } from '@/app/lib/public-backend';

export const dynamic = 'force-dynamic';

/** Public CMS page HTML/CSS by slug — backend first, then EN/NE/HI seed with CSS. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = (searchParams.get('name') || '').trim();
    if (!name) {
      return NextResponse.json({ message: 'name is required' }, { status: 400 });
    }

    const acceptLanguage = request.headers.get('accept-language') || 'en';
    const locale = normalizeCmsLocale(acceptLanguage);
    const params = new URLSearchParams({ name });

    try {
      const res = await publicBackendRequest(
        [
          `/public/page/content-by-name?${params}`,
          `/master/public/page/content-by-name?${params}`,
        ],
        {
          method: 'GET',
          headers: {
            'Accept-Language': locale,
          },
        }
      );

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const payload = (data as { data?: { title?: string; htmlContent?: string } | null })?.data;
        if (payload?.title || payload?.htmlContent) {
          return NextResponse.json(data, { status: 200 });
        }
      }
    } catch (error) {
      console.warn('[Public] page content-by-name upstream failed, using seed:', error);
    }

    const seed = getCmsPageSeed(name, locale);
    if (!seed) {
      return NextResponse.json({ data: null, message: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        status: 'SUCCESS',
        data: seed,
        fromSeed: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Public] page content-by-name error:', error);
    return NextResponse.json({ data: null, message: 'Failed to load page' }, { status: 200 });
  }
}
