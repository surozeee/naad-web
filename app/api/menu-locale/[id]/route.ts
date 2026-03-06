import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

const BASE = '/user/menu-locale';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: 'Menu locale id required' }, { status: 400 });
    }
    const res = await fetch(backendUrl(`${BASE}/get-by-id`), {
      method: 'POST',
      headers: backendHeaders(_request),
      body: JSON.stringify({ id }),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API menu-locale get-by-id]', e);
    return NextResponse.json({ message: 'Failed to fetch menu locale' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: 'Menu locale id required' }, { status: 400 });
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
    console.error('[API menu-locale update]', e);
    return NextResponse.json({ message: 'Failed to update menu locale' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: 'Menu locale id required' }, { status: 400 });
    }
    const headers = { ...backendHeaders(_request), id };
    const res = await fetch(backendUrl(`${BASE}/delete`), {
      method: 'DELETE',
      headers,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API menu-locale delete]', e);
    return NextResponse.json({ message: 'Failed to delete menu locale' }, { status: 500 });
  }
}
