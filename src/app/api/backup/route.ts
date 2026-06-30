import { NextResponse } from 'next/server';
import { Backup } from '@/lib/data-store';

export async function GET() {
  try {
    const data = await Backup.exportAll();
    return NextResponse.json(data, {
      headers: {
        'Content-Disposition': `attachment; filename="backup-${new Date().toISOString().slice(0,10)}.json"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
