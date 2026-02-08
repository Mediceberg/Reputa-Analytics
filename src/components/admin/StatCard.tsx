'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: 'emerald' | 'cyan' | 'purple' | 'blue';
  suffix?: string;
  index: number;
}

const colorMap = {
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: 'text-emerald-400',
    text: 'text-emerald-300',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    icon: 'text-cyan-400',
    text: 'text-cyan-300',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: 'text-purple-400',
    text: 'text-purple-300',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: 'text-blue-400',
    text: 'text-blue-300',
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  color,
  suffix = '',
  index,
}: StatCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={`${colors.bg} border ${colors.border} rounded-xl p-6 backdrop-blur-sm hover:scale-105 transition-transform duration-300`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.2 }}
            className={`${colors.text} text-3xl font-bold mt-2`}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && <span className="text-lg ml-1">{suffix}</span>}
          </motion.p>
        </div>
        <div className={`${colors.icon} p-3 bg-black/30 rounded-lg`}>
          <Icon size={32} />
        </div>
      </div>
    </motion.div>
  );
}
