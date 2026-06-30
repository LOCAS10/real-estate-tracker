import { NextRequest, NextResponse } from 'next/server';
import { Users } from '@/lib/data-store';

// تسجيل دخول عبر PIN
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin, username } = body || {};
    if (!pin) {
      return NextResponse.json({ error: 'PIN مطلوب' }, { status: 400 });
    }
    const user = await Users.findByPin(pin, username);
    if (!user) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
    }
    const { pin: _, ...safe } = user;
    return NextResponse.json({ user: safe });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'خطأ' }, { status: 500 });
  }
}

// قائمة المستخدمين
export async function GET() {
  try {
    const users = await Users.list();
    return NextResponse.json({ users: users.map(u => {
      const { pin, ...safe } = u;
      return safe;
    }) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
