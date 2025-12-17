# OAuth 2.1 Server Setup for Discourse SSO

This guide explains how to set up Open Ham Prep as an OAuth 2.1 identity provider so users can log into the Discourse forum using their existing Open Ham Prep credentials (single sign-on).

## Overview

**Key Features:**
- Users set their own "forum username" (privacy - they may not want real identity public)
- "Remember this decision" option to skip consent on subsequent logins
- **Optional integration** - self-hosters who don't use Discourse can ignore this

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────┐
│  Discourse      │────▶│  Open Ham Prep       │────▶│  Supabase   │
│  Forum          │     │  (OAuth 2.1 Server)  │     │  Auth       │
│  (self-hosted)  │◀────│  + Consent UI        │◀────│             │
└─────────────────┘     └──────────────────────┘     └─────────────┘
```

**Flow:**
1. User clicks "Login with Open Ham Prep" on Discourse
2. Discourse redirects to Open Ham Prep authorization endpoint
3. User authenticates (if not already logged in)
4. **First time**: User sees consent screen, sets forum username, approves
5. **Subsequent**: If "remember" checked, auto-approve (skip consent UI)
6. Open Ham Prep returns authorization code to Discourse
7. Discourse exchanges code for access token
8. Discourse fetches user info (including forum username) and logs user in

## Setup Instructions

### Step 1: Apply Database Migration

Run the migration to add the new columns and tables:

```bash
# For local development
npm run supabase:reset  # This will apply all migrations including the new one

# For production (via Supabase CLI)
supabase db push
```

### Step 2: Configure Supabase Auth Redirect URLs

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** > **URL Configuration**
4. Add the following to **Redirect URLs**:
   - `https://app.openhamprep.com/**` (production app)
   - `https://forum.openhamprep.com/auth/oidc/callback` (Discourse OIDC callback)
   - `http://localhost:8080/**` (local development)

### Step 3: Configure Supabase OAuth 2.1 Server (Dashboard)

1. Navigate to **Authentication** > **OAuth Server** (or **OAuth 2.1 Server**)
2. Click **Enable OAuth 2.1 Server** if not already enabled
3. Configure the following settings:
   - **Site URL**: `app.openhamprep.com` (where your React app is hosted)
   - **Authorization Path**: `/oauth/consent`
   - The Preview Authorization URL should show: `app.openhamprep.com/oauth/consent`
   - **JWT signing**: If using OIDC (recommended), switch to RS256 asymmetric signing
4. Register Discourse as an OAuth client:
   - Click **Add Client** (or **New Client**)
   - **Name**: `Open Ham Prep Forum`
   - **Type**: `Confidential` (server-side application)
   - **Redirect URI**: `https://forum.openhamprep.com/auth/oidc/callback`
5. **Save the Client ID and Client Secret** - you'll need these for Discourse

**IMPORTANT**: The Site URL in Supabase URL Configuration must match where your app is hosted (`app.openhamprep.com`). The OAuth Server uses this Site URL + Authorization Path to construct the full consent URL.

### Step 4: Configure Discourse (OIDC Plugin - Recommended)

We recommend using the **discourse-openid-connect** plugin instead of oauth2-basic because it:
- Has native PKCE support (required by OAuth 2.1)
- Handles OpenID Connect flows properly
- Works better with Supabase's OAuth 2.1 server

1. Log into your Discourse admin panel: https://forum.openhamprep.com/admin
2. Go to **Admin** > **Settings** > **Login**
3. Search for "openid" and configure:

