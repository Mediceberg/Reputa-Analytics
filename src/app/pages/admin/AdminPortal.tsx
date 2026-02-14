import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Clock,
  Crown,
  Database,
  Filter,
  LogOut,
  RefreshCw,
  Search,
  Server,
  Shield,
  TrendingUp,
  Users,
  Wallet,
  Wifi,
  WifiOff,
} from 'lucide-react';

const PAGE_SIZE = 50;
const gradientBg = 'linear-gradient(135deg, #07090f 0%, #0c0f1b 55%, #050609 100%)';

interface ConsolidatedUser {
  uid: string;
  username: string;
  primaryWallet?: string;
  walletAddress?: string;
  primaryEmail?: string;
  createdAt?: string;
  lastActiveAt?: string;
  reputaScore?: number;
  hasFeedback?: boolean;
  isVip?: boolean;
  linkStatus?: 'Linked' | 'Not Linked';
  dataSource?: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface StatsSummary {
  totalUsers: number;
  vipUsers: number;
  totalVisits: number;
  lastUpdated: string;
}

interface HealthStatus {
  uptime: number;
  mongodb?: { status: string; latency?: number | null };
  upstash?: { status: string; latency?: number | null };
}

function formatDate(value?: string): string {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return `${date.toLocaleDateString('en-CA')} ${date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })}`;
}

function formatRelative(value?: string): string {
  if (!value) return 'N/A';
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return 'N/A';
  const diffMinutes = Math.floor((Date.now() - target.getTime()) / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(value);
}

function formatUptime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${mins}m`;
}

function LoginScreen({ onLogin }: { onLogin: (password: string) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password.trim()) {
      setError('Please enter a password.');
      return;
    }
    setSubmitting(true);
    if (password === 'admin123') {
      setError('');
      onLogin(password);
    } else {
      setError('Invalid password, please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: gradientBg }}>
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-slate-900/70 p-8 backdrop-blur">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/10">
            <Shield className="h-8 w-8 text-purple-300" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.5em] text-slate-500">Reputa Analytics</p>
            <h1 className="text-2xl font-black text-white">Admin Portal</h1>
            <p className="text-sm text-slate-400">Authenticate to access the control center.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Admin password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-600/40 bg-black/50 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none"
              placeholder="Enter admin password"
              disabled={submitting}
            />
          </label>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-purple-500/30 bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white transition active:scale-95"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-500">
          Default password: <span className="text-purple-300">admin123</span>
        </p>
      </div>
    </div>
  );
}

function DbStatusBadge({ label, status, latency }: { label: string; status?: string; latency?: number | null }) {
  const isOnline = status === 'connected' || status === 'noop-fallback' || status === 'unknown';
  const bg = isOnline ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300' : 'bg-red-500/10 border-red-400/30 text-red-300';

  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest ${bg}`}>
      {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      <span>{label}</span>
      {latency != null && <span className="text-[9px] text-slate-400">{latency}ms</span>}
    </div>
  );
}

