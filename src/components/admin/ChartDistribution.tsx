'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

interface ChartDistributionProps {
  data: {
    high: number;
    medium: number;
    low: number;
  };
}

export function ChartDistribution({ data }: ChartDistributionProps) {
  const chartData = [
    {
      name: 'عالي (>80)',
      count: data.high,
      fill: '#10b981',
    },
    {
      name: 'متوسط (40-80)',
      count: data.medium,
      fill: '#06b6d4',
    },
    {
      name: 'منخفض (<40)',
      count: data.low,
      fill: '#6b7280',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-slate-900/50 border border-emerald-500/20 rounded-xl p-6 backdrop-blur-sm"
    >
      <h3 className="text-xl font-bold text-emerald-300 mb-4">📊 توزيع المستخدمين حسب السكور</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #10b981',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#10b981' }}
            formatter={(value: number) => `${value} مستخدم`}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* الإحصائيات */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {chartData.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="flex items-center gap-3"
          >
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: item.fill }}
            />
            <div>
              <p className="text-gray-400 text-sm">{item.name}</p>
              <p className="text-lg font-bold" style={{ color: item.fill }}>
                {item.count}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
