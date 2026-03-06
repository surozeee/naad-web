import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

const BASE = '/user/role';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: 'Role id required' }, { status: 400 });
    }
    const headers = { ...backendHeaders(_request), id };
    const res = await fetch(backendUrl(`${BASE}/get-by-id`), {
      method: 'POST',
      headers,
      body: JSON.stringify({ id }),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API roles get-by-id]', e);
    return NextResponse.json({ message: 'Failed to fetch role' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: 'Role id required' }, { status: 400 });
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
    console.error('[API roles update]', e);
    return NextResponse.json({ message: 'Failed to update role' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: 'Role id required' }, { status: 400 });
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
    console.error('[API roles change-status]', e);
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
      return NextResponse.json({ message: 'Role id required' }, { status: 400 });
    }
    const headers = { ...backendHeaders(_request), id };
    const res = await fetch(backendUrl(`${BASE}/delete`), {
      method: 'DELETE',
      headers,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API roles delete]', e);
    return NextResponse.json({ message: 'Failed to delete role' }, { status: 500 });
  }
}
