export type PlanStatus = 'planned' | 'open' | 'closed' | 'cancelled';
export type TradeDirection = 'long' | 'short';

// 时间周期类型
export type TimeFrame =
  | '1min'
  | '5min'
  | '15min'
  | '30min'
  | '1h'
  | '4h'
  | '1day'
  | '1week'
  | '1month'
  | '3month'
  | '12month';

export const TIME_FRAME_LABELS: Record<TimeFrame, string> = {
  '1min': '1分钟',
  '5min': '5分钟',
  '15min': '15分钟',
  '30min': '30分钟',
  '1h': '1小时',
  '4h': '4小时',
  '1day': '日线',
  '1week': '周线',
  '1month': '月线',
  '3month': '季线',
  '12month': '年线',
};

// 进场理由中的图片
export interface EntryImage {
  id: string;
  url: string; // 飞书文件 URL 或 base64
  fileToken?: string; // 飞书文件 token
}

export interface TradePlan {
  id: string; // 对应飞书文档中的 block_id
  symbol: string; // 标的，如 BTC、ETH、AAPL
  direction: TradeDirection; // 做多/做空
  timeFrame?: TimeFrame; // 时间周期
  entryReason: string; // 进场理由（文字部分）
  entryImages?: EntryImage[]; // 进场理由的图片
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

/**
 * 计算持仓时间
 * @param openedAt 开仓时间 ISO 字符串
 * @param closedAt 平仓时间 ISO 字符串（可选，默认当前时间）
 * @returns 格式化的持仓时间字符串
 */
export function calculateHoldingDuration(openedAt: string, closedAt?: string): string {
  const start = new Date(openedAt).getTime();
  const end = closedAt ? new Date(closedAt).getTime() : Date.now();
  const diffMs = end - start;

  if (diffMs < 0) return '0分钟';

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days > 0) {
    const remainingHours = hours % 24;
    if (remainingHours > 0) {
      return `${days}天${remainingHours}小时`;
    }
    return `${days}天`;
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes > 0) {
      return `${hours}小时${remainingMinutes}分钟`;
    }
    return `${hours}小时`;
  }

  return `${minutes}分钟`;
}
