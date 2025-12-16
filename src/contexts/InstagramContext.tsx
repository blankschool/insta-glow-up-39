import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Simplified types - main data fetching is now done via useInsights
export interface InstagramProfile {
  id: string;
  username?: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  biography?: string;
}

export interface InstagramAccount {
  pageId: string;
  pageName: string;
  instagram: InstagramProfile;
}

interface InstagramContextType {
  accounts: InstagramAccount[];
  selectedAccount: InstagramAccount | null;
  profile: InstagramProfile | null;
  loading: boolean;
  error: string | null;
  selectAccount: (account: InstagramAccount) => void;
  refreshData: () => Promise<void>;
}

const InstagramContext = createContext<InstagramContextType | undefined>(undefined);

export function InstagramProvider({ children }: { children: React.ReactNode }) {
  const { user, connectedAccounts } = useAuth();
  
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InstagramAccount | null>(null);
  const [profile, setProfile] = useState<InstagramProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track if data has been loaded for the current user
  const loadedUserIdRef = useRef<string | null>(null);

  const loadAccountData = useCallback(async (account: InstagramAccount) => {
    setLoading(true);
    setError(null);
    
    try {
      // Profile data comes from the account info
      setProfile(account.instagram);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectAccount = useCallback((account: InstagramAccount) => {
    setSelectedAccount(account);
    loadAccountData(account);
  }, [loadAccountData]);

  const refreshData = useCallback(async () => {
    if (selectedAccount) {
      await loadAccountData(selectedAccount);
    }
  }, [selectedAccount, loadAccountData]);

  // Load Instagram data when user has connected accounts
  useEffect(() => {
    // Clear data if no user or no connected accounts
    if (!user || connectedAccounts.length === 0) {
      setAccounts([]);
      setSelectedAccount(null);
      setProfile(null);
      loadedUserIdRef.current = null;
      return;
    }

    // Skip if already loaded for this user
    if (loadedUserIdRef.current === user.id) {
      return;
    }

    const loadAccounts = async () => {
      setLoading(true);
      try {
        // Get the access token from database via edge function
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke('get-instagram-token', {
          body: {}
        });

        if (tokenError) {
          console.error('Error fetching token:', tokenError);
          setError('Failed to load account data');
          setLoading(false);
          return;
        }

        if (tokenData?.access_token && tokenData?.instagram_user_id) {
          // Store token temporarily in sessionStorage for API calls
          sessionStorage.setItem('instagram_access_token', tokenData.access_token);
          sessionStorage.setItem('instagram_user_id', tokenData.instagram_user_id);

          // Use data from connected_accounts as the profile source
          const account = connectedAccounts[0];
          const profileData: InstagramProfile = {
            id: account.provider_account_id,
            username: account.account_username || undefined,
            name: account.account_name || undefined,
            profile_picture_url: account.profile_picture_url || undefined,
          };
          
          setProfile(profileData);
          
          // Create a synthetic account for compatibility
          const syntheticAccount: InstagramAccount = {
            pageId: tokenData.instagram_user_id,
            pageName: profileData.username || account.account_name || 'Instagram Account',
            instagram: profileData,
          };
          setAccounts([syntheticAccount]);
          setSelectedAccount(syntheticAccount);
          
          // Mark as loaded for this user
          loadedUserIdRef.current = user.id;
        }
      } catch (err: any) {
        console.error('Error loading accounts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, [user?.id, connectedAccounts.length]);

  return (
    <InstagramContext.Provider value={{
      accounts,
      selectedAccount,
      profile,
      loading,
      error,
      selectAccount,
      refreshData,
    }}>
      {children}
    </InstagramContext.Provider>
  );
}

export function useInstagram() {
  const context = useContext(InstagramContext);
  if (context === undefined) {
    throw new Error('useInstagram must be used within an InstagramProvider');
  }
  return context;
}