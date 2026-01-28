import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useLanguage } from '@/hooks/useLanguage';
import { ChartDataPoint } from '@/types';

interface PointsBreakdownProps {
  data: ChartDataPoint[];
}

const COLORS = ['#10b981', '#3fb185', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899'];

export function PointsBreakdown({ data }: PointsBreakdownProps) {
  const { t } = useLanguage();

  const chartData = data.map((item) => ({
    name: t(item.date),
    value: item.value,
  }));

  return (
    <div className="bg-[#111] rounded-2xl p-6">
      <h3 className="text-xl font-semibold text-white mb-6">{t('charts.breakdown')}</h3>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-3 mt-6">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="size-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-sm text-gray-300">{item.name}</span>
            <span className="text-sm font-medium text-white ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
