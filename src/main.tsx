import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { SpeedInsights } from '@vercel/speed-insights/react';
// استيراد ملفات التنسيق الأساسية للمشروع
import './styles/index.css';
import './styles/fonts.css';
import './styles/tailwind.css';
import './styles/theme.css';

/**
 * ErrorBoundary: مكون لمعالجة الأخطاء البرمجية المفاجئة في بيئة الإنتاج.
 * يمنع انهيار التطبيق بالكامل ويظهر واجهة مستخدم بديلة (Fallback UI).
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  // تحديث الحالة عند حدوث خطأ لإظهار واجهة الطوارئ
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // تسجيل تفاصيل الخطأ في وحدة التحكم (Console) للتشخيص
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * تهيئة تطبيق React وربطه بالعنصر الأساسي في ملف HTML (index.html).
 */
const rootElement = document.getElementById('root');

// التحقق من وجود العنصر الجذري لضمان عدم حدوث خطأ عند محاولة العرض (Rendering)
if (!rootElement) {
  throw new Error('Root element not found: Ensure index.html has an element with id="root"');
}

// إنشاء جذر التطبيق وبدء عملية العرض
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <SpeedInsights />
  </React.StrictMode>
);
