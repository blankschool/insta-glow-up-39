import { Activity, Heart, MessageCircle, Share2, Users } from 'lucide-react';
import { useMemo } from 'react';
import { useIgDashboard } from '@/api/useIgDashboard';
import type { MetricValue } from '@/types/ig';
import { formatNumber } from '@/lib/format';
import StatCard from '@/ui/components/StatCard';
import Card from '@/ui/components/Card';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';

function extractLatestNumber(metric: MetricValue | undefined | null): number | null {
  if (!metric) return null;
  if (typeof metric.value === 'number') return metric.value;
  if (Array.isArray(metric.values) && metric.values.length > 0) {
    return metric.values[metric.values.length - 1]?.value ?? null;
  }
  return null;
}

export default function DashboardPage() {
  // Must match Topbar defaults; the cache key will be shared.
  const { data, loading, error } = useIgDashboard({ timeframe: 'this_week', maxMedia: 25, includePage: false });

  const profile = data?.profile;
  const userInsights = data?.user_insights ?? [];
  const byName = useMemo(() => new Map(userInsights.map(m => [m.name, m])), [userInsights]);

  const accountsEngaged = extractLatestNumber(byName.get('accounts_engaged'));
  const reach = extractLatestNumber(byName.get('reach'));
  const totalInteractions = extractLatestNumber(byName.get('total_interactions')) ?? extractLatestNumber(byName.get('total_interactions'));
  const likes = extractLatestNumber(byName.get('likes'));
  const comments = extractLatestNumber(byName.get('comments'));
  const shares = extractLatestNumber(byName.get('shares'));

  const engagement = (likes ?? 0) + (comments ?? 0) + (shares ?? 0);

  const engagementSeries = useMemo(() => {
    const m = byName.get('total_interactions') ?? byName.get('accounts_engaged') ?? null;
    const values = Array.isArray(m?.values) ? m!.values! : [];
    return values.map((v) => ({ t: v.end_time ?? '', value: v.value }));
  }, [byName]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          {profile?.username ? `@${profile.username}` : 'Instagram Business'} • {profile?.followers_count ? `${formatNumber(profile.followers_count)} seguidores` : '—'}
        </p>
      </div>

      {error && <Card><div className="text-sm text-rose-300">{error}</div></Card>}
      {loading && <Card><div className="text-sm text-slate-300">Carregando…</div></Card>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Accounts Engaged" value={formatNumber(accountsEngaged)} icon={<Users className="h-4 w-4 text-sky-300" />} />
        <StatCard label="Reach" value={formatNumber(reach)} icon={<Activity className="h-4 w-4 text-emerald-300" />} />
        <StatCard label="Interações" value={formatNumber(totalInteractions ?? engagement)} icon={<Heart className="h-4 w-4 text-pink-300" />} />
        <StatCard label="Comentários" value={formatNumber(comments)} icon={<MessageCircle className="h-4 w-4 text-violet-300" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Série (best-effort)</div>
              <div className="text-xs text-slate-400">Nem todas as contas retornam valores diários.</div>
            </div>
            <div className="text-xs text-slate-400">
              <Share2 className="inline h-4 w-4" /> {formatNumber(shares)}
            </div>
          </div>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engagementSeries}>
                <Tooltip
                  contentStyle={{ background: '#0b1220', border: '1px solid #334155', borderRadius: 12 }}
                  labelStyle={{ color: '#cbd5e1' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="text-sm font-semibold">Como o engajamento é calculado</div>
          <p className="mt-2 text-sm text-slate-300">
            Por enquanto: <span className="font-semibold">likes + comments + shares</span>. Quando a API retornar
            <span className="font-semibold"> total_interactions</span> (ou métricas por mídia), usamos isso como referência.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
              <div className="text-xs text-slate-400">Likes</div>
              <div className="text-lg font-semibold">{formatNumber(likes)}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
              <div className="text-xs text-slate-400">Comments</div>
              <div className="text-lg font-semibold">{formatNumber(comments)}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
              <div className="text-xs text-slate-400">Shares</div>
              <div className="text-lg font-semibold">{formatNumber(shares)}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

