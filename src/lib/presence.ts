// lib/presence.ts
// تتبع المستخدمين المتصلين حالياً عبر Firebase Realtime Database

import { ref, onDisconnect, set, serverTimestamp } from 'firebase/database';
import { rtdb } from './firebase';
import type { UserT } from './data-store';

export function trackPresence(user: UserT) {
  try {
    if (!rtdb || !user?.id) return;

    const userRef = ref(rtdb, `online/${user.id}`);

    const data: Record<string, string | object> = {
      name: user.name,
      username: user.username,
      role: user.role,
      lastSeen: serverTimestamp(),
    };

    // حذف أي قيمة undefined قبل الإرسال
    Object.keys(data).forEach(key => {
      if (data[key] === undefined || data[key] === null) {
        delete data[key];
      }
    });

    set(userRef, data);
    onDisconnect(userRef).remove();
  } catch {
    // تجاهل الأخطاء صامتاً
  }
}
