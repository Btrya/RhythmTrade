import { useState } from 'react';

export interface ReviewFormData {
  actualExit: string;
  profitLoss: string;
  executionScore: number;
  reviewNote: string;
}

interface ReviewFormProps {
  plannedEntry: number;
  direction: 'long' | 'short';
  onSubmit: (data: ReviewFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function ReviewForm({
  plannedEntry,
  direction,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ReviewFormProps) {
  const [data, setData] = useState<ReviewFormData>({
    actualExit: '',
    profitLoss: '',
    executionScore: 3,
    reviewNote: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ReviewFormData, string>>>({});

  // 自动计算盈亏百分比
  const calculatePL = (exitPrice: string) => {
    const exit = Number(exitPrice);
    if (isNaN(exit) || exit <= 0) return '';

    let pl: number;
    if (direction === 'long') {
      pl = ((exit - plannedEntry) / plannedEntry) * 100;
    } else {
      pl = ((plannedEntry - exit) / plannedEntry) * 100;
    }
    return pl.toFixed(2);
  };

  const handleExitChange = (value: string) => {
    setData((prev) => ({
      ...prev,
      actualExit: value,
      profitLoss: calculatePL(value),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ReviewFormData, string>> = {};

    if (!data.actualExit || isNaN(Number(data.actualExit))) {
      newErrors.actualExit = '请输入有效的出场价';
    }
    if (!data.reviewNote.trim()) {
      newErrors.reviewNote = '请填写复盘笔记';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(data);
    }
  };

  const plValue = Number(data.profitLoss);
  const isProfit = !isNaN(plValue) && plValue >= 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="flex items-center gap-2 text-lg font-bold">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00ff88] to-[#00f5d4] flex items-center justify-center">
          <svg
            className="w-4 h-4 text-[#0a0e17]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        平仓复盘
      </h3>

      {/* 出场价和盈亏 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#94a3b8] mb-2">
            实际出场价 <span className="text-[#ff3366]">*</span>
          </label>
          <input
            type="number"
            step="any"
            value={data.actualExit}
            onChange={(e) => handleExitChange(e.target.value)}
            className="w-full bg-[#111827] border border-[#ffffff10] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f5d4] focus:ring-1 focus:ring-[#00f5d4]/50 transition-all"
            placeholder="0.00"
          />
          {errors.actualExit && (
            <p className="mt-2 text-sm text-[#ff3366] flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {errors.actualExit}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-[#94a3b8] mb-2">盈亏百分比</label>
          <div
            className={`w-full bg-[#111827] border rounded-xl px-4 py-3 font-bold text-xl ${
              data.profitLoss
                ? isProfit
                  ? 'border-[#00ff88]/30 text-[#00ff88]'
                  : 'border-[#ff3366]/30 text-[#ff3366]'
                : 'border-[#ffffff10] text-[#64748b]'
            }`}
          >
            {data.profitLoss
              ? `${Number(data.profitLoss) >= 0 ? '+' : ''}${data.profitLoss}%`
              : '-'}
          </div>
        </div>
      </div>

      {/* 执行评分 */}
      <div>
        <label className="block text-sm font-medium text-[#94a3b8] mb-3">
          执行评分（计划执行度）
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => setData((prev) => ({ ...prev, executionScore: score }))}
              className={`flex-1 py-3 rounded-xl text-2xl transition-all ${
                data.executionScore >= score
                  ? 'bg-gradient-to-br from-[#ffaa00] to-[#ff8800] text-white shadow-lg shadow-[#ffaa00]/20'
                  : 'bg-[#111827] text-[#2a2f3e] hover:bg-[#1a1f2e] border border-[#ffffff08]'
              }`}
            >
              ★
            </button>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-[#64748b]">
          <span>执行较差</span>
          <span>完美执行</span>
        </div>
      </div>

      {/* 复盘笔记 */}
      <div>
        <label className="block text-sm font-medium text-[#94a3b8] mb-2">
          复盘笔记 <span className="text-[#ff3366]">*</span>
        </label>
        <textarea
          value={data.reviewNote}
          onChange={(e) => setData((prev) => ({ ...prev, reviewNote: e.target.value }))}
          placeholder="做对了什么？做错了什么？下次如何改进？"
          rows={4}
          className="w-full bg-[#111827] border border-[#ffffff10] rounded-xl px-4 py-3 text-white placeholder-[#4a5568] focus:outline-none focus:border-[#00f5d4] focus:ring-1 focus:ring-[#00f5d4]/50 transition-all resize-none"
        />
        {errors.reviewNote && (
          <p className="mt-2 text-sm text-[#ff3366] flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {errors.reviewNote}
          </p>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 px-4 bg-[#1a1f2e] hover:bg-[#252a3a] text-[#64748b] hover:text-white rounded-xl font-medium transition-all border border-[#ffffff08]"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-[#00ff88] to-[#00f5d4] hover:from-[#00ef78] hover:to-[#00e5c4] disabled:from-[#1a4a3a] disabled:to-[#1a4a4a] disabled:cursor-not-allowed text-[#0a0e17] disabled:text-[#4a5568] rounded-xl font-bold transition-all shadow-lg shadow-[#00ff88]/20 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-[#0a0e17] border-t-transparent rounded-full animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              完成平仓
            </>
          )}
        </button>
      </div>
    </form>
  );
}
