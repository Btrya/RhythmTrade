import {
  getOrCreateFolder,
  getOrCreateDocument,
  getDocumentBlocks,
  appendBlocks,
  type DocBlock,
} from './feishuClient';
import { formatWeekRange } from './week';

const FOLDER_NAME = 'RhythmTrade';

/**
 * 获取或创建 RhythmTrade 根文件夹
 */
export async function getAppFolderToken(): Promise<string> {
  return getOrCreateFolder(FOLDER_NAME);
}

/**
 * 获取周报文档标题
 */
export function getWeekReportTitle(weekId: string): string {
  return `${weekId} 交易周报`;
}

/**
 * 获取或创建周报文档
 */
export async function getOrCreateWeekReport(weekId: string): Promise<string> {
  const folderToken = await getAppFolderToken();
  const title = getWeekReportTitle(weekId);
  return getOrCreateDocument(folderToken, title);
}

/**
 * 初始化周报文档结构
 */
export async function initWeekReportContent(
  documentId: string,
  weekId: string
): Promise<void> {
  const blocks = await getDocumentBlocks(documentId);

  // 如果文档已有内容，不重复初始化
  if (blocks.length > 1) {
    return;
  }

  // 找到 page block（根 block）
  const pageBlock = blocks.find((b) => b.block_type === 1);
  if (!pageBlock) {
    return;
  }

  const dateRange = formatWeekRange(weekId);

  // 初始化文档结构
  const initialBlocks = [
    // 概览标题
    {
      block_type: 4, // heading2
      heading2: {
        elements: [{ text_run: { content: '📊 本周概览' } }],
      },
    },
    // 统计信息（占位）
    {
      block_type: 2, // text
      text: {
        elements: [
          { text_run: { content: `📅 ${dateRange}` } },
        ],
      },
    },
    {
      block_type: 2,
      text: {
        elements: [
          { text_run: { content: '交易次数：0 | 已平仓：0 | 持仓中：0' } },
        ],
      },
    },
    // 分割线
    {
      block_type: 22, // divider
      divider: {},
    },
    // 交易记录标题
    {
      block_type: 4, // heading2
      heading2: {
        elements: [{ text_run: { content: '📈 交易记录' } }],
      },
    },
    // 占位提示
    {
      block_type: 2,
      text: {
        elements: [
          {
            text_run: {
              content: '暂无交易计划，点击「新建计划」开始记录',
              text_element_style: { italic: true },
            },
          },
        ],
      },
    },
    // 分割线
    {
      block_type: 22,
      divider: {},
    },
    // 周总结标题
    {
      block_type: 4,
      heading2: {
        elements: [{ text_run: { content: '📝 本周总结' } }],
      },
    },
    // 总结占位
    {
      block_type: 2,
      text: {
        elements: [
          {
            text_run: {
              content: '（在这里填写本周复盘总结）',
              text_element_style: { italic: true },
            },
          },
        ],
      },
    },
  ];

  await appendBlocks(documentId, pageBlock.block_id, initialBlocks);
}

/**
 * 获取周报文档内容
 */
export async function getWeekReportContent(documentId: string): Promise<DocBlock[]> {
  return getDocumentBlocks(documentId);
}
