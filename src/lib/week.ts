/**
 * 获取指定日期所在的 ISO 周数
 * 格式: YYYY-Wxx (如 2024-W03)
 */
export function getWeekId(date: Date = new Date()): string {
  const year = date.getFullYear();
  const weekNumber = getISOWeekNumber(date);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

export function getCurrentWeekId(): string {
  return getWeekId(new Date());
}

/**
 * 获取 ISO 周数 (ISO 8601)
 * 一年的第一周是包含第一个周四的那周
 */
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * 解析周 ID 获取该周的日期范围
 */
export function parseWeekId(weekId: string): { start: Date; end: Date } | null {
  const match = weekId.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);

  // 找到该年第一个周四
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - dayOfWeek + 1);

  // 计算目标周的周一
  const start = new Date(firstMonday);
  start.setDate(firstMonday.getDate() + (week - 1) * 7);

  // 周日
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return { start, end };
}

/**
 * 格式化日期范围
 */
export function formatWeekRange(weekId: string): string {
  const range = parseWeekId(weekId);
  if (!range) return weekId;

  const formatDate = (d: Date) =>
    `${d.getMonth() + 1}/${d.getDate()}`;

  return `${formatDate(range.start)} - ${formatDate(range.end)}`;
}
