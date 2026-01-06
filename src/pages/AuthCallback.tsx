import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const processed = useRef(false);

  const code = searchParams.get('code');
  const hasCode = !!code;

  useEffect(() => {
    if (processed.current) return;
    if (!hasCode) return;

    processed.current = true;

    login(code)
      .then(() => {
        navigate('/');
      })
      .catch((err) => {
        console.error('Login failed:', err);
        setError('登录失败，请重试');
      });
  }, [code, hasCode, login, navigate]);

  // 没有 code 参数，直接显示错误
  if (!hasCode) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-red-400">缺少授权码</p>
        <button onClick={() => navigate('/')} className="text-blue-400 hover:text-blue-300">
          返回首页
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-red-400">{error}</p>
        <button onClick={() => navigate('/')} className="text-blue-400 hover:text-blue-300">
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <p className="text-xl">正在登录...</p>
    </div>
  );
}
