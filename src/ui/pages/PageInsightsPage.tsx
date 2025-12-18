import { useIgDashboard } from '@/api/useIgDashboard';
import Card from '@/ui/components/Card';

export default function PageInsightsPage() {
  const { data, loading, error } = useIgDashboard({ timeframe: 'this_week', maxMedia: 10, includePage: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Page Insights (opcional)</h1>
        <p className="mt-1 text-sm text-slate-400">
          Só aparece se você configurar o secret `FB_PAGE_ID` no Supabase.
        </p>
      </div>

      {error && <Card><div className="text-sm text-rose-300">{error}</div></Card>}
      {loading && <Card><div className="text-sm text-slate-300">Carregando…</div></Card>}

      <Card>
        <div className="text-sm font-semibold">page_insights</div>
        <pre className="mt-3 max-h-[520px] overflow-auto rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-200">
          {JSON.stringify(data?.page_insights ?? null, null, 2)}
        </pre>
      </Card>
    </div>
  );
}

