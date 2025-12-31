import { useParams } from 'react-router-dom';

export default function PlanDetail() {
  const { planId } = useParams<{ planId: string }>();

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">交易计划详情</h1>
      <p className="text-slate-400">计划 ID: {planId}</p>
    </div>
  );
}
