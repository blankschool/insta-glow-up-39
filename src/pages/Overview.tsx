import { useEffect } from 'react';
import { useInsights } from '@/hooks/useInsights';
import { useAuth } from '@/contexts/AuthContext';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { DataAlerts } from '@/components/dashboard/DataAlerts';
import { 
  Users, 
  Grid3X3, 
  Heart, 
  Eye,
  MousePointerClick,
  UserPlus,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Button } from '@/components/ui/button';

const Overview = () => {
  const { connectedAccounts } = useAuth();
  const { data, loading, error, fetchInsights, selectedAccountId } = useInsights();

  const hasAccount = connectedAccounts && connectedAccounts.length > 0;

  // Fetch insights on mount and when account changes
  useEffect(() => {
    if (hasAccount && selectedAccountId) {
      fetchInsights();
    }
  }, [selectedAccountId]);

  // No account connected state
  if (!hasAccount) {
    return (
      <div className="space-y-4">
        <section className="flex flex-wrap items-end justify-between gap-3 py-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Visão Geral</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Resumo das métricas do seu perfil.</p>
          </div>
        </section>
        <div className="chart-card p-8 text-center">
          <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-2">Conecte sua conta</h3>
          <p className="text-muted-foreground text-sm">
            Conecte sua conta do Instagram para ver métricas de seguidores, engajamento, alcance e muito mais.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Extract profile insights from data
  const profileInsights = data?.profile_insights?.data || [];
  const getMetricValue = (name: string) => {
    const metric = profileInsights.find((m: any) => m.name === name);
    return metric?.values?.[0]?.value || 0;
  };

  const reach = getMetricValue('reach');
  const views = getMetricValue('views');
  const accountsEngaged = getMetricValue('accounts_engaged');
  const totalInteractions = getMetricValue('total_interactions');
  const likes = getMetricValue('likes');
  const comments = getMetricValue('comments');
  const shares = getMetricValue('shares');
  const saves = getMetricValue('saves');
  const profileLinksTaps = getMetricValue('profile_links_taps');
  const followsUnfollows = getMetricValue('follows_and_unfollows');

  // Get posts data
  const posts = data?.posts || [];
  
  // Calculate totals from posts
  const totalLikes = posts.reduce((sum: number, item: any) => sum + (item.like_count || 0), 0);
  const totalComments = posts.reduce((sum: number, item: any) => sum + (item.comments_count || 0), 0);

  // Get follower count from profile_insights (if stored) 
  const profileInsightsData = data?.profile_insights as any;
  const username = profileInsightsData?.username || '';

  // Follower growth data placeholder (would need historical snapshots)
  const followerGrowthData = [
    { date: 'Seg', followers: 0 },
    { date: 'Ter', followers: 0 },
    { date: 'Qua', followers: 0 },
    { date: 'Qui', followers: 0 },
    { date: 'Sex', followers: 0 },
    { date: 'Sáb', followers: 0 },
    { date: 'Dom', followers: 0 },
  ];

  const engagementData = [
    { name: 'Curtidas', value: likes || totalLikes, color: 'hsl(var(--primary))' },
    { name: 'Comentários', value: comments || totalComments, color: 'hsl(var(--muted-foreground))' },
    { name: 'Compartilhamentos', value: shares, color: 'hsl(var(--foreground) / 0.6)' },
    { name: 'Salvamentos', value: saves, color: 'hsl(var(--foreground) / 0.3)' },
  ].filter(item => item.value > 0);

  const recentPostsPerformance = posts.slice(0, 7).map((item: any, index: number) => ({
    post: `Post ${index + 1}`,
    likes: item.like_count || 0,
    comments: item.comments_count || 0,
    reach: item.insights?.reach || 0,
  }));

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // Check if we need to show warnings
  const hasEmptyPostInsights = posts.some((p: any) => !p.insights || Object.keys(p.insights).length === 0);
  const hasNoStories = (data?.stories || []).length === 0;
  const hasNoDemographics = !data?.demographics || data?.demographics?.error;

  // Check if we have any data at all
  const hasAnyData = reach > 0 || views > 0 || totalInteractions > 0 || posts.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resumo das principais métricas e performance do perfil.
            {data?.snapshot_date && (
              <span className="ml-2 text-xs">Atualizado: {new Date(data.snapshot_date).toLocaleDateString('pt-BR')}</span>
            )}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchInsights()}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar dados
        </Button>
      </section>

      {/* Data Alerts */}
      <DataAlerts 
        messages={data?.messages}
        showPostsWarning={hasEmptyPostInsights}
        showStoriesWarning={hasNoStories}
        showDemographicsWarning={hasNoDemographics}
      />

      {/* No data yet state */}
      {!hasAnyData && (
        <div className="chart-card p-6 text-center border-dashed">
          <Loader2 className="w-8 h-8 mx-auto text-muted-foreground mb-3 animate-spin" />
          <h3 className="font-semibold mb-2">Carregando dados...</h3>
          <p className="text-muted-foreground text-sm">
            Os dados podem levar até 48 horas para aparecer após conectar uma nova conta.
          </p>
        </div>
      )}

      {/* Main KPIs - Profile Insights */}
      {hasAnyData && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Alcance"
              value={formatNumber(reach)}
              icon={<Eye className="w-4 h-4" />}
              tooltip="Número de contas únicas que viram seu conteúdo"
            />
            <MetricCard
              label="Visualizações"
              value={formatNumber(views)}
              icon={<Eye className="w-4 h-4" />}
              tooltip="Total de visualizações do seu conteúdo"
            />
            <MetricCard
              label="Contas Engajadas"
              value={formatNumber(accountsEngaged)}
              icon={<Users className="w-4 h-4" />}
              tooltip="Contas únicas que interagiram com seu conteúdo"
            />
            <MetricCard
              label="Total Interações"
              value={formatNumber(totalInteractions)}
              icon={<Heart className="w-4 h-4" />}
              tooltip="Soma de todas as interações (curtidas, comentários, saves, shares)"
            />
          </div>

          {/* Secondary KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Total Posts"
              value={data?.total_posts?.toLocaleString() || posts.length.toLocaleString()}
              icon={<Grid3X3 className="w-4 h-4" />}
            />
            <MetricCard
              label="Curtidas (período)"
              value={formatNumber(likes || totalLikes)}
              icon={<Heart className="w-4 h-4" />}
            />
            <MetricCard
              label="Cliques no Link"
              value={formatNumber(profileLinksTaps)}
              icon={<MousePointerClick className="w-4 h-4" />}
              tooltip="Cliques no link da bio"
            />
            <MetricCard
              label="Novos Seguidores"
              value={formatNumber(followsUnfollows)}
              icon={<UserPlus className="w-4 h-4" />}
              tooltip="Diferença entre novos seguidores e unfollows"
            />
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Engagement Distribution */}
            {engagementData.length > 0 && (
              <ChartCard title="Distribuição de Engajamento" subtitle="Total de interações">
                <div className="h-[250px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={engagementData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {engagementData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {engagementData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-muted-foreground">{entry.name}</span>
                      <span className="font-medium">{formatNumber(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            )}

            {/* Recent Posts Performance */}
            {recentPostsPerformance.length > 0 && (
              <ChartCard title="Performance dos Posts Recentes" subtitle="Últimos 7 posts">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recentPostsPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="post" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="likes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Curtidas" />
                      <Bar dataKey="comments" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Comentários" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            )}
          </div>

          {/* Recent Posts Preview */}
          {posts.length > 0 && (
            <ChartCard title="Posts Recentes" subtitle="Últimos posts publicados">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {posts.slice(0, 6).map((item: any) => (
                  <a 
                    key={item.id}
                    href={item.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-lg overflow-hidden bg-secondary hover:opacity-80 transition-opacity"
                  >
                    {(item.media_url || item.thumbnail_url) ? (
                      <img 
                        src={item.thumbnail_url || item.media_url} 
                        alt={item.caption?.slice(0, 50) || 'Post'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Grid3X3 className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </ChartCard>
          )}
        </>
      )}
    </div>
  );
};

export default Overview;