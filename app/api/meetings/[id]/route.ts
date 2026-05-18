import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: 'Meeting id required' }, { status: 400 });
    }
    const headers = { ...backendHeaders(_request), id };
    const res = await fetch(backendUrl('/user/meetings/get-by-id'), {
      method: 'GET',
      headers,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API meetings get-by-id]', e);
    return NextResponse.json({ message: 'Failed to fetch meeting' }, { status: 500 });
  }
}
