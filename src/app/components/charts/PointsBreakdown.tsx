import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useLanguage } from '../../hooks/useLanguage';
import { ChartDataPoint } from '../../protocol/types';

interface PointsBreakdownProps {
  data: ChartDataPoint[];
}

const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899'];

export function PointsBreakdown({ data }: PointsBreakdownProps) {
  const { t } = useLanguage();

  const chartData = data.map((item) => ({
    name: t(item.date),
    value: item.value,
  }));

  return (
    <div className="glass-card p-6 border border-white/10 flex flex-col h-full">
      <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
        <div className="w-1 h-4 bg-purple-500 rounded-full" />
        {t('charts.breakdown')}
      </h3>

      <div className="flex-1 flex flex-col md:flex-row items-center gap-6">
        <div className="w-full h-[220px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((_entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 17, 23, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total</span>
            <span className="text-xl font-black text-white">100%</span>
          </div>
        </div>

        <div className="w-full space-y-3">
          {chartData.map((item, index) => (
            <div key={index} className="group p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-2.5 h-2.5 rounded-sm shadow-sm"
                  style={{ 
                    backgroundColor: COLORS[index % COLORS.length],
                    boxShadow: `0 0 10px ${COLORS[index % COLORS.length]}40`
                  }}
                />
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide group-hover:text-white transition-colors">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${(item.value / chartData.reduce((acc, curr) => acc + curr.value, 0) * 100)}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  />
                </div>
                <span className="text-[11px] font-black text-white">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
