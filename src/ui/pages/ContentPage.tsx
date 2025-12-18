import { useMemo, useState } from 'react';
import { useIgDashboard } from '@/api/useIgDashboard';
import Card from '@/ui/components/Card';
import { formatDateTime, formatNumber } from '@/lib/format';

export default function ContentPage() {
  const { data, loading, error } = useIgDashboard({ timeframe: 'this_week', maxMedia: 50, includePage: false });
  const [filter, setFilter] = useState<'ALL' | 'REELS' | 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'>('ALL');

  const items = data?.media ?? [];

  const filtered = useMemo(() => {
    if (filter === 'ALL') return items;
    return items.filter((m) => m.media_type === filter);
  }, [filter, items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Conteúdo</h1>
          <p className="mt-1 text-sm text-slate-400">Lista de posts/reels com métricas por mídia (best-effort).</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="h-9 rounded-xl border border-slate-800 bg-slate-900/40 px-3 text-sm text-slate-100 outline-none"
        >
          <option value="ALL">Todos</option>
          <option value="REELS">Reels</option>
          <option value="VIDEO">Vídeos</option>
          <option value="IMAGE">Imagens</option>
          <option value="CAROUSEL_ALBUM">Carrossel</option>
        </select>
      </div>

      {error && <Card><div className="text-sm text-rose-300">{error}</div></Card>}
      {loading && <Card><div className="text-sm text-slate-300">Carregando…</div></Card>}

      <Card>
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-widest text-slate-400">
              <tr className="border-b border-slate-800">
                <th className="py-3 pr-4">Tipo</th>
                <th className="py-3 pr-4">Data</th>
                <th className="py-3 pr-4">Legenda</th>
                <th className="py-3 pr-4">Likes</th>
                <th className="py-3 pr-4">Comments</th>
                <th className="py-3 pr-4">Reach</th>
                <th className="py-3 pr-4">Impressions</th>
                <th className="py-3 pr-4">Saves</th>
                <th className="py-3 pr-4">Shares</th>
                <th className="py-3">Engajamento</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const insights = m.insights ?? {};
                const engagement =
                  (m.like_count ?? 0) +
                  (m.comments_count ?? 0) +
                  (insights.saved ?? 0) +
                  (insights.shares ?? 0);
                return (
                  <tr key={m.id} className="border-b border-slate-900/60">
                    <td className="py-3 pr-4 text-slate-200">{m.media_type}</td>
                    <td className="py-3 pr-4 text-slate-300">{formatDateTime(m.timestamp)}</td>
                    <td className="py-3 pr-4 max-w-[420px] truncate text-slate-300">{m.caption || '—'}</td>
                    <td className="py-3 pr-4">{formatNumber(m.like_count)}</td>
                    <td className="py-3 pr-4">{formatNumber(m.comments_count)}</td>
                    <td className="py-3 pr-4">{formatNumber(insights.reach)}</td>
                    <td className="py-3 pr-4">{formatNumber(insights.impressions)}</td>
                    <td className="py-3 pr-4">{formatNumber(insights.saved)}</td>
                    <td className="py-3 pr-4">{formatNumber(insights.shares)}</td>
                    <td className="py-3 font-semibold">{formatNumber(engagement)}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Nenhum item.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

