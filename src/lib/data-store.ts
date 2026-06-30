// lib/data-store.ts
// طبقة بيانات موحدة تعمل مع Firebase أو وضع Demo (في الذاكرة)
// كل العمليات async حتى تنتقل بسلاسة بين الوضعين

import { db, isFirebaseConfigured } from './firebase';
import {
  collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc,
  deleteDoc, query, where, orderBy, Timestamp, onSnapshot
} from 'firebase/firestore';

// ============= الأنواع =============
export type UserRole = 'ADMIN' | 'SALES' | 'ACCOUNTANT';

export interface UserT {
  id: string;
  name: string;
  username: string;
  pin: string; // 4-6 digits
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface VisitorT {
  id: string;
  visitorCode: string;
  name: string;
  phone?: string;
  createdAt: string;
}

export interface VisitT {
  id: string;
  visitorId: string;
  visitorName?: string;
  visitorPhone?: string;
  visitorCode?: string;
  visitDate: string;
  request?: string;
  notes?: string;
  createdById?: string;
  createdByName?: string;
  createdAt: string;
}

export interface CustomerT {
  id: string;
  customerCode: string;
  visitorId: string;
  nationalId?: string;
  name: string;
  phone?: string;
  phone2?: string;
  address?: string;
  createdAt: string;
}

export type VillaType = 'CONNECTED' | 'SEMI_DETACHED';
export type LotStatus = 'EMPTY' | 'SEMI_FINISHED' | 'READY';

export interface LotT {
  id: string;
  lotNumber: string;
  titleDeed?: string;
  villaType: VillaType;
  lotArea: number;
  gardenArea: number;
  groundFloorArea: number;
  totalBuiltArea: number;
  status: LotStatus;
  priceEmpty: number;
  priceSemiFinished: number;
  priceReady: number;
  createdAt: string;
}

export type PaymentMethod = 'CASH' | 'CHECK' | 'TRANSFER' | 'CARD';

export interface SaleT {
  id: string;
  saleDate: string;
  customerId: string;
  customerName?: string;
  customerCode?: string;
  lotId: string;
  lotNumber?: string;
  salePrice: number;
  contractPdf?: string;
  notes?: string;
  createdById?: string;
  createdByName?: string;
  createdAt: string;
}

export interface PaymentT {
  id: string;
  saleId: string;
  saleInfo?: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdById?: string;
  createdByName?: string;
  createdAt: string;
}

// ============= Demo Store (في الذاكرة) =============
class MemoryStore {
  users: UserT[] = [];
  visitors: VisitorT[] = [];
  visits: VisitT[] = [];
  customers: CustomerT[] = [];
  lots: LotT[] = [];
  sales: SaleT[] = [];
  payments: PaymentT[] = [];

  constructor() {
    // مستخدم افتراضي: admin / PIN 1234
    this.users.push({
      id: 'u-admin',
      name: 'المدير العام',
      username: 'admin',
      pin: '1234',
      role: 'ADMIN',
      active: true,
      createdAt: new Date().toISOString(),
    });
    this.users.push({
      id: 'u-sales',
      name: 'موظف المبيعات',
      username: 'sales',
      pin: '2345',
      role: 'SALES',
      active: true,
      createdAt: new Date().toISOString(),
    });
    this.users.push({
      id: 'u-acc',
      name: 'المحاسب',
      username: 'accountant',
      pin: '3456',
      role: 'ACCOUNTANT',
      active: true,
      createdAt: new Date().toISOString(),
    });
  }
}

const memStore = new MemoryStore();

// ============= عدّادات تلقائية =============
async function nextCode(collection: 'visitors' | 'customers'): Promise<string> {
  const prefix = collection === 'visitors' ? 'VIS' : 'CUS';
  const items = await getAll(collection);
  const max = items.reduce((m, x) => {
    const n = parseInt((x.visitorCode || x.customerCode || '').split('-')[1] || '0', 10);
    return n > m ? n : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(6, '0')}`;
}

// ============= API الموحد =============
type CollectionName = 'users' | 'visitors' | 'visits' | 'customers' | 'lots' | 'sales' | 'payments';

async function getAll(name: CollectionName): Promise<any[]> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(collection(db, name));
    const arr = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    arr.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    return arr;
  }
  return (memStore as any)[name] as any[];
}

async function getById(name: CollectionName, id: string): Promise<any | null> {
  if (isFirebaseConfigured && db) {
    const snap = await getDoc(doc(db!, name, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  }
  const arr = (memStore as any)[name] as any[];
  return arr.find(x => x.id === id) || null;
}

async function create(name: CollectionName, data: any): Promise<any> {
  const id = isFirebaseConfigured && db
    ? (await addDoc(collection(db!, name), data)).id
    : `local-${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (!isFirebaseConfigured || !db) {
    (memStore as any)[name].push({ id, ...data });
  }
  return { id, ...data };
}

async function update(name: CollectionName, id: string, data: any): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db!, name, id), data);
  }
  const arr = (memStore as any)[name] as any[];
  const idx = arr.findIndex(x => x.id === id);
  if (idx >= 0) arr[idx] = { ...arr[idx], ...data };
}

