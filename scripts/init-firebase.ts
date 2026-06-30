// scripts/init-firebase.ts
// اختبار الاتصال بـ Firebase وإضافة المستخدمين الافتراضيين

import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, doc, setDoc, getDocs
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('🔥 Testing Firebase connection...');
console.log('   Project:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedUsers() {
  console.log('\n📋 Checking existing users...');
  const snap = await getDocs(collection(db, 'users'));
  console.log('   Found:', snap.size, 'users');

  if (snap.size > 0) {
    console.log('   Users already exist:');
    snap.forEach(d => {
      const data = d.data();
      console.log(`   - ${data.username} (${data.role}) — ${data.name}`);
    });
    return;
  }

  console.log('\n🌱 Seeding default users...');
  const now = new Date().toISOString();
  const defaultUsers = [
    { id: 'u-admin', name: 'المدير العام', username: 'admin', pin: '1234', role: 'ADMIN', active: true, createdAt: now },
    { id: 'u-sales', name: 'موظف المبيعات', username: 'sales', pin: '2345', role: 'SALES', active: true, createdAt: now },
    { id: 'u-acc', name: 'المحاسب', username: 'accountant', pin: '3456', role: 'ACCOUNTANT', active: true, createdAt: now },
  ];

  for (const u of defaultUsers) {
    await setDoc(doc(db, 'users', u.id), u);
    console.log(`   ✓ Created: ${u.username} / ${u.pin} (${u.role})`);
  }

  console.log('\n✅ Done! Default users created successfully.');
}

seedUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Error:', err.message);
    console.error('\nFull error:', err);
    process.exit(1);
  });
