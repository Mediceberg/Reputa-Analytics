import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell } from 'recharts';
import { useLanguage } from '../../hooks/useLanguage';
import { ChartDataPoint } from '../../protocol/types';

interface RiskActivityProps {
  data: ChartDataPoint[];
}

export function RiskActivity({ data }: RiskActivityProps) {
  const { t } = useLanguage();

  const getColor = (type?: string) => {
    switch (type) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#3fb185';
    }
  };

  const chartData = data.map((item, index) => ({
    x: index + 1,
    y: item.value,
    z: parseInt(item.label?.match(/\d+/)?.[0] || '0'),
    color: getColor(item.type),
  }));

  return (
    <div className="bg-[#111] rounded-2xl p-6 border border-white/10">
      <h3 className="text-xl font-semibold text-white mb-6">{t('charts.risk')}</h3>

      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            type="number"
            dataKey="x"
            name="Period"
            stroke="#888"
            label={{ value: 'Time Period', position: 'bottom', fill: '#888' }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Activity"
            stroke="#888"
            label={{ value: 'Activity Level', angle: -90, position: 'left', fill: '#888' }}
          />
          <ZAxis type="number" dataKey="z" range={[50, 400]} name="Risk" />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'Activity') return [value, 'Transactions'];
              return [value, name];
            }}
          />
          <Scatter name="Risk vs Activity" data={chartData} fill="#8884d8">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <div className="flex justify-center gap-6 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#10b981]" />
          <span className="text-sm text-gray-300">Low Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
          <span className="text-sm text-gray-300">Medium Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
          <span className="text-sm text-gray-300">High Risk</span>
        </div>
      </div>
    </div>
  );
}
