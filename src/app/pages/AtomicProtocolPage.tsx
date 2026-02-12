import { useState } from 'react';
import { ArrowLeft, Shield, Zap, TrendingUp, Brain, BookOpen, Clock, Activity, AlertTriangle } from 'lucide-react';
import { 
  ATOMIC_PROTOCOL_CONFIG, 
  ATOMIC_TRUST_LEVEL_COLORS,
  formatAtomicScore 
} from '../protocol/atomicProtocol';

interface AtomicProtocolPageProps {
  onBack: () => void;
}

export function AtomicProtocolPage({ onBack }: AtomicProtocolPageProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');

  const scoringComponents = [
    {
      id: 'wallet-age',
      icon: Clock,
      label: 'Wallet Age',
      weight: `${ATOMIC_PROTOCOL_CONFIG.WEIGHTS.WALLET_AGE * 100}%`,
      description: 'Account maturity and consistency over time',
      details: [
        'Active months tracking',
        'Inactivity penalties',
        'Long-term commitment bonus',
        'Minimum 30 days required',
      ],
    },
    {
      id: 'interaction',
      icon: Activity,
      label: 'Interaction Score',
      weight: `${ATOMIC_PROTOCOL_CONFIG.WEIGHTS.INTERACTION * 100}%`,
      description: 'Daily activity and platform engagement',
      details: [
        'Daily check-ins: 3 pts/day',
        'Ad bonuses: 5 pts each',
        'Report views: 2 pts each',
        'Tool usage tracking',
      ],
    },
    {
      id: 'pi-network',
      icon: Zap,
      label: 'Pi Network Transactions',
      weight: `${ATOMIC_PROTOCOL_CONFIG.WEIGHTS.PI_NETWORK * 100}%`,
      description: 'Internal network activity and payments',
      details: [
        'Internal transactions: +10 pts',
        'App interactions: +5 pts',
        'SDK payments: +15 pts',
        'Payment verification required',
      ],
    },
    {
      id: 'pi-dex',
      icon: TrendingUp,
      label: 'Pi DEX Activity',
      weight: `${ATOMIC_PROTOCOL_CONFIG.WEIGHTS.PI_DEX * 100}%`,
      description: 'Decentralized exchange participation',
      details: [
        'Normal trades: +10 pts',
        'Token diversity bonus: +20%',
        'Regular activity streak bonus',
        'Monthly activity tracking',
      ],
    },
    {
      id: 'staking',
      icon: Shield,
      label: 'Staking Commitment',
      weight: `${ATOMIC_PROTOCOL_CONFIG.WEIGHTS.STAKING * 100}%`,
      description: 'Long-term token commitment',
      details: [
        'Short-term staking: 100-500 pts',
        'Medium-term: 500-1000 pts',
        'Long-term: 1000-2000 pts',
        'Early unlock penalty: -50%',
      ],
    },
  ];

  const penalties = [
    {
      name: 'External Transfer Penalty',
      range: `${ATOMIC_PROTOCOL_CONFIG.PENALTIES.EXTERNAL_TX_MIN}-${ATOMIC_PROTOCOL_CONFIG.PENALTIES.EXTERNAL_TX_MAX} pts`,
      trigger: 'Frequent transfers to exchanges',
      mitigation: 'Reduce off-chain activity',
    },
    {
      name: 'Suspicious Behavior Penalty',
      range: `${ATOMIC_PROTOCOL_CONFIG.PENALTIES.SUSPICIOUS_MIN}-${ATOMIC_PROTOCOL_CONFIG.PENALTIES.SUSPICIOUS_MAX} pts`,
      trigger: 'Spam, farming, or suspicious links',
      mitigation: 'Maintain clean transaction history',
    },
  ];

  const trustLevels = [
    { level: 'Novice', range: '0-10,000', color: ATOMIC_TRUST_LEVEL_COLORS['Novice'] },
    { level: 'Explorer', range: '10,001-50,000', color: ATOMIC_TRUST_LEVEL_COLORS['Explorer'] },
    { level: 'Contributor', range: '50,001-150,000', color: ATOMIC_TRUST_LEVEL_COLORS['Contributor'] },
    { level: 'Verified', range: '150,001-300,000', color: ATOMIC_TRUST_LEVEL_COLORS['Verified'] },
    { level: 'Trusted', range: '300,001-450,000', color: ATOMIC_TRUST_LEVEL_COLORS['Trusted'] },
    { level: 'Ambassador', range: '450,001-600,000', color: ATOMIC_TRUST_LEVEL_COLORS['Ambassador'] },
    { level: 'Elite', range: '600,001-750,000', color: ATOMIC_TRUST_LEVEL_COLORS['Elite'] },
    { level: 'Sentinel', range: '750,001-850,000', color: ATOMIC_TRUST_LEVEL_COLORS['Sentinel'] },
    { level: 'Oracle', range: '850,001-950,000', color: ATOMIC_TRUST_LEVEL_COLORS['Oracle'] },
    { level: 'Atomic Legend', range: '950,001-1,000,000', color: ATOMIC_TRUST_LEVEL_COLORS['Atomic Legend'] },
  ];

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(180deg, #0A0B0F 0%, #0F1117 100%)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            aria-label="Go back"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-400">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">ATOMIC PROTOCOL</h1>
              <p className="text-xs text-gray-400 font-semibold">Ver. 1.0</p>
            </div>
          </div>
        </div>

        {/* Overview Section */}
        <div className="mb-8 p-6 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-cyan-500/10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-purple-400" />
                Unified Reputation System
              </h2>
              <p className="text-gray-400 text-sm max-w-3xl">
                The Atomic Protocol is a unified reputation scoring system that evaluates wallet trustworthiness 
                based on on-chain behavior, consistency, and network participation. All calculations are bound to 
                user identity (username, ID, wallet address) for secure and transparent tracking.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-gray-500 text-xs mb-1">Score Range</p>
              <p className="text-2xl font-bold text-cyan-400">{formatAtomicScore(ATOMIC_PROTOCOL_CONFIG.SCORE_MIN)} - {formatAtomicScore(ATOMIC_PROTOCOL_CONFIG.SCORE_MAX)}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-gray-500 text-xs mb-1">Total Components</p>
              <p className="text-2xl font-bold text-purple-400">5 Categories</p>
            </div>
          </div>
        </div>

        {/* Scoring Components */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Scoring Components
          </h2>

          <div className="grid gap-4">
            {scoringComponents.map((component) => {
              const Icon = component.icon;
              const isExpanded = expandedSection === component.id;

              return (
                <div
                  key={component.id}
                  className="rounded-xl border border-white/10 bg-white/5 overflow-hidden hover:bg-white/10 transition-all"
                >
                  <button
                    onClick={() => setExpandedSection(isExpanded ? null : component.id)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-all text-left"
                  >
                    <Icon className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white">{component.label}</h3>
                      <p className="text-xs text-gray-400 line-clamp-1">{component.description}</p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-xs font-semibold text-purple-300">
                        {component.weight}
                      </span>
                      <Zap className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-white/5 bg-white/2.5 space-y-2">
                      {component.details.map((detail, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                          <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                          {detail}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Trust Levels */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Trust Level Hierarchy
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trustLevels.map((item) => (
              <div
                key={item.level}
                className="p-4 rounded-xl border border-white/10 bg-white/5"
                style={{ borderLeftColor: item.color, borderLeftWidth: '3px' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <h3 className="font-semibold text-white">{item.level}</h3>
                </div>
                <p className="text-sm text-gray-400">{item.range} points</p>
              </div>
            ))}
          </div>
        </div>

        {/* Penalties */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Penalty System
          </h2>

          <div className="space-y-4">
            {penalties.map((penalty, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-white">{penalty.name}</h3>
                  <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-xs font-semibold text-red-300">
                    {penalty.range}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-500">Triggered by:</p>
                    <p className="text-gray-300">{penalty.trigger}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Mitigation:</p>
                    <p className="text-gray-300">{penalty.mitigation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Database Binding */}
        <div className="p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            Data Security & Identity Binding
          </h2>
          <div className="space-y-3 text-sm">
            <p className="text-gray-300">
              All reputation data is securely bound to unique user identity:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-center gap-2 text-gray-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <strong>Username:</strong> Unique account identifier
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <strong>User ID:</strong> Pi Network unique identifier
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <strong>Wallet Address:</strong> On-chain wallet identifier
              </li>
            </ul>
            <p className="text-gray-400 mt-4">
              This triple-binding ensures data integrity, prevents impersonation, and enables accurate 
              reputation tracking across all components.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
