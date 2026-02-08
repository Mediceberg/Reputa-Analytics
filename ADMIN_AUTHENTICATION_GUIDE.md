# 🔐 إضافة المصادقة إلى Admin Dashboard

## 📋 نظرة عامة

هذا الدليل يشرح كيفية إضافة **مصادقة وصلاحيات** إلى لوحة التحكم الإدارية لضمان الوصول الآمن.

---

## 🎯 الخطوات الموصى بها

### 1️⃣ Middleware للتحقق من المسؤول

**الملف**: `middleware.ts` (في جذر المشروع)

```typescript
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // حماية مسار /admin/dashboard
  if (pathname.startsWith('/admin')) {
    // الحصول على الـ token من cookies
    const token = request.cookies.get('admin_token')?.value;

    // إذا لم يكن هناك token، أعد التوجيه إلى تسجيل الدخول
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // التحقق من صحة الـ token
    if (!verifyAdminToken(token)) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

// دالة للتحقق من الـ token
function verifyAdminToken(token: string): boolean {
  try {
    // استخدم JWT أو أي نظام مصادقة آخر
    // مثال بسيط:
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    return decoded.role === 'admin' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}
```

---

### 2️⃣ صفحة تسجيل الدخول

**الملف**: `src/app/admin/login/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Mail } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // تحقق من بيانات المسؤول
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('البريد أو كلمة المرور غير صحيحة');
      }

      const { token } = await response.json();

      // احفظ الـ token في cookies
      document.cookie = `admin_token=${token}; path=/; secure; httponly`;

      // أعد التوجيه إلى لوحة التحكم
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-slate-900/50 border border-emerald-500/30 rounded-xl p-8 backdrop-blur-xl">
          <h1 className="text-3xl font-bold text-emerald-300 text-center mb-8">
            🔐 تسجيل الدخول الإداري
          </h1>

          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* البريد الإلكتروني */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-gray-300 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {/* كلمة المرور */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-gray-300 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {/* زر تسجيل الدخول */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 text-emerald-300 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-xs mt-4">
            تطبيق Reputa Score Admin
          </p>
        </div>
      </motion.div>
    </div>
  );
}
```

---

### 3️⃣ API لتسجيل الدخول

**الملف**: `api/admin/login/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// يجب حفظ بيانات المسؤول بشكل آمن (Hash)
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com', // غيّر هذا
  passwordHash: hashPassword('your-secure-password'), // غيّر هذا
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // تحقق من البريد والكلمة
    if (email !== ADMIN_CREDENTIALS.email) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة' },
        { status: 401 }
      );
    }

    if (!verifyPassword(password, ADMIN_CREDENTIALS.passwordHash)) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة' },
        { status: 401 }
      );
    }

    // أنشئ JWT token
    const token = createtoken({
      email,
      role: 'admin',
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 ساعة
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'خطأ في السيرفر' },
      { status: 500 }
    );
  }
}

// دوال مساعدة
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function createtoken(payload: any): string {
  // استخدم jsonwebtoken library للإنتاج
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}
```

---

### 4️⃣ Logout (تسجيل الخروج)

**أضف زر في Dashboard**:

```typescript
const handleLogout = () => {
  // احذف الـ token
  document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
  
  // أعد التوجيه إلى صفحة تسجيل الدخول
  router.push('/admin/login');
};

// أضف الزر في Header
<button
  onClick={handleLogout}
  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-300 rounded-lg"
>
  تسجيل الخروج
</button>
```

---

## 🛡️ أفضل الممارسات الأمنية

### 1️⃣ استخدام JWT بشكل آمن

```bash
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

```typescript
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET!;

function createtoken(email: string) {
  return jwt.sign(
    { email, role: 'admin' },
    secret,
    { expiresIn: '24h' }
  );
}

function verifytoken(token: string) {
  return jwt.verify(token, secret);
}
```

### 2️⃣ حماية البيانات الحساسة

```bash
# في .env.local
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=... (مُشفّر بـ bcrypt)
JWT_SECRET=your-secret-key-min-32-chars
```

### 3️⃣ استخدام bcrypt

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

```typescript
import bcrypt from 'bcryptjs';

// تشفير كلمة المرور
const hash = await bcrypt.hash(password, 10);

// التحقق من كلمة المرور
const isValid = await bcrypt.compare(password, hash);
```

### 4️⃣ Rate Limiting

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 محاولات في الساعة
});

export async function POST(request: NextRequest) {
  const ip = request.ip ?? 'unknown';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // معالجة الطلب...
}
```

### 5️⃣ Content Security Policy

```typescript
// في middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'"
  );

  return response;
}
```

---

## 🧪 اختبار المصادقة

```typescript
// اختبر تسجيل الدخول
import { describe, it, expect } from 'vitest';

describe('Admin Login', () => {
  it('should login with correct credentials', async () => {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'correct-password',
      }),
    });

    expect(response.status).toBe(200);
    const { token } = await response.json();
    expect(token).toBeDefined();
  });

  it('should reject incorrect credentials', async () => {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'wrong-password',
      }),
    });

    expect(response.status).toBe(401);
  });
});
```

---

## 📁 الملفات المطلوبة

```
.env.local
├── ADMIN_EMAIL
├── ADMIN_PASSWORD_HASH
└── JWT_SECRET

src/app/admin/
├── login/
│   └── page.tsx           ← صفحة تسجيل الدخول
└── dashboard/
    └── page.tsx           ← لوحة التحكم

api/admin/
├── login/
│   └── route.ts           ← API تسجيل الدخول
└── dashboard/
    └── route.ts           ← API لوحة التحكم

middleware.ts             ← حماية المسارات
```

---

## ✨ الخلاصة

**مع هذه الخطوات، لديك**:

✅ تسجيل دخول آمن  
✅ JWT authentication  
✅ معدل محدود للمحاولات  
✅ تشفير كلمات المرور  
✅ حماية المسارات  
✅ تسجيل الخروج  

**لوحة تحكم محمية بالكامل!** 🔐

---

**ملاحظة**: في الإنتاج، استخدم مزود مصادقة متخصص مثل:
- Auth0
- Firebase Authentication
- Supabase Auth
- NextAuth.js
