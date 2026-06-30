import { NextRequest, NextResponse } from 'next/server';
import { Users } from '@/lib/data-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const u = await Users.create(body);
    const { pin, ...safe } = u;
    return NextResponse.json({ user: safe });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
