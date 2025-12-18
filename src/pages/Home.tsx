import { Link } from 'react-router-dom';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Button } from '@/components/ui/button';
import { Instagram, Loader2 } from 'lucide-react';

const Home = () => {
  const { data, loading, error } = useDashboardData();
  const profile = data?.profile ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Insta Insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Modo sem login: dados carregados via Edge Function `ig-dashboard`.
          </p>
        </div>
        <Button asChild>
          <Link to="/overview">Abrir dashboard</Link>
        </Button>
      </section>

      {error && (
        <div className="chart-card p-6 border-destructive/50">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      <div className="chart-card p-8 flex items-center gap-4">
        {profile?.profile_picture_url ? (
          <img
            src={profile.profile_picture_url}
            alt="Profile"
            className="w-14 h-14 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center border border-border">
            <Instagram className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold truncate">
            {profile?.name || profile?.username || 'Instagram Business'}
          </p>
          {profile?.username && <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>}
        </div>
      </div>
    </div>
  );
};

export default Home;

