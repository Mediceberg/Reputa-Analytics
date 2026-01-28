import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/hooks/useLanguage';
import { ChartDataPoint, TimeFilter } from '@/types';

interface TransactionTimelineProps {
  internal: ChartDataPoint[];
  external: ChartDataPoint[];
  onFilterChange: (period: TimeFilter['period']) => void;
}

export function TransactionTimeline({ internal, external, onFilterChange }: TransactionTimelineProps) {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<TimeFilter['period']>('week');

  const filters: TimeFilter[] = [
    { period: 'day', label: t('charts.filter.day') },
    { period: 'week', label: t('charts.filter.week') },
    { period: 'month', label: t('charts.filter.month') },
  ];

  const data = internal.map((item, index) => ({
    date: item.date,
    internal: item.value,
    external: external[index]?.value || 0,
  }));

  const handleFilterChange = (newPeriod: TimeFilter['period']) => {
    setPeriod(newPeriod);
    onFilterChange(newPeriod);
  };

  return (
    <div className="bg-[#111] rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white">{t('charts.timeline')}</h3>
        <div className="flex gap-2">
          {filters.map((filter) => (
            <button
              key={filter.period}
              onClick={() => handleFilterChange(filter.period)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                period === filter.period
                  ? 'bg-[#FAC515] text-black font-medium'
                  : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="date" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="internal"
            name={t('charts.transactions.internal')}
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="external"
            name={t('charts.transactions.external')}
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
