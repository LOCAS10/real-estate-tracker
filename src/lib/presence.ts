// lib/presence.ts
// تتبع المستخدمين المتصلين حالياً عبر Firebase Realtime Database

import { ref, onDisconnect, set, serverTimestamp } from 'firebase/database';
import { rtdb } from './firebase';
import type { UserT } from './data-store';

export function trackPresence(user: UserT) {
  if (!rtdb || !user?.id) return;

  const userRef = ref(rtdb, `online/${user.id}`);

  set(userRef, {
    name: user.name,
    email: user.email,
    role: user.role,
    lastSeen: serverTimestamp(),
  });

  onDisconnect(userRef).remove();
}
