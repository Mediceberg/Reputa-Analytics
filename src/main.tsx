import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App'; // تأكد أن مجلد app يبدأ بحرف صغير كما هو في مشروعك

// استدعاء ملفات التنسيق - تأكد من وجود هذه الملفات في مجلد styles
// إذا كانت العلامة الحمراء تظهر هنا، فقد يكون السبب هو اسم ملف ناقص
import './styles/index.css';
import './styles/fonts.css';
import './styles/tailwind.css';
import './styles/theme.css';

// Error boundary for production
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

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

// Mount React app
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// استخدام متغير rootElement لضمان عدم وجود تضارب أسماء
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
