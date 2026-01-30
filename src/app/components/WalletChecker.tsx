import { useState } from 'react';
import { Search, Shield, Zap, Activity, Globe, Cpu, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import logoImage from '../../assets/logo-new.png';

interface WalletCheckerProps {
  onCheck: (address: string) => void;
}

export function WalletChecker({ onCheck }: WalletCheckerProps) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

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

  const features = [
    { icon: Shield, label: 'Trust Score', description: 'AI-powered reputation analysis', color: 'from-purple-500 to-violet-600' },
    { icon: Activity, label: 'Live Analytics', description: 'Real-time transaction monitoring', color: 'from-cyan-500 to-blue-600' },
    { icon: Globe, label: 'On-Chain Intel', description: 'Deep blockchain intelligence', color: 'from-pink-500 to-rose-600' },
  ];

  return (
    <div className="relative px-2 sm:px-0">
      <div className="text-center mb-8 sm:mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(0, 217, 255, 0.12) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: '0 0 12px #10B981' }} />
          <span 
            className="text-[10px] font-semibold uppercase tracking-[0.3em]" 
            style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-sans)' }}
          >
            Reputation Protocol • Live
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative flex justify-center mb-8"
        >
          <div 
            className="absolute inset-0 rounded-full animate-pulse-glow"
            style={{
              background: 'radial-gradient(circle, rgba(0, 217, 255, 0.5) 0%, rgba(139, 92, 246, 0.3) 40%, transparent 70%)',
              filter: 'blur(40px)',
              transform: 'scale(2)',
            }}
          />
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
            <img 
              src={logoImage} 
              alt="Reputa Score" 
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain animate-float"
              style={{ 
                filter: 'drop-shadow(0 0 25px rgba(0, 217, 255, 0.7)) drop-shadow(0 0 50px rgba(139, 92, 246, 0.4))',
              }}
            />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-2 tracking-tight"
          style={{ 
            color: 'rgba(255, 255, 255, 0.98)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          Scan Your Wallet
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="text-base md:text-lg font-medium mb-4"
          style={{ 
            color: 'rgba(160, 164, 184, 0.85)',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.01em',
          }}
        >
          to get started with us
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-lg md:text-xl lg:text-2xl font-semibold mb-6 animated-gradient-text"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}
        >
          Decode Wallet Behavior
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-sm md:text-base max-w-md mx-auto mb-5 leading-relaxed"
          style={{ color: 'rgba(160, 164, 184, 0.9)', fontFamily: 'var(--font-sans)' }}
        >
          Discover what your Pi Network wallet reveals about trust, consistency, and reputation.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-4 md:gap-6"
        >
          <span className="flex items-center gap-2" style={{ color: 'rgba(160, 164, 184, 0.7)' }}>
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-medium" style={{ fontFamily: 'var(--font-sans)' }}>On-chain intelligence</span>
          </span>
          <span className="hidden md:block w-1 h-1 rounded-full" style={{ background: 'rgba(160, 164, 184, 0.4)' }} />
          <span className="flex items-center gap-2" style={{ color: 'rgba(160, 164, 184, 0.7)' }}>
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium" style={{ fontFamily: 'var(--font-sans)' }}>No private keys needed</span>
          </span>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="max-w-xl mx-auto"
      >
        <div
          className="p-4 sm:p-6 md:p-8 rounded-2xl mx-2 sm:mx-0"
          style={{
            background: isFocused 
              ? 'linear-gradient(145deg, rgba(25, 28, 35, 0.9) 0%, rgba(35, 38, 48, 0.85) 100%)'
              : 'linear-gradient(145deg, rgba(20, 23, 30, 0.8) 0%, rgba(28, 31, 40, 0.75) 100%)',
            border: isFocused 
              ? '1px solid rgba(139, 92, 246, 0.35)'
              : '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: isFocused 
              ? '0 25px 80px rgba(139, 92, 246, 0.15), 0 0 0 1px rgba(139, 92, 246, 0.1)'
              : '0 15px 50px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(20px)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label 
                className="block mb-3 text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(160, 164, 184, 0.8)', fontFamily: 'var(--font-sans)' }}
              >
                Wallet Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="GXXX...XXX"
                  className="w-full pr-14 text-sm uppercase rounded-xl transition-all touch-target"
                  style={{ 
                    height: '52px',
                    padding: '0 56px 0 14px',
                    background: 'rgba(15, 17, 23, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.01em',
                  }}
                />
                <div 
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-lg"
                  style={{ background: 'rgba(139, 92, 246, 0.15)' }}
                >
                  <Search className="w-4 h-4 text-purple-400" />
                </div>
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-xs font-medium flex items-center gap-2"
                  style={{ color: '#EF4444', fontFamily: 'var(--font-sans)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {error}
                </motion.p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                type="submit" 
                className="flex-1 flex items-center justify-center gap-2.5 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all touch-target active:scale-98"
                style={{ 
                  height: '48px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%)',
                  color: 'white',
                  fontFamily: 'var(--font-sans)',
                  boxShadow: '0 8px 30px rgba(139, 92, 246, 0.35)',
                }}
              >
                <Zap className="w-4 h-4" />
                Analyze Wallet
              </button>
              <button 
                type="button" 
                onClick={handleTryDemo}
                className="px-6 rounded-xl font-semibold uppercase tracking-wide text-xs transition-all hover:bg-white/10"
                style={{
                  height: '52px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'rgba(255, 255, 255, 0.75)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Demo
              </button>
            </div>
          </form>
        </div>

        <div 
          className="mt-6 p-5 rounded-2xl flex gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
            border: '1px solid rgba(0, 217, 255, 0.15)',
          }}
        >
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(0, 217, 255, 0.15)' }}
          >
            <Shield className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <p className="font-bold mb-1" style={{ color: 'rgba(0, 217, 255, 0.9)' }}>Privacy First</p>
            <p className="text-sm" style={{ color: 'rgba(160, 164, 184, 0.8)' }}>
              This app only uses public blockchain data. We never ask for private keys or seed phrases.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="grid md:grid-cols-3 gap-5 mt-10 max-w-3xl mx-auto"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 + index * 0.1 }}
            className="kpi-card text-center group cursor-default py-6"
          >
            <div 
              className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3 bg-gradient-to-br ${feature.color} transition-transform group-hover:scale-110`}
              style={{ boxShadow: '0 6px 24px rgba(139, 92, 246, 0.2)' }}
            >
              <feature.icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-bold text-base mb-1.5" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              {feature.label}
            </h3>
            <p className="text-[13px]" style={{ color: 'rgba(160, 164, 184, 0.7)' }}>
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="text-center mt-12"
      >
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <Sparkles className="w-4 h-4 text-green-400" />
          <span className="text-[13px] font-medium" style={{ color: 'rgba(16, 185, 129, 0.9)' }}>
            Powered by Pi Network Blockchain
          </span>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
      </motion.div>
    </div>
  );
}
