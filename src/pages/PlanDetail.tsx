import { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getCurrentWeekId } from '../lib/week';
import { getLocalPlans, updateLocalPlan, deleteLocalPlan } from '../lib/planStorage';
import {
  getStatusLabel,
  getStatusColor,
  getDirectionLabel,
  getDirectionColor,
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
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center">
        <p className="text-xl mb-4">请先登录</p>
        <button
          onClick={() => navigate('/')}
          className="text-blue-400 hover:text-blue-300"
        >
          返回首页
        </button>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center">
        <p className="text-xl mb-4">计划不存在</p>
        <Link to={`/week/${weekId}`} className="text-blue-400 hover:text-blue-300">
          返回周报
        </Link>
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

  const statusColor = getStatusColor(plan.status);
  const directionColor = getDirectionColor(plan.direction);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* 顶部导航 */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={`/week/${weekId}`}
              className="text-slate-400 hover:text-white"
            >
              ← 返回
            </Link>
            <span className="text-slate-500">|</span>
            <span className="text-white font-medium">{plan.symbol}</span>
          </div>
          <span className={`${statusColor}`}>{getStatusLabel(plan.status)}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 基本信息 */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{plan.symbol}</h1>
              <span className={`font-medium ${directionColor}`}>
                {getDirectionLabel(plan.direction)}
              </span>
              {plan.timeFrame && (
                <span className="text-sm text-slate-400 bg-slate-700 px-2 py-1 rounded">
                  {TIME_FRAME_LABELS[plan.timeFrame]}
                </span>
              )}
            </div>
            {plan.status === 'closed' && plan.profitLoss !== undefined && (
              <span
                className={`text-xl font-bold ${
                  plan.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {plan.profitLoss >= 0 ? '+' : ''}
                {plan.profitLoss.toFixed(2)}%
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-700 rounded-lg p-3 text-center">
              <div className="text-sm text-slate-400">入场价</div>
              <div className="text-lg font-semibold">{plan.plannedEntry}</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-3 text-center">
              <div className="text-sm text-slate-400">止损</div>
              <div className="text-lg font-semibold text-red-400">{plan.stopLoss}</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-3 text-center">
              <div className="text-sm text-slate-400">止盈</div>
              <div className="text-lg font-semibold text-green-400">{plan.takeProfit}</div>
            </div>
          </div>

          {(plan.positionSize || plan.riskNote) && (
            <div className="flex gap-4 mb-4 text-sm">
              {plan.positionSize && (
                <div>
                  <span className="text-slate-400">仓位：</span>
                  <span className="text-white">{plan.positionSize}</span>
                </div>
              )}
              {plan.riskNote && (
                <div>
                  <span className="text-slate-400">风险：</span>
                  <span className="text-white">{plan.riskNote}</span>
                </div>
              )}
            </div>
          )}

          {/* 持仓时间 */}
          {plan.openedAt && (plan.status === 'open' || plan.status === 'closed') && (
            <div className="mb-4 p-3 bg-slate-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-sm">开仓时间：</span>
                  <span className="text-white text-sm">
                    {new Date(plan.openedAt).toLocaleString('zh-CN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-sm">持仓时间：</span>
                  <span className="text-blue-400 font-medium">
                    {calculateHoldingDuration(plan.openedAt, plan.closedAt)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-2">进场理由</h3>
            <p className="text-white whitespace-pre-wrap">{plan.entryReason}</p>

            {/* 显示进场截图 */}
            {plan.entryImages && plan.entryImages.length > 0 && (
              <div className="mt-4 space-y-3">
                {plan.entryImages.map((img) => (
                  <img
                    key={img.id}
                    src={img.url}
                    alt="进场理由截图"
                    className="w-full rounded-lg border border-slate-600"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 复盘信息（已平仓时显示） */}
        {plan.status === 'closed' && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
            <h3 className="text-lg font-semibold mb-4">📝 复盘记录</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-slate-400">实际出场：</span>
                <span className="text-white">{plan.actualExit}</span>
              </div>
              <div>
                <span className="text-slate-400">执行评分：</span>
                <span className="text-yellow-400">
                  {'⭐'.repeat(plan.executionScore || 0)}
                </span>
              </div>
            </div>

            {plan.reviewNote && (
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">复盘笔记</h4>
                <p className="text-white whitespace-pre-wrap">{plan.reviewNote}</p>
              </div>
            )}
          </div>
        )}

        {/* 复盘表单（点击平仓时显示） */}
        {showReviewForm && plan.status === 'open' && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
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
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  确认开仓
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  取消计划
                </button>
              </>
            )}

            {plan.status === 'open' && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                平仓并复盘
              </button>
            )}

            {(plan.status === 'cancelled' || plan.status === 'closed') && (
              <button
                onClick={handleDelete}
                className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-colors"
              >
                删除记录
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
