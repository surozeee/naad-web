import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

/** PUT update astrologer. Forwards to backend PUT update-astrologer with id header. */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: 'User id required' }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    const headers = { ...backendHeaders(request), id };
    const res = await fetch(backendUrl('/user/astrologer/update'), {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API astrologer update]', e);
    return NextResponse.json({ message: 'Failed to update astrologer' }, { status: 500 });
  }
}

/** DELETE astrologer user. */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: 'User id required' }, { status: 400 });
    }
    const headers = { ...backendHeaders(_request), id };
    const res = await fetch(backendUrl('/user/astrologer/delete'), {
      method: 'DELETE',
      headers,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API astrologer delete]', e);
    return NextResponse.json({ message: 'Failed to delete astrologer' }, { status: 500 });
  }
}

/** PATCH change astrologer status. */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: 'User id required' }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    const status =
      body && typeof body === 'object' && (body as Record<string, unknown>).status != null
        ? String((body as Record<string, string>).status)
        : '';
    const headers = { ...backendHeaders(request), id, status };
    const res = await fetch(backendUrl('/user/change-status'), {
      method: 'PATCH',
      headers,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API astrologer change-status]', e);
    return NextResponse.json({ message: 'Failed to change status' }, { status: 500 });
  }
}
