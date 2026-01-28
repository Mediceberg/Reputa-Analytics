import React, { useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';

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
    <div className="mt-8 p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-2xl border border-purple-500/30 backdrop-blur-sm relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-black text-purple-400 uppercase tracking-wide">Pioneer Feedback</h3>
        </div>
        
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Suggest an improvement..."
          className="w-full p-3 text-xs rounded-xl bg-white/5 border border-purple-500/30 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 min-h-[80px] backdrop-blur-sm transition-all resize-none"
        />
        
        <button 
          onClick={submitFeedback}
          className="mt-3 w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {status ? (
            <span>{status}</span>
          ) : (
            <>
              <Send className="w-3 h-3" />
              Send Suggestion
            </>
          )}
        </button>
      </div>
    </div>
  );
}
