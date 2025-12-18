import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const allowedOrigins = [
  "https://insta-glow-up-39.lovable.app",
  "https://lovable.dev",
  "http://localhost:5173",
  "http://localhost:8080",
];

const isLovableOrigin = (origin: string) => {
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") return false;
    return url.hostname === "lovable.dev" || url.hostname.endsWith(".lovable.dev");
  } catch {
    return false;
  }
};

const isDevOrigin = (origin: string) => {
  try {
    const url = new URL(origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(url.hostname)) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(url.hostname)) return true;
    const m = url.hostname.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
    if (m) {
      const secondOctet = Number(m[1]);
      return secondOctet >= 16 && secondOctet <= 31;
    }
    return false;
  } catch {
    return false;
  }
};

const getCorsHeaders = (origin: string | null) => {
  const isAllowed =
    !!origin && (allowedOrigins.includes(origin) || isLovableOrigin(origin) || isDevOrigin(origin));
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-dev-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
};

type Timeframe = "this_week" | "this_month" | "last_7_days" | "last_30_days";

type DashboardRequest = {
  businessId?: string;
  timeframe?: Timeframe;
  maxMedia?: number;
  includePage?: boolean;
};

type InstagramProfile = {
  id: string;
  username?: string;
  name?: string;
  biography?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  profile_picture_url?: string;
  website?: string;
};

type MediaItem = {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  permalink?: string;
  thumbnail_url?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
  insights?: Record<string, number>;
};

type StoryItem = {
  id: string;
  media_type: string;
  media_url?: string;
  permalink?: string;
  timestamp?: string;
  insights?: Record<string, number>;
};

type MetricPoint = { value: number; end_time?: string };
type MetricValue = {
  name: string;
  period?: string;
  values?: MetricPoint[];
  value?: number | Record<string, unknown>;
  title?: string;
  description?: string;
};

const GRAPH_BASE = "https://graph.facebook.com/v24.0";

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function getTimeframeRange(timeframe: Timeframe): { since: string; until: string } {
  const now = new Date();
  const until = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const days = timeframe === "this_month" || timeframe === "last_30_days" ? 30 : 7;
  const since = new Date(until.getTime() - days * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { since: fmt(since), until: fmt(until) };
}

async function graphGet(
  path: string,
  accessToken: string,
  params: Record<string, string> = {},
): Promise<unknown> {
  const url = new URL(`${GRAPH_BASE}${path}`);
  url.searchParams.set("access_token", accessToken);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const msg =
      typeof json === "object" && json && "error" in json
        ? JSON.stringify((json as { error?: unknown }).error)
        : text;
    throw new Error(`Graph API ${res.status}: ${msg}`);
  }
  return json;
}

function toMetricValues(json: unknown): MetricValue[] {
  const data = (json as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const name = typeof (item as any).name === "string" ? (item as any).name : null;
      if (!name) return null;

      const period = typeof (item as any).period === "string" ? (item as any).period : undefined;
      const title = typeof (item as any).title === "string" ? (item as any).title : undefined;
      const description = typeof (item as any).description === "string" ? (item as any).description : undefined;
      const values = Array.isArray((item as any).values)
        ? (item as any).values.map((v: any) => ({ value: Number(v.value), end_time: v.end_time }))
        : undefined;
      const value = (item as any).value;
      return { name, period, title, description, values, value };
    })
    .filter(Boolean) as MetricValue[];
}

function parseInsightsToNumbers(json: unknown): Record<string, number> {
  const metrics = toMetricValues(json);
  const out: Record<string, number> = {};
  for (const m of metrics) {
    if (typeof m.value === "number") out[m.name] = m.value;
    if (Array.isArray(m.values) && m.values.length > 0) out[m.name] = m.values[m.values.length - 1].value;
  }
  return out;
}

async function fetchMediaInsights(
  accessToken: string,
  media: { id: string; media_type: string },
): Promise<Record<string, number>> {
  const reelMetrics = [
    "reach",
    "impressions",
    "saved",
    "shares",
    "total_interactions",
    "plays",
    "video_views",
    "clips_replays_count",
    "ig_reels_aggregated_all_plays_count",
    "ig_reels_avg_watch_time",
    "ig_reels_video_view_total_time",
  ];
  const postMetrics = ["reach", "impressions", "saved", "shares", "total_interactions", "views", "plays", "video_views"];
  const metrics =
    media.media_type === "REELS" || media.media_type === "VIDEO" ? reelMetrics : postMetrics;
  const json = await graphGet(`/${media.id}/insights`, accessToken, { metric: metrics.join(",") });
  return parseInsightsToNumbers(json);
}

async function fetchStoryInsights(accessToken: string, storyId: string): Promise<Record<string, number>> {
  const json = await graphGet(`/${storyId}/insights`, accessToken, {
    metric: "impressions,reach,replies,exits,taps_forward,taps_back,navigation",
  });
  return parseInsightsToNumbers(json);
}

