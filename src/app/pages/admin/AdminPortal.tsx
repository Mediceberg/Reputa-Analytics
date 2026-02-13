import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Zap,
  Award,
  Loader,
  Shield,
  BarChart3,
  Crown,
  Database,
  Cloud,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface AdminStats {
  totalUniqueUsers: number;
  totalVisits: number;
  totalVipUsers: number;
}

interface User {
  username: string;
  pioneerId?: string;
  email?: string;
  wallets: string[];
  reputationScore: number;
  reputationLevel: number;
  lastActivityDate: Date;
  isVip: boolean;
  lastSeen: Date;
  createdAt: Date;
  sourceTables: string[];
  totalActivity: number;
  visitCount: number;
  sessionCount: number;
}

interface CacheInfo {
  upstashConnected: boolean;
  upstashLatency?: number;
  consolidatedUsers: number;
}

const AdminPortal: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [allRealUsers, setAllRealUsers] = useState<User[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [consolidating, setConsolidating] = useState(false);

  // Real-time polling state
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Pagination state - updated for 50 users per page
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [paginationInfo, setPaginationInfo] = useState<any>(null);
  const [masterStats, setMasterStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const usersPerPage = 50;

  // Calculate total pages from pagination info
  const totalPages = paginationInfo?.totalPages || Math.ceil(totalUsers / usersPerPage);

  const fetchStats = async (adminPassword: string) => {
    setLoadingStats(true);
    try {
      const response = await fetch(`/api/admin-portal/stats`, {
        headers: {
          'x-admin-password': adminPassword
        }
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
        setCacheInfo(data.cache);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchUsers = async (adminPassword: string, page: number = 1, search: string = '') => {
    // Clear old cache
    localStorage.clear();

    // Reset state before fetching new data
    setAllRealUsers([]);

    setLoadingUsers(true);
    console.log('🔍 Starting dual data fetch from MongoDB + Upstash KV...');

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        ...(search && { search })
      });

      const response = await fetch(`/api/admin-portal/users?${params}`, {
        headers: {
          'x-admin-password': adminPassword
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // DEBUG: Log received data
      console.log('FRONTEND RECEIVED DATA:', result);

      if (result.success) {
        // Log data retrieval for debugging
        console.log('📊 Dual fetch results:');
        console.log(`   Checking Mongo: ${result.stats?.mongodbRecords || 0} records`);
        console.log(`   Checking Upstash: ${result.stats?.upstashKeys || 0} keys`);
        console.log(`   Final merged: ${result.pagination?.totalUsers || 0} unique users`);
        console.log(`   Page ${result.pagination?.currentPage || page}: ${result.users?.length || 0} records loaded`);

        // DEBUG ALERT - Show real data count
        window.alert('Real Data Loaded: ' + (result.users?.length || 0) + ' users');

        setAllRealUsers(result.users);
        setTotalUsers(result.pagination.totalUsers);
        // setTotalPages(result.pagination.totalPages); // Removed - we calculate this
        setPaginationInfo(result.pagination);
        setMasterStats(result.stats);
        setCacheInfo(result.cache);

        // Update current page if it changed
        if (result.pagination.currentPage !== currentPage) {
          setCurrentPage(result.pagination.currentPage);
        }

        console.log('✅ Dual fetch completed successfully');
      } else {
        console.error('❌ Dual fetch failed:', result.error);
        throw new Error(result.error || 'Failed to fetch users');
      }

      // FORCE SET USERS - Even if success is false, try to set data
      if (result.users && Array.isArray(result.users)) {
        console.log('🔧 FORCE SETTING USERS:', result.users.length);
        setAllRealUsers(result.users);
        setTotalUsers(result.pagination?.totalUsers || result.users.length);
      }
    } catch (error: any) {
      console.error('❌ Dual fetch error:', error);
      throw error;
    } finally {
      setLoadingUsers(false);
    }
  };

  const consolidateData = async () => {
    if (!password) return;

    setConsolidating(true);
    try {
      const response = await fetch('/api/admin-portal/consolidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        }
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
        // Refresh data after consolidation
        await Promise.all([
          fetchStats(password),
          fetchUsers(password, currentPage, searchTerm)
        ]);
      } else {
        alert(`❌ Consolidation failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Consolidation error:', error);
      alert('❌ Network error during consolidation');
    } finally {
      setConsolidating(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin-portal/stats`, {
        headers: {
          'x-admin-password': password
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        await Promise.all([
          fetchStats(password),
          fetchUsers(password, 1, '')
        ]);
      } else {
        alert(`Authentication failed: ${data.error || 'Invalid admin password'}`);
      }
    } catch (error) {
      console.error('Admin auth error:', error);
      alert('Network error during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    if (password) {
      await Promise.all([
        fetchStats(password),
        fetchUsers(password, currentPage, searchTerm)
      ]);
    }
  };

  // Real-time polling effect
  React.useEffect(() => {
    if (isAuthenticated && password) {
      // Start polling every 30 seconds
      const interval = setInterval(() => {
        setIsPolling(true);
        refreshData().finally(() => {
          setIsPolling(false);
          setLastUpdate(new Date());
        });
      }, 30000); // 30 seconds

      setPollInterval(interval);

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else {
      // Clear polling when not authenticated
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
    }
  }, [isAuthenticated, password]);

  // Update lastUpdate when manual refresh happens
  React.useEffect(() => {
    if (!loadingStats && !loadingUsers && !isPolling) {
      setLastUpdate(new Date());
    }
  }, [loadingStats, loadingUsers, isPolling]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchUsers(password, page, searchTerm);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers(password, 1, searchTerm);
  };

  const getConnectionStatusIcon = (connected: boolean) => {
    return connected ?
      <CheckCircle className="w-4 h-4 text-green-400" /> :
      <XCircle className="w-4 h-4 text-red-400" />;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mb-4"
              >
                <Shield className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
              <p className="text-slate-400 text-sm">Enter admin password to access</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <input
                  type="password"
                  placeholder="Admin Password"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Access Portal
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-lg"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Crown className="w-8 h-8 text-purple-400" />
                Reputa Admin Portal
              </h1>
              <p className="text-slate-400 text-sm mt-1">Protocol Management Dashboard</p>
            </div>

            {/* Connection Status */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded-lg">
                <Database className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-300">MongoDB</span>
                {stats ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>

              <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded-lg">
                <Cloud className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-300">Upstash KV</span>
                {cacheInfo?.upstashConnected ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400">{cacheInfo.upstashLatency}ms</span>
                  </div>
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>

              {/* Real-time Status */}
              <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded-lg">
                <RefreshCw className={`w-4 h-4 text-slate-400 ${isPolling ? 'animate-spin' : ''}`} />
                <div className="text-xs">
                  {isPolling ? (
                    <span className="text-blue-400">Updating...</span>
                  ) : (
                    <span className="text-slate-300">
                      {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Loading...'}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={refreshData}
                disabled={loadingStats || loadingUsers || isPolling}
                className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 text-slate-300 px-4 py-2 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loadingStats || loadingUsers ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <button
                onClick={consolidateData}
                disabled={consolidating}
                className="bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 text-purple-300 px-4 py-2 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {consolidating ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <BarChart3 className="w-4 h-4" />
                )}
                {consolidating ? 'Consolidating...' : 'Consolidate Data'}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-7xl mx-auto px-6 py-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Unique Users</p>
                <p className="text-2xl font-bold text-white">
                  {loadingStats ? '...' : (masterStats?.uniqueUsers || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Records</p>
                <p className="text-2xl font-bold text-white">
                  {loadingStats ? '...' : (masterStats?.totalRecords || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Activity</p>
                <p className="text-2xl font-bold text-white">
                  {loadingStats ? '...' : allRealUsers.reduce((sum, user) => sum + user.totalActivity, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Visits</p>
                <p className="text-2xl font-bold text-white">
                  {loadingStats ? '...' : allRealUsers.reduce((sum, user) => sum + user.visitCount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Award className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Sessions</p>
                <p className="text-2xl font-bold text-white">
                  {loadingStats ? '...' : allRealUsers.reduce((sum, user) => sum + user.sessionCount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users by username, email, or wallet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25 transition-all"
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              className="bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 text-purple-300 px-6 py-3 rounded-xl transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-slate-400" />
              <div>
                <h2 className="text-xl font-bold text-white">Master Registry</h2>
                <p className="text-slate-400 text-sm">
                  Page {paginationInfo?.currentPage || currentPage} of {paginationInfo?.totalPages || totalPages} • {allRealUsers.length.toLocaleString()} total users • {usersPerPage} per page
                  {masterStats && (
                    <span className="ml-2 text-xs bg-slate-800 px-2 py-1 rounded">
                      📊 {masterStats.mongodbCollections} MongoDB collections • ⚡ {masterStats.upstashKeys} Upstash keys
                    </span>
                  )}
                  {loadingUsers && (
                    <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded animate-pulse">
                      🔄 Loading {usersPerPage} records from Master Registry...
                    </span>
                  )}
                </p>
              </div>
            </div>
            {loadingUsers && <Loader className="w-5 h-5 animate-spin text-slate-400" />}
          </div>

          <div className="overflow-x-auto">
            <table key={allRealUsers.length} className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Username</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Wallets</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Total Activity</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Score</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Visits</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Sessions</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">VIP</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Sources</th>
                </tr>
              </thead>
              <tbody>
                {allRealUsers.map((user, index) => (
                  <motion.tr
                    key={user.username}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-slate-800/30 hover:bg-slate-800/20"
                  >
                    <td className="py-3 px-4 text-white font-medium">{user.username}</td>
                    <td className="py-3 px-4 text-slate-300">{user.email || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-300">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-purple-300">{user.wallets.length} wallet(s)</span>
                        {user.wallets.length > 0 && (
                          <div className="text-xs text-slate-500 max-w-xs truncate">
                            {user.wallets.slice(0, 2).join(', ')}
                            {user.wallets.length > 2 && ` +${user.wallets.length - 2} more`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <span className="text-lg font-bold text-blue-400">
                        {user.totalActivity.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{user.reputationScore.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-300">
                      <span className="text-green-400 font-medium">{user.visitCount}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <span className="text-yellow-400 font-medium">{user.sessionCount}</span>
                    </td>
                    <td className="py-3 px-4">
                      {user.isVip ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                          <Crown className="w-3 h-3" />
                          VIP
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {user.sourceTables.map(table => (
                          <span key={table} className="px-2 py-1 bg-slate-700 text-xs rounded text-slate-300">
                            {table}
                          </span>
                        ))}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-700/50">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1 || loadingUsers}
                className="px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                First
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!paginationInfo?.hasPrevPage || loadingUsers}
                className="px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">Page</span>
                <input
                  type="number"
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= totalPages) {
                      handlePageChange(page);
                    }
                  }}
                  className="w-16 px-2 py-1 bg-slate-800/50 border border-slate-600/50 rounded text-slate-300 text-sm text-center"
                  min={1}
                  max={totalPages}
                />
                <span className="text-slate-400 text-sm">of {totalPages}</span>
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!paginationInfo?.hasNextPage || loadingUsers}
                className="px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages || loadingUsers}
                className="px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Last
              </button>
            </div>

            <div className="text-slate-400 text-sm">
              Showing {(currentPage - 1) * 50 + 1}-{Math.min(currentPage * 50, totalUsers)} of {totalUsers.toLocaleString()} users
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminPortal;
