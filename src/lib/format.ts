// lib/format.ts
// أدوات تنسيق

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('ar-MA').format(n || 0);
}

export function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('ar-MA', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date(iso));
  } catch { return iso; }
}

export function formatDateTime(iso: string): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('ar-MA', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch { return iso; }
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'مدير',
  SALES: 'موظف مبيعات',
  ACCOUNTANT: 'محاسب',
};

export const VILLA_TYPE_LABELS: Record<string, string> = {
  CONNECTED: 'متلاصقة',
  SEMI_DETACHED: 'شبه مستقلة',
};

export const LOT_STATUS_LABELS: Record<string, string> = {
  EMPTY: 'فارغة',
  SEMI_FINISHED: 'شبه جاهزة',
  READY: 'جاهزة',
};

export const AVAILABILITY_LABELS: Record<string, string> = {
  AVAILABLE: 'متوفرة',
  RESERVED: 'محجوزة',
  SOLD: 'مباعة',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'نقداً',
  CHECK: 'شيك',
  TRANSFER: 'تحويل بنكي',
  CARD: 'بطاقة',
};
