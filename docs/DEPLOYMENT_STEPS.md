# Deployment Steps - Open Ham Prep

Follow these steps to deploy the dual-site architecture.

## Overview

- **Marketing Site:** `openhamprep.com` → GitHub Pages
- **React App:** `app.openhamprep.com` → Vercel

---

## Part 1: GitHub Pages Setup (Marketing Site)

### Step 1: Enable GitHub Pages

1. Go to https://github.com/sonyccd/openhamprep/settings/pages
2. Under "Build and deployment":
   - **Source:** Select "GitHub Actions"
   - This allows the workflow to deploy instead of using the legacy Pages build
3. Click "Save"

### Step 2: Configure Custom Domain

1. Still in Pages settings, under "Custom domain":
   - Enter: `openhamprep.com`
   - Click "Save"
2. Wait for DNS check (may take a few minutes)
3. Once verified, check "Enforce HTTPS"

### Step 3: Update Cloudflare DNS

Since your domain is managed by Cloudflare, configure these DNS records:

**For GitHub Pages (Marketing Site):**
```
Type: A
Name: @
Content: 185.199.108.153
Proxy: OFF (gray cloud - DNS only)

Type: A
Name: @
Content: 185.199.109.153
Proxy: OFF (gray cloud - DNS only)

Type: A
Name: @
Content: 185.199.110.153
Proxy: OFF (gray cloud - DNS only)

Type: A
Name: @
Content: 185.199.111.153
Proxy: OFF (gray cloud - DNS only)
```

**Note:**
- You need all 4 A records pointing to GitHub's IPs for redundancy
- **Important:** Proxy must be OFF (gray cloud) - GitHub Pages doesn't work with Cloudflare proxy enabled

### Step 4: Verify Marketing Deployment

1. The GitHub Actions workflow should auto-trigger since you just pushed
2. Check workflow status: https://github.com/sonyccd/openhamprep/actions
3. Look for "Deploy Marketing Site to GitHub Pages" workflow
4. Once complete (green checkmark), visit `https://openhamprep.com`
5. You should see the marketing landing page

