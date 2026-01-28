import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useLanguage } from '@/hooks/useLanguage';
import { ChartDataPoint } from '@/types';

interface TokenPortfolioProps {
  data: ChartDataPoint[];
}

const COLORS = ['#FAC515', '#3fb185', '#8b5cf6', '#ec4899', '#06b6d4'];

export function TokenPortfolio({ data }: TokenPortfolioProps) {
  const { t } = useLanguage();

  const chartData = data.map((item) => ({
    name: item.date,
    value: item.value,
    label: item.label,
  }));

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-[#111] rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white">{t('charts.portfolio')}</h3>
        <div className="text-right">
          <p className="text-sm text-gray-400">{t('dex.value')}</p>
          <p className="text-2xl font-bold text-white">
            {totalValue.toFixed(2)} <span className="text-[#FAC515]">π</span>
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="name" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [`${value.toFixed(2)} π`, 'Value']}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-3 mt-6">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="size-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-sm text-gray-300">{item.name}</span>
            <span className="text-sm font-medium text-white ml-auto">
              {item.value.toFixed(2)} π
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
