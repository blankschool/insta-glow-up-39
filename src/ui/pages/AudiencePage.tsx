import { useIgDashboard } from '@/api/useIgDashboard';
import Card from '@/ui/components/Card';

export default function AudiencePage() {
  const { data, loading, error } = useIgDashboard({ timeframe: 'this_month', maxMedia: 10, includePage: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audiência</h1>
        <p className="mt-1 text-sm text-slate-400">
          Demografia de seguidores e audiência engajada (quando a conta tiver volume mínimo).
        </p>
      </div>

      {error && <Card><div className="text-sm text-rose-300">{error}</div></Card>}
      {loading && <Card><div className="text-sm text-slate-300">Carregando…</div></Card>}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="text-sm font-semibold">Follower demographics</div>
          <pre className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-200">
            {JSON.stringify(data?.follower_demographics?.value ?? null, null, 2)}
          </pre>
        </Card>
        <Card>
          <div className="text-sm font-semibold">Engaged audience demographics</div>
          <pre className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-200">
            {JSON.stringify(data?.engaged_audience_demographics?.value ?? null, null, 2)}
          </pre>
        </Card>
      </div>
    </div>
  );
}

