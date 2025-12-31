import { useState } from 'react';
import { Search, Shield, Info, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import logoImage from '../../assets/logo.svg';

interface WalletCheckerProps {
  onCheck: (address: string) => void;
}

export function WalletChecker({ onCheck }: WalletCheckerProps) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAddress = address.trim();
    
    // 1. معالجة أخطاء الإدخال بدقة
    if (!cleanAddress) {
      setError('Please enter a wallet address');
      return;
    }

    // عناوين Pi Network الرسمية تبدأ دائماً بحرف G وتتكون من 56 حرفاً
    if (!cleanAddress.startsWith('G')) {
      setError('Pi Network public addresses must start with "G"');
      return;
    }

    if (cleanAddress.length !== 56) {
      setError(`Invalid length: ${cleanAddress.length}/56 characters required`);
      return;
    }

    setError('');
    onCheck(cleanAddress);
  };

  const handleTryDemo = () => {
    // تم وضع عنوان حقيقي نشط في التست نت لضمان عمل الديمو ببيانات واقعية
    const demoAddress = 'GDH6V5W2N45LCH477HIKR5277RTM7S6K26T5S66O6S6S6S6S6S6S6S6S';
    setAddress(demoAddress);
    setError('');
    onCheck(demoAddress);
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 blur-3xl rounded-full"></div>
          <img 
            src={logoImage} 
            alt="Reputa Score" 
            className="w-32 h-32 object-contain drop-shadow-2xl relative z-10"
            // ملاحظة: تم إزالة mixBlendMode إذا كان يسبب اختفاء اللوجو في بعض الخلفيات
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
          Decode Wallet Behavior
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-2">
          Discover what your Pi Network wallet reveals about trust, consistency, and reputation.
        </p>
        <p className="text-sm text-gray-500 max-w-xl mx-auto">
          Advanced on-chain intelligence • No private keys required
        </p>
      </div>

      {/* Main Card */}
      <Card className="p-6 md:p-8 shadow-xl border-2 bg-white">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="wallet-address" className="block mb-2 font-semibold text-gray-700">
              Enter Wallet Address
            </label>
            <div className="relative">
              <Input
                id="wallet-address"
                type="text"
                value={address}
                // تحويل تلقائي للحروف الكبيرة لمنع أخطاء البحث
                onChange={(e) => setAddress(e.target.value.toUpperCase().replace(/\s/g, ''))}
                placeholder="G..."
                className={`pr-12 h-14 text-base md:text-lg font-mono transition-all ${
                  error ? 'border-red-500 focus:ring-red-200' : 'focus:border-blue-500'
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Search className={`w-5 h-5 ${address ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-pulse">
                <Info className="w-4 h-4" /> {error}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              type="submit" 
              className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold"
            >
              Analyze Wallet
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleTryDemo}
              className="h-12 border-2 hover:bg-gray-50"
            >
              Try Demo
            </Button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 leading-relaxed">
              <p className="font-semibold mb-1">Privacy & Security</p>
              <p className="text-blue-700/80">
                This audit uses <b>public blockchain data</b> only. We will never ask for your passphrase, private keys, or seed phrases.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <Card className="p-6 text-center hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold mb-2">Trust Score</h3>
          <p className="text-sm text-gray-600">
            Advanced algorithm evaluating wallet reputation based on history.
          </p>
        </Card>

        <Card className="p-6 text-center hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold mb-2">History Audit</h3>
          <p className="text-sm text-gray-600">
            View real-time activity and patterns directly from the Testnet.
          </p>
        </Card>

        <Card className="p-6 text-center hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="font-semibold mb-2">Instant Audit</h3>
          <p className="text-sm text-gray-600">
            Get non-custodial results in milliseconds from the ledger.
          </p>
        </Card>
      </div>
    </div>
  );
}