| Setting | Value |
|---------|-------|
| `openid_connect_enabled` | ✓ (checked) |
| `openid_connect_discovery_document` | (leave empty - we'll configure manually) |
| `openid_connect_client_id` | `<Client ID from Supabase>` |
| `openid_connect_client_secret` | `<Client Secret from Supabase>` |
| `openid_connect_authorize_url` | `https://api.openhamprep.com/auth/v1/oauth/authorize` |
| `openid_connect_token_url` | `https://api.openhamprep.com/auth/v1/oauth/token` |
| `openid_connect_userinfo_url` | `https://api.openhamprep.com/auth/v1/userinfo` |
| `openid_connect_authorize_scope` | `openid email profile` |
| `openid_connect_claims_email` | `email` |
| `openid_connect_claims_email_verified` | `email_verified` |
| `openid_connect_claims_name` | `name` |
| `openid_connect_claims_preferred_username` | `preferred_username` |
| `openid_connect_button_title` | `Login with Open Ham Prep` |
| `openid_connect_allow_association_change` | ✓ (checked) |

**IMPORTANT - Redirect URI**: Make sure the redirect URI registered in Supabase OAuth Server matches:
`https://forum.openhamprep.com/auth/oidc/callback`

The URLs above use the custom domain `api.openhamprep.com`. If you're self-hosting with a different Supabase project, replace with your project URL (e.g., `https://<project-ref>.supabase.co`).

### Step 5: Test the Integration

1. Go to https://forum.openhamprep.com
2. Click "Log In" or "Sign Up"
3. You should see "Login with Open Ham Prep" (or "with OAuth2") option
4. Click it and verify:
   - You're redirected to `https://app.openhamprep.com/oauth/consent?authorization_id=...`
   - If not logged in, you're prompted to log in first
   - You see the consent screen with forum username input
   - After approving, you're redirected back to Discourse logged in

**Troubleshooting**: If you get an "invalid_credentials" error or OAuth fails:

1. **Verify Redirect URI matches exactly**: In Supabase OAuth Server, the redirect URI must be:
   `https://forum.openhamprep.com/auth/oidc/callback`

2. **Check Client ID and Secret**: Verify they match exactly between Supabase and Discourse

3. **Verify Token Endpoint**: Discourse must be able to POST to `https://api.openhamprep.com/auth/v1/oauth/token`
   - Test with curl: `curl -X POST https://api.openhamprep.com/auth/v1/oauth/token`
   - Should return a JSON error (not HTML or 404)

4. **Check PKCE is working**: The OIDC plugin handles PKCE automatically, but verify:
   - Discourse is sending `code_verifier` in the token request
   - The `code_challenge` from the authorize request matches

5. **Check Discourse logs**: In Discourse admin, go to /logs to see detailed OAuth errors

6. **Verify userinfo endpoint**: After token exchange, Discourse fetches user info from:
   `https://api.openhamprep.com/auth/v1/userinfo`
   - Test: `curl -H "Authorization: Bearer <token>" https://api.openhamprep.com/auth/v1/userinfo`

7. **Network tab debugging**: Check browser Network tab during the OAuth flow to see:
   - The authorize request (should redirect to consent page)
   - The callback with authorization code
   - Any failed requests to token/userinfo endpoints

### Step 6: (Optional) Custom Access Token Hook

To include `forum_username` in the userinfo response, you may need to create a Supabase Edge Function hook. This is optional - the basic integration works without it.

## Files Involved

### New Files (created for this feature)
- `supabase/migrations/20251217000000_add_oauth_support.sql` - Database migration
- `src/pages/OAuthConsent.tsx` - OAuth consent page
- `src/hooks/useOAuthConsent.ts` - OAuth consent hook
- `src/hooks/useOAuthConsent.test.tsx` - Hook tests
- `src/pages/OAuthConsent.test.tsx` - Page tests

### Modified Files
- `src/App.tsx` - Added `/oauth/consent` route
- `src/components/ProfileModal.tsx` - Added Forum Username section
- `src/components/ProfileModal.test.tsx` - Updated tests
- `src/components/DashboardSidebar.tsx` - Updated UserInfo interface
- `src/components/AppLayout.tsx` - Pass forumUsername to userInfo

## Database Schema

The migration adds:

```sql
-- User's forum-specific username (separate from display_name for privacy)
ALTER TABLE profiles ADD COLUMN forum_username TEXT UNIQUE;

-- Track OAuth consent decisions for "remember this" functionality
CREATE TABLE oauth_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  scopes TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, client_id)
);
```

## Important Notes

### Forum Username vs Display Name
- `display_name` = shown within Open Ham Prep (can be real name)
- `forum_username` = shown on Discourse (can be pseudonym for privacy)
- Users set `forum_username` on first OAuth consent
- Users can edit it anytime in Profile Settings

### This is Optional
- The consent page only activates when accessed via OAuth flow
- No UI changes to the main app
- Self-hosters who don't use Discourse simply won't configure the OAuth client
- The database tables exist but remain empty if unused

### Security
- OAuth 2.1 requires PKCE (handled by Supabase)
- Asymmetric JWT signing (RS256) for third-party token validation
- RLS protects consent records
- Forum username uniqueness enforced at DB level

## References
- [Supabase OAuth Server Docs](https://supabase.com/docs/guides/auth/oauth-server)
- [Supabase OAuth Getting Started](https://supabase.com/docs/guides/auth/oauth-server/getting-started)
- [Discourse OpenID Connect Plugin](https://meta.discourse.org/t/openid-connect-authentication-plugin/103632)
- [Discourse OIDC Plugin Source](https://github.com/discourse/discourse-openid-connect)
