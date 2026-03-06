import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const res = await fetch(backendUrl('/user/menu-locale/get-by-menu-id'), {
      method: 'POST',
      headers: backendHeaders(request),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API menu-locale get-by-menu-id]', e);
    return NextResponse.json({ message: 'Failed to fetch menu locales' }, { status: 500 });
  }
}
