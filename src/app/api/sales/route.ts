import { NextRequest, NextResponse } from 'next/server';
import { Sales } from '@/lib/data-store';

export async function GET() {
  try {
    const sales = await Sales.list();
    return NextResponse.json({ sales });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const s = await Sales.create(body);
    return NextResponse.json({ sale: s });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
