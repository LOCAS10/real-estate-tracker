import { NextRequest, NextResponse } from 'next/server';
import { Visitors } from '@/lib/data-store';

export async function GET() {
  try {
    const visitors = await Visitors.list();
    return NextResponse.json({ visitors });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const v = await Visitors.create(body);
    return NextResponse.json({ visitor: v });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
