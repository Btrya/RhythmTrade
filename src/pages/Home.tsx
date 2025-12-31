export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center text-white px-4">
      <h1 className="text-5xl font-bold mb-4 text-center">RhythmTrade</h1>
      <p className="text-xl text-slate-400 mb-8 text-center">
        计划你的交易，交易你的计划
      </p>
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors"
        type="button"
      >
        飞书登录
      </button>
    </div>
  );
}
