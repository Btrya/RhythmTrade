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
  const isProfit = stats.totalProfitLoss >= 0;

  // 胜率进度条
  const winRateWidth = stats.closedPositions > 0 ? stats.winRate * 100 : 0;

  return (
    <div className="glass-card rounded-2xl p-6 card-enter relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#00f5d4]/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#9b5de5]/5 to-transparent rounded-full blur-3xl" />

      {/* 头部 */}
      <div className="flex items-center justify-between mb-6 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f5d4] to-[#00bbf9] flex items-center justify-center">
            <svg
              className="w-5 h-5 text-[#0a0e17]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold">本周概览</h2>
            <span className="text-xs text-[#64748b]">{dateRange}</span>
          </div>
        </div>

        {/* 总盈亏高亮显示 */}
        {stats.closedPositions > 0 && (
          <div className={`text-right ${isProfit ? 'profit-value' : 'loss-value'}`}>
            <div className="text-2xl font-bold number-ticker">{plDisplay}</div>
            <div className="text-xs opacity-70">总盈亏</div>
          </div>
        )}
      </div>

      {/* 统计网格 */}
      <div className="grid grid-cols-4 gap-4 relative">
        {/* 总交易 */}
        <div className="bg-[#111827]/60 rounded-xl p-4 text-center border border-[#ffffff08]">
          <div className="text-3xl font-bold gradient-text number-ticker">{stats.totalTrades}</div>
          <div className="text-xs text-[#64748b] mt-1 uppercase tracking-wider">总交易</div>
        </div>

        {/* 持仓中 */}
        <div className="bg-[#111827]/60 rounded-xl p-4 text-center border border-[#ffffff08] relative overflow-hidden">
          {stats.openPositions > 0 && (
            <div className="absolute inset-0 bg-[#00bbf9]/5 animate-pulse" />
          )}
          <div className="text-3xl font-bold text-[#00bbf9] number-ticker relative">
            {stats.openPositions}
          </div>
          <div className="text-xs text-[#64748b] mt-1 uppercase tracking-wider relative">
            持仓中
          </div>
        </div>

        {/* 胜率 */}
        <div className="bg-[#111827]/60 rounded-xl p-4 text-center border border-[#ffffff08]">
          <div className="text-3xl font-bold text-white number-ticker">
            {stats.closedPositions > 0 ? `${winRatePercent}%` : '-'}
          </div>
          <div className="text-xs text-[#64748b] mt-1 uppercase tracking-wider">胜率</div>
          {/* 胜率进度条 */}
          {stats.closedPositions > 0 && (
            <div className="mt-2 h-1 bg-[#1a1f2e] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00ff88] to-[#00f5d4] transition-all duration-1000 ease-out"
                style={{ width: `${winRateWidth}%` }}
              />
            </div>
          )}
        </div>

        {/* 胜/负场 */}
        <div className="bg-[#111827]/60 rounded-xl p-4 text-center border border-[#ffffff08]">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-[#00ff88] number-ticker">
              {stats.winCount}
            </span>
            <span className="text-[#64748b]">/</span>
            <span className="text-2xl font-bold text-[#ff3366] number-ticker">
              {stats.lossCount}
            </span>
          </div>
          <div className="text-xs text-[#64748b] mt-1 uppercase tracking-wider">胜/负</div>
        </div>
      </div>

      {/* 底部装饰线 */}
      <div className="mt-6 h-px bg-gradient-to-r from-transparent via-[#00f5d4]/30 to-transparent" />
    </div>
  );
}
