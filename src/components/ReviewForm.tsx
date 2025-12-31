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
  const plColor = isNaN(plValue) ? '' : plValue >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-semibold text-white">📝 平仓复盘</h3>

      {/* 出场价和盈亏 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            实际出场价 <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            step="any"
            value={data.actualExit}
            onChange={(e) => handleExitChange(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
          {errors.actualExit && (
            <p className="mt-1 text-sm text-red-400">{errors.actualExit}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            盈亏百分比
          </label>
          <div
            className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 ${plColor}`}
          >
            {data.profitLoss ? `${Number(data.profitLoss) >= 0 ? '+' : ''}${data.profitLoss}%` : '-'}
          </div>
        </div>
      </div>

      {/* 执行评分 */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          执行评分（计划执行度）
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => setData((prev) => ({ ...prev, executionScore: score }))}
              className={`flex-1 py-2 rounded-lg text-xl transition-colors ${
                data.executionScore >= score
                  ? 'bg-yellow-500 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              ⭐
            </button>
          ))}
        </div>
      </div>

      {/* 复盘笔记 */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          复盘笔记 <span className="text-red-400">*</span>
        </label>
        <textarea
          value={data.reviewNote}
          onChange={(e) => setData((prev) => ({ ...prev, reviewNote: e.target.value }))}
          placeholder="做对了什么？做错了什么？下次如何改进？"
          rows={4}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
        />
        {errors.reviewNote && (
          <p className="mt-1 text-sm text-red-400">{errors.reviewNote}</p>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {isSubmitting ? '保存中...' : '完成平仓'}
        </button>
      </div>
    </form>
  );
}
