import { NextRequest, NextResponse } from 'next/server';
import { Payments } from '@/lib/data-store';

export async function GET() {
  try {
    const payments = await Payments.list();
    return NextResponse.json({ payments });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const p = await Payments.create(body);
    return NextResponse.json({ payment: p });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