**Expected Result:**
- ✅ Marketing pages load from `openhamprep.com`
- ✅ Theme toggle works
- ✅ Navigation between pages works
- ✅ Links to `app.openhamprep.com/auth` are present (won't work yet)

---

## Part 2: Vercel Setup (React App)

### Step 1: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository: **sonyccd/openhamprep**
4. Click **Import**

### Step 2: Configure Build Settings

Vercel auto-detects Vite projects. Verify these settings:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Root Directory: ./
```

### Step 3: Add Environment Variables

Under **Environment Variables**, add:

```
VITE_SUPABASE_URL = <your-supabase-project-url>
VITE_SUPABASE_ANON_KEY = <your-supabase-anon-key>
VITE_POSTHOG_KEY = <your-posthog-key>
VITE_POSTHOG_HOST = <your-posthog-host>
```

**Where to find Supabase values:**
- Go to your Supabase project dashboard
- Settings → API
- Copy `URL` and `anon public` key

**Important:** Make sure to apply these variables to **Production**, **Preview**, and **Development** environments.

### Step 4: Deploy

1. Click **Deploy**
2. Vercel will build and deploy your app
3. This takes 1-3 minutes
4. You'll get a deployment URL like `openhamprep.vercel.app`

### Step 5: Configure Custom Domain

1. In your Vercel project, go to **Settings** → **Domains**
2. Add domain: `app.openhamprep.com`
3. Click **Add**
4. Vercel will provide DNS configuration instructions

### Step 6: Update Cloudflare DNS

Add a CNAME record in Cloudflare DNS:

```
Type: CNAME
Name: app
Target: cname.vercel-dns.com
Proxy: OFF (gray cloud - DNS only)
TTL: Auto
```

**Important:** Proxy must be OFF (gray cloud) for Vercel's SSL to work properly.

### Step 7: Verify App Deployment

1. Visit `https://app.openhamprep.com`
2. You should see a loading spinner, then be redirected to `/auth`
3. Test authentication flow:
   - Sign up with a test account
   - Verify email (check spam folder)
   - Log in and access dashboard

**Expected Result:**
- ✅ App loads at `app.openhamprep.com`
- ✅ Non-authenticated users → redirected to `/auth`
- ✅ Authentication works (Supabase connection)
- ✅ After login → redirected to `/dashboard`

---

## Part 3: Build Optimization

### Automatic Deployment Triggers

Both platforms have smart deployment triggers:

**GitHub Pages (Marketing):**
- Only deploys when files in `marketing/` directory change
- Configured in `.github/workflows/deploy-marketing.yml`:
```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'marketing/**'
```

**Vercel (React App):**
- Automatically deploys on every push to `main`
- Can be configured to ignore marketing changes in Vercel dashboard:
  1. Go to **Settings** → **Git**
  2. Under **Ignored Build Step**, add custom script:
  ```bash
  git diff HEAD^ HEAD --quiet -- marketing/
  ```
  3. This skips rebuilds when only marketing files change

---

## Part 4: Testing Checklist

### Marketing Site (`openhamprep.com`)

- [ ] Landing page loads
- [ ] About page loads
- [ ] FAQ page loads
- [ ] Features page loads
- [ ] Theme toggle works (light/dark)
- [ ] Mobile menu works
- [ ] All "Sign Up / Sign In" buttons link to `app.openhamprep.com/auth`
- [ ] GitHub repo link works
- [ ] Footer displays correctly

### React App (`app.openhamprep.com`)

- [ ] Root `/` redirects to `/auth` (non-authenticated)
- [ ] Root `/` redirects to `/dashboard` (authenticated)
- [ ] Sign up flow works
- [ ] Email verification works
- [ ] Login flow works
- [ ] Dashboard loads after login
- [ ] Practice tests work
- [ ] Question answering works
- [ ] Progress tracking works
- [ ] Admin panel accessible (if admin user)

### Cross-Site Integration

- [ ] Marketing CTA buttons correctly link to app auth
- [ ] App logout doesn't break (still works)
- [ ] Cookies/sessions work correctly across subdomains

---

## Troubleshooting

### GitHub Pages Not Deploying

**Problem:** Workflow runs but site doesn't update

**Solution:**
1. Check workflow logs: https://github.com/sonyccd/openhamprep/actions
2. Ensure GitHub Pages is set to "GitHub Actions" source
3. Verify CNAME file exists in `marketing/` directory
4. Check DNS propagation: https://dnschecker.org

### Vercel Build Fails

**Problem:** Build fails with errors

**Solutions:**
1. Check build logs in Vercel dashboard
2. Verify all environment variables are set
3. Check that `npm run build` works locally
4. Verify Supabase credentials are correct
5. Ensure environment variables are applied to the correct environment (Production/Preview/Development)

### DNS Not Resolving

**Problem:** Domain doesn't point to site

**Solutions:**
1. Wait 5-10 minutes for DNS propagation
2. Check Cloudflare DNS settings match above
3. **Ensure Proxy is DISABLED (gray cloud)** for both GitHub Pages and Vercel
4. Clear browser DNS cache
5. Test with: `nslookup openhamprep.com` and `nslookup app.openhamprep.com`

### SSL Certificate Issues

**Problem:** "Not Secure" warning

**Solutions:**
1. GitHub Pages: Wait 10-15 minutes after DNS setup
2. Vercel: SSL is usually instant
3. Ensure "Enforce HTTPS" is checked in GitHub Pages settings
4. Verify Cloudflare proxy is disabled (gray cloud) for both domains
5. In Cloudflare, SSL mode should be "Full" or "Full (strict)"

### App Authentication Not Working

**Problem:** Login fails or doesn't redirect

**Solutions:**
1. Check Supabase environment variables are correct
2. In Supabase dashboard → Authentication → URL Configuration:
   - Add `app.openhamprep.com` to allowed redirect URLs
3. Check browser console for errors
4. Verify Supabase project is not paused

---

## Success Criteria

✅ **Marketing site is live:**
- `https://openhamprep.com` loads correctly
- All pages accessible
- Theme toggle works

✅ **App is live:**
- `https://app.openhamprep.com` redirects to auth
- Authentication works end-to-end
- Dashboard loads after login

✅ **Auto-deployment works:**
- Push to `main` triggers GitHub Actions for marketing
- Push to `main` triggers Vercel rebuild for app

✅ **Zero/Low cost:**
- GitHub Pages: Free
- Vercel: Free tier (generous limits)

---

## Next Steps After Deployment

1. **Test on Mobile:** Verify responsive design works
2. **SEO:** Submit sitemap to Google Search Console
3. **Analytics:** Verify Pendo tracking works in app
4. **Monitoring:** Set up uptime monitoring (e.g., UptimeRobot)
5. **Documentation:** Update any hardcoded URLs in docs

---

## Quick Reference

### Key URLs
- Marketing: https://openhamprep.com
- App: https://app.openhamprep.com
- GitHub Repo: https://github.com/sonyccd/openhamprep
- GitHub Actions: https://github.com/sonyccd/openhamprep/actions

### Key Files
- Marketing workflow: `.github/workflows/deploy-marketing.yml`
- Marketing content: `marketing/` directory
- App config: `vite.config.ts`, `package.json`
- Deployment docs: `DEPLOYMENT_STEPS.md`

### Support Resources
- GitHub Pages Docs: https://docs.github.com/en/pages
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
