-- Create a secure function for users to delete their own account
-- This function uses SECURITY DEFINER to run with elevated privileges
-- but is restricted to only delete the calling user's account

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current user's ID from the JWT
  -- This is the critical security check - auth.uid() returns the authenticated user's ID
  -- and cannot be spoofed without a valid JWT
  current_user_id := auth.uid();

  -- SECURITY CHECK: Ensure user is authenticated
  -- This check MUST NOT be removed - it prevents unauthenticated deletion
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;

  -- Log the deletion attempt (for audit purposes)
  RAISE LOG 'User deletion requested for user_id: %', current_user_id;

  -- Delete the user from auth.users
  -- This will cascade to profiles and all related data via foreign key constraints
  DELETE FROM auth.users WHERE id = current_user_id;

  -- Verify deletion occurred
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found or already deleted'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Account deleted successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error deleting user %: %', current_user_id, SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', 'An error occurred while deleting account'
    );
END;
$$;

-- Add a comment explaining the security model
COMMENT ON FUNCTION public.delete_own_account() IS
'Securely deletes the currently authenticated user account.
SECURITY: Uses auth.uid() to ensure users can only delete their own account.
The auth.uid() check MUST NOT be removed - see tests in src/hooks/useDeleteAccount.test.ts';

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

-- Revoke from public/anon to ensure only authenticated users can call it
REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM public;
