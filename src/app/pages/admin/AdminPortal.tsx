import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Users, Eye, Crown, Search, RefreshCw, Activity,
  Database, Wifi, WifiOff, Clock, Wallet, ChevronDown, ChevronUp,
  Lock, LogOut, Server, Zap, TrendingUp, Filter,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────
interface StatsData {
  totalUniqueUsers: number;
  totalVisits: number;
  totalVipUsers: number;
  totalReputationScores?: number;
  paidVipUsers?: number;
  referralVipUsers?: number;
}

interface TrafficUser {
  _id?: string;
  username: string;
  wallets: string[];
  visitCount: number;
  isVip: boolean;
  paymentDetails?: {
    paymentId: string;
    txid: string;
    amount: number;
    paidAt: string;
    method?: string;
  } | null;
  reputaScore: number;
  firstSeen: string;
  lastSeen: string;
  email?: string;
  referralCount?: number;
  protocolVersion?: string;
}

interface ConsolidatedUser extends TrafficUser {
  primaryWallet: string;
  allWallets: string[];
  primaryPioneerId?: string;
  allPioneerIds: string[];
  primaryEmail?: string;
  sources: string[];
  maxReferralCount: number;
  protocolVersions: string[];
  recordCount: number;
  isConsolidated: boolean;
  feedbackCount: number;
  hasFeedback: boolean;
  checkinCount: number;
  lastCheckin?: number;
  activityScore: number;
  dataCompleteness: {
    hasWallet: boolean;
    hasPioneerId: boolean;
    hasEmail: boolean;
    hasPayment: boolean;
    hasReputation: boolean;
  };
}

interface HealthStatus {
  mongodb: { status: string; latency: number | null };
  upstash: { status: string; latency: number | null };
  uptime: number;
}

// ─── Helpers ─────────────────────────────────────────────────────
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    // Format: 2026-02-12 21:04
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-') + ' ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch { return 'N/A'; }
}

function formatRelativeTime(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return formatDate(dateStr);
  } catch { return 'N/A'; }
}

function truncateWallet(w: string): string {
  if (!w || w.length < 12) return w || 'N/A';
  return `${w.slice(0, 6)}...${w.slice(-4)}`;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

// ─── Login Screen ────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (pw: string) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin-portal/stats?password=${encodeURIComponent(password)}`);
      if (res.ok) {
        onLogin(password);
      } else {
        setError('Invalid password. Access denied.');
      }
    } catch {
      setError('Connection error. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0b0f 0%, #0d0f17 50%, #0a0b0f 100%)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #00d9ff 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative w-full max-w-md mx-4 p-8 rounded-3xl" style={{ background: 'rgba(15, 17, 23, 0.9)', border: '1px solid rgba(139, 92, 246, 0.2)', boxShadow: '0 0 60px rgba(139, 92, 246, 0.1)' }}>
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(0, 217, 255, 0.2))', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <Shield className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-[0.2em]" style={{ color: 'rgba(139, 92, 246, 0.9)' }}>Admin Portal</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] mt-1">Reputa Score Master Engine</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="password"
              placeholder="Enter Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl text-sm outline-none transition-all"
              style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#fff' }}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-400 text-[11px] text-center font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(0, 217, 255, 0.3) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              color: '#fff',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? 'Verifying...' : 'Unlock Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: React.ElementType; label: string; value: string | number; color: string; sub?: string;
}) {
  return (
    <div className="p-5 rounded-2xl transition-all hover:scale-[1.02]" style={{ background: 'rgba(15, 17, 23, 0.8)', border: `1px solid ${color}22` }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
      </div>
      <p className="text-3xl font-black" style={{ color }}>{value}</p>
      {sub && <p className="text-[9px] text-slate-600 mt-1">{sub}</p>}
    </div>
  );
}

// ─── DB Status Badge ─────────────────────────────────────────────
function DbStatusBadge({ label, status, latency }: { label: string; status: string; latency: number | null }) {
  const isOk = status === 'connected' || status === 'noop-fallback';
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: isOk ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)', border: `1px solid ${isOk ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
      {isOk ? <Wifi className="w-3 h-3 text-green-400" /> : <WifiOff className="w-3 h-3 text-red-400" />}
      <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: isOk ? '#22c55e' : '#ef4444' }}>{label}</span>
      {latency !== null && <span className="text-[8px] text-slate-500">{latency}ms</span>}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────
function Dashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [users, setUsers] = useState<TrafficUser[]>([]);
  const [paidUsers, setPaidUsers] = useState<TrafficUser[]>([]);
  const [consolidatedUsers, setConsolidatedUsers] = useState<ConsolidatedUser[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'consolidated' | 'paid'>('overview');
  const [sortField, setSortField] = useState<'lastSeen' | 'visitCount' | 'firstSeen'>('lastSeen');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const headers = { 'x-admin-password': password };

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const [statsRes, usersRes, paidRes, consolidatedRes, healthRes] = await Promise.all([
        fetch('/api/admin-portal/stats', { headers }),
        fetch(`/api/admin-portal/users?search=${encodeURIComponent(searchQuery)}`, { headers }),
        fetch('/api/admin-portal/paid-users', { headers }),
        fetch(`/api/admin-portal/consolidated?search=${encodeURIComponent(searchQuery)}`, { headers }),
        fetch('/api/health-check'),
      ]);

      // Check for HTTP errors
      if (!statsRes.ok) throw new Error(`Stats API failed: ${statsRes.status}`);
      if (!usersRes.ok) throw new Error(`Users API failed: ${usersRes.status}`);
      if (!paidRes.ok) throw new Error(`Paid users API failed: ${paidRes.status}`);
      if (!consolidatedRes.ok) throw new Error(`Consolidated API failed: ${consolidatedRes.status}`);
      if (!healthRes.ok) throw new Error(`Health check API failed: ${healthRes.status}`);

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const paidData = await paidRes.json();
      const consolidatedData = await consolidatedRes.json();
      const healthData = await healthRes.json();

      // Check API response success
      if (!statsData.success) {
        throw new Error(statsData.error || 'Stats API returned failure');
      }
      if (!usersData.success) {
        throw new Error(usersData.error || 'Users API returned failure');
      }
      if (!paidData.success) {
        throw new Error(paidData.error || 'Paid users API returned failure');
      }

      // Set data
      setStats(statsData.stats);
      setUsers(usersData.users || []);
      setPaidUsers(paidData.paidUsers || []);
      setConsolidatedUsers(consolidatedData.users || []);
      setHealth(healthData);
      setLastRefresh(new Date());

      // Check for database connection issues
      const dbIssues = [];
      if (healthData.mongodb?.status === 'error') {
        dbIssues.push('MongoDB connection failed');
      }
      if (healthData.upstash?.status === 'error') {
        dbIssues.push('Upstash Redis connection failed');
      }
      if (healthData.upstash?.status === 'noop-fallback') {
        dbIssues.push('Upstash Redis not configured (using fallback)');
      }

      if (dbIssues.length > 0) {
        setError('البيانات غير متوفرة بسبب عدم ربط قاعدة البيانات السحابية. يرجى التحقق من متغيرات البيئة وإعادة تشغيل السيرفر.');
      }

    } catch (e) {
      console.error('Dashboard fetch error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      
      // Set user-friendly error messages
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setError('Authentication failed. Please refresh the page and login again.');
      } else if (errorMessage.includes('MongoDB') || errorMessage.includes('Database')) {
        setError('Database connection failed. Please check MONGODB_URI environment variable.');
      } else if (errorMessage.includes('Redis') || errorMessage.includes('Upstash')) {
        setError('Redis connection failed. Please check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.');
      } else if (errorMessage.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(`Failed to load data: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [password, searchQuery]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const sortedUsers = [...users].sort((a, b) => {
    const dir = sortDir === 'desc' ? -1 : 1;
    if (sortField === 'visitCount') return dir * (a.visitCount - b.visitCount);
    if (sortField === 'firstSeen') return dir * (new Date(a.firstSeen).getTime() - new Date(b.firstSeen).getTime());
    return dir * (new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime());
  });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'desc' ? <ChevronDown className="w-3 h-3 inline" /> : <ChevronUp className="w-3 h-3 inline" />;
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0b0f 0%, #0d0f17 50%, #0a0b0f 100%)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4" style={{ background: 'rgba(10, 11, 15, 0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(0, 217, 255, 0.2))', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-tight text-white">Admin Master Engine</h1>
            <p className="text-[8px] text-slate-500 uppercase tracking-[0.3em]">Reputa Score Control Center</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {health && (
            <>
              <DbStatusBadge label="MongoDB" status={health.mongodb.status} latency={health.mongodb.latency} />
              <DbStatusBadge label="Upstash" status={health.upstash.status} latency={health.upstash.latency} />
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <Server className="w-3 h-3 text-slate-500" />
                <span className="text-[8px] text-slate-500">{formatUptime(health.uptime)}</span>
              </div>
            </>
          )}
          <button
            onClick={fetchAll}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95"
            style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', color: '#8b5cf6' }}
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95"
            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
          >
            <LogOut className="w-3 h-3" />
            Logout
          </button>
        </div>
      </header>

      <main className="px-4 sm:px-8 py-6 max-w-[1600px] mx-auto space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl flex items-start gap-3" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
              <span className="text-[10px] font-bold text-red-400">!</span>
            </div>
            <div className="flex-1">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-red-400 mb-1">Connection Error</h3>
              <p className="text-[10px] text-red-300 leading-relaxed">{error}</p>
              <div className="mt-2 text-[9px] text-red-400">
                <strong>Environment Variables Needed:</strong><br/>
                • MONGODB_URI (MongoDB Atlas connection string)<br/>
                • UPSTASH_REDIS_REST_URL (Upstash Redis URL)<br/>
                • UPSTASH_REDIS_REST_TOKEN (Upstash Redis token)
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-400/10 transition-colors"
            >
              ×
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Unique Users" value={stats?.totalUniqueUsers ?? '...'} color="#8b5cf6" sub="Based on unique usernames" />
          <StatCard icon={Eye} label="Total Visits" value={stats?.totalVisits ?? '...'} color="#00d9ff" sub="All-time page visits" />
          <StatCard icon={Crown} label="VIP Users" value={stats?.totalVipUsers ?? '...'} color="#f59e0b" sub="Paid subscribers" />
          <StatCard icon={Activity} label="Last Refresh" value={lastRefresh.toLocaleTimeString()} color="#22c55e" sub="Auto-refresh: 30s" />
        </div>

        {/* Search + Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
              style={{
                background: activeTab === 'users' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activeTab === 'users' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                color: activeTab === 'users' ? '#8b5cf6' : '#64748b',
              }}
            >
              <Users className="w-3 h-3 inline mr-1.5" />
              All Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('consolidated')}
              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
              style={{
                background: activeTab === 'consolidated' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activeTab === 'consolidated' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                color: activeTab === 'consolidated' ? '#22c55e' : '#64748b',
              }}
            >
              <Database className="w-3 h-3 inline mr-1.5" />
              Consolidated ({consolidatedUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('paid')}
              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
              style={{
                background: activeTab === 'paid' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activeTab === 'paid' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                color: activeTab === 'paid' ? '#f59e0b' : '#64748b',
              }}
            >
              <Filter className="w-3 h-3 inline mr-1.5" />
              Paid Users ({paidUsers.length})
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by username or wallet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAll()}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-[11px] outline-none transition-all"
              style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff' }}
            />
          </div>
        </div>

        {/* Users Table */}
        {activeTab === 'users' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15, 17, 23, 0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-400" />
                Pioneer Directory
              </h2>
              <span className="text-[9px] text-slate-500">{users.length} records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <th className="text-left text-[9px] font-black uppercase tracking-wider text-slate-500 px-5 py-3">Username</th>
                    <th className="text-left text-[9px] font-black uppercase tracking-wider text-slate-500 px-3 py-3">
                      <Wallet className="w-3 h-3 inline mr-1" />Wallet
                    </th>
                    <th className="text-center text-[9px] font-black uppercase tracking-wider text-slate-500 px-3 py-3 cursor-pointer select-none" onClick={() => toggleSort('firstSeen')}>
                      First Seen <SortIcon field="firstSeen" />
                    </th>
                    <th className="text-center text-[9px] font-black uppercase tracking-wider text-slate-500 px-3 py-3 cursor-pointer select-none" onClick={() => toggleSort('visitCount')}>
                      Visits <SortIcon field="visitCount" />
                    </th>
                    <th className="text-center text-[9px] font-black uppercase tracking-wider text-slate-500 px-3 py-3">Score</th>
                    <th className="text-center text-[9px] font-black uppercase tracking-wider text-slate-500 px-3 py-3">VIP</th>
                    <th className="text-right text-[9px] font-black uppercase tracking-wider text-slate-500 px-5 py-3 cursor-pointer select-none" onClick={() => toggleSort('lastSeen')}>
                      Last Seen <SortIcon field="lastSeen" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-500 text-[11px] uppercase tracking-widest">
                        No pioneers found in registry
                      </td>
                    </tr>
                  )}
                  {isLoading && users.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-16">
                        <RefreshCw className="w-5 h-5 text-purple-400 animate-spin mx-auto mb-2" />
                        <span className="text-slate-500 text-[10px] uppercase tracking-widest">Loading data...</span>
                      </td>
                    </tr>
                  )}
                  {sortedUsers.map((user, idx) => (
                    <tr key={user.username + idx} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td className="px-5 py-3">
                        <span className="font-bold text-[12px]" style={{ color: user.isVip ? '#f59e0b' : '#8b5cf6' }}>
                          {user.isVip && <Crown className="w-3 h-3 inline mr-1 text-amber-400" />}
                          {user.username}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-mono text-[10px] text-slate-400">
                          {user.wallets?.length > 0 ? truncateWallet(user.wallets[0]) : 'No wallet'}
                        </span>
                        {user.wallets?.length > 1 && (
                          <span className="ml-1 text-[8px] text-slate-600">+{user.wallets.length - 1}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-[10px] text-slate-400">{formatDate(user.firstSeen)}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold" style={{ background: 'rgba(0, 217, 255, 0.08)', color: '#00d9ff' }}>
                          <TrendingUp className="w-3 h-3" />
                          {user.visitCount}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-[10px] font-bold text-slate-400" title="Score is under activation">
                          {user.reputaScore || '---'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {user.isVip ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                            <Zap className="w-3 h-3" /> VIP
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-600 uppercase">Free</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(user.lastSeen)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Consolidated Users Table */}
        {activeTab === 'consolidated' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15, 17, 23, 0.8)', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-green-400 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Global Data Consolidation
              </h2>
              <span className="text-[9px] text-slate-500">{consolidatedUsers.length} unified records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <th className="text-left text-[9px] font-black uppercase tracking-wider text-slate-500 px-5 py-3">User</th>
                    <th className="text-left text-[9px] font-black uppercase tracking-wider text-slate-500 px-3 py-3">Wallet</th>
                    <th className="text-center text-[9px] font-black uppercase tracking-wider text-slate-500 px-3 py-3">Source</th>
                    <th className="text-center text-[9px] font-black uppercase tracking-wider text-slate-500 px-3 py-3">Activity</th>
                    <th className="text-center text-[9px] font-black uppercase tracking-wider text-slate-500 px-3 py-3">Score</th>
                    <th className="text-right text-[9px] font-black uppercase tracking-wider text-slate-500 px-5 py-3">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidatedUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-slate-500 text-[11px] uppercase tracking-widest">
                        No consolidated data available
                      </td>
                    </tr>
                  )}
                  {consolidatedUsers.map((user, idx) => (
                    <tr key={user.username + idx} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-white">{user.username}</div>
                            {user.primaryPioneerId && (
                              <div className="text-[8px] text-slate-500 font-mono">{user.primaryPioneerId.slice(0, 8)}...</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-mono text-[9px] text-cyan-400">
                          {user.primaryWallet ? truncateWallet(user.primaryWallet) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex flex-col gap-1">
                          {user.sources.map((source, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase" 
                                  style={{ 
                                    background: source === 'final_users_v3' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
                                    color: source === 'final_users_v3' ? '#8b5cf6' : '#f59e0b',
                                    border: `1px solid ${source === 'final_users_v3' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                                  }}>
                              {source.replace('final_users_', '').replace('user', '')}
                            </span>
                          ))}
                        </div>
                        {user.isConsolidated && (
                          <div className="text-[7px] text-green-400 font-bold mt-1">MERGED</div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-center gap-2">
                            {user.hasFeedback && <span className="text-[8px] text-blue-400">💬</span>}
                            <span className="text-[9px] text-slate-300">{user.feedbackCount}</span>
                          </div>
                          <div className="text-[7px] text-slate-500">{user.checkinCount} check-ins</div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-purple-400">{user.reputaScore.toLocaleString()}</span>
                          <div className="text-[7px] text-slate-500">Activity: {user.activityScore}</div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(user.lastActiveAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Paid Users Table */}
        {activeTab === 'paid' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15, 17, 23, 0.8)', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-amber-400 flex items-center gap-2">
                <Crown className="w-4 h-4" />
                VIP / Paid Users
              </h2>
              <span className="text-[9px] text-slate-500">{paidUsers.length} paid</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <th className="text-left text-[9px] font-black uppercase tracking-wider text-slate-500 px-5 py-3">Username</th>
                    <th className="text-left text-[9px] font-black uppercase tracking-wider text-slate-500 px-3 py-3">Wallet</th>
                    <th className="text-center text-[9px] font-black uppercase tracking-wider text-slate-500 px-3 py-3">Payment ID</th>
                    <th className="text-center text-[9px] font-black uppercase tracking-wider text-slate-500 px-3 py-3">TX Hash</th>
                    <th className="text-center text-[9px] font-black uppercase tracking-wider text-slate-500 px-3 py-3">Amount</th>
                    <th className="text-right text-[9px] font-black uppercase tracking-wider text-slate-500 px-5 py-3">Paid At</th>
                  </tr>
                </thead>
                <tbody>
                  {paidUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-slate-500 text-[11px] uppercase tracking-widest">
                        No paid users yet
                      </td>
                    </tr>
                  )}
                  {paidUsers.map((user, idx) => (
                    <tr key={user.username + idx} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td className="px-5 py-3">
                        <span className="font-bold text-[12px] text-amber-400">
                          <Crown className="w-3 h-3 inline mr-1" />
                          {user.username}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-mono text-[10px] text-slate-400">
                          {user.wallets?.length > 0 ? truncateWallet(user.wallets[0]) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="font-mono text-[9px] text-slate-500">
                          {user.paymentDetails?.paymentId ? truncateWallet(user.paymentDetails.paymentId) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="font-mono text-[9px] text-cyan-400">
                          {user.paymentDetails?.txid ? truncateWallet(user.paymentDetails.txid) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-[11px] font-bold text-green-400">
                          {user.paymentDetails?.amount ? `${user.paymentDetails.amount} Pi` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-[10px] text-slate-500">
                          {user.paymentDetails?.paidAt ? formatDate(user.paymentDetails.paidAt) : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-[8px] text-slate-600 uppercase tracking-[0.3em]">
            Reputa Score Admin Master Engine v1.0 &bull; Data Path: User Action &rarr; Upstash (Speed) &rarr; MongoDB (Permanent)
          </p>
        </div>
      </main>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────
export default function AdminPortal() {
  const [password, setPassword] = useState<string | null>(() => {
    try { return sessionStorage.getItem('admin_portal_pw'); } catch { return null; }
  });

  const handleLogin = (pw: string) => {
    setPassword(pw);
    try { sessionStorage.setItem('admin_portal_pw', pw); } catch { /* ignore */ }
  };

  const handleLogout = () => {
    setPassword(null);
    try { sessionStorage.removeItem('admin_portal_pw'); } catch { /* ignore */ }
  };

  if (!password) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <Dashboard password={password} onLogout={handleLogout} />;
}
