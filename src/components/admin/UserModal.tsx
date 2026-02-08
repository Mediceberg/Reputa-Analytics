'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface User {
  id: string;
  uid: string;
  username: string;
  reputation_score: number;
  wallet_address: string;
  vip_status: boolean;
  joined_date: string;
  app_score: number;
  email: string;
}

interface UserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserModal({ user, isOpen, onClose }: UserModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!user) return null;

  const getScoreBadgeColor = (score: number) => {
    if (score > 80) return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300';
    if (score > 40) return 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300';
    return 'bg-gray-500/20 border-gray-500/50 text-gray-300';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* خلفية خافتة */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* الـ Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50"
          >
            <div className="bg-slate-900/95 border border-emerald-500/30 rounded-xl backdrop-blur-xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-emerald-500/20">
                <h2 className="text-2xl font-bold text-emerald-300">تفاصيل المستخدم</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <X className="text-red-400" size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* نقاط السمعة */}
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">نقاط السمعة الإجمالية</p>
                  <div className={`inline-block border rounded-lg px-6 py-3 ${getScoreBadgeColor(user.reputation_score)}`}>
                    <p className="text-3xl font-bold">{user.reputation_score}</p>
                  </div>
                </div>

                {/* البيانات الأساسية */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailField
                    label="اسم المستخدم"
                    value={user.username}
                    copiable={false}
                  />
                  <DetailField
                    label="البريد الإلكتروني"
                    value={user.email}
                    copiable={true}
                    onCopy={() => handleCopy(user.email, 'email')}
                    copied={copiedField === 'email'}
                  />
                  <DetailField
                    label="UID الكامل"
                    value={user.uid}
                    copiable={true}
                    onCopy={() => handleCopy(user.uid, 'uid')}
                    copied={copiedField === 'uid'}
                  />
                  <DetailField
                    label="حالة VIP"
                    value={user.vip_status ? '✅ نعم' : '❌ لا'}
                    copiable={false}
                  />
                </div>

                {/* عنوان المحفظة */}
                <div className="bg-slate-800/50 border border-cyan-500/20 rounded-lg p-4">
                  <p className="text-cyan-300 text-sm mb-2">عنوان المحفظة الكامل</p>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-300 font-mono text-sm break-all">
                      {user.wallet_address}
                    </p>
                    <button
                      onClick={() => handleCopy(user.wallet_address, 'wallet')}
                      className="ml-2 p-2 hover:bg-cyan-500/20 rounded transition-colors"
                    >
                      {copiedField === 'wallet' ? (
                        <Check size={18} className="text-emerald-400" />
                      ) : (
                        <Copy size={18} className="text-cyan-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* إحصائيات إضافية */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <p className="text-purple-300 text-sm mb-1">سكور التطبيق</p>
                    <p className="text-2xl font-bold text-purple-200">{user.app_score}</p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-blue-300 text-sm mb-1">تاريخ الانضمام</p>
                    <p className="text-sm font-mono text-blue-200">
                      {new Date(user.joined_date).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-center text-gray-500 text-xs pt-4 border-t border-gray-700">
                  <p>{new Date(user.joined_date).toLocaleString('ar-SA')}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-emerald-500/20">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-700/50 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface DetailFieldProps {
  label: string;
  value: string;
  copiable?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}

function DetailField({
  label,
  value,
  copiable = false,
  onCopy,
  copied = false,
}: DetailFieldProps) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      <div className="flex items-center justify-between">
        <p className="text-gray-300 font-medium break-all">{value}</p>
        {copiable && (
          <button
            onClick={onCopy}
            className="ml-2 p-2 hover:bg-emerald-500/20 rounded transition-colors"
          >
            {copied ? (
              <Check size={18} className="text-emerald-400" />
            ) : (
              <Copy size={18} className="text-gray-400 hover:text-emerald-400" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
