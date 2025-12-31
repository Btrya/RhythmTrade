import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getCurrentWeekId } from '../lib/week';
import { addLocalPlan } from '../lib/planStorage';
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
        entryReason: data.entryReason,
        plannedEntry: Number(data.plannedEntry),
        stopLoss: Number(data.stopLoss),
        takeProfit: Number(data.takeProfit),
        positionSize: data.positionSize || undefined,
        riskNote: data.riskNote || undefined,
        status: 'planned',
        createdAt: now,
        updatedAt: now,
      };

      // 保存到本地存储
      addLocalPlan(weekId, plan);

      // TODO: 同步写入飞书文档

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

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* 顶部导航 */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={`/week/${weekId}`} className="text-slate-400 hover:text-white">
            ← 返回
          </Link>
          <span className="text-slate-500">|</span>
          <span className="text-white font-medium">新建交易计划</span>
        </div>
      </header>

      {/* 表单 */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
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
