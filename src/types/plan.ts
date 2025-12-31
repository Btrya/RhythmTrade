export type PlanStatus = 'planned' | 'open' | 'closed' | 'cancelled';
export type TradeDirection = 'long' | 'short';

export interface TradePlan {
  id: string; // 对应飞书文档中的 block_id
  symbol: string; // 标的，如 BTC、ETH、AAPL
  direction: TradeDirection; // 做多/做空
  entryReason: string; // 进场理由
  plannedEntry: number; // 计划入场价
  stopLoss: number; // 止损价
  takeProfit: number; // 止盈目标
  positionSize?: string; // 仓位大小（可选）
  riskNote?: string; // 风险备注（可选）

  status: PlanStatus;
  createdAt: string; // ISO 日期字符串
  updatedAt: string;

  // 开仓后填写
  actualEntry?: number; // 实际入场价
  openedAt?: string; // 开仓时间

  // 平仓后填写
  actualExit?: number; // 实际出场价
  closedAt?: string; // 平仓时间
  profitLoss?: number; // 盈亏百分比
  executionScore?: number; // 执行评分 1-5
  reviewNote?: string; // 复盘笔记
}

export interface WeekStats {
  totalTrades: number;
  openPositions: number;
  closedPositions: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  totalProfitLoss: number;
}

export function calculateStats(plans: TradePlan[]): WeekStats {
  const closed = plans.filter((p) => p.status === 'closed');
  const open = plans.filter((p) => p.status === 'open');

  const wins = closed.filter((p) => (p.profitLoss ?? 0) > 0);
  const losses = closed.filter((p) => (p.profitLoss ?? 0) < 0);

  const totalPL = closed.reduce((sum, p) => sum + (p.profitLoss ?? 0), 0);

  return {
    totalTrades: plans.length,
    openPositions: open.length,
    closedPositions: closed.length,
    winCount: wins.length,
    lossCount: losses.length,
    winRate: closed.length > 0 ? wins.length / closed.length : 0,
    totalProfitLoss: totalPL,
  };
}

export function getStatusLabel(status: PlanStatus): string {
  const labels: Record<PlanStatus, string> = {
    planned: '计划中',
    open: '持仓中',
    closed: '已平仓',
    cancelled: '已取消',
  };
  return labels[status];
}

export function getStatusColor(status: PlanStatus): string {
  const colors: Record<PlanStatus, string> = {
    planned: 'text-yellow-400',
    open: 'text-blue-400',
    closed: 'text-green-400',
    cancelled: 'text-slate-500',
  };
  return colors[status];
}

export function getDirectionLabel(direction: TradeDirection): string {
  return direction === 'long' ? '做多' : '做空';
}

export function getDirectionColor(direction: TradeDirection): string {
  return direction === 'long' ? 'text-green-400' : 'text-red-400';
}
