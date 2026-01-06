import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getCurrentWeekId } from '../lib/week';
import { createPlan } from '../lib/planService';
import type { TradePlan } from '../types/plan';
import PlanForm, { type PlanFormData } from '../components/PlanForm';

export default function PlanNew() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const weekId = searchParams.get('week') || getCurrentWeekId();

  const handleSubmit = async (data: PlanFormData) => {
    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const plan: TradePlan = {
        id: `plan_${Date.now()}`,
        symbol: data.symbol,
        direction: data.direction,
        timeFrame: data.timeFrame,
        entryReason: data.entryReason,
        entryImages: data.entryImages.length > 0 ? data.entryImages : undefined,
        plannedEntry: Number(data.plannedEntry),
        stopLoss: Number(data.stopLoss),
        takeProfit: Number(data.takeProfit),
        positionSize: data.positionSize || undefined,
        riskNote: data.riskNote || undefined,
        status: 'planned',
        createdAt: now,
        updatedAt: now,
      };

      await createPlan(weekId, plan);
      navigate(`/week/${weekId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/week/${weekId}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen grid-bg flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#00f5d4] to-[#00bbf9] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#0a0e17]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">请先登录</h2>
          <p className="text-[#64748b] mb-6">登录后可创建交易计划</p>
          <button
            onClick={() => navigate('/')}
            className="neon-button px-6 py-3 rounded-xl"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-gradient-bg">
      {/* 网格背景 */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />

      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0e17]/80 border-b border-[#ffffff08]">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/week/${weekId}`}
              className="text-[#64748b] hover:text-white transition-colors flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回
            </Link>
            <div className="h-6 w-px bg-[#ffffff10]" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9b5de5] to-[#f15bb5] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="font-bold">新建交易计划</span>
            </div>
          </div>
        </div>
      </header>

      {/* 表单 */}
      <main className="max-w-3xl mx-auto px-6 py-8 relative">
        <div className="glass-card rounded-2xl p-8 card-enter">
          {/* 表单头部提示 */}
          <div className="mb-8 pb-6 border-b border-[#ffffff08]">
            <h1 className="text-2xl font-bold mb-2">创建交易计划</h1>
            <p className="text-[#64748b] text-sm">
              详细记录你的交易逻辑，便于后续复盘分析
            </p>
          </div>

          <PlanForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </div>
      </main>
    </div>
  );
}
