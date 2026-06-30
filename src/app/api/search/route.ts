import { NextRequest, NextResponse } from 'next/server';
import { Search } from '@/lib/data-store';

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q') || '';
    const results = await Search.search(q);
    return NextResponse.json(results);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
