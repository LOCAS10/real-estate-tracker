// lib/firebase-admin.ts
// Firebase Admin SDK للاستخدام في API routes فقط (server-side)
// يعطي صلاحيات كاملة لتجاوز قواعد Firestore الأمنية

import { initializeApp, getApps, cert, ApplicationOptions } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

let adminApp: any = null;
let adminDb: Firestore | null = null;

function initAdmin() {
  if (adminDb) return adminDb;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin SDK credentials missing. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  }

  if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    adminApp = getApps()[0];
  }

  adminDb = getFirestore(adminApp);
  return adminDb;
}

export function getAdminDb(): Firestore {
  return initAdmin();
}

export const isAdminConfigured = Boolean(projectId && clientEmail && privateKey);
