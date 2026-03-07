import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

/** Proxy all /api/bucket/* requests to backend /api/v2/bucket/*. Forwards method, body, and headers (id, status). */
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

const BUCKET_HEADERS = ['id', 'status'];

async function proxy(request: NextRequest, params: { path: string[] }, method: string) {
  try {
    const pathSegments = params.path ?? [];
    if (pathSegments.length === 0) {
      return NextResponse.json({ message: 'Bucket path required' }, { status: 400 });
    }
    const backendPath = `/bucket/${pathSegments.join('/')}`;
    const search = request.nextUrl.searchParams.toString();
    const url = backendUrl(backendPath) + (search ? `?${search}` : '');
    const forwardHeaders = backendHeaders(request);
    BUCKET_HEADERS.forEach((h) => {
      const v = request.headers.get(h) ?? request.headers.get(h.toLowerCase());
      if (v) forwardHeaders[h] = v;
    });
    let body: BodyInit | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      const contentType = request.headers.get('content-type');
      if (contentType?.startsWith('multipart/form-data')) {
        body = await request.arrayBuffer();
        forwardHeaders['Content-Type'] = contentType;
      } else {
        try {
          body = await request.text();
        } catch {
          body = undefined;
        }
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
    console.error('[API bucket]', e);
    return NextResponse.json({ message: 'Bucket API request failed' }, { status: 500 });
  }
}
