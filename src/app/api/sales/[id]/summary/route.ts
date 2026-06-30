import { NextRequest, NextResponse } from 'next/server';
import { Sales } from '@/lib/data-store';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const summary = await Sales.summary(id);
    return NextResponse.json({ summary });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
