
/**
 * Reputation Display Component - Protocol v3.0
 * Shows user reputation, level, and progress
 */

import React, { useEffect, useState } from 'react';
import protocol from '../../server/config/reputaProtocol';

interface ReputationDisplayProps {
  pioneerId: string;
  username: string;
  email: string;
}

export const ReputationDisplay: React.FC<ReputationDisplayProps> = ({
  pioneerId,
  username,
  email
}) => {
  const [reputation, setReputation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReputation = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/v3/reputation?pioneerId=${pioneerId}&username=${username}&email=${email}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch reputation');
        }
        
        const data = await response.json();
        setReputation(data.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchReputation();
  }, [pioneerId, username, email]);

  if (loading) {
    return <div className="text-center py-8">⏳ Loading reputation...</div>;
  }

  if (error) {
    return <div className="text-red-500 py-8">❌ Error: {error}</div>;
  }

  if (!reputation) {
    return <div className="text-gray-500 py-8">No reputation data</div>;
  }

  const levelColor = {
    1: '#8B7355',  // Brown
    5: '#4169E1',  // Royal Blue
    10: '#FFD700', // Gold
    15: '#FF6347', // Tomato
    20: '#FF1493'  // Deep Pink
  };

  const getLevelColor = (level: number) => {
    if (level >= 18) return '#FF1493';
    if (level >= 15) return '#FF6347';
    if (level >= 10) return '#FFD700';
    if (level >= 5) return '#4169E1';
    return '#8B7355';
  };

  return (
    <div className="w-full max-w-md mx-auto bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg shadow-xl p-6 text-white">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">{reputation.levelName}</h2>
        <p className="text-blue-200">Level {reputation.reputationLevel}/20</p>
      </div>

      {/* Score Display */}
      <div className="bg-blue-800 bg-opacity-50 rounded-lg p-4 mb-6">
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-yellow-300">
            {reputation.totalReputationScore.toLocaleString()}
          </div>
          <div className="text-sm text-blue-200">/ 100,000 points</div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-blue-900 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300"
            style={{ width: `${reputation.progress.percentProgress}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-blue-200 text-center">
          {reputation.progress.pointsNeededForNext.toLocaleString()} points to next level
        </div>
      </div>

      {/* Component Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Wallet Component */}
        <div className="bg-blue-800 bg-opacity-50 rounded-lg p-4">
          <div className="text-xs text-blue-300 uppercase tracking-wider mb-2">
            Wallet (80%)
          </div>
          <div className="text-2xl font-bold text-blue-100">
            {reputation.components.wallet.combined.toLocaleString()}
          </div>
          <div className="text-xs text-blue-300 mt-2">
            <div>Mainnet: {reputation.components.wallet.mainnet}</div>
            <div>Testnet: {reputation.components.wallet.testnet}</div>
          </div>
        </div>

        {/* App Engagement Component */}
        <div className="bg-purple-900 bg-opacity-50 rounded-lg p-4">
          <div className="text-xs text-purple-300 uppercase tracking-wider mb-2">
            App (20%)
          </div>
          <div className="text-2xl font-bold text-purple-100">
            {reputation.components.appEngagement.total.toLocaleString()}
          </div>
          <div className="text-xs text-purple-300 mt-2">
            <div>Check-in: {reputation.components.appEngagement.checkIn}</div>
            <div>Ads: {reputation.components.appEngagement.adBonus}</div>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="bg-blue-800 bg-opacity-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-blue-300 uppercase mb-1">Current Streak</div>
            <div className="text-2xl font-bold text-green-400">
              {reputation.activity.currentStreak}
            </div>
            <div className="text-xs text-blue-300">days</div>
          </div>
          <div>
            <div className="text-xs text-blue-300 uppercase mb-1">Best Streak</div>
            <div className="text-2xl font-bold text-blue-100">
              {reputation.activity.longestStreak}
            </div>
            <div className="text-xs text-blue-300">days</div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-4 text-center text-xs text-blue-300">
        Updated: {new Date(reputation.metadata.updatedAt).toLocaleDateString()}
      </div>
    </div>
  );
};

export default ReputationDisplay;
