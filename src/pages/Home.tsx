import { redirectToFeishuAuth } from '../lib/feishu';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { getCurrentWeekId } from '../lib/week';

export default function Home() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(`/week/${getCurrentWeekId()}`);
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center text-white">
        <p className="text-xl">加载中...</p>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center text-white px-4">
        <img
          src={user.avatar_url}
          alt={user.name}
          className="w-20 h-20 rounded-full mb-4"
        />
        <h2 className="text-2xl font-bold mb-2">{user.name}</h2>
        <p className="text-slate-400 mb-6">已登录</p>
        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/week/${getCurrentWeekId()}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors"
            type="button"
          >
            进入周报
          </button>
          <button
            onClick={logout}
            className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-8 rounded-lg transition-colors"
            type="button"
          >
            退出登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center text-white px-4">
      <h1 className="text-5xl font-bold mb-4 text-center">RhythmTrade</h1>
      <p className="text-xl text-slate-400 mb-8 text-center">
        计划你的交易，交易你的计划
      </p>
      <button
        onClick={redirectToFeishuAuth}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors flex items-center gap-2"
        type="button"
      >
        <FeishuIcon />
        飞书登录
      </button>
    </div>
  );
}

function FeishuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}
