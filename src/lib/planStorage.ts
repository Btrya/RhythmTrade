import type { TradePlan } from '../types/plan';
import { appendBlocks, type DocBlock } from './feishuClient';

/**
 * 将交易计划转换为飞书文档 Block
 */
export function planToBlocks(plan: TradePlan): Partial<DocBlock>[] {
  const statusEmoji = {
    planned: '📋',
    open: '🔵',
    closed: plan.profitLoss && plan.profitLoss >= 0 ? '✅' : '🔴',
    cancelled: '⚫',
  }[plan.status];

  const directionText = plan.direction === 'long' ? '做多' : '做空';
  const statusText = {
    planned: '计划中',
    open: '持仓中',
    closed: '已平仓',
    cancelled: '已取消',
  }[plan.status];

  const blocks: Partial<DocBlock>[] = [
    // 标题: #1 BTC 做多 ✅ 已平仓
    {
      block_type: 5, // heading3
      heading3: {
        elements: [
          {
            text_run: {
              content: `${statusEmoji} ${plan.symbol} ${directionText} | ${statusText}`,
            },
          },
        ],
      },
    },
    // 计划信息
    {
      block_type: 2, // text
      text: {
        elements: [
          {
            text_run: {
              content: `入场：${plan.plannedEntry} | 止损：${plan.stopLoss} | 止盈：${plan.takeProfit}`,
            },
          },
        ],
      },
    },
  ];

  // 仓位和风险备注
  if (plan.positionSize || plan.riskNote) {
    const parts: string[] = [];
    if (plan.positionSize) parts.push(`仓位：${plan.positionSize}`);
    if (plan.riskNote) parts.push(`风险：${plan.riskNote}`);
    blocks.push({
      block_type: 2,
      text: {
        elements: [{ text_run: { content: parts.join(' | ') } }],
      },
    });
  }

  // 进场理由
  blocks.push({
    block_type: 2,
    text: {
      elements: [
        { text_run: { content: '进场理由：', text_element_style: { bold: true } } },
        { text_run: { content: plan.entryReason } },
      ],
    },
  });

  // 如果已平仓，添加复盘信息
  if (plan.status === 'closed') {
    blocks.push({
      block_type: 2,
      text: {
        elements: [
          { text_run: { content: '实际出场：', text_element_style: { bold: true } } },
          {
            text_run: {
              content: `${plan.actualExit ?? '-'} | 盈亏：${plan.profitLoss?.toFixed(2) ?? '-'}%`,
            },
          },
        ],
      },
    });

    if (plan.reviewNote) {
      blocks.push({
        block_type: 2,
        text: {
          elements: [
            { text_run: { content: '复盘笔记：', text_element_style: { bold: true } } },
            { text_run: { content: plan.reviewNote } },
          ],
        },
      });
    }

    if (plan.executionScore) {
      blocks.push({
        block_type: 2,
        text: {
          elements: [{ text_run: { content: `执行评分：${'⭐'.repeat(plan.executionScore)}` } }],
        },
      });
    }
  }

  // 空行分隔
  blocks.push({
    block_type: 2,
    text: { elements: [{ text_run: { content: '' } }] },
  });

  return blocks;
}

/**
 * 将交易计划写入飞书文档
 */
export async function writePlanToDocument(
  documentId: string,
  parentBlockId: string,
  plan: TradePlan
): Promise<DocBlock[]> {
  const blocks = planToBlocks(plan);
  return appendBlocks(documentId, parentBlockId, blocks);
}

/**
 * 从 localStorage 读取本地缓存的计划
 * （用于在飞书 API 不可用时的降级方案）
 */
export function getLocalPlans(weekId: string): TradePlan[] {
  const key = `rt_plans_${weekId}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

export function saveLocalPlans(weekId: string, plans: TradePlan[]): void {
  const key = `rt_plans_${weekId}`;
  localStorage.setItem(key, JSON.stringify(plans));
}

export function addLocalPlan(weekId: string, plan: TradePlan): void {
  const plans = getLocalPlans(weekId);
  plans.push(plan);
  saveLocalPlans(weekId, plans);
}

export function updateLocalPlan(weekId: string, planId: string, updates: Partial<TradePlan>): void {
  const plans = getLocalPlans(weekId);
  const index = plans.findIndex((p) => p.id === planId);
  if (index !== -1) {
    plans[index] = { ...plans[index], ...updates, updatedAt: new Date().toISOString() };
    saveLocalPlans(weekId, plans);
  }
}

export function deleteLocalPlan(weekId: string, planId: string): void {
  const plans = getLocalPlans(weekId);
  const filtered = plans.filter((p) => p.id !== planId);
  saveLocalPlans(weekId, filtered);
}
