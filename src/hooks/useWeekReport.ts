import { useCallback, useEffect, useState } from 'react';
import {
  getOrCreateWeekReport,
  initWeekReportContent,
  getWeekReportContent,
} from '../lib/weekReport';
import type { DocBlock } from '../lib/feishuClient';

interface UseWeekReportResult {
  documentId: string | null;
  blocks: DocBlock[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useWeekReport(weekId: string): UseWeekReportResult {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<DocBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 获取或创建周报文档
      const docId = await getOrCreateWeekReport(weekId);
      setDocumentId(docId);

      // 初始化文档结构（如果是新文档）
      await initWeekReportContent(docId, weekId);

      // 读取文档内容
      const content = await getWeekReportContent(docId);
      setBlocks(content);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load week report'));
    } finally {
      setIsLoading(false);
    }
  }, [weekId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  return {
    documentId,
    blocks,
    isLoading,
    error,
    refresh: loadReport,
  };
}
