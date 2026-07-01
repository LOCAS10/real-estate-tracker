// lib/auth-context.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserT } from './data-store';
import { trackPresence } from './presence';

interface SessionState {
  user: UserT | null;
  loading: boolean;
  login: (user: UserT) => void;
  logout: () => void;
}

const AuthContext = createContext<SessionState | undefined>(undefined);

const STORAGE_KEY = 'real-estate-session-v1';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserT | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let parsed: UserT | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        parsed = JSON.parse(raw) as UserT;
      }
    } catch {}
    // استخدام setState داخل microtask لتجنب التحذير
    Promise.resolve().then(() => {
      setUser(parsed && parsed.id ? parsed : null);
      setLoading(false);
      if (parsed && parsed.id) trackPresence(parsed);
    });
  }, []);

  const login = (u: UserT) => {
    setUser(u);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); } catch {}
    trackPresence(u);
  };

  const logout = () => {
    setUser(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
