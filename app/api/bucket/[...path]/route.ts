import { NextRequest, NextResponse } from 'next/server';
import { backendHeadersFromSession, backendUrl } from '@/app/lib/backend-api';

/** Proxy all /api/bucket/* requests to backend /api/v2/bucket/*. Forwards method, body, and headers (id, status). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params, 'GET');
}
export async function HEAD(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params, 'HEAD');
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

function isBinaryStreamPath(pathSegments: string[]): boolean {
  // /api/bucket/stream/{id} or /api/bucket/public/stream/{id}
  if (pathSegments[0] === 'stream') return true;
  return pathSegments[0] === 'public' && pathSegments[1] === 'stream';
}

async function proxy(request: NextRequest, params: { path: string[] }, method: string) {
  try {
    const pathSegments = params.path ?? [];
    if (pathSegments.length === 0) {
      return NextResponse.json({ message: 'Bucket path required' }, { status: 400 });
    }
    const backendPath = `/bucket/${pathSegments.join('/')}`;
    const search = request.nextUrl.searchParams.toString();
    const url = backendUrl(backendPath) + (search ? `?${search}` : '');
    const stream = isBinaryStreamPath(pathSegments);
    const forwardHeaders = await backendHeadersFromSession(request, {
      includeJsonContentType: !stream,
    });
    BUCKET_HEADERS.forEach((h) => {
      const v = request.headers.get(h) ?? request.headers.get(h.toLowerCase());
      if (v) forwardHeaders[h] = v;
    });

    // Critical for YouTube-style seek/buffer: forward Range / conditional headers
    if (stream) {
      delete forwardHeaders['Content-Type'];
      const range = request.headers.get('range');
      if (range) forwardHeaders.Range = range;
      const ifRange = request.headers.get('if-range');
      if (ifRange) forwardHeaders['If-Range'] = ifRange;
    }

    let body: BodyInit | undefined;
    if (method !== 'GET' && method !== 'DELETE' && method !== 'HEAD') {
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

    if (stream) {
      const outHeaders = new Headers();
      const pass = [
        'content-type',
        'content-length',
        'content-range',
        'accept-ranges',
        'cache-control',
        'etag',
        'last-modified',
      ];
      for (const name of pass) {
        const value = res.headers.get(name);
        if (value) outHeaders.set(name, value);
      }
      outHeaders.set('Accept-Ranges', res.headers.get('accept-ranges') || 'bytes');
      // Ensure browser <audio> can use buffered ranges through same-origin proxy
      outHeaders.set(
        'Access-Control-Expose-Headers',
        'Accept-Ranges, Content-Range, Content-Length, Content-Type'
      );
      return new NextResponse(method === 'HEAD' ? null : res.body, {
        status: res.status,
        headers: outHeaders,
      });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API bucket]', e);
    return NextResponse.json({ message: 'Bucket API request failed' }, { status: 500 });
  }
}
