import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { formatWeekRange, getCurrentWeekId } from '../lib/week';
import { getLocalPlans } from '../lib/planStorage';
import { calculateStats } from '../types/plan';
import StatsCard from '../components/StatsCard';
import PlanCard from '../components/PlanCard';

export default function Week() {
  const { weekId } = useParams<{ weekId: string }>();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const currentWeekId = getCurrentWeekId();
  const displayWeekId = weekId || currentWeekId;
  const dateRange = formatWeekRange(displayWeekId);

  // 从本地存储读取计划（后续会改为从飞书读取）
  const plans = getLocalPlans(displayWeekId);
  const stats = calculateStats(plans);

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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xl font-bold">
              RhythmTrade
            </Link>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">{displayWeekId}</span>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-slate-300">{user.name}</span>
              </div>
            )}
            <button
              onClick={logout}
              className="text-sm text-slate-400 hover:text-white"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <StatsCard stats={stats} dateRange={dateRange} />

        {/* 操作栏 */}
        <div className="flex items-center justify-between my-6">
          <h2 className="text-xl font-semibold">📈 交易记录</h2>
          <Link
            to={`/plan/new?week=${displayWeekId}`}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            + 新建计划
          </Link>
        </div>

        {/* 计划列表 */}
        {plans.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
            <p className="text-slate-400 mb-4">暂无交易计划</p>
            <Link
              to={`/plan/new?week=${displayWeekId}`}
              className="text-blue-400 hover:text-blue-300"
            >
              创建第一个交易计划 →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} weekId={displayWeekId} />
            ))}
          </div>
        )}

        {/* 周度总结 */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">📝 本周总结</h2>
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <textarea
              placeholder="在这里填写本周复盘总结..."
              rows={4}
              className="w-full bg-transparent text-white placeholder-slate-500 resize-none focus:outline-none"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
