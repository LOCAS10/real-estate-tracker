import { NextResponse } from 'next/server';
import { Dashboard } from '@/lib/data-store';

export async function GET() {
  try {
    const stats = await Dashboard.stats();
    return NextResponse.json({ stats });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
