import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

export async function DELETE(request: NextRequest) {
  try {
    const permissionGroupId = request.headers.get('permissiongroupid') ?? request.headers.get('permissionGroupId') ?? '';
    const permissionId = request.headers.get('permissionid') ?? request.headers.get('permissionId') ?? '';
    if (!permissionGroupId || !permissionId) {
      return NextResponse.json({ message: 'permissionGroupId and permissionId required' }, { status: 400 });
    }
    const headers = { ...backendHeaders(request), permissionGroupId, permissionId };
    const res = await fetch(backendUrl('/user/permission-group/remove-permission'), {
      method: 'DELETE',
      headers,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API permission-groups remove-permission]', e);
    return NextResponse.json({ message: 'Failed to remove permission' }, { status: 500 });
  }
}
