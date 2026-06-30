import { NextRequest, NextResponse } from 'next/server';
import { Customers } from '@/lib/data-store';

export async function GET() {
  try {
    const customers = await Customers.list();
    return NextResponse.json({ customers });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // التحويل من زائر إلى زبون
    if (body.visitorId && body.convert) {
      const c = await Customers.createFromVisitor(body.visitorId, body);
      return NextResponse.json({ customer: c });
    }
    return NextResponse.json({ error: 'يجب استخدام التحويل من زائر' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
