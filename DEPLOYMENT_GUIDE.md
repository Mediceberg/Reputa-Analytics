# 🚀 Reputa Score - دليل النشر على Vercel

## 📋 قائمة التحقق السريعة

قبل النشر، تأكد من:
- ✅ تم وضع الشعار في `/src/assets/logo.svg`
- ✅ تم تثبيت جميع الـ dependencies: `npm install`
- ✅ يعمل المشروع محلياً: `npm run dev`
- ✅ البناء ينجح بدون أخطاء: `npm run build`

---

## 📁 الهيكل المطلوب للملفات

```
reputa-analytics/
├── src/
│   ├── assets/
│   │   └── logo.svg              ← 🎨 ضع الشعار هنا
│   ├── app/
│   │   ├── App.tsx               ← ✅ محدث بالمسارات الصحيحة
│   │   └── components/           ← ✅ جميع المكونات محدثة
│   └── styles/
├── public/
│   └── favicon.ico               ← أيقونة التطبيق
├── package.json
├── vite.config.ts                ← ✅ محسّن للإنتاج
├── vercel.json                   ← ✅ تم الإنشاء
└── README.md
```

---

## 🔧 إعداد المشروع للنشر

### 1. التأكد من صحة الملفات

```bash
# تحقق من وجود الشعار
ls src/assets/logo.svg

# إذا لم يكن موجوداً، الشعار الحالي SVG جاهز
# أو استبدله بشعارك الخاص (PNG/SVG)
```

### 2. تنظيف وبناء المشروع

```bash
# حذف build السابق
rm -rf dist node_modules

# تثبيت الـ dependencies
npm install

# بناء المشروع
npm run build

# معاينة النسخة المبنية
npm run preview
```

إذا فشل البناء، تحقق من:
- ✅ جميع الـ imports صحيحة
- ✅ لا توجد أخطاء TypeScript
- ✅ الصور موجودة في المسارات الصحيحة

---

## 🌐 النشر على Vercel - خطوة بخطوة

### المرحلة 1: رفع الكود على GitHub

```bash
# 1. إنشاء repository جديد على GitHub
# اذهب إلى: https://github.com/new

# 2. في مجلد المشروع، قم بـ:
git init
git add .
git commit -m "Initial commit - Reputa Score v2.5"
git branch -M main

# 3. ربط المشروع بـ GitHub (استبدل YOUR_USERNAME و YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

### المرحلة 2: ربط Vercel بـ GitHub

#### الطريقة الأولى: من Vercel Dashboard

1. **التسجيل/تسجيل الدخول**
   - اذهب إلى: https://vercel.com
   - سجل دخول بحساب GitHub

2. **إنشاء مشروع جديد**
   - اضغط "New Project"
   - اختر "Import Git Repository"
   - اختر repository الخاص بك

3. **إعدادات البناء**
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Deploy**
   - اضغط "Deploy"
   - انتظر اكتمال البناء (2-3 دقائق)
   - احصل على الرابط: `https://your-app.vercel.app`

---

#### الطريقة الثانية: من Command Line (CLI)

```bash
# 1. تثبيت Vercel CLI
npm install -g vercel

# 2. تسجيل الدخول
vercel login

# 3. النشر
vercel

# 4. للنشر على Production
vercel --prod
```

---

## 🔄 النشر التلقائي

بعد الربط الأول، أي تحديث تقوم به سيُنشر تلقائياً:

```bash
# قم بتعديلات على الكود
# ثم:

git add .
git commit -m "Updated feature X"
git push

# Vercel سيبني وينشر تلقائياً! 🎉
```

---

## 🎨 تخصيص الشعار

### استخدام شعارك الخاص

```bash
# 1. ضع شعارك في:
src/assets/logo.svg  # أو logo.png

# 2. إذا غيرت الاسم، حدّث الـ imports في:
# - src/app/App.tsx
# - src/app/components/WalletChecker.tsx
# - src/app/components/AuditReport.tsx

# مثال:
# import logoImage from '../../assets/my-custom-logo.svg';
```

---

## 🐛 حل المشاكل الشائعة

### مشكلة: الصور لا تظهر بعد النشر

**السبب**: مسارات خاطئة أو استخدام `figma:asset/`

**الحل**:
```typescript
// ❌ خطأ
import logo from 'figma:asset/...'
import logo from '/assets/logo.svg'

// ✅ صحيح
import logo from '../assets/logo.svg'
import logo from '../../assets/logo.svg'
```

---

### مشكلة: 404 عند تحديث الصفحة

**السبب**: Vercel لا يعرف أن التطبيق Single Page App

**الحل**: ملف `vercel.json` موجود بالفعل ويحل هذه المشكلة ✅

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

---

### مشكلة: Build فشل على Vercel

**الخطوات**:

1. **تحقق من الـ Build محلياً**
   ```bash
   npm run build
   ```
   إذا فشل، أصلح الأخطاء أولاً

2. **تحقق من Node Version**
   - في Vercel Dashboard → Settings → General
   - Node.js Version: 18.x أو أحدث

3. **تحقق من الـ Dependencies**
   ```bash
   # حذف node_modules وإعادة التثبيت
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## 📊 إعدادات متقدمة (اختياري)

### Environment Variables

إذا كنت تستخدم API keys:

1. اذهب إلى: Vercel Dashboard → Settings → Environment Variables
2. أضف المتغيرات:
   ```
   VITE_PI_API_KEY=your_key_here
   VITE_API_URL=https://api.example.com
   ```

3. استخدمها في الكود:
   ```typescript
   const apiKey = import.meta.env.VITE_PI_API_KEY;
   ```

---

### Custom Domain

1. اذهب إلى: Vercel Dashboard → Settings → Domains
2. اضغط "Add Domain"
3. اتبع التعليمات لربط النطاق الخاص بك

---

## ✅ التحقق من النجاح

بعد النشر، تحقق من:

- ✅ الموقع يفتح على الرابط
- ✅ الشعار يظهر بشكل صحيح
- ✅ يمكنك إدخال عنوان محفظة وتحليله
- ✅ جميع الأزرار تعمل
- ✅ التصميم responsive على الموبايل

---

## 📱 اختبار على Pi Browser

```
1. افتح Pi Browser على الهاتف
2. اذهب إلى: https://your-app.vercel.app
3. جرّب جميع المميزات
4. تأكد أن التصميم يظهر جيداً
```

---

## 🎉 تهانينا!

تطبيقك الآن مباشر على الإنترنت! 🚀

- 🌐 **الرابط**: `https://your-app.vercel.app`
- 📊 **Analytics**: متاح في Vercel Dashboard
- 🔄 **Auto-deploy**: مفعّل على GitHub push

---

## 🆘 الدعم

إذا واجهت أي مشكلة:

1. **تحقق من Vercel Logs**
   - Dashboard → Deployments → Latest Deployment → Logs

2. **راجع الوثائق**
   - [Vite Docs](https://vitejs.dev/)
   - [Vercel Docs](https://vercel.com/docs)

3. **أعد البناء**
   - Dashboard → Deployments → ... → Redeploy

---

**Built with ❤️ for Pi Network**
