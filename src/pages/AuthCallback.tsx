import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code');

  useEffect(() => {
    if (code) {
      // TODO: 用 code 换取 access_token
      console.log('OAuth code:', code);
      navigate('/');
    }
  }, [code, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <p className="text-xl">正在登录...</p>
    </div>
  );
}
