import type { TradePlan } from '../types/plan';
import { getLocalPlans, saveLocalPlans, addLocalPlan } from './planStorage';
import { getOrCreateWeekReport, initWeekReportContent } from './weekReport';
import { getDocumentBlocks, appendBlocks, type DocBlock } from './feishuClient';
import { planToBlocks } from './planService';

/**
 * 从飞书文档块解析交易计划
 * 注：这是一个简化版本，根据文档中的格式解析
 */
function parseBlocksToPlan(blocks: DocBlock[], startIndex: number): TradePlan | null {
  const block = blocks[startIndex];
  if (block.block_type !== 5) return null; // 必须是 heading3

  const heading = block.heading3?.elements?.[0]?.text_run?.content || '';

  // 解析标题：📋 BTC 做多 | 计划中
  const match = heading.match(/^([📋🔵✅🔴⚫])\s+(\w+)\s+(做多|做空)\s+\|\s+(.+)$/);
  if (!match) return null;

  const [, , symbol, directionText, statusText] = match;

  const direction = directionText === '做多' ? 'long' : 'short';
  const statusMap: Record<string, TradePlan['status']> = {
    '计划中': 'planned',
    '持仓中': 'open',
    '已平仓': 'closed',
    '已取消': 'cancelled',
  };
  const status = statusMap[statusText] || 'planned';

  // 解析下一个块获取价格信息
  let plannedEntry = 0;
  let stopLoss = 0;
  let takeProfit = 0;
  let entryReason = '';
  let positionSize: string | undefined;
  let riskNote: string | undefined;
  let actualExit: number | undefined;
  let profitLoss: number | undefined;
  let reviewNote: string | undefined;
  let executionScore: number | undefined;

  for (let i = startIndex + 1; i < blocks.length && i < startIndex + 10; i++) {
    const b = blocks[i];
    if (b.block_type === 5) break; // 遇到下一个标题就停止

    const text = b.text?.elements?.map((e) => e.text_run?.content || '').join('') || '';

    // 解析入场信息
    const priceMatch = text.match(/入场：([\d.]+)\s*\|\s*止损：([\d.]+)\s*\|\s*止盈：([\d.]+)/);
    if (priceMatch) {
      plannedEntry = Number(priceMatch[1]);
      stopLoss = Number(priceMatch[2]);
      takeProfit = Number(priceMatch[3]);
      continue;
    }

    // 解析仓位/风险
    if (text.includes('仓位：')) {
      const posMatch = text.match(/仓位：([^|]+)/);
      if (posMatch) positionSize = posMatch[1].trim();
    }
    if (text.includes('风险：')) {
      const riskMatch = text.match(/风险：(.+)/);
      if (riskMatch) riskNote = riskMatch[1].trim();
    }

    // 解析进场理由
    if (text.includes('进场理由：')) {
      entryReason = text.replace('进场理由：', '').trim();
      continue;
    }

    // 解析平仓信息
    const exitMatch = text.match(/实际出场：([\d.]+)\s*\|\s*盈亏：([-\d.]+)%/);
    if (exitMatch) {
      actualExit = Number(exitMatch[1]);
      profitLoss = Number(exitMatch[2]);
      continue;
    }

    // 解析复盘笔记
    if (text.includes('复盘笔记：')) {
      reviewNote = text.replace('复盘笔记：', '').trim();
      continue;
    }

    // 解析执行评分
    const scoreMatch = text.match(/执行评分：(⭐+)/);
    if (scoreMatch) {
      executionScore = scoreMatch[1].length;
    }
  }

  if (!plannedEntry) return null;

  return {
    id: `doc_${block.block_id}`,
    symbol,
    direction,
    entryReason,
    plannedEntry,
    stopLoss,
    takeProfit,
    positionSize,
    riskNote,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    actualExit,
    profitLoss,
    reviewNote,
    executionScore,
  };
}

/**
 * 从飞书文档读取所有交易计划
 */
export async function readPlansFromDocument(documentId: string): Promise<TradePlan[]> {
  const blocks = await getDocumentBlocks(documentId);
  const plans: TradePlan[] = [];

  // 查找所有 heading3 块（每个代表一个交易计划）
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.block_type === 5) {
      // heading3
      const heading = block.heading3?.elements?.[0]?.text_run?.content || '';
      // 检查是否是交易计划标题（以状态 emoji 开头）
      if (/^[📋🔵✅🔴⚫]/.test(heading)) {
        const plan = parseBlocksToPlan(blocks, i);
        if (plan) {
          plans.push(plan);
        }
      }
    }
  }

  return plans;
}

/**
 * 同步文档与 localStorage
 * 策略：
 * 1. 读取文档中的计划
 * 2. 读取 localStorage 中的计划
 * 3. 将文档中有但本地没有的计划加入本地
 * 4. 将本地有但文档中没有的计划写入文档
 */
export async function syncPlans(weekId: string): Promise<{
  fromDoc: number;
  toDoc: number;
  total: number;
}> {
  console.log('[syncPlans] Starting sync for week:', weekId);

  // 获取或创建文档
  const documentId = await getOrCreateWeekReport(weekId);
  await initWeekReportContent(documentId, weekId);

  // 读取文档中的计划
  const docPlans = await readPlansFromDocument(documentId);
  console.log('[syncPlans] Plans from document:', docPlans.length);

  // 读取本地计划
  const localPlans = getLocalPlans(weekId);
  console.log('[syncPlans] Plans from localStorage:', localPlans.length);

  let fromDoc = 0;
  let toDoc = 0;

  // 将文档中有但本地没有的计划加入本地
  const localIds = new Set(localPlans.map((p) => p.id));
  const docIds = new Set(docPlans.map((p) => p.id));

  for (const docPlan of docPlans) {
    // 查找本地是否有相同 symbol 和 createdAt 的计划
    const existsLocally = localPlans.some(
      (lp) => lp.symbol === docPlan.symbol && lp.plannedEntry === docPlan.plannedEntry
    );

    if (!existsLocally) {
      addLocalPlan(weekId, docPlan);
      fromDoc++;
      console.log('[syncPlans] Added to local from doc:', docPlan.symbol);
    }
  }

  // 将本地有但文档中没有的计划写入文档
  const blocks = await getDocumentBlocks(documentId);
  const pageBlock = blocks.find((b) => b.block_type === 1);

  if (pageBlock) {
    for (const localPlan of localPlans) {
      // 检查文档中是否已有相同的计划
      const existsInDoc = docPlans.some(
        (dp) => dp.symbol === localPlan.symbol && dp.plannedEntry === localPlan.plannedEntry
      );

      if (!existsInDoc) {
        try {
          const planBlocks = planToBlocks(localPlan);
          await appendBlocks(documentId, pageBlock.block_id, planBlocks);
          toDoc++;
          console.log('[syncPlans] Written to doc from local:', localPlan.symbol);
        } catch (err) {
          console.error('[syncPlans] Failed to write plan to doc:', err);
        }
      }
    }
  }

  // 重新加载本地计划以获取最新状态
  const updatedLocalPlans = getLocalPlans(weekId);

  return {
    fromDoc,
    toDoc,
    total: updatedLocalPlans.length,
  };
}

/**
 * 获取同步后的计划列表
 */
export async function getSyncedPlans(weekId: string): Promise<TradePlan[]> {
  try {
    await syncPlans(weekId);
  } catch (err) {
    console.error('[getSyncedPlans] Sync failed, using local only:', err);
  }
  return getLocalPlans(weekId);
}
