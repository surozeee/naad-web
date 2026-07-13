import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/app/lib/api-base';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

/** Proxy all /api/event/* requests to backend /api/v2/event/*. Forwards method, body, and headers (id, status). */
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

/** Custom headers the Java event APIs read via @RequestHeader (case-insensitive match). */
const EVENT_HEADER_ALIASES: Array<{ keys: string[]; forwardAs: string }> = [
  { keys: ['id'], forwardAs: 'id' },
  { keys: ['status'], forwardAs: 'status' },
  { keys: ['publishStatus', 'publishstatus'], forwardAs: 'publishStatus' },
];

async function proxy(request: NextRequest, params: { path: string[] }, method: string) {
  try {
    const pathSegments = params.path ?? [];
    if (pathSegments.length === 0) {
      return NextResponse.json({ message: 'Event path required' }, { status: 400 });
    }
    const backendPath = `/event/${pathSegments.join('/')}`;
    const url = backendUrl(backendPath);
    const contentType = request.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');
    let body: BodyInit | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      if (isMultipart) {
        body = await request.formData();
      } else {
        try {
          const text = await request.text();
          body = text.length > 0 ? text : undefined;
        } catch {
          body = undefined;
        }
      }
    }
    // Only force JSON Content-Type when there is a JSON body (header-only PATCH must not send it).
    const hasJsonBody = !isMultipart && typeof body === 'string' && body.length > 0;
    const forwardHeaders = backendHeaders(request, {
      includeJsonContentType: hasJsonBody,
    });
    for (const { keys, forwardAs } of EVENT_HEADER_ALIASES) {
      let value: string | null = null;
      for (const key of keys) {
        value = request.headers.get(key);
        if (value) break;
      }
      if (value) forwardHeaders[forwardAs] = value;
    }
    const res = await backendFetch(url, {
      method,
      headers: forwardHeaders,
      body,
    });
    const responseContentType = res.headers.get('content-type') || '';
    if (responseContentType.includes('application/json')) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.status });
    }
    const text = await res.text().catch(() => '');
    return new NextResponse(text, { status: res.status });
  } catch (e) {
    console.error('[API event]', e);
    return NextResponse.json({ message: 'Event API request failed' }, { status: 500 });
  }
}
