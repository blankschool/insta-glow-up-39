import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useIgDashboard } from '@/api/useIgDashboard';
import type { Timeframe } from '@/types/ig';

export default function Topbar() {
  const [timeframe, setTimeframe] = useState<Timeframe>('this_week');
  const [maxMedia, setMaxMedia] = useState(25);
  const [includePage, setIncludePage] = useState(false);

  const params = useMemo(() => ({ timeframe, maxMedia, includePage }), [includePage, maxMedia, timeframe]);
  const { refetch, loading } = useIgDashboard(params);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/60 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <div className="text-sm font-semibold">Painel</div>
          <div className="text-xs text-slate-400">Atualize e ajuste o período</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as Timeframe)}
            className="h-9 rounded-xl border border-slate-800 bg-slate-900/40 px-3 text-sm text-slate-100 outline-none"
          >
            <option value="this_week">Últimos 7 dias</option>
            <option value="this_month">Últimos 30 dias</option>
            <option value="last_7_days">last_7_days</option>
            <option value="last_30_days">last_30_days</option>
          </select>

          <select
            value={maxMedia}
            onChange={(e) => setMaxMedia(Number(e.target.value))}
            className="h-9 rounded-xl border border-slate-800 bg-slate-900/40 px-3 text-sm text-slate-100 outline-none"
          >
            <option value={10}>10 itens</option>
            <option value={25}>25 itens</option>
            <option value={50}>50 itens</option>
          </select>

          <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={includePage}
              onChange={(e) => setIncludePage(e.target.checked)}
              className="accent-sky-500"
            />
            Page Insights
          </label>

          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-sky-500 px-3 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60"
            disabled={loading}
          >
            <RefreshCw className={['h-4 w-4', loading ? 'animate-spin' : ''].join(' ')} />
            Atualizar
          </button>
        </div>
      </div>
    </header>
  );
}