async function remove(name: CollectionName, id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db!, name, id));
  }
  const arr = (memStore as any)[name] as any[];
  const idx = arr.findIndex(x => x.id === id);
  if (idx >= 0) arr.splice(idx, 1);
}

// ============= الواجهات المتخصصة =============

// --- المستخدمون ---
export const Users = {
  async findByPin(pin: string, username?: string): Promise<UserT | null> {
    const all = await getAll('users');
    const u = all.find(x => x.pin === pin && x.active && (!username || x.username === username));
    return u || null;
  },
  async findByUsername(username: string): Promise<UserT | null> {
    const all = await getAll('users');
    return all.find(x => x.username === username) || null;
  },
  async list(): Promise<UserT[]> { return getAll('users'); },
  async create(data: Partial<UserT>): Promise<UserT> {
    return create('users', {
      name: data.name || '',
      username: data.username || '',
      pin: data.pin || '0000',
      role: data.role || 'SALES',
      active: data.active ?? true,
      createdAt: new Date().toISOString(),
    });
  },
  async update(id: string, data: Partial<UserT>): Promise<void> { return update('users', id, data); },
  async delete(id: string): Promise<void> { return remove('users', id); },
};

// --- الزوار ---
export const Visitors = {
  async list(): Promise<VisitorT[]> { return getAll('visitors'); },
  async get(id: string): Promise<VisitorT | null> { return getById('visitors', id); },
  async create(data: Partial<VisitorT>): Promise<VisitorT> {
    const visitorCode = data.visitorCode || await nextCode('visitors');
    return create('visitors', {
      visitorCode,
      name: data.name || '',
      phone: data.phone || '',
      createdAt: new Date().toISOString(),
    });
  },
  async update(id: string, data: Partial<VisitorT>): Promise<void> { return update('visitors', id, data); },
  async delete(id: string): Promise<void> {
    // حذف الزيارات المرتبطة
    const visits = await Visits.list();
    for (const v of visits) {
      if (v.visitorId === id) await Visits.delete(v.id);
    }
    // التحقق من وجود زبون مرتبط
    const customers = await Customers.list();
    if (customers.some(c => c.visitorId === id)) {
      throw new Error('لا يمكن حذف الزائر، تم تحويله إلى زبون');
    }
    return remove('visitors', id);
  },
};

// --- الزيارات ---
export const Visits = {
  async list(): Promise<VisitT[]> { return getAll('visits'); },
  async create(data: Partial<VisitT>): Promise<VisitT> {
    const visitor = data.visitorId ? await Visitors.get(data.visitorId) : null;
    return create('visits', {
      visitorId: data.visitorId || '',
      visitorName: visitor?.name || data.visitorName || '',
      visitorPhone: visitor?.phone || data.visitorPhone || '',
      visitorCode: visitor?.visitorCode || data.visitorCode || '',
      visitDate: data.visitDate || new Date().toISOString(),
      request: data.request || '',
      notes: data.notes || '',
      createdById: data.createdById || '',
      createdByName: data.createdByName || '',
      createdAt: new Date().toISOString(),
    });
  },
  async update(id: string, data: Partial<VisitT>): Promise<void> { return update('visits', id, data); },
  async delete(id: string): Promise<void> { return remove('visits', id); },
};

