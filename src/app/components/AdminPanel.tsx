import { useState } from 'react';

export function AdminPanel() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const triggerAppPayment = async () => {
    if (!address.startsWith('G') || address.length !== 56) {
      alert("الرجاء إدخال عنوان محفظة Pi صحيح");
      return;
    }

    setLoading(true);
    setResult('جاري التنفيذ من السيرفر...');

    try {
      const response = await fetch('/api/admin-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientAddress: address })
      });

      const data = await response.json();

      if (data.success) {
        setResult(`✅ نجاح! رقم المعاملة: ${data.txid}`);
        setAddress(''); // مسح الحقل لإدخال العنوان التالي
      } else {
        setResult(`❌ خطأ: ${data.error}`);
      }
    } catch (err) {
      setResult('❌ فشل الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-2xl border-2 border-purple-500">
      <h2 className="text-2xl font-bold text-purple-700 mb-4 text-center">App-to-User Sender</h2>
      <p className="text-sm text-gray-500 mb-6 text-center">هذه العمليات تخرج من محفظة التطبيق مباشرة</p>
      
      <div className="space-y-4">
        <input 
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value.toUpperCase().trim())}
          placeholder="أدخل عنوان المستلم (G...)"
          className="w-full p-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-400 outline-none"
        />
        
        <button 
          onClick={triggerAppPayment}
          disabled={loading}
          className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
            loading ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {loading ? 'جاري الإرسال...' : 'إرسال 0.1 Pi من التطبيق'}
        </button>

        {result && (
          <div className={`p-3 rounded text-xs break-all ${result.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
