import { useState } from 'react';
import type { TradeDirection } from '../types/plan';

export interface PlanFormData {
  symbol: string;
  direction: TradeDirection;
  entryReason: string;
  plannedEntry: string;
  stopLoss: string;
  takeProfit: string;
  positionSize: string;
  riskNote: string;
}

interface PlanFormProps {
  initialData?: Partial<PlanFormData>;
  onSubmit: (data: PlanFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const defaultData: PlanFormData = {
  symbol: '',
  direction: 'long',
  entryReason: '',
  plannedEntry: '',
  stopLoss: '',
  takeProfit: '',
  positionSize: '',
  riskNote: '',
};

export default function PlanForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: PlanFormProps) {
  const [data, setData] = useState<PlanFormData>({
    ...defaultData,
    ...initialData,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PlanFormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PlanFormData, string>> = {};

    if (!data.symbol.trim()) {
      newErrors.symbol = '请输入标的';
    }
    if (!data.entryReason.trim()) {
      newErrors.entryReason = '请填写进场理由';
    }
    if (!data.plannedEntry || isNaN(Number(data.plannedEntry))) {
      newErrors.plannedEntry = '请输入有效的入场价';
    }
    if (!data.stopLoss || isNaN(Number(data.stopLoss))) {
      newErrors.stopLoss = '请输入有效的止损价';
    }
    if (!data.takeProfit || isNaN(Number(data.takeProfit))) {
      newErrors.takeProfit = '请输入有效的止盈价';
    }

    // 校验止损止盈逻辑
    const entry = Number(data.plannedEntry);
    const sl = Number(data.stopLoss);
    const tp = Number(data.takeProfit);

    if (!isNaN(entry) && !isNaN(sl) && !isNaN(tp)) {
      if (data.direction === 'long') {
        if (sl >= entry) {
          newErrors.stopLoss = '做多时止损应低于入场价';
        }
        if (tp <= entry) {
          newErrors.takeProfit = '做多时止盈应高于入场价';
        }
      } else {
        if (sl <= entry) {
          newErrors.stopLoss = '做空时止损应高于入场价';
        }
        if (tp >= entry) {
          newErrors.takeProfit = '做空时止盈应低于入场价';
        }
      }
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

  const updateField = <K extends keyof PlanFormData>(field: K, value: PlanFormData[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 标的 */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          标的 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.symbol}
          onChange={(e) => updateField('symbol', e.target.value.toUpperCase())}
          placeholder="如 BTC、ETH、AAPL"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        {errors.symbol && <p className="mt-1 text-sm text-red-400">{errors.symbol}</p>}
      </div>

      {/* 方向 */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          方向 <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => updateField('direction', 'long')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              data.direction === 'long'
                ? 'bg-green-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            做多
          </button>
          <button
            type="button"
            onClick={() => updateField('direction', 'short')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              data.direction === 'short'
                ? 'bg-red-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            做空
          </button>
        </div>
      </div>

      {/* 价格信息 */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            入场价 <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            step="any"
            value={data.plannedEntry}
            onChange={(e) => updateField('plannedEntry', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
          {errors.plannedEntry && (
            <p className="mt-1 text-sm text-red-400">{errors.plannedEntry}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            止损价 <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            step="any"
            value={data.stopLoss}
            onChange={(e) => updateField('stopLoss', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
          {errors.stopLoss && <p className="mt-1 text-sm text-red-400">{errors.stopLoss}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            止盈价 <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            step="any"
            value={data.takeProfit}
            onChange={(e) => updateField('takeProfit', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
          {errors.takeProfit && (
            <p className="mt-1 text-sm text-red-400">{errors.takeProfit}</p>
          )}
        </div>
      </div>

      {/* 进场理由 */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          进场理由 <span className="text-red-400">*</span>
        </label>
        <textarea
          value={data.entryReason}
          onChange={(e) => updateField('entryReason', e.target.value)}
          placeholder="技术面/基本面/消息面，写清楚你的交易逻辑"
          rows={4}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
        />
        {errors.entryReason && (
          <p className="mt-1 text-sm text-red-400">{errors.entryReason}</p>
        )}
      </div>

      {/* 可选字段 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            仓位大小（可选）
          </label>
          <input
            type="text"
            value={data.positionSize}
            onChange={(e) => updateField('positionSize', e.target.value)}
            placeholder="如 10%、0.1 BTC"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            风险备注（可选）
          </label>
          <input
            type="text"
            value={data.riskNote}
            onChange={(e) => updateField('riskNote', e.target.value)}
            placeholder="潜在风险点"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
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
          className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {isSubmitting ? '保存中...' : '保存计划'}
        </button>
      </div>
    </form>
  );
}
