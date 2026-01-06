import { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getCurrentWeekId } from '../lib/week';
import { getLocalPlans, updateLocalPlan, deleteLocalPlan } from '../lib/planStorage';
import {
  getStatusLabel,
  getDirectionLabel,
  calculateHoldingDuration,
  TIME_FRAME_LABELS,
} from '../types/plan';
import ReviewForm, { type ReviewFormData } from '../components/ReviewForm';

export default function PlanDetail() {
  const { planId } = useParams<{ planId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const weekId = searchParams.get('week') || getCurrentWeekId();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 查找计划
  const plan = useMemo(() => {
    const plans = getLocalPlans(weekId);
    return plans.find((p) => p.id === planId);
  }, [weekId, planId]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen grid-bg flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#00f5d4] to-[#00bbf9] flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#0a0e17]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">请先登录</h2>
          <p className="text-[#64748b] mb-6">登录后可查看交易详情</p>
          <button onClick={() => navigate('/')} className="neon-button px-6 py-3 rounded-xl">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen grid-bg flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#1a1f2e] flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#64748b]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">计划不存在</h2>
          <p className="text-[#64748b] mb-6">该交易计划可能已被删除</p>
          <Link to={`/week/${weekId}`} className="neon-button px-6 py-3 rounded-xl inline-block">
            返回周报
          </Link>
        </div>
      </div>
    );
  }

  const handleOpenPosition = () => {
    updateLocalPlan(weekId, plan.id, {
      status: 'open',
      actualEntry: plan.plannedEntry,
      openedAt: new Date().toISOString(),
    });
    navigate(`/week/${weekId}`);
  };

  const handleClosePosition = (data: ReviewFormData) => {
    setIsSubmitting(true);
    try {
      updateLocalPlan(weekId, plan.id, {
        status: 'closed',
        actualExit: Number(data.actualExit),
        profitLoss: Number(data.profitLoss),
        executionScore: data.executionScore,
        reviewNote: data.reviewNote,
        closedAt: new Date().toISOString(),
      });
      navigate(`/week/${weekId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    updateLocalPlan(weekId, plan.id, { status: 'cancelled' });
    navigate(`/week/${weekId}`);
  };

  const handleDelete = () => {
    if (confirm('确定删除这个交易计划吗？')) {
      deleteLocalPlan(weekId, plan.id);
      navigate(`/week/${weekId}`);
    }
  };

  const isLong = plan.direction === 'long';
  const isProfit = (plan.profitLoss ?? 0) >= 0;

  // 计算盈亏比
  const riskReward = () => {
    const entry = plan.plannedEntry;
    const sl = plan.stopLoss;
    const tp = plan.takeProfit;
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    if (risk === 0) return '-';
    return `1:${(reward / risk).toFixed(1)}`;
  };

  // 状态样式
  const getStatusClass = () => {
    if (plan.status === 'planned') return 'status-planned';
    if (plan.status === 'open') return 'status-open';
    if (plan.status === 'cancelled') return 'status-cancelled';
    if (plan.status === 'closed') {
      return isProfit ? 'status-closed-win' : 'status-closed-loss';
    }
    return '';
  };

  return (
    <div className="min-h-screen animated-gradient-bg">
      {/* 网格背景 */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />

      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0e17]/80 border-b border-[#ffffff08]">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to={`/week/${weekId}`}
                className="text-[#64748b] hover:text-white transition-colors flex items-center gap-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                返回
              </Link>
              <div className="h-6 w-px bg-[#ffffff10]" />
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                    isLong ? 'bg-[#00ff88]/20' : 'bg-[#ff3366]/20'
                  }`}
                >
                  {plan.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{plan.symbol}</span>
                    <span className={isLong ? 'direction-long' : 'direction-short'}>
                      {getDirectionLabel(plan.direction)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <span className={`status-badge ${getStatusClass()}`}>
              {getStatusLabel(plan.status)}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 relative">
        {/* 盈亏高亮卡片（已平仓时显示） */}
        {plan.status === 'closed' && plan.profitLoss !== undefined && (
          <div
            className={`glass-card rounded-2xl p-6 mb-6 card-enter relative overflow-hidden ${
              isProfit ? 'border-[#00ff88]/30' : 'border-[#ff3366]/30'
            }`}
          >
            <div className={`absolute inset-0 ${isProfit ? 'bg-[#00ff88]/5' : 'bg-[#ff3366]/5'}`} />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isProfit ? 'bg-[#00ff88]/20' : 'bg-[#ff3366]/20'
                  }`}
                >
                  {isProfit ? (
                    <svg
                      className="w-6 h-6 text-[#00ff88]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6 text-[#ff3366]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="text-sm text-[#64748b]">交易结果</div>
                  <div className="font-medium">{isProfit ? '盈利' : '亏损'}</div>
                </div>
              </div>
              <div
                className={`text-3xl font-bold number-ticker ${isProfit ? 'profit-value' : 'loss-value'}`}
              >
                {plan.profitLoss >= 0 ? '+' : ''}
                {plan.profitLoss.toFixed(2)}%
              </div>
            </div>
          </div>
        )}

        {/* 基本信息卡片 */}
        <div className="glass-card rounded-2xl p-6 mb-6 card-enter">
          {/* 标的和周期信息 */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#ffffff08]">
            <div className="flex items-center gap-3">
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold ${
                  isLong ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'bg-[#ff3366]/20 text-[#ff3366]'
                }`}
              >
                {plan.symbol.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{plan.symbol}</h1>
                  <span className={isLong ? 'direction-long' : 'direction-short'}>
                    {getDirectionLabel(plan.direction)}
                  </span>
                </div>
                {plan.timeFrame && (
                  <span className="text-xs text-[#94a3b8] bg-[#1a1f2e] px-2 py-1 rounded">
                    {TIME_FRAME_LABELS[plan.timeFrame]}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-[#64748b] mb-1">盈亏比</div>
              <div className="text-xl font-bold text-[#00bbf9]">{riskReward()}</div>
            </div>
          </div>

          {/* 价格信息网格 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#111827]/60 rounded-xl p-4 text-center border border-[#ffffff08]">
              <div className="text-xs uppercase tracking-wider text-[#64748b] mb-2">计划入场</div>
              <div className="text-xl font-bold number-ticker">{plan.plannedEntry}</div>
              {plan.actualEntry && plan.actualEntry !== plan.plannedEntry && (
                <div className="text-xs text-[#00bbf9] mt-1">实际: {plan.actualEntry}</div>
              )}
            </div>
            <div className="bg-[#111827]/60 rounded-xl p-4 text-center border border-[#ffffff08]">
              <div className="text-xs uppercase tracking-wider text-[#64748b] mb-2">止损</div>
              <div className="text-xl font-bold text-[#ff3366] number-ticker">{plan.stopLoss}</div>
            </div>
            <div className="bg-[#111827]/60 rounded-xl p-4 text-center border border-[#ffffff08]">
              <div className="text-xs uppercase tracking-wider text-[#64748b] mb-2">止盈</div>
              <div className="text-xl font-bold text-[#00ff88] number-ticker">
                {plan.takeProfit}
              </div>
            </div>
          </div>

          {/* 仓位和风险信息 */}
          {(plan.positionSize || plan.riskNote) && (
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-[#111827]/40 rounded-xl border border-[#ffffff08]">
              {plan.positionSize && (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-[#64748b]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                  <span className="text-[#64748b] text-sm">仓位:</span>
                  <span className="text-white text-sm font-medium">{plan.positionSize}</span>
                </div>
              )}
              {plan.riskNote && (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-[#ffaa00]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="text-[#64748b] text-sm">风险:</span>
                  <span className="text-[#ffaa00] text-sm font-medium">{plan.riskNote}</span>
                </div>
              )}
            </div>
          )}

          {/* 持仓时间 */}
          {plan.openedAt && (plan.status === 'open' || plan.status === 'closed') && (
            <div className="mb-6 p-4 bg-gradient-to-r from-[#00bbf9]/10 to-transparent rounded-xl border border-[#00bbf9]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#00bbf9]/20 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-[#00bbf9]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-[#64748b]">开仓时间</div>
                    <div className="text-sm text-white">
                      {new Date(plan.openedAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#64748b]">持仓时长</div>
                  <div className="text-lg font-bold text-[#00bbf9]">
                    {calculateHoldingDuration(plan.openedAt, plan.closedAt)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 进场理由 */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-medium text-[#64748b] mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              进场理由
            </h3>
            <div className="bg-[#111827]/40 rounded-xl p-4 border border-[#ffffff08]">
              <p className="text-white whitespace-pre-wrap leading-relaxed">{plan.entryReason}</p>
            </div>

            {/* 显示进场截图 */}
            {plan.entryImages && plan.entryImages.length > 0 && (
              <div className="mt-4 space-y-3">
                {plan.entryImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.url}
                      alt="进场理由截图"
                      className="w-full rounded-xl border border-[#ffffff08] transition-transform group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 复盘信息（已平仓时显示） */}
        {plan.status === 'closed' && (
          <div className="glass-card rounded-2xl p-6 mb-6 card-enter">
            <h3 className="flex items-center gap-2 text-lg font-bold mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9b5de5] to-[#f15bb5] flex items-center justify-center">
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              复盘记录
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#111827]/60 rounded-xl p-4 border border-[#ffffff08]">
                <div className="text-xs uppercase tracking-wider text-[#64748b] mb-2">实际出场</div>
                <div className="text-xl font-bold number-ticker">{plan.actualExit}</div>
              </div>
              <div className="bg-[#111827]/60 rounded-xl p-4 border border-[#ffffff08]">
                <div className="text-xs uppercase tracking-wider text-[#64748b] mb-2">执行评分</div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-xl ${
                        star <= (plan.executionScore || 0) ? 'text-[#ffaa00]' : 'text-[#2a2f3e]'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {plan.reviewNote && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-medium text-[#64748b] mb-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  复盘笔记
                </h4>
                <div className="bg-[#111827]/40 rounded-xl p-4 border border-[#ffffff08]">
                  <p className="text-white whitespace-pre-wrap leading-relaxed">
                    {plan.reviewNote}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 复盘表单（点击平仓时显示） */}
        {showReviewForm && plan.status === 'open' && (
          <div className="glass-card rounded-2xl p-6 mb-6 card-enter">
            <ReviewForm
              plannedEntry={plan.actualEntry || plan.plannedEntry}
              direction={plan.direction}
              onSubmit={handleClosePosition}
              onCancel={() => setShowReviewForm(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {/* 操作按钮 */}
        {!showReviewForm && (
          <div className="space-y-3">
            {plan.status === 'planned' && (
              <>
                <button
                  onClick={handleOpenPosition}
                  className="w-full py-4 bg-gradient-to-r from-[#00f5d4] to-[#00bbf9] hover:from-[#00e5c4] hover:to-[#00aae9] text-[#0a0e17] rounded-xl font-bold transition-all shadow-lg shadow-[#00f5d4]/20 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  确认开仓
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full py-4 bg-[#1a1f2e] hover:bg-[#252a3a] text-[#64748b] hover:text-white rounded-xl font-medium transition-all border border-[#ffffff08]"
                >
                  取消计划
                </button>
              </>
            )}

            {plan.status === 'open' && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="w-full py-4 bg-gradient-to-r from-[#00ff88] to-[#00f5d4] hover:from-[#00ef78] hover:to-[#00e5c4] text-[#0a0e17] rounded-xl font-bold transition-all shadow-lg shadow-[#00ff88]/20 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                平仓并复盘
              </button>
            )}

            {(plan.status === 'cancelled' || plan.status === 'closed') && (
              <button
                onClick={handleDelete}
                className="w-full py-4 bg-[#ff3366]/10 hover:bg-[#ff3366]/20 text-[#ff3366] rounded-xl font-medium transition-all border border-[#ff3366]/20 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                删除记录
              </button>
            )}
          </div>
        )}
      </main>

      {/* 底部装饰 */}
      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00f5d4]/20 to-transparent pointer-events-none" />
    </div>
  );
}