async function fetchIgUserInsights(accessToken: string, businessId: string, timeframe: Timeframe) {
  const { since, until } = getTimeframeRange(timeframe);

  const messages: string[] = [];
  const dayMetrics = [
    "accounts_engaged",
    "reach",
    "total_interactions",
    "likes",
    "comments",
    "saved",
    "shares",
    "replies",
    "profile_links_taps",
    "views",
  ];

  let user_insights: MetricValue[] = [];
  try {
    const json = await graphGet(`/${businessId}/insights`, accessToken, {
      metric: dayMetrics.join(","),
      period: "day",
      since,
      until,
    });
    user_insights = toMetricValues(json);
  } catch (e) {
    messages.push(`user_insights failed: ${(e as Error).message}`);
  }

  let engaged_audience_demographics: MetricValue | null = null;
  try {
    const json = await graphGet(`/${businessId}/insights`, accessToken, {
      metric: "engaged_audience_demographics",
      period: timeframe === "this_month" || timeframe === "last_30_days" ? "this_month" : "this_week",
    });
    engaged_audience_demographics = toMetricValues(json)[0] ?? null;
  } catch (e) {
    messages.push(`engaged_audience_demographics failed: ${(e as Error).message}`);
  }

  let follower_demographics: MetricValue | null = null;
  try {
    const json = await graphGet(`/${businessId}/insights`, accessToken, {
      metric: "follower_demographics",
      period: "lifetime",
    });
    follower_demographics = toMetricValues(json)[0] ?? null;
  } catch (e) {
    messages.push(`follower_demographics failed: ${(e as Error).message}`);
  }

  let follows_and_unfollows: MetricValue | null = null;
  try {
    const json = await graphGet(`/${businessId}/insights`, accessToken, {
      metric: "follows_and_unfollows",
      period: "day",
      since,
      until,
    });
    follows_and_unfollows = toMetricValues(json)[0] ?? null;
  } catch (e) {
    messages.push(`follows_and_unfollows failed: ${(e as Error).message}`);
  }

  return { user_insights, engaged_audience_demographics, follower_demographics, follows_and_unfollows, messages };
}

async function fetchPageInsights(accessToken: string, pageId: string, timeframe: Timeframe) {
  const { since, until } = getTimeframeRange(timeframe);
  const messages: string[] = [];
  const metrics = [
    "page_post_engagements",
    "page_impressions",
    "page_impressions_unique",
    "page_views_total",
    "page_fans",
    "page_total_actions",
    "page_daily_follows",
    "page_daily_unfollows_unique",
  ];
  try {
    const json = await graphGet(`/${pageId}/insights`, accessToken, {
      metric: metrics.join(","),
      period: "day",
      since,
      until,
    });
    return { page_insights: toMetricValues(json), messages };
  } catch (e) {
    messages.push(`page_insights failed: ${(e as Error).message}`);
    return { page_insights: [], messages };
  }
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    const body = (await req.json().catch(() => ({}))) as DashboardRequest;

    const businessId = body.businessId ?? Deno.env.get("IG_BUSINESS_ID") ?? "";
    const accessToken = Deno.env.get("IG_ACCESS_TOKEN") ?? "";
    if (!businessId || !accessToken) throw new Error("Missing IG_BUSINESS_ID / IG_ACCESS_TOKEN secrets");

    const timeframe: Timeframe = body.timeframe ?? "this_week";
    const includePage = !!body.includePage;
    const maxMedia = clampInt(body.maxMedia, 25, 1, 50);

    const profileJson = await graphGet(`/${businessId}`, accessToken, {
      fields: "id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website",
    });
    const profile = profileJson as InstagramProfile;

    const mediaJson = await graphGet(`/${businessId}/media`, accessToken, {
      fields: "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count",
      limit: String(maxMedia),
    });
    const mediaData = (mediaJson as { data?: unknown }).data;
    const mediaItems: MediaItem[] = Array.isArray(mediaData) ? (mediaData as any) : [];

    const storiesJson = await graphGet(`/${businessId}/stories`, accessToken, {
      fields: "id,media_type,media_url,permalink,timestamp",
      limit: "25",
    });
    const storiesData = (storiesJson as { data?: unknown }).data;
    const storyItems: StoryItem[] = Array.isArray(storiesData) ? (storiesData as any) : [];

    const mediaWithInsights = await Promise.all(
      mediaItems.map(async (m) => {
        try {
          const insights = await fetchMediaInsights(accessToken, { id: m.id, media_type: m.media_type });
          const engagement =
            (m.like_count ?? 0) +
            (m.comments_count ?? 0) +
            (insights.saved ?? 0) +
            (insights.shares ?? 0);
          return { ...m, insights: { ...insights, engagement } };
        } catch {
          const engagement = (m.like_count ?? 0) + (m.comments_count ?? 0);
          return { ...m, insights: { engagement } };
        }
      }),
    );

    const storiesWithInsights = await Promise.all(
      storyItems.map(async (s) => {
        try {
          const insights = await fetchStoryInsights(accessToken, s.id);
          const completionRate =
            insights.impressions && insights.exits ? Math.round((1 - insights.exits / insights.impressions) * 100) : 0;
          return { ...s, insights: { ...insights, completion_rate: completionRate } };
        } catch {
          return { ...s, insights: {} };
        }
      }),
    );

    const ig = await fetchIgUserInsights(accessToken, businessId, timeframe);
    const messages: string[] = [...ig.messages];

    let page_insights: MetricValue[] | null = null;
    if (includePage) {
      const pageId = Deno.env.get("FB_PAGE_ID") ?? "";
      if (!pageId) {
        messages.push("FB_PAGE_ID not set; skipping page insights");
      } else {
        const res = await fetchPageInsights(accessToken, pageId, timeframe);
        page_insights = res.page_insights;
        messages.push(...res.messages);
      }
    }

    const duration = Date.now() - startedAt;
    return new Response(
      JSON.stringify({
        success: true,
        request_id: requestId,
        duration_ms: duration,
        snapshot_date: new Date().toISOString().slice(0, 10),
        provider: "instagram_graph_api",
        profile,
        user_insights: ig.user_insights,
        engaged_audience_demographics: ig.engaged_audience_demographics,
        follower_demographics: ig.follower_demographics,
        follows_and_unfollows: ig.follows_and_unfollows,
        media: mediaWithInsights,
        stories: storiesWithInsights,
        page_insights,
        messages,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": requestId } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