// --- الزبناء ---
export const Customers = {
  async list(): Promise<CustomerT[]> { return getAll('customers'); },
  async get(id: string): Promise<CustomerT | null> { return getById('customers', id); },
  async createFromVisitor(visitorId: string, extra?: Partial<CustomerT>): Promise<CustomerT> {
    const visitor = await Visitors.get(visitorId);
    if (!visitor) throw new Error('الزائر غير موجود');
    // التحقق إن لم يكن محولاً مسبقاً
    const existing = (await getAll('customers')).find(c => c.visitorId === visitorId);
    if (existing) throw new Error('هذا الزائر محوّل إلى زبون مسبقاً');
    const customerCode = await nextCode('customers');
    return create('customers', {
      customerCode,
      visitorId,
      nationalId: extra?.nationalId || '',
      name: extra?.name || visitor.name,
      phone: extra?.phone || visitor.phone || '',
      phone2: extra?.phone2 || '',
      address: extra?.address || '',
      createdAt: new Date().toISOString(),
    });
  },
  async update(id: string, data: Partial<CustomerT>): Promise<void> { return update('customers', id, data); },
  async delete(id: string): Promise<void> {
    const sales = await Sales.list();
    if (sales.some(s => s.customerId === id)) {
      throw new Error('لا يمكن حذف الزبون، لديه عمليات بيع');
    }
    return remove('customers', id);
  },
};

// --- البقع ---
export const Lots = {
  async list(): Promise<LotT[]> { return getAll('lots'); },
  async get(id: string): Promise<LotT | null> { return getById('lots', id); },
  async create(data: Partial<LotT>): Promise<LotT> {
    const existing = (await getAll('lots')).find(l => l.lotNumber === data.lotNumber);
    if (existing) throw new Error('رقم البقعة موجود مسبقاً');
    return create('lots', {
      lotNumber: data.lotNumber || '',
      titleDeed: data.titleDeed || '',
      villaType: data.villaType || 'CONNECTED',
      lotArea: Number(data.lotArea) || 0,
      gardenArea: Number(data.gardenArea) || 0,
      groundFloorArea: Number(data.groundFloorArea) || 0,
      totalBuiltArea: Number(data.totalBuiltArea) || 0,
      status: data.status || 'EMPTY',
      priceEmpty: Number(data.priceEmpty) || 0,
      priceSemiFinished: Number(data.priceSemiFinished) || 0,
      priceReady: Number(data.priceReady) || 0,
      createdAt: new Date().toISOString(),
    });
  },
  async update(id: string, data: Partial<LotT>): Promise<void> { return update('lots', id, data); },
  async delete(id: string): Promise<void> {
    const sales = await Sales.list();
    if (sales.some(s => s.lotId === id)) {
      throw new Error('لا يمكن حذف البقعة، تم بيعها');
    }
    return remove('lots', id);
  },
  // السعر الحالي حسب الحالة
  currentPrice(lot: LotT): number {
    if (lot.status === 'READY') return lot.priceReady;
    if (lot.status === 'SEMI_FINISHED') return lot.priceSemiFinished;
    return lot.priceEmpty;
  },
  // حالة التوفّر محسوبة من المبيعات
  async availability(lotId: string): Promise<'AVAILABLE' | 'SOLD'> {
    const sales = await getAll('sales');
    return sales.some((s: any) => s.lotId === lotId) ? 'SOLD' : 'AVAILABLE';
  },
};

// --- المبيعات ---
export const Sales = {
  async list(): Promise<SaleT[]> { return getAll('sales'); },
  async get(id: string): Promise<SaleT | null> { return getById('sales', id); },
  async create(data: Partial<SaleT>): Promise<SaleT> {
    const customer = data.customerId ? await Customers.get(data.customerId) : null;
    const lot = data.lotId ? await Lots.get(data.lotId) : null;
    // التحقق من عدم البيع المسبق للبقعة
    const sales = await getAll('sales');
    if (sales.some((s: any) => s.lotId === data.lotId)) {
      throw new Error('هذه البقعة مبيعة مسبقاً');
    }
    return create('sales', {
      saleDate: data.saleDate || new Date().toISOString(),
      customerId: data.customerId || '',
      customerName: customer?.name || '',
      customerCode: customer?.customerCode || '',
      lotId: data.lotId || '',
      lotNumber: lot?.lotNumber || '',
      salePrice: Number(data.salePrice) || 0,
      contractPdf: data.contractPdf || '',
      notes: data.notes || '',
      createdById: data.createdById || '',
      createdByName: data.createdByName || '',
      createdAt: new Date().toISOString(),
    });
  },
  async update(id: string, data: Partial<SaleT>): Promise<void> { return update('sales', id, data); },
  async delete(id: string): Promise<void> {
    // حذف الدفعات المرتبطة
    const payments = await Payments.list();
    for (const p of payments) {
      if (p.saleId === id) await Payments.delete(p.id);
    }
    return remove('sales', id);
  },
  // ملخص مالي للعملية
  async summary(saleId: string) {
    const sale = await Sales.get(saleId);
    if (!sale) return null;
    const payments = (await Payments.list()).filter(p => p.saleId === saleId);
    const paid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = sale.salePrice - paid;
    const percent = sale.salePrice > 0 ? (paid / sale.salePrice) * 100 : 0;
    return { sale, payments, paid, remaining, percent };
  },
};

