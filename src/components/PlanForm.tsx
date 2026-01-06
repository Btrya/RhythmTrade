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

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

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
  }, []);

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

    const entry = Number(data.plannedEntry);
    const sl = Number(data.stopLoss);
    const tp = Number(data.takeProfit);

    if (!isNaN(entry) && !isNaN(sl) && !isNaN(tp)) {
      if (data.direction === 'long') {
        if (sl >= entry) newErrors.stopLoss = '做多时止损应低于入场价';
        if (tp <= entry) newErrors.takeProfit = '做多时止盈应高于入场价';
      } else {
        if (sl <= entry) newErrors.stopLoss = '做空时止损应高于入场价';
        if (tp >= entry) newErrors.takeProfit = '做空时止盈应低于入场价';
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

  // 计算盈亏比预览
  const riskRewardPreview = () => {
    const entry = Number(data.plannedEntry);
    const sl = Number(data.stopLoss);
    const tp = Number(data.takeProfit);
    if (isNaN(entry) || isNaN(sl) || isNaN(tp) || entry === 0) return null;
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    if (risk === 0) return null;
    return (reward / risk).toFixed(2);
  };

  const rrRatio = riskRewardPreview();

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 标的 */}
      <div>
        <label className="block text-sm font-medium text-[#94a3b8] mb-2">
          交易标的 <span className="text-[#ff3366]">*</span>
        </label>
        <input
          type="text"
          value={data.symbol}
          onChange={(e) => updateField('symbol', e.target.value.toUpperCase())}
          placeholder="BTC / ETH / AAPL / SPY"
          className="crypto-input w-full px-4 py-3 rounded-xl text-lg font-medium"
        />
        {errors.symbol && <p className="mt-2 text-sm text-[#ff3366]">{errors.symbol}</p>}
      </div>

      {/* 方向和时间周期 */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[#94a3b8] mb-2">
            交易方向 <span className="text-[#ff3366]">*</span>
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => updateField('direction', 'long')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                data.direction === 'long'
                  ? 'bg-[#00ff88]/20 text-[#00ff88] border-2 border-[#00ff88]/50 shadow-[0_0_20px_rgba(0,255,136,0.3)]'
                  : 'bg-[#111827] text-[#64748b] border-2 border-transparent hover:border-[#ffffff10]'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
                做多
              </span>
            </button>
            <button
              type="button"
              onClick={() => updateField('direction', 'short')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                data.direction === 'short'
                  ? 'bg-[#ff3366]/20 text-[#ff3366] border-2 border-[#ff3366]/50 shadow-[0_0_20px_rgba(255,51,102,0.3)]'
                  : 'bg-[#111827] text-[#64748b] border-2 border-transparent hover:border-[#ffffff10]'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
                做空
              </span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#94a3b8] mb-2">
            时间周期 <span className="text-[#ff3366]">*</span>
          </label>
          <select
            value={data.timeFrame}
            onChange={(e) => updateField('timeFrame', e.target.value as TimeFrame)}
            className="crypto-input w-full px-4 py-3 rounded-xl appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '20px',
            }}
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
      <div>
        <label className="block text-sm font-medium text-[#94a3b8] mb-4">
          价格设置 <span className="text-[#ff3366]">*</span>
        </label>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#111827]/50 rounded-xl p-4 border border-[#ffffff08]">
            <div className="text-xs text-[#64748b] uppercase tracking-wider mb-2">入场价</div>
            <input
              type="number"
              step="any"
              value={data.plannedEntry}
              onChange={(e) => updateField('plannedEntry', e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-xl font-bold focus:outline-none number-ticker"
            />
            {errors.plannedEntry && (
              <p className="mt-2 text-xs text-[#ff3366]">{errors.plannedEntry}</p>
            )}
          </div>
          <div className="bg-[#111827]/50 rounded-xl p-4 border border-[#ff3366]/20">
            <div className="text-xs text-[#ff3366] uppercase tracking-wider mb-2">止损价</div>
            <input
              type="number"
              step="any"
              value={data.stopLoss}
              onChange={(e) => updateField('stopLoss', e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-xl font-bold text-[#ff3366] focus:outline-none number-ticker"
            />
            {errors.stopLoss && <p className="mt-2 text-xs text-[#ff3366]">{errors.stopLoss}</p>}
          </div>
          <div className="bg-[#111827]/50 rounded-xl p-4 border border-[#00ff88]/20">
            <div className="text-xs text-[#00ff88] uppercase tracking-wider mb-2">止盈价</div>
            <input
              type="number"
              step="any"
              value={data.takeProfit}
              onChange={(e) => updateField('takeProfit', e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-xl font-bold text-[#00ff88] focus:outline-none number-ticker"
            />
            {errors.takeProfit && (
              <p className="mt-2 text-xs text-[#ff3366]">{errors.takeProfit}</p>
            )}
          </div>
        </div>

        {/* 盈亏比预览 */}
        {rrRatio && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-[#64748b]">盈亏比:</span>
            <span
              className={`font-bold ${Number(rrRatio) >= 2 ? 'text-[#00ff88]' : Number(rrRatio) >= 1 ? 'text-[#fbbf24]' : 'text-[#ff3366]'}`}
            >
              1:{rrRatio}
            </span>
            {Number(rrRatio) >= 2 && <span className="text-[#00ff88] text-xs">优秀</span>}
            {Number(rrRatio) < 1 && <span className="text-[#ff3366] text-xs">风险过高</span>}
          </div>
        )}
      </div>

      {/* 进场理由 */}
      <div>
        <label className="block text-sm font-medium text-[#94a3b8] mb-2">
          进场理由 <span className="text-[#ff3366]">*</span>
        </label>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={data.entryReason}
            onChange={(e) => updateField('entryReason', e.target.value)}
            onPaste={handlePaste}
            placeholder="详细描述你的交易逻辑：技术形态、支撑阻力、指标信号、市场情绪...&#10;&#10;💡 提示：可以直接粘贴截图 (Ctrl+V / Cmd+V)"
            rows={5}
            className="crypto-input w-full px-4 py-3 rounded-xl resize-none text-sm leading-relaxed"
          />
          {errors.entryReason && (
            <p className="mt-2 text-sm text-[#ff3366]">{errors.entryReason}</p>
          )}
        </div>

        {/* 图片预览 */}
        {data.entryImages.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-[#64748b] mb-2">
              已添加 {data.entryImages.length} 张截图
            </div>
            <div className="grid grid-cols-2 gap-3">
              {data.entryImages.map((img) => (
                <div
                  key={img.id}
                  className="relative group rounded-xl overflow-hidden border border-[#ffffff08]"
                >
                  <img src={img.url} alt="进场理由截图" className="w-full h-36 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-[#ff3366] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100"
                  >
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 可选字段 */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[#64748b] mb-2">仓位大小（可选）</label>
          <input
            type="text"
            value={data.positionSize}
            onChange={(e) => updateField('positionSize', e.target.value)}
            placeholder="10% / 0.1 BTC / 100股"
            className="crypto-input w-full px-4 py-3 rounded-xl"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#64748b] mb-2">风险备注（可选）</label>
          <input
            type="text"
            value={data.riskNote}
            onChange={(e) => updateField('riskNote', e.target.value)}
            placeholder="需要关注的风险点"
            className="crypto-input w-full px-4 py-3 rounded-xl"
          />
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-4 pt-6 border-t border-[#ffffff08]">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3.5 px-6 bg-[#1a1f2e] hover:bg-[#242b3d] text-[#94a3b8] rounded-xl font-medium transition-all"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 neon-button py-3.5 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-[#0a0e17] border-t-transparent rounded-full animate-spin" />
              保存中...
            </span>
          ) : (
            '保存计划'
          )}
        </button>
      </div>
    </form>
  );
}
