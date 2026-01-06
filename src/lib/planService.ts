import type { TradePlan } from '../types/plan';
import { TIME_FRAME_LABELS } from '../types/plan';
import { getOrCreateWeekReport, initWeekReportContent } from './weekReport';
import {
  appendBlocks,
  getDocumentBlocks,
  uploadImageToDocument,
  type DocBlock,
} from './feishuClient';
import { addLocalPlan, updateLocalPlan } from './planStorage';

/**
 * 将交易计划转换为飞书文档 Block
 */
export function planToBlocks(plan: TradePlan): Partial<DocBlock>[] {
  const statusEmoji: Record<string, string> = {
    planned: '📋',
    open: '🔵',
    closed: plan.profitLoss && plan.profitLoss >= 0 ? '✅' : '🔴',
    cancelled: '⚫',
  };

  const statusText: Record<string, string> = {
    planned: '计划中',
    open: '持仓中',
    closed: '已平仓',
    cancelled: '已取消',
  };

  const directionText = plan.direction === 'long' ? '做多' : '做空';
  const emoji = statusEmoji[plan.status] || '📋';
  const status = statusText[plan.status] || '计划中';

  const blocks: Partial<DocBlock>[] = [
    // 标题
    {
      block_type: 5, // heading3
      heading3: {
        elements: [
          {
            text_run: {
              content: `${emoji} ${plan.symbol} ${directionText} | ${status}`,
            },
          },
        ],
      },
    },
    // 价格信息
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

  // 时间周期
  if (plan.timeFrame) {
    blocks.push({
      block_type: 2,
      text: {
        elements: [
          { text_run: { content: '时间周期：', text_element_style: { bold: true } } },
          { text_run: { content: TIME_FRAME_LABELS[plan.timeFrame] } },
        ],
      },
    });
  }

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

  // 进场图片说明（图片会单独上传）
  if (plan.entryImages && plan.entryImages.length > 0) {
    blocks.push({
      block_type: 2,
      text: {
        elements: [
          {
            text_run: {
              content: `📷 进场截图 (${plan.entryImages.length} 张)：`,
              text_element_style: { bold: true },
            },
          },
        ],
      },
    });
  }

  // 开仓时间
  if (plan.openedAt) {
    blocks.push({
      block_type: 2,
      text: {
        elements: [
          { text_run: { content: '开仓时间：', text_element_style: { bold: true } } },
          { text_run: { content: new Date(plan.openedAt).toLocaleString('zh-CN') } },
        ],
      },
    });
  }

  // 如果已平仓，添加复盘信息
  if (plan.status === 'closed') {
    // 平仓时间
    if (plan.closedAt) {
      blocks.push({
        block_type: 2,
        text: {
          elements: [
            { text_run: { content: '平仓时间：', text_element_style: { bold: true } } },
            { text_run: { content: new Date(plan.closedAt).toLocaleString('zh-CN') } },
          ],
        },
      });
    }

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
    text: { elements: [{ text_run: { content: '---' } }] },
  });

  return blocks;
}

/**
 * 找到「交易记录」标题后的位置
 */
async function findTradeRecordInsertPosition(
  documentId: string
): Promise<{ parentId: string; afterBlockId: string | null }> {
  const blocks = await getDocumentBlocks(documentId);

  // 找到 page block
  const pageBlock = blocks.find((b) => b.block_type === 1);
  if (!pageBlock) {
    throw new Error('Document has no page block');
  }

  // 找「交易记录」标题
  let tradeRecordBlockId: string | null = null;
  for (const block of blocks) {
    if (block.block_type === 4 && block.heading2) {
      // heading2
      const text = block.heading2.elements?.[0]?.text_run?.content || '';
      if (text.includes('交易记录')) {
        tradeRecordBlockId = block.block_id;
        break;
      }
    }
  }

  return {
    parentId: pageBlock.block_id,
    afterBlockId: tradeRecordBlockId,
  };
}

/**
 * 创建交易计划并写入飞书文档
 */
export async function createPlan(weekId: string, plan: TradePlan): Promise<void> {
  // 1. 先保存到本地
  addLocalPlan(weekId, plan);

  try {
    // 2. 获取或创建周报文档
    console.log('[createPlan] Getting/creating week report for:', weekId);
    const documentId = await getOrCreateWeekReport(weekId);
    console.log('[createPlan] Document ID:', documentId);

    console.log('[createPlan] Initializing document content...');
    await initWeekReportContent(documentId, weekId);
    console.log('[createPlan] Document initialized');

    // 3. 找到插入位置
    console.log('[createPlan] Finding insert position...');
    const { parentId } = await findTradeRecordInsertPosition(documentId);
    console.log('[createPlan] Parent block ID:', parentId);

    // 4. 转换为 blocks 并写入
    const blocks = planToBlocks(plan);
    console.log('[createPlan] Writing blocks:', JSON.stringify(blocks));
    const result = await appendBlocks(documentId, parentId, blocks);
    console.log('[createPlan] Append result:', JSON.stringify(result));

    // 5. 上传图片（如果有）
    if (plan.entryImages && plan.entryImages.length > 0) {
      console.log('[createPlan] Uploading', plan.entryImages.length, 'images...');
      for (let i = 0; i < plan.entryImages.length; i++) {
        const image = plan.entryImages[i];
        try {
          const imageBlockId = await uploadImageToDocument(
            documentId,
            parentId,
            image.url,
            `entry_image_${i + 1}.png`
          );
          console.log('[createPlan] Image uploaded, block ID:', imageBlockId);
        } catch (imgError) {
          console.error('[createPlan] Failed to upload image:', imgError);
          // 图片上传失败不影响整体流程
        }
      }
    }

    console.log('Plan written to Feishu document:', documentId);
  } catch (error) {
    console.error('Failed to write plan to Feishu:', error);
    // 本地已保存，飞书写入失败不影响使用
  }
}

/**
 * 更新交易计划（本地 + 飞书）
 * 注：飞书文档更新比较复杂，MVP 阶段先只更新本地
 */
export async function updatePlan(
  weekId: string,
  planId: string,
  updates: Partial<TradePlan>
): Promise<void> {
  // 更新本地存储
  updateLocalPlan(weekId, planId, updates);

  // TODO: 更新飞书文档中对应的 blocks
  // 这需要：1. 找到对应的 block  2. 删除旧 blocks  3. 插入新 blocks
  // MVP 阶段暂不实现
}
