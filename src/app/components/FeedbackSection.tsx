import React, { useState } from 'react';

export function FeedbackSection({ username }: { username: string }) {
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('');

  const submitFeedback = async () => {
    if (!feedback.trim()) return;
    setStatus('Sending...');

    try {
      const res = await fetch('/api/save-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          text: feedback,
          timestamp: new Date().toISOString()
        }),
      });

      if (res.ok) {
        setFeedback('');
        setStatus('✅ Thank you, Pioneer!');
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (e) {
      setStatus('❌ Failed to send.');
    }
  };

  return (
    <div className="mt-8 p-4 bg-purple-50 rounded-2xl border border-purple-100">
      <h3 className="text-sm font-black text-purple-700 uppercase mb-2">Pioneer Feedback</h3>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Suggest an improvement..."
        className="w-full p-3 text-xs rounded-xl border-none focus:ring-2 focus:ring-purple-400 min-h-[80px]"
      />
      <button 
        onClick={submitFeedback}
        className="mt-2 w-full py-2 bg-purple-600 text-white text-[10px] font-black uppercase rounded-lg active:scale-95 transition-all"
      >
        {status || 'Send Suggestion'}
      </button>
    </div>
  );
}
