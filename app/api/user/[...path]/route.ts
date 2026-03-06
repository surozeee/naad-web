import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

/** Proxy /api/user/* to backend /api/v2/user/*. Forwards method, body, and headers (id, userId). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params, 'GET');
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params, 'POST');
}
export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params, 'PUT');
}
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params, 'PATCH');
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params, 'DELETE');
}

const USER_HEADERS = ['id', 'userId'];

async function proxy(request: NextRequest, params: { path: string[] }, method: string) {
  try {
    const pathSegments = params.path ?? [];
    if (pathSegments.length === 0) {
      return NextResponse.json({ message: 'User path required' }, { status: 400 });
    }
    const backendPath = `/user/${pathSegments.join('/')}`;
    const url = backendUrl(backendPath);
    const forwardHeaders = backendHeaders(request);
    USER_HEADERS.forEach((h) => {
      const v = request.headers.get(h) ?? request.headers.get(h.toLowerCase());
      if (v) forwardHeaders[h] = v;
    });
    let body: string | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        body = await request.text();
      } catch {
        body = undefined;
      }
    }
    const res = await fetch(url, {
      method,
      headers: forwardHeaders,
      body: body || undefined,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API user]', e);
    return NextResponse.json({ message: 'User API request failed' }, { status: 500 });
  }
}
