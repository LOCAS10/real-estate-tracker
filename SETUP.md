# خطوات تشغيل نظام تتبع المشروع على Firebase + GitHub + Vercel

## المتطلبات
- حساب GitHub
- حساب Google (لـ Firebase)
- حساب Vercel (يُسحب من GitHub)

---

## الخطوة 1️⃣: إعداد Firebase Firestore

1. اذهب إلى https://console.firebase.google.com
2. اضغط **"Add project"** → اكتب اسم المشروع (مثل `real-estate-tracker`) → Continue → Create project
3. من القائمة الجانبية، اختر **Firestore Database** → **Create database** → ابدأ في **Production mode** → اختر المنطقة (eu-west أو us-central) → Enable
4. من القائمة الجانبية، اضغط **Project Settings** (⚙️ بجانب Project Overview) → في تبويب **General**، انزل لأسفل إلى **"Your apps"** → اضغط أيقونة الويب `</>`
5. اكتب اسم التطبيق (مثل `tracker-web`) → Register app → ستحصل على كود يحتوي على:
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234:web:abc123"
   };
   ```
   احتفظ بهذه القيم، سنستخدمها لاحقاً

### قواعد الأمان في Firestore
من تبويب **Firestore Database** → **Rules**، الصق:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // للتجربة فقط - غيّرها لاحقاً
    }
  }
}
```
اضغط **Publish**

---

## الخطوة 2️⃣: رفع الكود على GitHub

1. اذهب إلى https://github.com/new
2. Repository name: `real-estate-tracker`
3. اختر **Private** (أو Public حسب رغبتك)
4. **لا تختر** "Add README" أو "Add .gitignore"
5. اضغط **Create repository**

### رفع الملفات محلياً
في الطرفية على جهازك (أو في الـ sandbox):
```bash
cd /home/z/my-project

# تهيئة git
git init
git add .
git commit -m "Initial commit - Real Estate Tracker System"

# اربط بـ GitHub (استبدل USERNAME باسمك)
git remote add origin https://github.com/USERNAME/real-estate-tracker.git
git branch -M main
git push -u origin main
```

---

## الخطوة 3️⃣: النشر على Vercel

1. اذهب إلى https://vercel.com → سجّل الدخول بـ GitHub
2. اضغط **"Add New..."** → **Project**
3. اختر مستودع `real-estate-tracker` → اضغط **Import**
4. في صفحة الإعدادات، اذهب لـ **Environment Variables** وأضف الـ 6 متغيرات من firebaseConfig:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | AIzaSy... (من firebaseConfig) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | your-project.firebaseapp.com |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | your-project |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | your-project.appspot.com |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | 1234567890 |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | 1:1234:web:abc123 |

5. اضغط **Deploy** — Vercel سيبني التطبيق تلقائياً
6. بعد انتهاء النشر، ستحصل على رابط: `https://real-estate-tracker.vercel.app`
7. التطبيق سيستخدم Firebase تلقائياً عند توفّر المفاتيح

---

## الخطوة 4️⃣: الاختبار والتحقق

افتح رابط Vercel في المتصفح:
1. ستظهر شاشة PIN
2. ادخل: `admin` / `1234`
3. ستجد نفسك في لوحة التحكم

### تجربة التدفق الكامل
1. **إضافة زائر**: قائمة الزوار → زائر جديد → اكتب اسماً → حفظ (ستحصل على VIS-000001)
2. **تحويل لزبون**: قائمة الزبناء → تحويل زائر → اختر الزائر → أكمل البيانات → تحويل (CUS-000001)
3. **إضافة بقعة**: البقع العقارية → بقعة جديدة → املأ الرقم والمساحات والأسعار → حفظ
4. **عملية بيع**: المبيعات → عملية بيع جديدة → اختر زبون → اختر بقعة (المتاحة فقط تظهر) → السعر يُملأ تلقائياً → ارفع عقد PDF اختيارياً → تسجيل البيع
5. **الدفعات**: من المبيعات، اضغط 💰 لإضافة دفعة → المحصّل والمتبقي يُحسبان تلقائياً

### ميزة مهمة تم اختبارها ✅
البقعة المبيعة **لا تظهر** في قائمة "اختر البقعة" عند عملية بيع جديدة — يمنع البيع المزدوج.

---

## الخطوة 5️⃣: إدارة المستخدمين (اختياري)

بعد أول دخول كـ admin:
1. اذهب إلى **إدارة المستخدمين**
2. أضف مستخدمين جدد بأدوار مختلفة:
   - **مدير**: يرى كل شيء
   - **موظف مبيعات**: لا يرى الدفعات ولا المستخدمين
   - **محاسب**: يرى الدفعات والتقارير

كل مستخدم يحصل على PIN خاص به.

---

## ملاحظات تقنية

### حول وضع Demo
- بدون إعداد Firebase، التطبيق يعمل في **وضع Demo** مع تخزين JSON محلي في `db/demo-data.json`
- هذا مفيد للتجربة قبل النشر
- عند ضبط مفاتيح Firebase، ينتقل تلقائياً إلى Firestore

### حول تخزين العقود PDF
- العقود تُخزّن كـ Base64 داخل وثيقة Firestore
- الحد الأقصى 10 ميجابايت لكل عقد
- للإنتاج مع ملفات كثيرة، يُنصح بالترحيل إلى **Firebase Storage** وتخزين الرابط فقط في Firestore

### النسخ الاحتياطي
- من تبويب **النسخ الاحتياطي**، يمكن تنزيل كل البيانات كملف JSON
- يمكن استعادتها لاحقاً أو نقلها لمشروع Firebase آخر

---

## استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| شاشة فارغة بعد النشر | تحقق من Vercel Logs — غالباً متغير Firebase ناقص |
| "بيانات الدخول غير صحيحة" | تأكد أن Firestore مُفعّل والقواعد تسمح بالقراءة |
| لا تظهر البيانات | تحقق أن `NEXT_PUBLIC_FIREBASE_PROJECT_ID` صحيح |
| Pin لا يعمل | المستخدمون الافتراضيون (admin/sales/accountant) موجودون في demo mode فقط. في Firebase، يجب إنشاؤهم عبر API أو إضافتهم يدوياً في Firestore |

### إضافة المستخدم الافتراضي في Firebase
افتح Firestore Console → Add document إلى مجموعة `users`:
```
collection: users
document id: (auto)
fields:
  name: "المدير العام"
  username: "admin"
  pin: "1234"
  role: "ADMIN"
  active: true
  createdAt: (timestamp)
```
