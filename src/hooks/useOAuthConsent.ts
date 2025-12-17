import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { validateForumUsername } from '@/lib/validation';

const LOG_PREFIX = '[OAuth]';

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
  isProcessing: boolean;
  isAutoApproving: boolean;
  handleApprove: (forumUsername: string) => Promise<void>;
  handleCancel: () => void;
}

/**
 * Helper to safely call Supabase OAuth API methods
 * Throws a clear error if OAuth server is not enabled
 */
async function callOAuthApi<T>(
  method: (() => Promise<{ data: T | null; error: Error | null }>) | undefined,
  methodName: string
): Promise<{ data: T | null; error: Error | null }> {
  if (!method) {
    return { data: null, error: new Error(`OAuth server not enabled: ${methodName} is not available`) };
  }
  return method();
}

export function useOAuthConsent(): UseOAuthConsentReturn {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorizationDetails, setAuthorizationDetails] = useState<AuthorizationDetails | null>(null);
  const [forumUsername, setForumUsername] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAutoApproving, setIsAutoApproving] = useState(false);

  const authorizationId = searchParams.get('authorization_id');

  // Use ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const autoApprove = useCallback(async (authId: string) => {
    if (!authId) {
      console.error(LOG_PREFIX, 'Auto-approve called without authorization ID');
      return;
    }

    try {
      setIsAutoApproving(true);

      const { data, error } = await callOAuthApi(
        supabase.auth.oauth?.approveAuthorization?.bind(supabase.auth.oauth, authId),
        'approveAuthorization'
      );

      if (error) throw error;

      if (data?.redirect_to) {
        window.location.href = data.redirect_to;
      }
    } catch (err) {
      console.error(LOG_PREFIX, 'Auto-approve failed:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Auto-approval failed');
        setIsLoading(false);
        setIsAutoApproving(false);
      }
    }
  }, []);

  const fetchAuthorizationDetails = useCallback(async (userId: string, authId: string) => {
    if (!authId) {
      console.error(LOG_PREFIX, 'fetchAuthorizationDetails called without authorization ID');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get authorization details from Supabase OAuth server
      const { data: authDetails, error: authError } = await callOAuthApi(
        supabase.auth.oauth?.getAuthorizationDetails?.bind(supabase.auth.oauth, authId),
        'getAuthorizationDetails'
      );

      if (authError) {
        throw authError;
      }

      if (!authDetails) {
        throw new Error('Failed to fetch authorization details');
      }

      // Log the full response to debug field names
      console.log(LOG_PREFIX, 'Authorization details received:', JSON.stringify(authDetails, null, 2));

      // Check if Supabase returned a redirect_url with authorization code already included
      // This happens when consent was already granted via Supabase's internal consent management.
      // Per Supabase docs: "If the response includes a redirect_uri, it means consent was already given"
      const preApprovedRedirectUrl = authDetails.redirect_url || authDetails.redirect_uri;
      if (preApprovedRedirectUrl && preApprovedRedirectUrl.includes('code=')) {
        console.log(LOG_PREFIX, 'Consent already granted, redirecting to:', preApprovedRedirectUrl);
        setIsAutoApproving(true);
        window.location.href = preApprovedRedirectUrl;
        return;
      }

      // Supabase OAuth 2.1 may use 'client' object, 'application' object, or different field names
      // The actual API returns: { client: { id, name }, redirect_uri, scope, ... }
      const clientId = authDetails.client_id || authDetails.client?.id || authDetails.application?.id || authDetails.application_id;

      // Handle different possible field names from Supabase OAuth API
      const clientName = authDetails.client_name || authDetails.client?.name || authDetails.application?.name || authDetails.name || 'Unknown Application';
      const redirectUri = authDetails.redirect_uri || '';
      const scopes = authDetails.scopes || authDetails.scope?.split(' ') || [];

      if (!clientId) {
        console.error(LOG_PREFIX, 'No client_id found in authorization details');
        throw new Error('Invalid authorization details: missing client_id');
      }

      setAuthorizationDetails({
        client_id: clientId,
        client_name: clientName,
        redirect_uri: redirectUri,
        scopes: scopes,
        state: authDetails.state,
      });

      // Fetch user's forum username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('forum_username')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error(LOG_PREFIX, 'Error fetching profile:', profileError);
      }

      if (!isMountedRef.current) return;

      const userForumUsername = profileData?.forum_username || null;
      setForumUsername(userForumUsername);

      // If user already has a forum username, auto-approve (no consent needed - we own both apps)
      if (userForumUsername) {
        await autoApprove(authId);
        return;
      }

      setIsLoading(false);
    } catch (err) {
      console.error(LOG_PREFIX, 'Error in fetchAuthorizationDetails:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load authorization details');
        setIsLoading(false);
      }
    }
  }, [autoApprove]);

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
    fetchAuthorizationDetails(user.id, authorizationId);
  }, [user, authLoading, authorizationId, navigate, fetchAuthorizationDetails]);

  async function handleApprove(newForumUsername: string) {
    // Guard against missing required state
    if (!authorizationDetails || !user || !authorizationId) {
      console.error(LOG_PREFIX, 'handleApprove called with missing state', {
        hasAuthDetails: !!authorizationDetails,
        hasUser: !!user,
        hasAuthId: !!authorizationId
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Validate and save forum username
      const validation = validateForumUsername(newForumUsername);

      if (!validation.valid) {
        toast.error(validation.error || 'Invalid forum username');
        setIsProcessing(false);
        return;
      }

      const trimmed = newForumUsername.trim();
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ forum_username: trimmed })
        .eq('id', user.id);

      if (updateError) {
        if (updateError.code === '23505') {
          toast.error('This username is already taken');
        } else {
          console.error(LOG_PREFIX, 'Failed to update forum username:', updateError);
          toast.error('Failed to save forum username');
        }
        setIsProcessing(false);
        return;
      }

      // Approve the authorization
      const { data, error } = await callOAuthApi(
        supabase.auth.oauth?.approveAuthorization?.bind(supabase.auth.oauth, authorizationId),
        'approveAuthorization'
      );

      if (error) throw error;

      if (data?.redirect_to) {
        window.location.href = data.redirect_to;
      } else {
        toast.error('No redirect URL received');
        if (isMountedRef.current) {
          setIsProcessing(false);
        }
      }
    } catch (err) {
      console.error(LOG_PREFIX, 'Approve failed:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to continue');
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    }
  }

  function handleCancel() {
    // Simply navigate back to dashboard
    navigate('/dashboard');
  }

  return {
    isLoading,
    error,
    authorizationDetails,
    forumUsername,
    isProcessing,
    isAutoApproving,
    handleApprove,
    handleCancel,
  };
}
