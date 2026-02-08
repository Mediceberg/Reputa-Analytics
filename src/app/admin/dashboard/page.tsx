'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Zap,
  Award,
  Loader,
} from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { UsersTable } from '@/components/admin/UsersTable';
import { UserModal } from '@/components/admin/UserModal';
import { ChartDistribution } from '@/components/admin/ChartDistribution';

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

interface DashboardData {
  stats: {
    totalPioneers: number;
    totalPayments: number;
    totalTransactions: number;
    averageReputation: number;
    totalUsers: number;
  };
  scoreDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  users: User[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/dashboard');
        if (!response.ok) {
          throw new Error('فشل في جلب البيانات');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-emerald-400"
        >
          <Loader size={48} />
        </motion.div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg font-bold mb-4">❌ {error ?? 'فشل في تحميل البيانات'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 text-emerald-300 rounded-lg"
          >
            إعادة محاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-emerald-500/20 backdrop-blur-xl sticky top-0 z-30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              🎛️ لوحة التحكم الإدارية
            </h1>
            <div className="text-right">
              <p className="text-gray-400">Reputa Score Web3</p>
              <p className="text-emerald-300 text-sm">إدارة المستخدمين والإحصائيات</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* الإحصائيات العليا */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="إجمالي الرواد"
            value={data.stats.totalPioneers}
            icon={Users}
            color="emerald"
            index={0}
          />
          <StatCard
            title="الدفعات الناجحة"
            value={data.stats.totalPayments}
            icon={TrendingUp}
            color="cyan"
            index={1}
          />
          <StatCard
            title="العمليات الكلية"
            value={data.stats.totalTransactions}
            icon={Zap}
            color="blue"
            index={2}
          />
          <StatCard
            title="متوسط السمعة"
            value={data.stats.averageReputation}
            icon={Award}
            color="purple"
            suffix="نقطة"
            index={3}
          />
        </div>

        {/* الرسم البياني والجدول */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* الرسم البياني */}
          <div className="lg:col-span-1">
            <ChartDistribution data={data.scoreDistribution} />
          </div>

          {/* معلومات إضافية */}
          <div className="lg:col-span-2 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="bg-slate-900/50 border border-emerald-500/20 rounded-xl p-6 backdrop-blur-sm">
                <p className="text-emerald-300 text-sm font-medium mb-2">إجمالي المستخدمين</p>
                <p className="text-3xl font-bold text-emerald-200">{data.stats.totalUsers}</p>
                <p className="text-gray-500 text-xs mt-2">مستخدم نشط</p>
              </div>

              <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 backdrop-blur-sm">
                <p className="text-cyan-300 text-sm font-medium mb-2">نسبة VIP</p>
                <p className="text-3xl font-bold text-cyan-200">
                  {Math.round(
                    (data.users.filter((u) => u.vip_status).length / data.stats.totalUsers) * 100
                  )}
                  %
                </p>
                <p className="text-gray-500 text-xs mt-2">مستخدمين VIP</p>
              </div>
            </motion.div>

            {/* معلومات التوزيع */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 backdrop-blur-sm"
            >
              <h3 className="text-cyan-300 font-medium mb-4">📈 ملخص التوزيع</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">مستخدمين بسكور عالي (>80)</span>
                  <span className="text-emerald-300 font-bold">{data.scoreDistribution.high}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">مستخدمين بسكور متوسط (40-80)</span>
                  <span className="text-cyan-300 font-bold">{data.scoreDistribution.medium}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">مستخدمين بسكور منخفض (<40)</span>
                  <span className="text-gray-300 font-bold">{data.scoreDistribution.low}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* جدول المستخدمين */}
        <UsersTable users={data.users} onUserClick={handleUserClick} />
      </main>

      {/* User Modal */}
      <UserModal
        user={selectedUser}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
      />

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="border-t border-emerald-500/20 mt-12 py-6 text-center text-gray-500 text-sm"
      >
        <p>Reputa Score Web3 Admin Dashboard © 2026</p>
        <p className="text-xs mt-2">آخر تحديث: {new Date().toLocaleString('ar-SA')}</p>
      </motion.footer>
    </div>
  );
}
