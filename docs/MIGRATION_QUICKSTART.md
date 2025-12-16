# Supabase Migration Quickstart

This is a quick reference guide for migrating Open Ham Prep from Lovable Cloud to a standalone Supabase project.

## Prerequisites

✅ Supabase CLI installed (v2.65.5)
✅ Migration script created (`migrate-to-supabase.sh`)

## Quick Migration Steps

### 1. Create Supabase Project (5 minutes)

1. Go to https://supabase.com
2. Click "New Project"
3. Choose organization and set project name (e.g., "openhamprep")
4. Set database password (save this!)
5. Select region (US East recommended)
6. Wait for project to be created

### 2. Get Project Credentials (2 minutes)

From your Supabase dashboard:

**Project ID:**
- Settings > General > Reference ID

**API Keys:**
- Settings > API > Project API keys
- Copy the `anon` `public` key

**Project URL:**
- Settings > API > Project URL

### 3. Run Migration Script (10-15 minutes)

```bash
./migrate-to-supabase.sh
```

The script will:
- Login to Supabase (opens browser)
- Link your local project to the new Supabase project
- Apply all database migrations
- Deploy edge functions
- Create `.env` file with new credentials
- Guide you through auth configuration

### 4. Export Data from Lovable (5 minutes)

If you have existing data in Lovable Cloud:

1. Login to your current app with admin account
2. Go to Admin dashboard
3. Use "Bulk Export" feature to export:
   - Questions (JSON format)
   - Glossary terms (JSON format)
4. Save the exported files

### 5. Import Data to New Supabase (5 minutes)

1. Start your dev server: `npm run dev`
2. Login with a new account (will be your new admin)
3. In Supabase SQL Editor, grant admin role:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('your-user-uuid', 'admin');
   ```
4. Go to Admin dashboard
5. Use "Bulk Import" to import your exported data

### 6. Test Everything (10 minutes)

```bash
npm run dev
```

Test these features:
- [ ] Sign up / Sign in
- [ ] Practice test
- [ ] Random practice
- [ ] Study by topics
- [ ] Bookmarks
- [ ] Glossary
- [ ] Admin dashboard (if admin)

### 7. Configure Production Auth (2 minutes)

In Supabase Dashboard:
- Auth > URL Configuration
- Site URL: `https://openhamprep.app`
- Redirect URLs:
  - `https://openhamprep.app/auth`
  - `http://localhost:8080/auth`

### 8. Update Production Deployment

Update your production environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## Troubleshooting

### Migration fails with "permission denied"
- Make sure you're logged in: `supabase login`
- Check you're using the correct project ID

### Edge functions fail to deploy
- Check `supabase/config.toml` has correct settings
- Try deploying functions individually:
  ```bash
  supabase functions deploy delete-user --no-verify-jwt
  supabase functions deploy geocode-addresses --no-verify-jwt
  supabase functions deploy manage-question-links --no-verify-jwt
  supabase functions deploy seed-questions --no-verify-jwt
  ```

### Can't login after migration
- Check `.env` has correct credentials
- Verify auth redirect URLs in Supabase dashboard
- Clear browser cache and cookies

### Admin features not working
- Make sure you granted admin role via SQL:
  ```sql
  INSERT INTO public.user_roles (user_id, role)
  VALUES ('your-user-uuid', 'admin');
  ```
- Check user UUID in Auth > Users

## Manual Migration (Alternative)

If the script doesn't work, follow the detailed manual instructions in `docs/SUPABASE_MIGRATION.md`.

## Getting Help

- Check detailed migration guide: `docs/SUPABASE_MIGRATION.md`
- Supabase docs: https://supabase.com/docs
- Project issues: https://github.com/sonyccd/openhamprep/issues

## Estimated Total Time

- With existing data: ~45 minutes
- Without data: ~25 minutes
