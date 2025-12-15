import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { code, user_id, provider = 'instagram' } = await req.json();
    
    if (!code) {
      throw new Error('Authorization code is required');
    }

    if (!user_id) {
      throw new Error('User ID is required');
    }

    const clientId = Deno.env.get('INSTAGRAM_APP_ID');
    const clientSecret = Deno.env.get('INSTAGRAM_APP_SECRET');
    const redirectUri = 'https://insta-glow-up-39.lovable.app/auth/callback';

    console.log('Exchanging code for short-lived token...');
    console.log('Provider:', provider);
    console.log('User ID:', user_id);

    let accessToken: string;
    let instagramUserId: string;
    let expiresIn: number;

    if (provider === 'facebook') {
      // Facebook OAuth flow
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
      );

      const tokenData = await tokenResponse.json();
      console.log('Facebook token response:', JSON.stringify(tokenData));

      if (tokenData.error) {
        throw new Error(tokenData.error.message);
      }

      // Get long-lived token for Facebook
      const longLivedResponse = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${tokenData.access_token}`
      );

      const longLivedData = await longLivedResponse.json();
      console.log('Facebook long-lived token response:', JSON.stringify(longLivedData));

      if (longLivedData.error) {
        throw new Error(longLivedData.error.message);
      }

      accessToken = longLivedData.access_token;
      expiresIn = longLivedData.expires_in || 5184000; // Default 60 days

      // Get Instagram business account ID via Facebook Pages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
      );
      const pagesData = await pagesResponse.json();
      
      if (pagesData.data && pagesData.data.length > 0) {
        const page = pagesData.data[0];
        const igResponse = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`
        );
        const igData = await igResponse.json();
        
        if (igData.instagram_business_account) {
          instagramUserId = igData.instagram_business_account.id;
        } else {
          throw new Error('No Instagram business account linked to Facebook page');
        }
      } else {
        throw new Error('No Facebook pages found');
      }

    } else {
      // Instagram Direct OAuth flow
      const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code: code,
        }),
      });

      const tokenData = await tokenResponse.json();
      console.log('Instagram token response:', JSON.stringify(tokenData));

      if (tokenData.error_message) {
        throw new Error(tokenData.error_message);
      }

      const { access_token: shortLivedToken, user_id: igUserId } = tokenData;
      instagramUserId = igUserId;

      // Exchange short-lived token for long-lived token
      console.log('Exchanging for long-lived token...');
      const longLivedResponse = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`
      );

      const longLivedData = await longLivedResponse.json();
      console.log('Long-lived token response:', JSON.stringify(longLivedData));

      if (longLivedData.error) {
        throw new Error(longLivedData.error.message);
      }

      accessToken = longLivedData.access_token || shortLivedToken;
      expiresIn = longLivedData.expires_in || 5184000;
    }

    // Get Instagram profile info
    console.log('Fetching Instagram profile...');
    const profileResponse = await fetch(
      `https://graph.instagram.com/v18.0/${instagramUserId}?fields=id,username,name,profile_picture_url&access_token=${accessToken}`
    );
    const profileData = await profileResponse.json();
    console.log('Profile data:', JSON.stringify(profileData));

    // Save to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    console.log('Saving connected account to database...');
    const { error: upsertError } = await supabase
      .from('connected_accounts')
      .upsert({
        user_id: user_id,
        provider: provider,
        provider_account_id: instagramUserId,
        access_token: accessToken,
        token_expires_at: tokenExpiresAt,
        account_username: profileData.username || null,
        account_name: profileData.name || null,
        profile_picture_url: profileData.profile_picture_url || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider,provider_account_id',
      });

    if (upsertError) {
      console.error('Database upsert error:', upsertError);
      throw new Error('Failed to save connected account');
    }

    console.log('Connected account saved successfully');

    return new Response(JSON.stringify({
      success: true,
      provider: provider,
      instagram_user_id: instagramUserId,
      username: profileData.username,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Instagram OAuth error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage, success: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
