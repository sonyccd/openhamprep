import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AuthorizationDetails {
  client_id: string;
  client_name: string;
  redirect_uri: string;
  scopes: string[];
  state?: string;
}

interface UseOAuthConsentReturn {
  isLoading: boolean;
  error: string | null;
  authorizationDetails: AuthorizationDetails | null;
  forumUsername: string | null;
  hasExistingConsent: boolean;
  isProcessing: boolean;
  handleApprove: (forumUsername: string, rememberDecision: boolean) => Promise<void>;
  handleDeny: () => Promise<void>;
}

export function useOAuthConsent(): UseOAuthConsentReturn {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorizationDetails, setAuthorizationDetails] = useState<AuthorizationDetails | null>(null);
  const [forumUsername, setForumUsername] = useState<string | null>(null);
  const [hasExistingConsent, setHasExistingConsent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const authorizationId = searchParams.get('authorization_id');

  const autoApprove = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.oauth?.approveAuthorization?.(authorizationId!) ?? { data: null, error: new Error('OAuth server not enabled') };

      if (error) throw error;

      if (data?.redirect_to) {
        window.location.href = data.redirect_to;
      }
    } catch (err) {
      console.error('Auto-approve failed:', err);
      setError(err instanceof Error ? err.message : 'Auto-approval failed');
      setIsLoading(false);
    }
  }, [authorizationId]);

  const fetchAuthorizationDetails = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get authorization details from Supabase OAuth server
      // Note: This API may need to be adjusted based on actual Supabase OAuth 2.1 API
      const { data: authDetails, error: authError } = await supabase.auth.oauth?.getAuthorizationDetails?.(authorizationId!) ?? { data: null, error: new Error('OAuth server not enabled') };

      if (authError) {
        throw authError;
      }

      if (!authDetails) {
        throw new Error('Failed to fetch authorization details');
      }

      setAuthorizationDetails({
        client_id: authDetails.client_id,
        client_name: authDetails.client_name || 'Unknown Application',
        redirect_uri: authDetails.redirect_uri,
        scopes: authDetails.scopes || [],
        state: authDetails.state,
      });

      // Fetch user's forum username from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('forum_username')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }

      setForumUsername(profile?.forum_username || null);

      // Check for existing consent
      const { data: existingConsent, error: consentError } = await supabase
        .from('oauth_consents')
        .select('id')
        .eq('user_id', userId)
        .eq('client_id', authDetails.client_id)
        .maybeSingle();

      if (consentError) {
        console.error('Error checking existing consent:', consentError);
      }

      const hasConsent = !!existingConsent;
      setHasExistingConsent(hasConsent);

      // If user has existing consent AND has a forum username, auto-approve
      if (hasConsent && profile?.forum_username) {
        await autoApprove();
        return;
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error in fetchAuthorizationDetails:', err);
      setError(err instanceof Error ? err.message : 'Failed to load authorization details');
      setIsLoading(false);
    }
  }, [authorizationId, autoApprove]);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // If not logged in, redirect to auth with return URL
    if (!user) {
      const returnUrl = `/oauth/consent?authorization_id=${authorizationId}`;
      navigate(`/auth?returnTo=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // If no authorization_id, show error
    if (!authorizationId) {
      setError('Missing authorization_id parameter');
      setIsLoading(false);
      return;
    }

    // Fetch authorization details and user profile
    fetchAuthorizationDetails(user.id);
  }, [user, authLoading, authorizationId, navigate, fetchAuthorizationDetails]);

  async function handleApprove(newForumUsername: string, rememberDecision: boolean) {
    if (!authorizationDetails || !user) return;

    try {
      setIsProcessing(true);

      // Validate and save forum username if provided/changed
      if (newForumUsername && newForumUsername !== forumUsername) {
        const trimmed = newForumUsername.trim();
        const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;

        if (!usernameRegex.test(trimmed)) {
          toast.error('Username must be 3-20 characters and contain only letters, numbers, underscores, or hyphens');
          setIsProcessing(false);
          return;
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ forum_username: trimmed })
          .eq('id', user.id);

        if (updateError) {
          if (updateError.code === '23505') {
            toast.error('This username is already taken');
          } else {
            toast.error('Failed to save forum username');
          }
          setIsProcessing(false);
          return;
        }
      }

      // Save consent if "remember decision" is checked
      if (rememberDecision) {
        const { error: consentError } = await supabase
          .from('oauth_consents')
          .upsert({
            user_id: user.id,
            client_id: authorizationDetails.client_id,
            scopes: authorizationDetails.scopes,
          }, {
            onConflict: 'user_id,client_id',
          });

        if (consentError) {
          console.error('Failed to save consent:', consentError);
          // Don't block the flow, just log the error
        }
      }

      // Approve the authorization
      const { data, error } = await supabase.auth.oauth?.approveAuthorization?.(authorizationId!) ?? { data: null, error: new Error('OAuth server not enabled') };

      if (error) throw error;

      if (data?.redirect_to) {
        window.location.href = data.redirect_to;
      } else {
        toast.error('No redirect URL received');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Approve failed:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to approve authorization');
      setIsProcessing(false);
    }
  }

  async function handleDeny() {
    if (!authorizationId) return;

    try {
      setIsProcessing(true);

      const { data, error } = await supabase.auth.oauth?.denyAuthorization?.(authorizationId) ?? { data: null, error: new Error('OAuth server not enabled') };

      if (error) throw error;

      if (data?.redirect_to) {
        window.location.href = data.redirect_to;
      } else {
        // If no redirect, go back to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Deny failed:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to deny authorization');
      setIsProcessing(false);
    }
  }

  return {
    isLoading,
    error,
    authorizationDetails,
    forumUsername,
    hasExistingConsent,
    isProcessing,
    handleApprove,
    handleDeny,
  };
}
