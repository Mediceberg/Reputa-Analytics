import { useState } from 'react';
import { Search, Shield, Info, Zap, Globe, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import logoImage from '../../assets/logo.png';

interface WalletCheckerProps {
  onCheck: (address: string) => void;
}

export function WalletChecker({ onCheck }: WalletCheckerProps) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanAddress = address.trim().toUpperCase();

    if (!cleanAddress) {
      setError('Please enter a wallet address');
      return;
    }

    if (!cleanAddress.startsWith('G')) {
      setError('Pi Network addresses must start with "G"');
      return;
    }

    if (cleanAddress.length !== 56) {
      setError('Invalid address length. Pi addresses are exactly 56 characters.');
      return;
    }

    const base32Regex = /^[A-Z2-7]+$/;
    if (!base32Regex.test(cleanAddress)) {
      setError('Invalid characters detected in wallet address.');
      return;
    }

    setError('');
    onCheck(cleanAddress);
  };

  const handleTryDemo = () => {
    setError('');
    onCheck('demo');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-full border border-purple-200/50 mb-6">
          <Shield className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-bold text-purple-700 uppercase tracking-widest">Reputation Protocol</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tight">
          Scan Any Wallet
        </h1>
        
        <div className="inline-flex items-center justify-center mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-purple-600/30 blur-3xl rounded-full scale-150"></div>
          <div className="relative z-10 p-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl border border-cyan-500/20">
            <img 
              src={logoImage} 
              alt="Reputa Score" 
              className="w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]"
            />
          </div>
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Decode Wallet Behavior
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-2">
          Discover what your Pi Network wallet reveals about trust, consistency, and reputation.
        </p>
        <p className="text-sm text-gray-400 max-w-xl mx-auto">
          Advanced on-chain intelligence • No private keys required
        </p>
      </div>

      <Card className="p-8 shadow-2xl border-2 border-purple-100/50 bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="wallet-address" className="block mb-2 font-bold text-gray-700 text-sm uppercase tracking-wide">
              Enter Wallet Address
            </label>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative">
                <Input
                  id="wallet-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  className="pr-12 h-14 text-lg font-mono uppercase focus:ring-purple-500 border-gray-200 bg-white/80"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 font-medium animate-pulse">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button 
              type="submit" 
              className="flex-1 h-14 bg-gradient-to-r from-purple-600 via-purple-700 to-cyan-600 hover:from-purple-700 hover:via-purple-800 hover:to-cyan-700 transition-all shadow-lg shadow-purple-500/25 active:scale-[0.98] text-white font-bold text-sm uppercase tracking-wide"
            >
              <Zap className="w-4 h-4 mr-2" />
              Analyze Wallet
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleTryDemo}
              className="h-14 border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 font-bold text-gray-600 px-6"
            >
              Try Demo
            </Button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-200/50">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-cyan-600" />
            </div>
            <div className="text-sm">
              <p className="font-bold text-cyan-900 mb-1">Privacy First</p>
              <p className="text-cyan-700">
                This app only uses public blockchain data. We never ask for private keys or seed phrases.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <Card className="p-6 text-center hover:border-purple-300 transition-all hover:shadow-xl hover:-translate-y-1 cursor-default bg-gradient-to-br from-white to-purple-50/50 border-purple-100">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-bold mb-2 text-gray-900">Trust Score</h3>
          <p className="text-sm text-gray-600">
            Advanced algorithm evaluating wallet reputation
          </p>
        </Card>

        <Card className="p-6 text-center hover:border-cyan-300 transition-all hover:shadow-xl hover:-translate-y-1 cursor-default bg-gradient-to-br from-white to-cyan-50/50 border-cyan-100">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/25">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-bold mb-2 text-gray-900">Transaction History</h3>
          <p className="text-sm text-gray-600">
            View recent wallet activity and patterns
          </p>
        </Card>

        <Card className="p-6 text-center hover:border-amber-300 transition-all hover:shadow-xl hover:-translate-y-1 cursor-default bg-gradient-to-br from-white to-amber-50/50 border-amber-100">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/25">
            <Globe className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-bold mb-2 text-gray-900">Instant Analysis</h3>
          <p className="text-sm text-gray-600">
            Get results in milliseconds from blockchain
          </p>
        </Card>
      </div>
    </div>
  );
}
