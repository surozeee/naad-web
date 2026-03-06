import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

const BASE = '/user/permission-group';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: 'Permission group id required' }, { status: 400 });
    }
    const res = await fetch(backendUrl(`${BASE}/get-by-id`), {
      method: 'POST',
      headers: backendHeaders(_request),
      body: JSON.stringify({ id }),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API permission-groups get-by-id]', e);
    return NextResponse.json({ message: 'Failed to fetch permission group' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: 'Permission group id required' }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    const headers = { ...backendHeaders(request), id };
    const res = await fetch(backendUrl(`${BASE}/update`), {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API permission-groups update]', e);
    return NextResponse.json({ message: 'Failed to update permission group' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: 'Permission group id required' }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    const status = (body && typeof body === 'object' && (body as Record<string, unknown>).status != null)
      ? String((body as Record<string, string>).status)
      : '';
    const headers = { ...backendHeaders(request), id, status };
    const res = await fetch(backendUrl(`${BASE}/change-status`), {
      method: 'PATCH',
      headers,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API permission-groups change-status]', e);
    return NextResponse.json({ message: 'Failed to change status' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: 'Permission group id required' }, { status: 400 });
    }
    const headers = { ...backendHeaders(_request), id };
    const res = await fetch(backendUrl(`${BASE}/delete`), {
      method: 'DELETE',
      headers,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API permission-groups delete]', e);
    return NextResponse.json({ message: 'Failed to delete permission group' }, { status: 500 });
  }
}
