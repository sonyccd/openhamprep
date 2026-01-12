# Local Development Guide

This guide shows you how to run the entire Open Ham Prep stack locally, including a local Supabase instance. This is perfect for contributors who want to develop without needing access to the hosted Supabase project.

## Quick Start (2 Minutes)

**Prerequisites:** Node.js 20+, Docker Desktop (running)

```bash
git clone https://github.com/sonyccd/openhamprep.git
cd openhamprep
npm install
npm run dev:full
```

**What You Get:**
- **Application**: http://localhost:8080
- **Database GUI**: http://localhost:54323 (Supabase Studio)
- **Email Testing**: http://localhost:54324
- **PostgreSQL**: localhost:54322

**Sample Data Included:** 40 Technician questions, 35 General, 35 Extra, 30 glossary terms, 5 exam sessions.

---

## Prerequisites

- **Node.js 20+** (Supabase CLI requires Node 20)
- **Docker Desktop** (for local Supabase)

### Install Docker Desktop

**macOS:**
```bash
brew install --cask docker
# Or download from: https://www.docker.com/products/docker-desktop
```

**Linux:**
```bash
# Follow instructions at: https://docs.docker.com/engine/install/
```

**Windows:**
Download from: https://www.docker.com/products/docker-desktop

## Quick Start

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/sonyccd/openhamprep.git
cd openhamprep
npm install  # Includes Supabase CLI as a dev dependency
```

### 2. Start Local Supabase

```bash
npm run supabase:start
```

This will:
- Start PostgreSQL database
- Start PostgREST API
- Start GoTrue Auth server
- Start Realtime server
- Start Storage server
- Start Edge Functions runtime
- Apply all migrations automatically
- Seed initial data

**First run takes ~2-3 minutes to download Docker images.**

You'll see output like:
```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhb...
service_role key: eyJhb...
```

### 3. Set Up Environment Variables

The npm script automatically creates `.env.local`:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key-from-output>
VITE_SUPABASE_PROJECT_ID=local
```

### 4. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:8080

### 5. Access Supabase Studio

Visit: http://localhost:54323

This gives you a local version of the Supabase dashboard where you can:
- View and edit tables
- Run SQL queries
- Manage authentication
- View logs
- Test Edge Functions

## Development Workflow

### Daily Workflow

```bash
# Start everything
npm run dev:full

# When done, stop Supabase
npm run supabase:stop
```

### Available Commands

```bash
# Start local Supabase
npm run supabase:start

# Stop local Supabase (preserves data)
npm run supabase:stop

# Restart Supabase
npm run supabase:restart

# Reset Supabase (wipes all data!)
npm run supabase:reset

# View Supabase status
npm run supabase:status

# Open Supabase Studio
npm run supabase:studio

# Start both Supabase and dev server
npm run dev:full

# Run tests against local Supabase
npm run test:local
```

## Database Migrations

### Creating New Migrations

```bash
# Create a new migration
npx supabase migration new migration_name

# Edit the file in supabase/migrations/
# Then apply it:
npm run supabase:reset  # Resets and applies all migrations
```

### Applying Migrations

Migrations in `supabase/migrations/` are automatically applied when you start local Supabase.

To manually apply:
```bash
npm run supabase:reset
```

## Seeding Data

### Option 1: Use the Seed Function

```bash
# The seed function is automatically available
# Call it from your app or via SQL:
SELECT seed_questions();
```

### Option 2: Import JSON Data

```bash
# Import questions
supabase db execute --file seed-data/questions.json

# Or use the admin bulk import in the app
```

### Option 3: SQL Seed File

Create `supabase/seed.sql` with your seed data:

```sql
-- Insert test users, questions, etc.
INSERT INTO questions (id, question, options, correct_answer, subelement, question_group)
VALUES
  ('T1A01', 'Test question?', '["A", "B", "C", "D"]', 0, 'T1', 'T1A'),
  ('T1A02', 'Another question?', '["A", "B", "C", "D"]', 1, 'T1', 'T1A');
```

