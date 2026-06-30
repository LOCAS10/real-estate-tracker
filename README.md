# نظام إدارة البقع العقارية

نظام متكامل لإدارة الزوار، الزبناء، البقع العقارية، المبيعات، والدفعات مع شاشة دخول عبر PIN.

## التقنيات المستخدمة

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes (Serverless)
- **Database**: Firebase Firestore (مع وضع Demo محلي تلقائي)
- **Export**: jsPDF + xlsx
- **Deployment**: Vercel + GitHub
- **Auth**: نظام PIN مخصص (يدعم أدوار: مدير، مبيعات، محاسب)

## الميزات

### 1. شاشة PIN للمصادقة
- اسم المستخدم + PIN (4-6 أرقام)
- لوحة أرقام افتراضية
- حسابات تجريبية:
  - `admin` / `1234` (مدير)
  - `sales` / `2345` (مبيعات)
  - `accountant` / `3456` (محاسب)

### 2. الوحدات
- **الزوار**: كود تلقائي VIS-000001، اسم، هاتف
- **سجل الزيارات**: زائر يمكنه زيارات متعددة، مع الطلب والملاحظات
- **الزبناء**: تحويل زائر → زبون (مع الاحتفاظ بالتاريخ)، كود CUS-000001
- **البقع العقارية**: رقم، رسم عقاري، نوع (متلاصقة/شبه مستقلة)، مساحات، 3 أسعار حسب الحالة (فارغة/شبه جاهزة/جاهزة)
- **المبيعات**: اختيار زبون + بقعة من القائمة، سعر، تاريخ، ملاحظات، عقد PDF
- **الدفعات**: لكل عملية بيع عدد غير محدود من الدفعات، حساب تلقائي للمحصّل والمتبقي والنسبة
- **المستخدمون**: إنشاء/تعديل/حذف، PIN لكل مستخدم، أدوار

### 3. ميزات ذكية
- **السعر الحالي** يُحسب تلقائياً حسب حالة البقعة
- **التوفّر** محسوب من المبيعات (لا يوجد حقل "متوفرة/مباعة" يسبب تعارض)
- **محرك بحث موحد**: بحث واحد يبحث في كل الجداول
- **التقارير**: هذا الشهر، البقع المتوفرة، حسب الحالة، كل المبيعات — مع تصدير PDF و Excel
- **النسخ الاحتياطي**: تنزيل JSON كامل

## النشر

### 1. رفع الكود إلى GitHub
```bash
git init
git add .
git commit -m "Initial commit - Real Estate Lots Management"
git branch -M main
git remote add origin https://github.com/USERNAME/real-estate-lots.git
git push -u origin main
```

### 2. إعداد Firebase
1. اذهب إلى https://console.firebase.google.com
2. أنشئ مشروعاً جديداً (مثل: `real-estate-lots`)
3. فعّل **Firestore Database** (ابدأ في وضع الإنتاج Production mode)
4. من إعدادات المشروع، أضف تطبيق ويب واحصل على الإعدادات (firebaseConfig)
5. في تبويب **Service Accounts**، أنشئ مفتاحاً (لاستخدام Admin SDK إن لزم)

### 3. النشر على Vercel
1. اذهب إلى https://vercel.com وسجّل الدخول بـ GitHub
2. اضغط **Add New Project** واختر المستودع
3. أضف متغيرات البيئة في Vercel:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc...
```

4. اضغط **Deploy** — سيكون التطبيق متاحاً على `https://your-project.vercel.app`

### 4. قواعد أمان Firebase المقترحة
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // للإنتاج: استخدم Firebase Auth وقيّد الكتابة للمستخدمين المسجلين
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## التطوير المحلي

```bash
# تثبيت الاعتمادات
bun install

# تشغيل خادم التطوير
bun run dev

# Lint
bun run lint
```

بدون إعداد Firebase، التطبيق يعمل في **وضع Demo** (بيانات في الذاكرة) — مفيد للتجربة قبل النشر.

## هيكل المشروع

```
src/
├── app/
│   ├── page.tsx                    # الصفحة الرئيسية (PIN screen + App)
│   ├── layout.tsx                  # Layout عربي RTL
│   └── api/
│       ├── auth/route.ts           # تسجيل الدخول بالـ PIN
│       ├── visitors/[id]/route.ts
│       ├── visits/[id]/route.ts
│       ├── customers/[id]/route.ts
│       ├── lots/[id]/route.ts
│       ├── sales/[id]/summary/route.ts
│       ├── payments/[id]/route.ts
│       ├── search/route.ts         # البحث الموحد
│       ├── dashboard/route.ts      # إحصائيات
│       ├── reports/route.ts        # التقارير
│       ├── backup/route.ts         # النسخ الاحتياطي
│       └── users/[id]/route.ts
├── components/
│   ├── pin-screen.tsx              # شاشة PIN
│   ├── app-shell.tsx               # Sidebar + Layout
│   └── views/
│       ├── dashboard-view.tsx
│       ├── visitors-view.tsx
│       ├── visits-view.tsx
│       ├── customers-view.tsx
│       ├── lots-view.tsx
│       ├── sales-view.tsx
│       ├── payments-view.tsx
│       ├── search-view.tsx
│       ├── reports-view.tsx
│       ├── users-view.tsx
│       └── backup-view.tsx
└── lib/
    ├── firebase.ts                 # إعداد Firebase
    ├── data-store.ts               # طبقة البيانات (Firebase/Demo)
    ├── auth-context.tsx            # سياق الجلسة
    ├── format.ts                   # تنسيق العملات/التواريخ
    └── query-provider.tsx
```
