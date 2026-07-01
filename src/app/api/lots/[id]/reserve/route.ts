import { NextRequest, NextResponse } from 'next/server';
import { Lots } from '@/lib/data-store';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (!body.customerName) {
      return NextResponse.json({ error: 'اسم الزبون مطلوب' }, { status: 400 });
    }
    await Lots.reserve(id, {
      customerName: body.customerName,
      notes: body.notes,
      reservedBy: body.reservedBy,
      reservedByName: body.reservedByName,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await Lots.unreserve(id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
