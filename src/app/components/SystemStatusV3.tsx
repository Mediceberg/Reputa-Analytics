/**
 * System Status Dashboard - Reputa v3.0
 * Shows protocol status, database info, and system health
 */

import React, { useEffect, useState } from 'react';

interface SystemStatus {
  protocol: {
    version: string;
    maxLevel: number;
    maxPoints: number;
  };
  database: string;
  cache: string;
  uptime: number;
  timestamp: string;
}

interface HealthStatus {
  status: string;
  timestamp: string;
  protocol: any;
}

export const SystemStatusDashboard: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/health');
        const data = await response.json();
        setHealth(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Health check failed');
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-center py-8">⏳ Checking system status...</div>;
  }

  if (error) {
    return <div className="text-red-500 py-8">❌ Error: {error}</div>;
  }

  if (!health) {
    return <div className="text-gray-500 py-8">No status data</div>;
  }

  return (
    <div className="w-full bg-gray-900 text-white p-6 rounded-lg">
      <h1 className="text-3xl font-bold mb-6">🚀 Reputa Protocol v3.0 - System Status</h1>

      {/* Protocol Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-900 bg-opacity-50 rounded-lg p-4">
          <div className="text-sm text-blue-300 uppercase mb-2">Protocol Version</div>
          <div className="text-3xl font-bold text-blue-100">{health.protocol.version}</div>
        </div>

        <div className="bg-purple-900 bg-opacity-50 rounded-lg p-4">
          <div className="text-sm text-purple-300 uppercase mb-2">Max Levels</div>
          <div className="text-3xl font-bold text-purple-100">{health.protocol.maxLevel}</div>
        </div>

        <div className="bg-green-900 bg-opacity-50 rounded-lg p-4">
          <div className="text-sm text-green-300 uppercase mb-2">Max Points</div>
          <div className="text-3xl font-bold text-green-100">{health.protocol.maxPoints.toLocaleString()}</div>
        </div>
      </div>

      {/* System Components */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-bold mb-4">📊 System Components</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Primary Database</span>
            <span className="bg-green-600 text-white px-3 py-1 rounded">MongoDB</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Cache Layer</span>
            <span className="bg-blue-600 text-white px-3 py-1 rounded">Redis (5-min TTL)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">API Version</span>
            <span className="bg-purple-600 text-white px-3 py-1 rounded">v3.0</span>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-bold mb-4">✨ Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <span className="text-green-400 mr-2">✅</span>
            <div>
              <div className="font-semibold">20 Levels</div>
              <div className="text-sm text-gray-400">From Newcomer to Supreme</div>
            </div>
          </div>
          <div className="flex items-start">
            <span className="text-green-400 mr-2">✅</span>
            <div>
              <div className="font-semibold">100,000 Points</div>
              <div className="text-sm text-gray-400">Increased from 10,000</div>
            </div>
          </div>
          <div className="flex items-start">
            <span className="text-green-400 mr-2">✅</span>
            <div>
              <div className="font-semibold">Unified Scoring</div>
              <div className="text-sm text-gray-400">80% Wallet + 20% App</div>
            </div>
          </div>
          <div className="flex items-start">
            <span className="text-green-400 mr-2">✅</span>
            <div>
              <div className="font-semibold">MongoDB Primary</div>
              <div className="text-sm text-gray-400">Reliable Data Storage</div>
            </div>
          </div>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">📡 API Endpoints</h2>
        <div className="space-y-2 font-mono text-sm">
          <div className="text-gray-400">
            <span className="text-blue-400">GET</span> /api/v3/reputation
          </div>
          <div className="text-gray-400">
            <span className="text-green-400">POST</span> /api/v3/reputation/check-in
          </div>
          <div className="text-gray-400">
            <span className="text-green-400">POST</span> /api/v3/reputation/ad-bonus
          </div>
          <div className="text-gray-400">
            <span className="text-blue-400">GET</span> /api/v3/reputation/leaderboard
          </div>
          <div className="text-gray-400">
            <span className="text-blue-400">GET</span> /api/v3/reputation/protocol
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-6 text-center text-xs text-gray-400">
        Last updated: {new Date(health.timestamp).toLocaleString()}
      </div>
    </div>
  );
};

export default SystemStatusDashboard;
