import { NextResponse } from 'next/server';
import { publicBackendRequest } from '@/app/lib/public-backend';

export const dynamic = 'force-dynamic';

/** Public Contact Us form submit (Communication-Service). */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const res = await publicBackendRequest(
      [
        '/communication/public/support-email/create',
        '/public/support-email/create',
        '/public/communication/support-email/create',
      ],
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[Public] support-email create error:', error);
    return NextResponse.json({ message: 'Failed to send message' }, { status: 500 });
  }
}
