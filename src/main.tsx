import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
// استيراد ملفات التنسيق الأساسية للمشروع
import './styles/index.css';
import './styles/fonts.css';
import './styles/tailwind.css';
import './styles/theme.css';
import './styles/modals.css';

/**
 * ErrorBoundary: مكون لمعالجة الأخطاء البرمجية المفاجئة في بيئة الإنتاج.
 * يمنع انهيار التطبيق بالكامل ويظهر واجهة مستخدم بديلة (Fallback UI).
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage?: string; errorStack?: string; componentStack?: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: undefined, errorStack: undefined, componentStack: undefined };
  }

  // تحديث الحالة عند حدوث خطأ لإظهار واجهة الطوارئ
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // تسجيل تفاصيل الخطأ في وحدة التحكم (Console) للتشخيص
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    const errorMessage = error?.message || String(error);
    const errorStack = error?.stack;
    const componentStack = errorInfo?.componentStack;

    this.setState({ errorMessage, errorStack, componentStack });

    try {
      const payload = {
        at: new Date().toISOString(),
        message: errorMessage,
        stack: errorStack,
        componentStack,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      };
      localStorage.setItem('reputa:last_error', JSON.stringify(payload));
    } catch {
      // ignore
    }
  }

  render() {
    if (this.state.hasError) {
      const diagnostics = [
        this.state.errorMessage ? `Message: ${this.state.errorMessage}` : '',
        this.state.errorStack ? `\nStack:\n${this.state.errorStack}` : '',
        this.state.componentStack ? `\nComponentStack:\n${this.state.componentStack}` : '',
      ].filter(Boolean).join('\n');

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              Please refresh the page or try again later.
            </p>
            {!!diagnostics && (
              <div className="mx-auto mb-6 max-w-2xl text-left">
                <div className="text-[11px] leading-relaxed whitespace-pre-wrap p-4 rounded-lg border border-gray-200 bg-white text-gray-800 max-h-[45vh] overflow-auto">
                  {diagnostics}
                </div>
                <div className="mt-3 flex items-center justify-center gap-3">
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(diagnostics);
                      } catch {
                        try {
                          const ta = document.createElement('textarea');
                          ta.value = diagnostics;
                          document.body.appendChild(ta);
                          ta.select();
                          document.execCommand('copy');
                          document.body.removeChild(ta);
                        } catch {
                          // ignore
                        }
                      }
                    }}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                  >
                    Copy Error Details
                  </button>
                </div>
              </div>
            )}
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
  </React.StrictMode>
);
