import type { WeekStats } from '../types/plan';

interface StatsCardProps {
  stats: WeekStats;
  dateRange: string;
}

export default function StatsCard({ stats, dateRange }: StatsCardProps) {
  const winRatePercent = (stats.winRate * 100).toFixed(1);
  const plDisplay =
    stats.totalProfitLoss >= 0
      ? `+${stats.totalProfitLoss.toFixed(2)}%`
      : `${stats.totalProfitLoss.toFixed(2)}%`;
  const plColor = stats.totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">📊 本周概览</h2>
        <span className="text-sm text-slate-400">{dateRange}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{stats.totalTrades}</div>
          <div className="text-sm text-slate-400">总交易</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.openPositions}</div>
          <div className="text-sm text-slate-400">持仓中</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {stats.closedPositions > 0 ? `${winRatePercent}%` : '-'}
          </div>
          <div className="text-sm text-slate-400">
            胜率 ({stats.winCount}/{stats.closedPositions})
          </div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${plColor}`}>
            {stats.closedPositions > 0 ? plDisplay : '-'}
          </div>
          <div className="text-sm text-slate-400">总盈亏</div>
        </div>
      </div>
    </div>
  );
}
