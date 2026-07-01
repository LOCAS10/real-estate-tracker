import { NextRequest, NextResponse } from 'next/server';
import { Notifications } from '@/lib/data-store';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId') || '';
    const userRole = req.nextUrl.searchParams.get('userRole') || '';
    if (!userId) return NextResponse.json({ error: 'userId مطلوب' }, { status: 400 });
    const list = await Notifications.forUser(userId, userRole);
    return NextResponse.json({ notifications: list });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.message) {
      return NextResponse.json({ error: 'العنوان والمحتوى مطلوبان' }, { status: 400 });
    }
    const n = await Notifications.create(body);
    return NextResponse.json({ notification: n });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