function Pagination({ meta, onPageChange, disabled }: { meta: PaginationMeta; onPageChange: (page: number) => void; disabled: boolean }) {
  const pages = useMemo(() => {
    if (meta.pages <= 5) return Array.from({ length: meta.pages }, (_, i) => i + 1);
    if (meta.page <= 3) return [1, 2, 3, 4, 5];
    if (meta.page >= meta.pages - 2) return [meta.pages - 4, meta.pages - 3, meta.pages - 2, meta.pages - 1, meta.pages];
    return [meta.page - 2, meta.page - 1, meta.page, meta.page + 1, meta.page + 2];
  }, [meta.page, meta.pages]);

  const stats = `${(meta.page - 1) * meta.limit + 1}-${Math.min(meta.page * meta.limit, meta.total)} of ${meta.total}`;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/5 p-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
      <span>Showing {stats}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(meta.page - 1)}
          disabled={!meta.hasPrev || disabled}
          className="rounded-lg border border-white/10 px-3 py-1 text-[11px] uppercase tracking-widest text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Prev
        </button>
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            disabled={disabled}
            className={`h-8 w-8 rounded-lg border text-[11px] font-semibold ${
              page === meta.page ? 'border-purple-400 bg-purple-500/30 text-white' : 'border-white/10 text-slate-400'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(meta.page + 1)}
          disabled={!meta.hasNext || disabled}
          className="rounded-lg border border-white/10 px-3 py-1 text-[11px] uppercase tracking-widest text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Dashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [users, setUsers] = useState<ConsolidatedUser[]>([]);
  const [manualData, setManualData] = useState<ConsolidatedUser[] | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);

  const headers = useMemo(() => ({ 'x-admin-password': password }), [password]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const searchParam = encodeURIComponent(search.trim());
      const query = `/api/admin-portal/consolidated?page=${page}&limit=${PAGE_SIZE}&search=${searchParam}`;
      const [consolidatedRes, healthRes] = await Promise.all([
        fetch(query, { headers }),
        fetch('/api/health-check'),
      ]);

      if (!consolidatedRes.ok) throw new Error(`Consolidated API failed: ${consolidatedRes.status}`);
      if (!healthRes.ok) throw new Error(`Health check failed: ${healthRes.status}`);

      const consolidatedData = await consolidatedRes.json();
      const healthData = await healthRes.json();

      setStats({
        totalUsers: consolidatedData.uniqueUsers ?? 0,
        vipUsers: consolidatedData.vipUsers ?? 0,
        totalVisits: consolidatedData.totalVisits ?? 0,
        lastUpdated: consolidatedData.lastUpdated ?? new Date().toISOString(),
      });
      const serverPagination =
        consolidatedData.pagination ??
        consolidatedData.meta?.pagination ??
        null;

      const apiUsers: ConsolidatedUser[] = consolidatedData.users ?? [];
      const totalFromApi = (
        serverPagination?.total ??
        consolidatedData.uniqueUsers ??
        apiUsers.length
      );

      if (serverPagination) {
        const limit = serverPagination.limit ?? PAGE_SIZE;
        const totalPages = serverPagination.pages ?? Math.max(1, Math.ceil(totalFromApi / limit));
        const currentPage = Math.min(serverPagination.page ?? page, totalPages);

        setManualData(null);
        setUsers(apiUsers);
        setPagination({
          page: currentPage,
          limit,
          total: totalFromApi,
          pages: totalPages,
          hasNext:
            serverPagination.hasNext ?? currentPage < totalPages,
          hasPrev:
            serverPagination.hasPrev ?? currentPage > 1,
        });
      } else {
        const totalPages = Math.max(1, Math.ceil(totalFromApi / PAGE_SIZE));
        const safePage = Math.min(page, totalPages);
        const start = (safePage - 1) * PAGE_SIZE;
        const pagedUsers = apiUsers.slice(start, start + PAGE_SIZE);

        setManualData(apiUsers);
        setUsers(pagedUsers);
        setPagination({
          page: safePage,
          limit: PAGE_SIZE,
          total: totalFromApi,
          pages: totalPages,
          hasNext: safePage < totalPages,
          hasPrev: safePage > 1,
        });
        if (safePage !== page) {
          setPage(safePage);
        }
      }
      setHealth({
        uptime: healthData.uptime ?? 0,
        mongodb: healthData.mongodb,
        upstash: healthData.upstash,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load data: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [headers, page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    fetchData();
  };

  const handlePageChange = (newPage: number) => {
    if (!pagination) return;
    if (newPage < 1 || newPage > pagination.pages || newPage === page) return;
    setPage(newPage);
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!manualData) return;
    const total = manualData.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    const paged = manualData.slice(start, start + PAGE_SIZE);
    setUsers(paged);
    setPagination({
      page: safePage,
      limit: PAGE_SIZE,
      total,
      pages: totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    });
  }, [manualData, page]);

  return (
    <div
      ref={mainRef}
      className="min-h-screen w-full flex flex-col"
      style={{ background: gradientBg, overflowY: 'auto' }}
    >
      <header className="sticky top-0 z-30 border-b border-white/5 bg-black/80 px-6 py-4 backdrop-blur">
        <div className="flex w-full flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10">
              <Shield className="h-5 w-5 text-purple-300" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.5em] text-slate-500">Admin Console</p>
              <h1 className="text-lg font-black text-white">Reputa Master Dashboard</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {health && (
              <>
                <DbStatusBadge label="MongoDB" status={health.mongodb?.status} latency={health.mongodb?.latency ?? null} />
                <DbStatusBadge label="Upstash" status={health.upstash?.status} latency={health.upstash?.latency ?? null} />
                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-widest text-slate-400">
                  <Server className="h-3 w-3" /> {formatUptime(health.uptime)}
                </div>
              </>
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-purple-400/40 bg-purple-500/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-purple-200"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-red-200"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full space-y-6 px-6 py-6 text-white">
        {error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        {stats && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="Total Users" value={stats.totalUsers.toLocaleString()} icon={<Users className="h-5 w-5" />} />
            <StatsCard title="VIP Users" value={stats.vipUsers.toLocaleString()} accent="from-amber-500" icon={<Crown className="h-5 w-5" />} />
            <StatsCard title="Total Visits" value={stats.totalVisits.toLocaleString()} accent="from-sky-500" icon={<Activity className="h-5 w-5" />} />
            <StatsCard title="Last Updated" value={formatRelative(stats.lastUpdated)} accent="from-emerald-500" icon={<Clock className="h-5 w-5" />} />
          </div>
        )}

        <section className="rounded-2xl border border-white/5 bg-white/5 p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by username or wallet..."
                className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-200"
            >
              <Filter className="h-4 w-4" /> Apply
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-white/5 bg-black/40">
          <header className="flex items-center justify-between border-b border-white/5 px-6 py-4 text-xs uppercase tracking-[0.3em] text-slate-400">
            <span className="flex items-center gap-2 text-white">
              <Database className="h-4 w-4 text-emerald-300" /> Consolidated Registry
            </span>
            <span>{users.length} rows ({pagination?.total ?? 0} total)</span>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-black/80 text-[11px] uppercase tracking-widest text-slate-300 backdrop-blur">
                <tr>
                  <th className="px-6 py-3 text-left">User</th>
                  <th className="px-6 py-3 text-left">Wallet</th>
                  <th className="px-6 py-3 text-left">Last Active</th>
                  <th className="px-6 py-3 text-left">Score</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Source</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                      {loading ? 'Loading consolidated data...' : 'No users found for the current filters.'}
                    </td>
                  </tr>
                )}
                {users.map((user) => (
                  <tr key={user.uid} className="border-t border-white/5 text-slate-200">
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-white">{user.username}</p>
                        {user.primaryEmail && <p className="text-xs text-slate-500">{user.primaryEmail}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Wallet className="h-4 w-4 text-slate-500" />
                        <span className="font-mono text-[11px]">{user.walletAddress ?? user.primaryWallet ?? 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      <p>{formatRelative(user.lastActiveAt)}</p>
                      <p className="text-[11px] text-slate-600">{formatDate(user.lastActiveAt)}</p>
                    </td>
                    <td className="px-6 py-4 text-white">
                      {(user.reputaScore ?? 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest">
                        {user.isVip && (
                          <span className="rounded-full border border-amber-400/50 bg-amber-500/10 px-2 py-1 text-amber-200">VIP</span>
                        )}
                        {user.hasFeedback && (
                          <span className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-2 py-1 text-emerald-200">Feedback</span>
                        )}
                        <span className="text-slate-500">{user.linkStatus ?? 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-slate-500" />
                        <span>{user.dataSource ?? 'MongoDB'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {pagination && (
          <Pagination meta={pagination} onPageChange={handlePageChange} disabled={loading} />
        )}

        <footer className="border-t border-white/5 pt-6 text-center text-[10px] uppercase tracking-[0.4em] text-slate-500">
          Reputa Admin Engine • MongoDB + Upstash • Real-time Sync
        </footer>
      </main>
    </div>
  );
}

function StatsCard({ title, value, icon, accent }: { title: string; value: string; icon: React.ReactNode; accent?: string }) {
  const accentClass = accent ?? 'from-purple-500';
  return (
    <div className="space-y-2 rounded-2xl border border-white/5 bg-white/5 p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
        {title}
        <span className={`rounded-lg bg-gradient-to-r ${accentClass} to-transparent px-2 py-1 text-white/70`}>{icon}</span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}

export default function AdminPortal() {
  const [password, setPassword] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('admin_portal_pw');
    } catch {
      return null;
    }
  });

  const handleLogin = (pw: string) => {
    setPassword(pw);
    try {
      sessionStorage.setItem('admin_portal_pw', pw);
    } catch {
      /* no-op */
    }
  };

  const handleLogout = () => {
    setPassword(null);
    try {
      sessionStorage.removeItem('admin_portal_pw');
    } catch {
      /* no-op */
    }
  };

  if (!password) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <Dashboard password={password} onLogout={handleLogout} />;
}
