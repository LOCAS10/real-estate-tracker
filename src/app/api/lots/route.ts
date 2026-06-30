import { NextRequest, NextResponse } from 'next/server';
import { Lots } from '@/lib/data-store';

export async function GET() {
  try {
    const lots = await Lots.list();
    // إضافة حالة التوفّر والسعر الحالي
    const enriched = await Promise.all(lots.map(async l => ({
      ...l,
      currentPrice: Lots.currentPrice(l),
      availability: await Lots.availability(l.id),
    })));
    return NextResponse.json({ lots: enriched });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const l = await Lots.create(body);
    return NextResponse.json({ lot: l });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
