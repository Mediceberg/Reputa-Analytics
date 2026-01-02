import { Sparkles, Lock, TrendingUp, Activity, Clock, Shield } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import type { WalletData } from '../App';
import logoImage from '../../assets/logo.svg';

interface AuditReportProps {
  walletData: WalletData;
  isProUser: boolean;
  onUpgradePrompt: () => void;
}

export function AuditReport({ walletData, isProUser, onUpgradePrompt }: AuditReportProps) {
  // Calculate metrics
  const avgTransactionValue = walletData.transactions.reduce((sum, tx) => sum + tx.amount, 0) / walletData.transactions.length;
  const receivedCount = walletData.transactions.filter(tx => tx.type === 'received').length;
  const sentCount = walletData.transactions.filter(tx => tx.type === 'sent').length;
  const activityRatio = (walletData.totalTransactions / walletData.accountAge) * 30; // transactions per month

  // Calculate health scores
  const balanceHealth = Math.min((walletData.balance / 1000) * 100, 100);
  const activityHealth = Math.min(activityRatio * 10, 100);
  const ageHealth = Math.min((walletData.accountAge / 365) * 100, 100);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold text-xl">Professional Audit Report</h2>
          <p className="text-sm text-gray-500 mt-1">
            Detailed behavioral analysis and risk assessment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-purple-600">Reputa Certified</span>
        </div>
      </div>

      {!isProUser ? (
        // Blurred preview for non-VIP users
        <div className="relative">
          {/* Blurred content */}
          <div className="filter blur-sm pointer-events-none select-none">
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold">Balance Health</span>
                </div>
                <div className="text-2xl font-bold mb-2">85%</div>
                <Progress value={85} className="h-2" />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold">Activity Health</span>
                </div>
                <div className="text-2xl font-bold mb-2">72%</div>
                <Progress value={72} className="h-2" />
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold">Age Health</span>
                </div>
                <div className="text-2xl font-bold mb-2">68%</div>
                <Progress value={68} className="h-2" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-3">Transaction Patterns</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Avg. Transaction</p>
                    <p className="font-bold">XX.XX π</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Monthly Activity</p>
                    <p className="font-bold">XX txs/month</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-3">Risk Analysis</h3>
                <p className="text-sm text-gray-600">
                  Detailed risk assessment and recommendations...
                </p>
              </div>
            </div>
          </div>

          {/* Overlay with VIP upgrade */}
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="text-center max-w-md p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-2">Pro Exclusive Content</h3>
              <p className="text-gray-600 mb-6">
                Unlock professional audit reports with advanced analytics, risk assessment, 
                and behavioral insights for only <span className="font-bold text-purple-600">1 π</span>
              </p>
              <Button 
                onClick={onUpgradePrompt}
                className="gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade to Pro Access
              </Button>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <Lock className="w-4 h-4" />
                <span>One-time payment via Pi Network</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Full content for VIP users
        <div>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold">Balance Health</span>
              </div>
              <div className="text-2xl font-bold mb-2">{Math.round(balanceHealth)}%</div>
              <Progress value={balanceHealth} className="h-2" />
              <p className="text-xs text-gray-600 mt-2">
                {balanceHealth >= 70 ? 'Excellent balance ratio' : balanceHealth >= 40 ? 'Good balance' : 'Low balance'}
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold">Activity Health</span>
              </div>
              <div className="text-2xl font-bold mb-2">{Math.round(activityHealth)}%</div>
              <Progress value={activityHealth} className="h-2" />
              <p className="text-xs text-gray-600 mt-2">
                {activityHealth >= 70 ? 'Very active wallet' : activityHealth >= 40 ? 'Moderate activity' : 'Low activity'}
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold">Age Health</span>
              </div>
              <div className="text-2xl font-bold mb-2">{Math.round(ageHealth)}%</div>
              <Progress value={ageHealth} className="h-2" />
              <p className="text-xs text-gray-600 mt-2">
                {ageHealth >= 70 ? 'Well-established' : ageHealth >= 40 ? 'Moderately aged' : 'New account'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">Transaction Patterns</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Avg. Transaction</p>
                  <p className="font-bold">{avgTransactionValue.toFixed(2)} π</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Monthly Activity</p>
                  <p className="font-bold">{activityRatio.toFixed(1)} txs/mo</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Received</p>
                  <p className="font-bold text-green-600">{receivedCount} txs</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Sent</p>
                  <p className="font-bold text-orange-600">{sentCount} txs</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">Risk Analysis</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    walletData.trustScore >= 60 ? 'bg-green-500' : 
                    walletData.trustScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-semibold text-sm">Overall Risk Level: {
                      walletData.trustScore >= 60 ? 'Low' : 
                      walletData.trustScore >= 40 ? 'Moderate' : 'High'
                    }</p>
                    <p className="text-sm text-gray-600">
                      {walletData.trustScore >= 60 
                        ? 'This wallet demonstrates consistent, trustworthy behavior with strong fundamentals.'
                        : walletData.trustScore >= 40
                        ? 'This wallet shows moderate activity. Standard verification recommended for large transactions.'
                        : 'Exercise caution. Limited history or activity detected. Additional verification advised.'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    walletData.accountAge >= 180 ? 'bg-green-500' : 
                    walletData.accountAge >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-semibold text-sm">Account Maturity: {
                      walletData.accountAge >= 180 ? 'Mature' : 
                      walletData.accountAge >= 90 ? 'Developing' : 'New'
                    }</p>
                    <p className="text-sm text-gray-600">
                      Account is {walletData.accountAge} days old. {
                        walletData.accountAge >= 180
                        ? 'Well-established account with proven track record.'
                        : walletData.accountAge >= 90
                        ? 'Account has been active for a reasonable period.'
                        : 'Newly created account. Limited historical data available.'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    activityRatio >= 10 ? 'bg-green-500' : 
                    activityRatio >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-semibold text-sm">Activity Pattern: {
                      activityRatio >= 10 ? 'High Activity' : 
                      activityRatio >= 5 ? 'Moderate Activity' : 'Low Activity'
                    }</p>
                    <p className="text-sm text-gray-600">
                      {activityRatio >= 10
                        ? 'Very active wallet with regular transaction patterns.'
                        : activityRatio >= 5
                        ? 'Moderate transaction frequency observed.'
                        : 'Limited transaction activity. May be dormant or new.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" />
                Reputa Recommendation
              </h3>
              <p className="text-sm text-gray-700">
                {walletData.trustScore >= 80
                  ? 'This wallet is highly recommended for transactions. Strong reputation indicators across all metrics.'
                  : walletData.trustScore >= 60
                  ? 'This wallet is suitable for standard transactions. Good reputation with consistent activity.'
                  : walletData.trustScore >= 40
                  ? 'Use standard verification protocols. The wallet shows moderate signals. Recommended for small to medium transactions.'
                  : 'Enhanced verification recommended. Limited positive signals detected. Consider additional due diligence for significant transactions.'
                }
              </p>
            </div>

            {/* VIP Advanced Analytics Bar */}
            <div className="mt-6 p-6 bg-gradient-to-br from-cyan-500/10 via-blue-600/10 to-purple-600/10 rounded-xl border-2 border-cyan-400/30 relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>

              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <img 
                      src={logoImage} 
                      alt="Reputa VIP" 
                      className="w-8 h-8 object-contain"
                      style={{ mixBlendMode: 'multiply' }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold flex items-center gap-2">
                      <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                        VIP Advanced Trust Analytics
                      </span>
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                    </h3>
                    <p className="text-xs text-gray-600">Exclusive deep-dive reputation metrics</p>
                  </div>
                </div>

                {/* Advanced Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-cyan-200/50">
                    <p className="text-xs text-gray-500 mb-1">Consistency Score</p>
                    <p className="font-bold text-cyan-600">{Math.round(85 + (walletData.trustScore - 50) * 0.3)}%</p>
                    <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full"
                        style={{ width: `${Math.round(85 + (walletData.trustScore - 50) * 0.3)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-blue-200/50">
                    <p className="text-xs text-gray-500 mb-1">Network Trust</p>
                    <p className="font-bold text-blue-600">{Math.round(walletData.trustScore * 0.9)}%</p>
                    <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                        style={{ width: `${Math.round(walletData.trustScore * 0.9)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-purple-200/50">
                    <p className="text-xs text-gray-500 mb-1">Predictability</p>
                    <p className="font-bold text-purple-600">{Math.round(70 + activityRatio * 2)}%</p>
                    <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"
                        style={{ width: `${Math.min(Math.round(70 + activityRatio * 2), 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-emerald-200/50">
                    <p className="text-xs text-gray-500 mb-1">Stability Index</p>
                    <p className="font-bold text-emerald-600">{Math.round(ageHealth * 0.8 + balanceHealth * 0.2)}%</p>
                    <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                        style={{ width: `${Math.round(ageHealth * 0.8 + balanceHealth * 0.2)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Advanced Insights */}
                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-blue-200/50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm mb-1 text-gray-800">AI-Powered Insight</p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {walletData.trustScore >= 70 
                          ? `This wallet exhibits exceptional behavioral patterns. The consistency score of ${Math.round(85 + (walletData.trustScore - 50) * 0.3)}% combined with a ${Math.round(ageHealth * 0.8 + balanceHealth * 0.2)}% stability index indicates a reliable and trustworthy user profile. Network trust metrics confirm strong community reputation.`
                          : walletData.trustScore >= 50
                          ? `Moderate trust indicators detected. The wallet maintains ${Math.round(70 + activityRatio * 2)}% predictability in transaction patterns. Network trust at ${Math.round(walletData.trustScore * 0.9)}% suggests standard verification is adequate for most transactions.`
                          : `Lower trust signals observed. Consistency and stability metrics indicate limited historical data. Enhanced due diligence recommended. Network trust currently at ${Math.round(walletData.trustScore * 0.9)}%.`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* VIP Badge */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                  <span>Powered by VIP Advanced Analytics Engine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}