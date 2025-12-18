import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import type { IgDashboardResponse, Timeframe } from '@/types/ig';

export type DashboardParams = {
  timeframe: Timeframe;
  maxMedia: number;
  includePage: boolean;
};

export function useIgDashboard(params: DashboardParams) {
  const body = useMemo(
    () => ({
      timeframe: params.timeframe,
      maxMedia: params.maxMedia,
      includePage: params.includePage,
      businessId: (import.meta.env.VITE_IG_BUSINESS_ID as string | undefined) || undefined,
    }),
    [params.includePage, params.maxMedia, params.timeframe],
  );

  const query = useQuery({
    queryKey: ['ig-dashboard', body],
    queryFn: async (): Promise<IgDashboardResponse> => {
      const { data, error } = await supabase.functions.invoke('ig-dashboard', { body });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch IG dashboard');
      return data as IgDashboardResponse;
    },
    staleTime: 30_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    data: query.data ?? null,
    refetch: query.refetch,
  };
}

