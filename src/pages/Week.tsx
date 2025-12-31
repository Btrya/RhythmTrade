import { useParams } from 'react-router-dom';

export default function Week() {
  const { weekId } = useParams<{ weekId: string }>();

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">{weekId} 交易周报</h1>
      <p className="text-slate-400">交易计划列表将显示在这里</p>
    </div>
  );
}
