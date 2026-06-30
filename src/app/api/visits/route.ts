import { NextRequest, NextResponse } from 'next/server';
import { Visits } from '@/lib/data-store';

export async function GET() {
  try {
    const visits = await Visits.list();
    return NextResponse.json({ visits });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const v = await Visits.create(body);
    return NextResponse.json({ visit: v });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
