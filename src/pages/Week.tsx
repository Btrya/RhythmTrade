import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { formatWeekRange, getCurrentWeekId } from '../lib/week';
import { getLocalPlans } from '../lib/planStorage';
import { syncPlans } from '../lib/syncService';
import { calculateStats, type TradePlan } from '../types/plan';
import StatsCard from '../components/StatsCard';
import PlanCard from '../components/PlanCard';

export default function Week() {
  const { weekId } = useParams<{ weekId: string }>();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const currentWeekId = getCurrentWeekId();
  const displayWeekId = weekId || currentWeekId;
  const dateRange = formatWeekRange(displayWeekId);

  const [plans, setPlans] = useState<TradePlan[]>([]);
  const [isSyncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    setPlans(getLocalPlans(displayWeekId));

    if (isAuthenticated) {
      setSyncing(true);
      try {
        const result = await syncPlans(displayWeekId);
        setPlans(getLocalPlans(displayWeekId));
        if (result.fromDoc > 0 || result.toDoc > 0) {
          setLastSyncResult(`从云端导入 ${result.fromDoc} 条，上传 ${result.toDoc} 条`);
          setTimeout(() => setLastSyncResult(null), 3000);
        }
      } catch (err) {
        console.error('Sync failed:', err);
      } finally {
        setSyncing(false);
      }
    }
  }, [displayWeekId, isAuthenticated]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const stats = calculateStats(plans);

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
          <p className="text-[#64748b] mb-6">登录后可查看和管理你的交易计划</p>
          <button onClick={() => navigate('/')} className="neon-button px-6 py-3 rounded-xl">
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
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f5d4] to-[#00bbf9] flex items-center justify-center transition-transform group-hover:scale-110">
                  <span className="text-[#0a0e17] font-bold text-sm">RT</span>
                </div>
                <span className="text-lg font-bold gradient-text">RhythmTrade</span>
              </Link>

              <div className="h-6 w-px bg-[#ffffff10]" />

              <div className="flex items-center gap-2">
                <span className="text-[#64748b] text-sm">周期</span>
                <span className="bg-[#1a1f2e] px-3 py-1.5 rounded-lg text-sm font-medium">
                  {displayWeekId}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* 同步状态 */}
              {isSyncing && (
                <div className="flex items-center gap-2 text-[#00bbf9] text-sm">
                  <div className="w-4 h-4 border-2 border-[#00bbf9] border-t-transparent rounded-full animate-spin" />
                  <span>同步中...</span>
                </div>
              )}

              {user && (
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-8 h-8 rounded-full ring-2 ring-[#ffffff10]"
                  />
                  <span className="text-sm text-[#94a3b8]">{user.name}</span>
                </div>
              )}

              <button
                onClick={logout}
                className="text-sm text-[#64748b] hover:text-[#ff3366] transition-colors"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-6xl mx-auto px-6 py-8 relative">
        {/* 同步结果提示 */}
        {lastSyncResult && (
          <div className="mb-6 glass-card rounded-xl p-4 flex items-center gap-3 border-[#00ff88]/30 card-enter">
            <div className="w-8 h-8 rounded-full bg-[#00ff88]/20 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-[#00ff88]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span className="text-[#00ff88]">{lastSyncResult}</span>
          </div>
        )}

        {/* 统计卡片 */}
        <StatsCard stats={stats} dateRange={dateRange} />

        {/* 操作栏 */}
        <div className="flex items-center justify-between my-8">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9b5de5] to-[#f15bb5] flex items-center justify-center">
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
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </span>
              交易记录
            </h2>
            <button
              onClick={loadPlans}
              disabled={isSyncing}
              className="text-[#64748b] hover:text-[#00f5d4] disabled:opacity-50 transition-colors p-2 hover:bg-[#ffffff08] rounded-lg"
              title="刷新同步"
            >
              <svg
                className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <span className="text-sm text-[#64748b]">{plans.length} 条记录</span>
          </div>

          <Link
            to={`/plan/new?week=${displayWeekId}`}
            className="neon-button px-5 py-2.5 rounded-xl flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            新建计划
          </Link>
        </div>

        {/* 计划列表 */}
        {plans.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 text-center card-enter">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#1a1f2e] flex items-center justify-center">
              <svg
                className="w-10 h-10 text-[#64748b]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">暂无交易计划</h3>
            <p className="text-[#64748b] mb-6">记录你的第一笔交易，开启复盘之旅</p>
            <Link
              to={`/plan/new?week=${displayWeekId}`}
              className="neon-button px-6 py-3 rounded-xl inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              创建第一个交易计划
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan, index) => (
              <PlanCard key={plan.id} plan={plan} weekId={displayWeekId} index={index} />
            ))}
          </div>
        )}

        {/* 周度总结 */}
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f5d4] to-[#00bbf9] flex items-center justify-center">
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </span>
            本周总结
          </h2>
          <div className="glass-card rounded-2xl p-6 card-enter">
            <textarea
              placeholder="在这里记录本周的交易心得、市场观察、改进计划..."
              rows={4}
              className="w-full bg-transparent text-white placeholder-[#64748b] resize-none focus:outline-none text-sm leading-relaxed"
            />
            <div className="mt-4 pt-4 border-t border-[#ffffff08] flex justify-end">
              <button className="text-sm text-[#64748b] hover:text-[#00f5d4] transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                保存到文档
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 底部装饰 */}
      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00f5d4]/20 to-transparent pointer-events-none" />
    </div>
  );
}
