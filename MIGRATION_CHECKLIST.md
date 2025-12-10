# Migration Checklist

Use this checklist to track your migration progress.

## Pre-Migration

- [ ] Read `MIGRATION_SUMMARY.md` for overview
- [ ] Review `MIGRATION_QUICKSTART.md` for detailed steps
- [ ] Backup any critical data from Lovable Cloud
- [ ] Note down current production URL and settings

## Create Supabase Project

- [ ] Go to https://supabase.com
- [ ] Create new project
- [ ] Choose organization
- [ ] Set project name: `openhamprep` (or your choice)
- [ ] Set strong database password (save it!)
- [ ] Select region (US East recommended)
- [ ] Wait for project creation (~2 min)

## Gather Credentials

- [ ] Open project dashboard
- [ ] Navigate to Settings > General
  - [ ] Copy Project ID (Reference ID)
- [ ] Navigate to Settings > API
  - [ ] Copy Project URL
  - [ ] Copy anon/public key

## Run Migration Script

- [ ] Open terminal in project directory
- [ ] Run `./migrate-to-supabase.sh`
- [ ] Follow prompts to login to Supabase
- [ ] Enter Project ID when prompted
- [ ] Confirm migration application
- [ ] Confirm function deployment
- [ ] Enter anon key when prompted
- [ ] Verify `.env` file created

## Configure Authentication

- [ ] Go to Supabase dashboard
- [ ] Navigate to Auth > URL Configuration
- [ ] Set Site URL: `https://openhamprep.app`
- [ ] Add Redirect URLs:
  - [ ] `https://openhamprep.app/auth`
  - [ ] `http://localhost:8080/auth`
- [ ] Save changes

## Data Migration (If applicable)

### Export from Lovable Cloud

- [ ] Login to current app with admin account
- [ ] Go to Admin dashboard
- [ ] Export questions (JSON)
- [ ] Export glossary terms (JSON)
- [ ] Save files locally

### Import to Supabase

- [ ] Start dev server: `npm run dev`
- [ ] Create new user account
- [ ] Get user UUID from Supabase dashboard (Auth > Users)
- [ ] Run SQL to grant admin:
  ```sql
  INSERT INTO public.user_roles (user_id, role)
  VALUES ('your-uuid-here', 'admin');
  ```
- [ ] Refresh app and verify admin access
- [ ] Go to Admin dashboard
- [ ] Import questions via Bulk Import
- [ ] Import glossary terms via Bulk Import
- [ ] Verify data imported correctly

## Local Testing

- [ ] Dev server running: `npm run dev`
- [ ] Test user signup
- [ ] Test user login
- [ ] Test practice test
- [ ] Test random practice
- [ ] Test study by topics
- [ ] Test bookmarks
- [ ] Test glossary
- [ ] Test flashcards
- [ ] Test progress tracking
- [ ] Test admin features (if admin)
- [ ] Test in both light/dark mode
- [ ] Test on mobile viewport
- [ ] Check browser console for errors

## Verify Database

- [ ] Go to Supabase dashboard
- [ ] Navigate to Table Editor
- [ ] Verify tables exist:
  - [ ] profiles
  - [ ] questions
  - [ ] glossary_terms
  - [ ] question_attempts
  - [ ] practice_test_results
  - [ ] bookmarked_questions
  - [ ] user_roles
  - [ ] exam_sessions
- [ ] Verify data populated (if imported)

## Verify Edge Functions

- [ ] Go to Supabase dashboard
- [ ] Navigate to Edge Functions
- [ ] Verify functions deployed:
  - [ ] delete-user
  - [ ] geocode-addresses
  - [ ] manage-question-links
  - [ ] seed-questions
- [ ] Check function logs for errors

## Production Deployment

- [ ] Update production environment variables:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`
  - [ ] `VITE_SUPABASE_PROJECT_ID`
- [ ] Deploy updated frontend
- [ ] Test production site
- [ ] Verify auth works in production
- [ ] Verify all features work in production

## Post-Migration

- [ ] Monitor error logs for issues
- [ ] Test production app thoroughly
- [ ] Create admin account in production
- [ ] Import production data (if needed)
- [ ] Update any documentation with new setup
- [ ] Share new setup instructions with team
- [ ] Consider deleting Lovable Cloud project (after verification)

## Optional Cleanup

- [ ] Delete `MIGRATION_QUICKSTART.md` (or keep for reference)
- [ ] Delete `MIGRATION_SUMMARY.md`
- [ ] Delete `MIGRATION_CHECKLIST.md` (this file)
- [ ] Delete `migrate-to-supabase.sh` (or keep for team)
- [ ] Keep `docs/SUPABASE_MIGRATION.md` for reference
- [ ] Keep `.env.example` for team onboarding

## Troubleshooting Reference

If you encounter issues, check:
1. `MIGRATION_QUICKSTART.md` - Common solutions
2. `docs/SUPABASE_MIGRATION.md` - Detailed manual steps
3. Supabase docs: https://supabase.com/docs
4. Project issues: https://github.com/sonyccd/openhamprep/issues

---

**Migration Status**: _Not Started_ / _In Progress_ / _Complete_

**Date Started**: _______________

**Date Completed**: _______________

**Notes**:
