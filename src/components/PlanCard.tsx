import { Link } from 'react-router-dom';
import type { TradePlan } from '../types/plan';
import {
  getStatusLabel,
  getStatusColor,
  getDirectionLabel,
  getDirectionColor,
  calculateHoldingDuration,
  TIME_FRAME_LABELS,
} from '../types/plan';

interface PlanCardProps {
  plan: TradePlan;
  weekId: string;
}

export default function PlanCard({ plan, weekId }: PlanCardProps) {
  const statusColor = getStatusColor(plan.status);
  const directionColor = getDirectionColor(plan.direction);

  const profitDisplay =
    plan.status === 'closed' && plan.profitLoss !== undefined
      ? plan.profitLoss >= 0
        ? `+${plan.profitLoss.toFixed(2)}%`
        : `${plan.profitLoss.toFixed(2)}%`
      : null;

  const profitColor =
    plan.profitLoss !== undefined
      ? plan.profitLoss >= 0
        ? 'text-green-400'
        : 'text-red-400'
      : '';

  // 计算持仓时间
  const holdingDuration =
    plan.openedAt && (plan.status === 'open' || plan.status === 'closed')
      ? calculateHoldingDuration(plan.openedAt, plan.closedAt)
      : null;

  return (
    <Link
      to={`/plan/${plan.id}?week=${weekId}`}
      className="block bg-slate-800 rounded-lg p-4 hover:bg-slate-750 transition-colors border border-slate-700 hover:border-slate-600"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white">{plan.symbol}</span>
          <span className={`text-sm font-medium ${directionColor}`}>
            {getDirectionLabel(plan.direction)}
          </span>
          {plan.timeFrame && (
            <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded">
              {TIME_FRAME_LABELS[plan.timeFrame]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {profitDisplay && (
            <span className={`text-sm font-medium ${profitColor}`}>{profitDisplay}</span>
          )}
          <span className={`text-sm ${statusColor}`}>{getStatusLabel(plan.status)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
        <div>
          <span className="text-slate-500">入场：</span>
          <span className="text-white">{plan.plannedEntry}</span>
        </div>
        <div>
          <span className="text-slate-500">止损：</span>
          <span className="text-red-400">{plan.stopLoss}</span>
        </div>
        <div>
          <span className="text-slate-500">止盈：</span>
          <span className="text-green-400">{plan.takeProfit}</span>
        </div>
      </div>

      {/* 持仓时间显示 */}
      {holdingDuration && (
        <div className="text-sm mb-2">
          <span className="text-slate-500">持仓：</span>
          <span className="text-blue-400">{holdingDuration}</span>
        </div>
      )}

      <p className="text-sm text-slate-400 line-clamp-2">{plan.entryReason}</p>
    </Link>
  );
}
