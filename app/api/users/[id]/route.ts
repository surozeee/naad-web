import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

const BASE = '/user';

/** GET user by id. Forwards to backend GET get-by-id with id header. */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: 'User id required' }, { status: 400 });
    }
    const headers = { ...backendHeaders(_request), id };
    const res = await fetch(backendUrl(`${BASE}/get-by-id`), {
      method: 'GET',
      headers,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API users get-by-id]', e);
    return NextResponse.json({ message: 'Failed to fetch user' }, { status: 500 });
  }
}

/** PUT update user. Body: UserRequest. Forwards to backend PUT update with id header. */
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
    const res = await fetch(backendUrl(`${BASE}/update`), {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API users update]', e);
    return NextResponse.json({ message: 'Failed to update user' }, { status: 500 });
  }
}

/** PATCH change user status. Body: { status: 'ACTIVE' | 'INACTIVE' }. Forwards to backend PATCH change-status with id and status headers. */
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
    console.error('[API users change-status]', e);
    return NextResponse.json({ message: 'Failed to change status' }, { status: 500 });
  }
}

/** DELETE user. Forwards to backend DELETE delete with id header. */
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
    const res = await fetch(backendUrl(`${BASE}/delete`), {
      method: 'DELETE',
      headers,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API users delete]', e);
    return NextResponse.json({ message: 'Failed to delete user' }, { status: 500 });
  }
}
