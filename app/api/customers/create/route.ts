import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

const CUSTOMER_CREATE_PATH = '/customer/customer';

/** POST create customer. Proxies to backend POST /api/v2/customer/customer. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const url = backendUrl(CUSTOMER_CREATE_PATH);
    const res = await fetch(url, {
      method: 'POST',
      headers: backendHeaders(request),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API customers create]', e);
    return NextResponse.json({ message: 'Failed to create customer' }, { status: 500 });
  }
}
