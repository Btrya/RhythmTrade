import { useState, useRef, useCallback } from 'react';
import type { TradeDirection, TimeFrame, EntryImage } from '../types/plan';
import { TIME_FRAME_LABELS } from '../types/plan';

export interface PlanFormData {
  symbol: string;
  direction: TradeDirection;
  timeFrame: TimeFrame;
  entryReason: string;
  entryImages: EntryImage[];
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
  timeFrame: '4h',
  entryReason: '',
  entryImages: [],
  plannedEntry: '',
  stopLoss: '',
  takeProfit: '',
  positionSize: '',
  riskNote: '',
};

const TIME_FRAMES: TimeFrame[] = [
  '1min',
  '5min',
  '15min',
  '30min',
  '1h',
  '4h',
  '1day',
  '1week',
  '1month',
  '3month',
  '12month',
];

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 处理图片粘贴
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;

          // 转换为 base64
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            const newImage: EntryImage = {
              id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              url: base64,
            };
            setData((prev) => ({
              ...prev,
              entryImages: [...prev.entryImages, newImage],
            }));
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    },
    []
  );

  // 删除图片
  const removeImage = useCallback((imageId: string) => {
    setData((prev) => ({
      ...prev,
      entryImages: prev.entryImages.filter((img) => img.id !== imageId),
    }));
  }, []);

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

      {/* 方向和时间周期 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            方向 <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2">
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

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            时间周期 <span className="text-red-400">*</span>
          </label>
          <select
            value={data.timeFrame}
            onChange={(e) => updateField('timeFrame', e.target.value as TimeFrame)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            {TIME_FRAMES.map((tf) => (
              <option key={tf} value={tf}>
                {TIME_FRAME_LABELS[tf]}
              </option>
            ))}
          </select>
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
          ref={textareaRef}
          value={data.entryReason}
          onChange={(e) => updateField('entryReason', e.target.value)}
          onPaste={handlePaste}
          placeholder="技术面/基本面/消息面，写清楚你的交易逻辑&#10;&#10;提示：可以直接粘贴截图（Ctrl+V / Cmd+V）"
          rows={4}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
        />
        {errors.entryReason && (
          <p className="mt-1 text-sm text-red-400">{errors.entryReason}</p>
        )}

        {/* 图片预览区域 */}
        {data.entryImages.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-slate-400">
              已添加 {data.entryImages.length} 张图片：
            </p>
            <div className="grid grid-cols-2 gap-3">
              {data.entryImages.map((img) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.url}
                    alt="进场理由截图"
                    className="w-full h-32 object-cover rounded-lg border border-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="删除图片"
                  >
                    <span className="text-white text-sm">×</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
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
