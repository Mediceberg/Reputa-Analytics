'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';

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

interface UsersTableProps {
  users: User[];
  onUserClick: (user: User) => void;
}

const ITEMS_PER_PAGE = 10;

export function UsersTable({ users, onUserClick }: UsersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof User;
    direction: 'asc' | 'desc';
  }>({
    key: 'reputation_score',
    direction: 'desc',
  });

  // البحث والتصفية
  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.uid.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // الترتيب
  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

    return sorted;
  }, [filteredUsers, sortConfig]);

  // التصفية (Pagination)
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sortedUsers.slice(startIndex, endIndex);
  }, [sortedUsers, currentPage]);

  const totalPages = Math.ceil(sortedUsers.length / ITEMS_PER_PAGE);

  const handleSort = (key: keyof User) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const getScoreBadgeColor = (score: number) => {
    if (score > 80) return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300';
    if (score > 40) return 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300';
    return 'bg-gray-500/20 border-gray-500/50 text-gray-300';
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof User }) => {
    if (sortConfig.key !== columnKey) {
      return <div className="w-4 h-4" />;
    }
    return sortConfig.direction === 'desc' ? (
      <ChevronDown size={16} />
    ) : (
      <ChevronUp size={16} />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-slate-900/50 border border-emerald-500/20 rounded-xl overflow-hidden backdrop-blur-sm"
    >
      {/* شريط البحث */}
      <div className="p-6 border-b border-emerald-500/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="ابحث عن اسم المستخدم، البريد الإلكتروني، أو الـ UID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // العودة للصفحة الأولى عند البحث
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <p className="text-gray-400 text-sm mt-2">
          {filteredUsers.length} من {users.length} مستخدم
        </p>
      </div>

      {/* الجدول */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/50 border-b border-emerald-500/20">
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('username')}
                  className="flex items-center gap-2 text-gray-300 hover:text-emerald-300 transition-colors"
                >
                  اسم المستخدم
                  <SortIcon columnKey="username" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('reputation_score')}
                  className="flex items-center gap-2 text-gray-300 hover:text-emerald-300 transition-colors"
                >
                  نقاط السمعة
                  <SortIcon columnKey="reputation_score" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">المحفظة</th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('vip_status')}
                  className="flex items-center gap-2 text-gray-300 hover:text-emerald-300 transition-colors"
                >
                  VIP
                  <SortIcon columnKey="vip_status" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">تاريخ الانضمام</th>
              <th className="px-6 py-3 text-center">الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user, index) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                onClick={() => onUserClick(user)}
              >
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-300">{user.username}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-block border rounded-lg px-3 py-1 ${getScoreBadgeColor(user.reputation_score)}`}>
                    {user.reputation_score}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs font-mono text-gray-400">
                    {truncateAddress(user.wallet_address)}
                  </p>
                </td>
                <td className="px-6 py-4">
                  {user.vip_status ? (
                    <span className="inline-block bg-purple-500/20 border border-purple-500/50 text-purple-300 px-3 py-1 rounded-lg text-xs font-medium">
                      ✨ VIP
                    </span>
                  ) : (
                    <span className="text-gray-500 text-xs">عادي</span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-400 text-xs">
                  {new Date(user.joined_date).toLocaleDateString('ar-SA')}
                </td>
                <td className="px-6 py-4 text-center">
                  <button className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 text-emerald-300 rounded text-xs transition-colors">
                    اعرض
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* التصفية (Pagination) */}
      <div className="flex items-center justify-between p-6 border-t border-emerald-500/20">
        <div className="text-gray-400 text-sm">
          الصفحة {currentPage} من {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700 text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            السابق
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700 text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            التالي
          </button>
        </div>
      </div>
    </motion.div>
  );
}
