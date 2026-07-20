import { NextResponse } from 'next/server';
import { buildLoginSessionResponse } from '@/lib/login-session';

export const dynamic = 'force-dynamic';

export interface EstablishSessionBody {
  email: string;
  loginResponse: unknown;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EstablishSessionBody;
    const email = String(body?.email ?? '').trim();
    if (!email || body?.loginResponse == null) {
      return NextResponse.json(
        { message: 'email and loginResponse are required.' },
        { status: 400 }
      );
    }
    return buildLoginSessionResponse(body.loginResponse, email);
  } catch (error) {
    console.error('[Auth] establish-session error:', error);
    return NextResponse.json(
      { message: 'Something went wrong. Please try again later.', code: 'ESTABLISH_SESSION_FAILED' },
      { status: 500 }
    );
  }
}