It will be applied automatically on `supabase db reset`.

## Testing

### Run Tests Against Local Supabase

```bash
# Make sure local Supabase is running
npm run supabase:start

# Run tests
npm run test:local
```

### Test Authentication

Local Supabase includes Inbucket for email testing:
- Visit: http://localhost:54324
- All emails sent by Supabase appear here
- Click confirmation links to verify accounts

## Edge Functions

### Developing Edge Functions

```bash
# Serve functions locally (hot reload)
npx supabase functions serve

# Deploy to local Supabase
npx supabase functions deploy function-name --local

# Test a function
curl -i --location --request POST 'http://localhost:54321/functions/v1/function-name' \
  --header 'Authorization: Bearer eyJhb...' \
  --header 'Content-Type: application/json' \
  --data '{"name":"test"}'
```

### Available Functions

- `delete-user` - Delete user account
- `geocode-addresses` - Geocode exam session addresses
- `manage-question-links` - Manage learning resource links
- `seed-questions` - Seed initial questions

## Database Access

### Direct Database Connection

```bash
# Connect via psql
psql postgresql://postgres:postgres@localhost:54322/postgres

# Or use any PostgreSQL client:
Host: localhost
Port: 54322
Database: postgres
User: postgres
Password: postgres
```

### Supabase Studio

Visit http://localhost:54323 for a GUI interface.

## Troubleshooting

### Supabase won't start

```bash
# Check Docker is running
docker ps

# Check for port conflicts (54321-54324)
lsof -i :54321

# Reset everything
npm run supabase:stop
docker system prune -a
npm run supabase:start
```

### "Database is not healthy"

```bash
# Wait 30 seconds for services to initialize
# Or check logs:
npx supabase logs
```

### Migrations fail to apply

```bash
# Check migration files for errors
ls supabase/migrations/

# Apply manually:
supabase db reset

# Or start fresh:
npm run supabase:reset
```

### Edge Functions not working

```bash
# Serve functions separately:
npx supabase functions serve

# Check function logs:
npx supabase functions logs function-name
```

### Can't connect to database

```bash
# Verify Supabase is running:
npm run supabase:status

# Check connection string:
cat .env.local
```

## Environment Variables

### Local Development (`.env.local`)

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
VITE_SUPABASE_PROJECT_ID=local
```

### Hosted Supabase (`.env`)

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_SUPABASE_PROJECT_ID=<your-project-id>
```

## Data Persistence

Local Supabase data persists between stops/starts in Docker volumes.

**To wipe all data:**
```bash
npm run supabase:reset
```

**To export data:**
```bash
npx supabase db dump -f backup.sql
```

**To import data:**
```bash
npm run supabase:reset
psql -h localhost -p 54322 -U postgres -d postgres -f backup.sql
```

## Contributing Workflow

1. Fork the repository
2. Clone your fork
3. Run `npm install`
4. Run `npm run supabase:start` to start local Supabase
5. Run `npm run dev` to start the app
6. Make your changes
7. Test thoroughly with local Supabase
8. Submit a pull request

**You never need access to the hosted Supabase!**

## Switching Between Local and Hosted

Use different env files:

```bash
# Local development
cp .env.local .env

# Hosted Supabase
cp .env.production .env
```

Or use environment-specific commands:
```bash
# Local
npm run dev:local

# Hosted
npm run dev:hosted
```

## Performance Tips

- Local Supabase uses ~2GB RAM
- First start downloads ~500MB Docker images
- Database resets are fast (~5 seconds)
- Stop Supabase when not developing to save resources

## Next Steps

- Read `CONTRIBUTING.md` for code style guidelines
- Check `docs/SUPABASE_MIGRATION.md` for hosted setup
- Join discussions on GitHub Issues
- Review existing migrations in `supabase/migrations/`

## Resources

- Supabase Local Development: https://supabase.com/docs/guides/cli/local-development
- Supabase CLI Reference: https://supabase.com/docs/reference/cli
- Docker Documentation: https://docs.docker.com/
