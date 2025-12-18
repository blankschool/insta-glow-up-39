import { useState } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Button } from '@/components/ui/button';
import { Instagram, Loader2, RefreshCw, User } from 'lucide-react';
import { toast } from 'sonner';

const Profile = () => {
  const { data, loading, refresh } = useDashboardData();
  const [refreshing, setRefreshing] = useState(false);

  const profile = data?.profile ?? null;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
    toast.success('Dados atualizados');
  };

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-end justify-between gap-3 py-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Perfil</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Informações do perfil (modo sem login).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </section>

      <div className="chart-card p-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[160px]">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !profile ? (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Perfil não carregado</h2>
              <p className="text-muted-foreground">
                Confira se a Edge Function `ig-dashboard` está deployada e se os secrets `IG_BUSINESS_ID` e `IG_ACCESS_TOKEN` estão configurados.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0">
              {profile?.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full border-4 border-border object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  <Instagram className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-xl font-bold">
                  {profile?.name || profile?.username || 'Instagram Profile'}
                </h2>
                {profile?.username && <p className="text-muted-foreground">@{profile.username}</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Seguidores</p>
                  <p className="font-semibold">{profile?.followers_count?.toLocaleString?.() || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Seguindo</p>
                  <p className="font-semibold">{profile?.follows_count?.toLocaleString?.() || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Posts</p>
                  <p className="font-semibold">{profile?.media_count?.toLocaleString?.() || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

