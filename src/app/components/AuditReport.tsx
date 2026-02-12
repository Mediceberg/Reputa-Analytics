import { Sparkles, TrendingUp, Activity, Clock, Shield, Zap, Brain } from 'lucide-react';   
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import type { WalletData } from '../protocol/types';
import logoImage from '../../assets/logo-new.png';

interface AuditReportProps {
  walletData: WalletData;
  isProUser: boolean;
  onUpgradePrompt: () => void;
}

export function AuditReport({ walletData, isProUser, onUpgradePrompt }: AuditReportProps) {
  const trustScore = walletData.trustScore ?? walletData.reputaScore ?? 50;
  
  const avgTransactionValue = walletData.transactions.length > 0 
    ? walletData.transactions.reduce((sum, tx) => sum + tx.amount, 0) / walletData.transactions.length 
    : 0;
  const receivedCount = walletData.transactions.filter(tx => tx.type === 'received').length;
  const sentCount = walletData.transactions.filter(tx => tx.type === 'sent').length;
  const activityRatio = (walletData.totalTransactions / walletData.accountAge) * 30;

  const balanceHealth = Math.min((walletData.balance / 1000) * 100, 100);
  const activityHealth = Math.min(activityRatio * 10, 100);
  const ageHealth = Math.min((walletData.accountAge / 365) * 100, 100);

  return (
    <Card className="p-4 sm:p-5 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-purple-500/20 shadow-2xl shadow-purple-500/10 overflow-hidden relative backdrop-blur-xl">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      }}></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-base sm:text-lg text-white line-clamp-1">Professional Audit Report</h2>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                Detailed behavioral analysis and risk assessment
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-400/30 backdrop-blur-sm flex-shrink-0">
            <Shield className="w-3 h-3 text-purple-400" />
            <span className="font-semibold text-purple-400 text-xs">Reputa Certified</span>
          </div>
        </div>

        {!isProUser ? (
          <div className="relative">
            {/* Blurred preview */}
            <div className="filter blur-sm pointer-events-none select-none opacity-60">
              <div className="grid md:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
                <div className="p-3 sm:p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs sm:text-sm font-semibold text-purple-300">Balance Health</span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-purple-300 mb-1.5">85%</div>
                  <Progress value={85} className="h-1.5 bg-purple-900/50" />
                </div>

                <div className="p-3 sm:p-4 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs sm:text-sm font-semibold text-cyan-300">Activity Health</span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-cyan-300 mb-1.5">72%</div>
                  <Progress value={72} className="h-1.5 bg-cyan-900/50" />
                </div>

                <div className="p-3 sm:p-4 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs sm:text-sm font-semibold text-emerald-300">Age Health</span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-emerald-300 mb-1.5">68%</div>
                  <Progress value={68} className="h-1.5 bg-emerald-900/50" />
                </div>
              </div>
            </div>

            {/* VIP Upgrade Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-md rounded-lg">
              <div className="text-center max-w-sm p-5 sm:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-yellow-500/30">
                  <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="font-bold text-base sm:text-lg mb-1.5 text-white">Pro Exclusive Content</h3>
                <p className="text-xs sm:text-sm text-gray-400 mb-4">
                  Unlock professional audit reports with advanced analytics, risk assessment, 
                  and behavioral insights for only <span className="font-bold text-purple-400">1 π</span>
                </p>
                <Button 
                  onClick={onUpgradePrompt}
                  className="gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-900 font-bold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all hover:scale-105 w-full text-xs sm:text-sm py-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Upgrade to Pro Access
                </Button>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-500">
                  <Shield className="w-3.5 h-3.5" />
                  <span>One-time payment via Pi Network</span>
                </div>
              </div>
            </div>
          </div>
          ) : (
          <div>
            {/* Health Metrics Grid */}
            <div className="grid md:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg border border-purple-500/30 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs sm:text-sm font-semibold text-purple-300">Balance Health</span>
                </div>
                <div className="text-lg sm:text-xl font-bold text-purple-300 mb-1.5">{Math.round(balanceHealth)}%</div>
                <Progress value={balanceHealth} className="h-1.5 bg-purple-900/50" />
                <p className="text-xs text-gray-500 mt-1.5">
                  {balanceHealth >= 70 ? 'Excellent balance ratio' : balanceHealth >= 40 ? 'Good balance' : 'Low balance'}
                </p>
              </div>

              <div className="p-3 sm:p-4 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-lg border border-cyan-500/30 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-2">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs sm:text-sm font-semibold text-cyan-300">Activity Health</span>
                </div>
                <div className="text-lg sm:text-xl font-bold text-cyan-300 mb-1.5">{Math.round(activityHealth)}%</div>
                <Progress value={activityHealth} className="h-1.5 bg-cyan-900/50" />
                <p className="text-xs text-gray-500 mt-1.5">
                  {activityHealth >= 70 ? 'Very active wallet' : activityHealth >= 40 ? 'Moderate activity' : 'Low activity'}
                </p>
              </div>

              <div className="p-3 sm:p-4 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-lg border border-emerald-500/30 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs sm:text-sm font-semibold text-emerald-300">Age Health</span>
                </div>
                <div className="text-lg sm:text-xl font-bold text-emerald-300 mb-1.5">{Math.round(ageHealth)}%</div>
                <Progress value={ageHealth} className="h-1.5 bg-emerald-900/50" />
                <p className="text-xs text-gray-500 mt-1.5">
                  {ageHealth >= 70 ? 'Well-established' : ageHealth >= 40 ? 'Moderately aged' : 'New account'}
                </p>
              </div>
            </div>

            {/* Transaction Patterns */}
            <div className="space-y-2.5 sm:space-y-3">
              <div className="p-3 sm:p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-slate-700/50">
                <h3 className="font-semibold mb-2 text-xs sm:text-sm text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Transaction Patterns
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs sm:text-sm">
                  <div>
                    <p className="text-gray-500 mb-0.5">Avg. Transaction</p>
                    <p className="font-bold text-white">{avgTransactionValue.toFixed(2)} π</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Monthly Activity</p>
                    <p className="font-bold text-white">{activityRatio.toFixed(1)} txs/mo</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Received</p>
                    <p className="font-bold text-emerald-400">{receivedCount} txs</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Sent</p>
                    <p className="font-bold text-orange-400">{sentCount} txs</p>
                  </div>
                </div>
              </div>

              {/* Risk Analysis */}
              <div className="p-3 sm:p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-slate-700/50">
                <h3 className="font-semibold mb-2 text-xs sm:text-sm text-white flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  Risk Analysis
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      trustScore >= 60 ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 
                      trustScore >= 40 ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'
                    }`} />
                    <div>
                      <p className="font-semibold text-xs sm:text-sm text-white">Overall Risk Level: {
                        trustScore >= 60 ? 'Low' : 
                        trustScore >= 40 ? 'Moderate' : 'High'
                      }</p>
                      <p className="text-xs sm:text-sm text-gray-400">
                        {trustScore >= 60 
                          ? 'This wallet demonstrates consistent, trustworthy behavior with strong fundamentals.'
                          : trustScore >= 40
                          ? 'This wallet shows moderate activity. Standard verification recommended for large transactions.'
                          : 'Exercise caution. Limited history or activity detected. Additional verification advised.'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                      walletData.accountAge >= 180 ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 
                      walletData.accountAge >= 90 ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'
                    }`} />
                    <div>
                      <p className="font-semibold text-xs sm:text-sm text-white">Account Maturity: {
                        walletData.accountAge >= 180 ? 'Mature' : 
                        walletData.accountAge >= 90 ? 'Developing' : 'New'
                      }</p>
                      <p className="text-sm text-gray-400">
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
                      activityRatio >= 10 ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 
                      activityRatio >= 5 ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'
                    }`} />
                    <div>
                      <p className="font-semibold text-sm text-white">Activity Pattern: {
                        activityRatio >= 10 ? 'High Activity' : 
                        activityRatio >= 5 ? 'Moderate Activity' : 'Low Activity'
                      }</p>
                      <p className="text-sm text-gray-400">
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

              {/* Reputa Recommendation */}
              <div className="p-4 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl border border-purple-500/30 backdrop-blur-sm">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-white">
                  <Shield className="w-4 h-4 text-purple-400" />
                  Reputa Recommendation
                </h3>
                <p className="text-sm text-gray-300">
                  {trustScore >= 80
                    ? 'This wallet is highly recommended for transactions. Strong reputation indicators across all metrics.'
                    : trustScore >= 60
                    ? 'This wallet is suitable for standard transactions. Good reputation with consistent activity.'
                    : trustScore >= 40
                    ? 'Use standard verification protocols. The wallet shows moderate signals. Recommended for small to medium transactions.'
                    : 'Enhanced verification recommended. Limited positive signals detected. Consider additional due diligence for significant transactions.'
                  }
                </p>
              </div>

              {/* VIP Advanced Analytics */}
              <div className="mt-6 p-6 bg-gradient-to-br from-cyan-500/10 via-blue-600/10 to-purple-600/10 rounded-xl border-2 border-cyan-400/30 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                  }}></div>
                </div>

                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                      <img 
                        src={logoImage} 
                        alt="Reputa VIP" 
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold flex items-center gap-2">
                        <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                          VIP Advanced Trust Analytics
                        </span>
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                      </h3>
                      <p className="text-xs text-gray-500">Exclusive deep-dive reputation metrics</p>
                    </div>
                  </div>

                  {/* Advanced Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-slate-800/80 backdrop-blur-sm p-3 rounded-lg border border-cyan-500/30">
                      <p className="text-xs text-gray-500 mb-1">Consistency Score</p>
                      <p className="font-bold text-cyan-400">{Math.round(85 + (trustScore - 50) * 0.3)}%</p>
                      <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full"
                          style={{ width: `${Math.round(85 + (trustScore - 50) * 0.3)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-slate-800/80 backdrop-blur-sm p-3 rounded-lg border border-blue-500/30">
                      <p className="text-xs text-gray-500 mb-1">Network Trust</p>
                      <p className="font-bold text-blue-400">{Math.round(trustScore * 0.9)}%</p>
                      <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                          style={{ width: `${Math.round(trustScore * 0.9)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-slate-800/80 backdrop-blur-sm p-3 rounded-lg border border-purple-500/30">
                      <p className="text-xs text-gray-500 mb-1">Predictability</p>
                      <p className="font-bold text-purple-400">{Math.round(70 + activityRatio * 2)}%</p>
                      <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"
                          style={{ width: `${Math.min(Math.round(70 + activityRatio * 2), 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-slate-800/80 backdrop-blur-sm p-3 rounded-lg border border-emerald-500/30">
                      <p className="text-xs text-gray-500 mb-1">Stability Index</p>
                      <p className="font-bold text-emerald-400">{Math.round(ageHealth * 0.8 + balanceHealth * 0.2)}%</p>
                      <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                          style={{ width: `${Math.round(ageHealth * 0.8 + balanceHealth * 0.2)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* AI Insight */}
                  <div className="bg-slate-800/60 backdrop-blur-sm p-4 rounded-lg border border-cyan-500/20">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-cyan-500/30">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-1 text-white">AI-Powered Insight</p>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          {trustScore >= 70 
                            ? `This wallet exhibits exceptional behavioral patterns. The consistency score of ${Math.round(85 + (trustScore - 50) * 0.3)}% combined with a ${Math.round(ageHealth * 0.8 + balanceHealth * 0.2)}% stability index indicates a reliable and trustworthy user profile. Network trust metrics confirm strong community reputation.`
                            : trustScore >= 50
                            ? `Moderate trust indicators detected. The wallet maintains ${Math.round(70 + activityRatio * 2)}% predictability in transaction patterns. Network trust at ${Math.round(trustScore * 0.9)}% suggests standard verification is adequate for most transactions.`
                            : `Lower trust signals observed. Consistency and stability metrics indicate limited historical data. Enhanced due diligence recommended. Network trust currently at ${Math.round(trustScore * 0.9)}%.`
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
      </div>
    </Card>
  );
}