// --- الدفعات ---
export const Payments = {
  async list(): Promise<PaymentT[]> { return getAll('payments'); },
  async create(data: Partial<PaymentT>): Promise<PaymentT> {
    const sale = data.saleId ? await Sales.get(data.saleId) : null;
    return create('payments', {
      saleId: data.saleId || '',
      saleInfo: sale ? `${sale.lotNumber} - ${sale.customerName}` : '',
      paymentDate: data.paymentDate || new Date().toISOString(),
      amount: Number(data.amount) || 0,
      paymentMethod: data.paymentMethod || 'CASH',
      notes: data.notes || '',
      createdById: data.createdById || '',
      createdByName: data.createdByName || '',
      createdAt: new Date().toISOString(),
    });
  },
  async update(id: string, data: Partial<PaymentT>): Promise<void> { return update('payments', id, data); },
  async delete(id: string): Promise<void> { return remove('payments', id); },
};

// --- البحث الموحد ---
export const Search = {
  async search(q: string) {
    const term = q.trim().toLowerCase();
    if (!term) return { visitors: [], visits: [], customers: [], lots: [], sales: [], payments: [] };

    const [visitors, visits, customers, lots, sales, payments] = await Promise.all([
      Visitors.list(), Visits.list(), Customers.list(),
      Lots.list(), Sales.list(), Payments.list(),
    ]);

    return {
      visitors: visitors.filter(v =>
        v.name.toLowerCase().includes(term) ||
        (v.phone || '').includes(term) ||
        v.visitorCode.toLowerCase().includes(term)
      ),
      visits: visits.filter(v =>
        (v.visitorName || '').toLowerCase().includes(term) ||
        (v.request || '').toLowerCase().includes(term) ||
        (v.notes || '').toLowerCase().includes(term) ||
        (v.visitorCode || '').toLowerCase().includes(term)
      ),
      customers: customers.filter(c =>
        c.name.toLowerCase().includes(term) ||
        (c.phone || '').includes(term) ||
        (c.phone2 || '').includes(term) ||
        (c.nationalId || '').includes(term) ||
        c.customerCode.toLowerCase().includes(term)
      ),
      lots: lots.filter(l =>
        l.lotNumber.toLowerCase().includes(term) ||
        (l.titleDeed || '').toLowerCase().includes(term)
      ),
      sales: sales.filter(s =>
        (s.customerName || '').toLowerCase().includes(term) ||
        (s.lotNumber || '').toLowerCase().includes(term) ||
        (s.customerCode || '').toLowerCase().includes(term)
      ),
      payments: payments.filter(p =>
        (p.saleInfo || '').toLowerCase().includes(term) ||
        (p.notes || '').toLowerCase().includes(term)
      ),
    };
  },
};

// --- إحصائيات لوحة التحكم ---
export const Dashboard = {
  async stats() {
    const [visitors, customers, lots, sales, payments] = await Promise.all([
      Visitors.list(), Customers.list(), Lots.list(),
      Sales.list(), Payments.list(),
    ]);

    const soldLotIds = new Set(sales.map(s => s.lotId));
    const soldCount = lots.filter(l => soldLotIds.has(l.id)).length;
    const availableCount = lots.length - soldCount;

    const totalSales = sales.reduce((s, x) => s + x.salePrice, 0);
    const totalCollected = payments.reduce((s, x) => s + x.amount, 0);
    const totalRemaining = totalSales - totalCollected;

    return {
      visitorsCount: visitors.length,
      customersCount: customers.length,
      lotsCount: lots.length,
      soldCount,
      availableCount,
      totalSales,
      totalCollected,
      totalRemaining,
    };
  },
};

// --- النسخ الاحتياطي ---
export const Backup = {
  async exportAll() {
    const [users, visitors, visits, customers, lots, sales, payments] = await Promise.all([
      Users.list(), Visitors.list(), Visits.list(), Customers.list(),
      Lots.list(), Sales.list(), Payments.list(),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      version: 1,
      data: { users, visitors, visits, customers, lots, sales, payments },
    };
  },
};
