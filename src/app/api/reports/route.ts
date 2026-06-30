import { NextRequest, NextResponse } from 'next/server';
import { Visitors, Visits, Customers, Lots, Sales, Payments } from '@/lib/data-store';

// تقارير: this-month, available, by-status
export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type') || 'this-month';
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [visitors, visits, customers, lots, sales, payments] = await Promise.all([
      Visitors.list(), Visits.list(), Customers.list(),
      Lots.list(), Sales.list(), Payments.list(),
    ]);

    if (type === 'this-month') {
      const monthVisitors = visitors.filter(v => new Date(v.createdAt) >= startOfMonth && new Date(v.createdAt) < endOfMonth);
      const monthVisits = visits.filter(v => new Date(v.visitDate) >= startOfMonth && new Date(v.visitDate) < endOfMonth);
      const monthSales = sales.filter(s => new Date(s.saleDate) >= startOfMonth && new Date(s.saleDate) < endOfMonth);
      const monthPayments = payments.filter(p => new Date(p.paymentDate) >= startOfMonth && new Date(p.paymentDate) < endOfMonth);

      return NextResponse.json({
        type,
        visitors: monthVisitors,
        visits: monthVisits,
        sales: monthSales,
        payments: monthPayments,
        totals: {
          visitorsCount: monthVisitors.length,
          visitsCount: monthVisits.length,
          salesCount: monthSales.length,
          salesTotal: monthSales.reduce((s, x) => s + x.salePrice, 0),
          paymentsCount: monthPayments.length,
          paymentsTotal: monthPayments.reduce((s, x) => s + x.amount, 0),
        }
      });
    }

    if (type === 'available') {
      const soldLotIds = new Set(sales.map(s => s.lotId));
      const available = lots.filter(l => !soldLotIds.has(l.id));
      return NextResponse.json({ type, lots: available, count: available.length });
    }

    if (type === 'by-status') {
      return NextResponse.json({
        type,
        empty: lots.filter(l => l.status === 'EMPTY'),
        semiFinished: lots.filter(l => l.status === 'SEMI_FINISHED'),
        ready: lots.filter(l => l.status === 'READY'),
      });
    }

    return NextResponse.json({ error: 'نوع تقرير غير معروف' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
