import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartDataPoint } from '../../protocol/types';
import { useLanguage } from '../../hooks/useLanguage';
import { PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

interface TokenPortfolioProps {
  data: ChartDataPoint[];
}

const COLORS = ['#00D9FF', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899'];

export function TokenPortfolio({ data }: TokenPortfolioProps) {
  const { t } = useLanguage();
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="glass-card p-6 flex flex-col min-h-[500px] border border-white/10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <PieChartIcon className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">
              Portfolio Allocation
            </h3>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Asset Distribution</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Net Worth</p>
          <p className="font-black text-xl neon-text-cyan">
            {total.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs text-cyan-400">π</span>
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full h-[240px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={75}
                outerRadius={95}
                paddingAngle={6}
                dataKey="value"
                stroke="none"
              >
                {data.map((_entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ filter: `drop-shadow(0 0 8px ${COLORS[index % COLORS.length]}40)` }}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(10, 11, 15, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <TrendingUp className="w-5 h-5 text-cyan-400 mb-1 opacity-50" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Growth</span>
            <span className="text-lg font-black text-white">+12.5%</span>
          </div>
        </div>

        <div className="w-full grid grid-cols-2 gap-3 mt-8">
          {data.slice(0, 4).map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={index} className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/20 transition-all">
                <div 
                  className="w-2 h-2 rounded-full shrink-0 shadow-lg" 
                  style={{ 
                    backgroundColor: COLORS[index % COLORS.length],
                    boxShadow: `0 0 8px ${COLORS[index % COLORS.length]}`
                  }}
                />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[10px] font-black text-white uppercase truncate tracking-wide">{item.date}</span>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-gray-500">{percentage}%</span>
                    <span className="text-[9px] font-black text-cyan-400/80">{item.value.toLocaleString()} π</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
