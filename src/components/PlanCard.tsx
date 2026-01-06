import { Link } from 'react-router-dom';
import type { TradePlan } from '../types/plan';
import {
  getStatusLabel,
  getDirectionLabel,
  calculateHoldingDuration,
  TIME_FRAME_LABELS,
} from '../types/plan';

interface PlanCardProps {
  plan: TradePlan;
  weekId: string;
  index?: number;
}

export default function PlanCard({ plan, weekId, index = 0 }: PlanCardProps) {
  const isLong = plan.direction === 'long';
  const isProfit = (plan.profitLoss ?? 0) >= 0;

  const profitDisplay =
    plan.status === 'closed' && plan.profitLoss !== undefined
      ? plan.profitLoss >= 0
        ? `+${plan.profitLoss.toFixed(2)}%`
        : `${plan.profitLoss.toFixed(2)}%`
      : null;

  const holdingDuration =
    plan.openedAt && (plan.status === 'open' || plan.status === 'closed')
      ? calculateHoldingDuration(plan.openedAt, plan.closedAt)
      : null;

  // 状态样式
  const getStatusClass = () => {
    if (plan.status === 'planned') return 'status-planned';
    if (plan.status === 'open') return 'status-open';
    if (plan.status === 'cancelled') return 'status-cancelled';
    if (plan.status === 'closed') {
      return isProfit ? 'status-closed-win' : 'status-closed-loss';
    }
    return '';
  };

  // 计算盈亏比
  const riskReward = () => {
    const entry = plan.plannedEntry;
    const sl = plan.stopLoss;
    const tp = plan.takeProfit;
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    if (risk === 0) return '-';
    return `1:${(reward / risk).toFixed(1)}`;
  };

  return (
    <Link
      to={`/plan/${plan.id}?week=${weekId}`}
      className="block glass-card rounded-xl p-5 card-enter"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* 顶部：标的 + 方向 + 状态 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* 标的图标 */}
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
              isLong ? 'bg-[#00ff88]/20' : 'bg-[#ff3366]/20'
            }`}
          >
            {plan.symbol.slice(0, 2)}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-wide">{plan.symbol}</span>
              <span className={isLong ? 'direction-long' : 'direction-short'}>
                {getDirectionLabel(plan.direction)}
              </span>
              {plan.timeFrame && (
                <span className="text-xs text-[#94a3b8] bg-[#1a1f2e] px-2 py-1 rounded">
                  {TIME_FRAME_LABELS[plan.timeFrame]}
                </span>
              )}
            </div>
            {holdingDuration && (
              <div className="text-xs text-[#64748b] mt-1">
                <span className="text-[#00bbf9]">{holdingDuration}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {profitDisplay && (
            <span
              className={`text-xl font-bold number-ticker ${
                isProfit ? 'profit-value' : 'loss-value'
              }`}
            >
              {profitDisplay}
            </span>
          )}
          <span className={`status-badge ${getStatusClass()}`}>{getStatusLabel(plan.status)}</span>
        </div>
      </div>

      {/* 价格信息网格 */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-[#111827]/50 rounded-lg p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-[#64748b] mb-1">入场</div>
          <div className="text-sm font-semibold number-ticker">{plan.plannedEntry}</div>
        </div>
        <div className="bg-[#111827]/50 rounded-lg p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-[#64748b] mb-1">止损</div>
          <div className="text-sm font-semibold text-[#ff3366] number-ticker">{plan.stopLoss}</div>
        </div>
        <div className="bg-[#111827]/50 rounded-lg p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-[#64748b] mb-1">止盈</div>
          <div className="text-sm font-semibold text-[#00ff88] number-ticker">
            {plan.takeProfit}
          </div>
        </div>
        <div className="bg-[#111827]/50 rounded-lg p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-[#64748b] mb-1">盈亏比</div>
          <div className="text-sm font-semibold text-[#00bbf9]">{riskReward()}</div>
        </div>
      </div>

      {/* 进场理由预览 */}
      <div className="relative">
        <p className="text-sm text-[#94a3b8] line-clamp-2 leading-relaxed">{plan.entryReason}</p>
        {/* 渐变遮罩 */}
        <div className="absolute bottom-0 right-0 w-20 h-full bg-gradient-to-l from-[#1a1f2e] to-transparent pointer-events-none" />
      </div>

      {/* 底部指示条 */}
      <div className="mt-4 pt-3 border-t border-[#ffffff08] flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-[#64748b]">
          {plan.positionSize && (
            <span>
              <span className="text-[#94a3b8]">仓位</span> {plan.positionSize}
            </span>
          )}
          {plan.entryImages && plan.entryImages.length > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
              {plan.entryImages.length}
            </span>
          )}
        </div>
        <span className="text-xs text-[#00f5d4] opacity-0 group-hover:opacity-100 transition-opacity">
          查看详情 →
        </span>
      </div>
    </Link>
  );
}
