import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    
    if (!user_id) {
      throw new Error('User ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching token for user:', user_id);

    // Get the most recent connected account for the user
    const { data, error } = await supabase
      .from('connected_accounts')
      .select('access_token, provider_account_id, token_expires_at')
      .eq('user_id', user_id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error('No connected account found');
    }

    if (!data) {
      throw new Error('No connected account found');
    }

    // Check if token is expired
    if (data.token_expires_at) {
      const expiresAt = new Date(data.token_expires_at);
      const now = new Date();
      if (expiresAt <= now) {
        console.log('Token expired, needs refresh');
        // TODO: Implement token refresh logic
        throw new Error('Token expired. Please reconnect your account.');
      }
    }

    console.log('Token retrieved successfully');

    return new Response(JSON.stringify({
      access_token: data.access_token,
      instagram_user_id: data.provider_account_id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Get token error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
