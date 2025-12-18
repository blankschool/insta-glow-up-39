export type Timeframe = 'this_week' | 'this_month' | 'last_30_days' | 'last_7_days';

export type MetricPoint = {
  value: number;
  end_time?: string;
};

export type MetricValue = {
  name: string;
  period?: string;
  values?: MetricPoint[];
  value?: number | Record<string, unknown>;
  title?: string;
  description?: string;
};

export type IgProfile = {
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

export type IgMediaItem = {
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

export type IgStoryItem = {
  id: string;
  media_type: string;
  media_url?: string;
  permalink?: string;
  timestamp?: string;
  insights?: Record<string, number>;
};

export type IgDashboardResponse = {
  success: boolean;
  error?: string;
  request_id?: string;
  duration_ms?: number;
  snapshot_date?: string;
  profile?: IgProfile;
  user_insights?: MetricValue[];
  engaged_audience_demographics?: MetricValue | null;
  follower_demographics?: MetricValue | null;
  follows_and_unfollows?: MetricValue | null;
  media?: IgMediaItem[];
  stories?: IgStoryItem[];
  page_insights?: MetricValue[] | null;
  messages?: string[];
};

