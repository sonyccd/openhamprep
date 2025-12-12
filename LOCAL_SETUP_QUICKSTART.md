# Local Setup Quickstart

Get up and running with local Supabase in 2 minutes!

## Prerequisites

1. **Node.js 20+**
   ```bash
   node -v  # Should be v20 or higher
   ```

2. **Docker Desktop**
   - macOS: `brew install --cask docker` or download from docker.com
   - Must be running before starting Supabase

## Setup

```bash
# Clone and navigate to project
git clone https://github.com/YOUR_USERNAME/openhamprep.git
cd openhamprep

# Install dependencies (includes Supabase CLI)
npm install

# Start Supabase + dev server
npm run dev:full
```

That's it!

## What You Get

- **Application**: http://localhost:8080
- **Database GUI**: http://localhost:54323 (Supabase Studio)
- **Email Testing**: http://localhost:54324 (see all emails)
- **PostgreSQL**: localhost:54322 (direct database access)

## Sample Data Included

When you start local Supabase, you get:
- 40 Technician questions, 35 General, 35 Extra
- 30 glossary terms
- 5 upcoming exam sessions

## Creating an Admin User

1. Sign up at http://localhost:8080/auth
2. Go to Supabase Studio: http://localhost:54323
3. Navigate to: Table Editor > user_roles
4. Click "+ Insert" and add:
   - user_id: (your UUID from auth.users table)
   - role: admin

Or run SQL in Studio:
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-id-here', 'admin');
```

## Daily Workflow

```bash
# Start both Supabase and dev server
npm run dev:full

# When done
npm run supabase:stop
```

## Common Commands

```bash
npm run dev                # Start dev server only
npm run supabase:start     # Start local Supabase
npm run supabase:stop      # Stop (keeps data)
npm run supabase:reset     # Reset database (wipes data)
npm run supabase:studio    # Open database GUI
npm run dev:full           # Start everything
```

## Troubleshooting

**"Docker is not running"**
- Start Docker Desktop application

**"Port already in use"**
```bash
npm run supabase:stop
npm run supabase:start
```

**"Database not healthy"**
- Wait 30 seconds for all services to start
- Check: `npm run supabase:status`

**Need fresh start?**
```bash
npm run supabase:stop
docker system prune -a  # Warning: deletes all Docker data!
npm run supabase:start
```

## Why Local Supabase?

- **No hosted account needed** - Everything runs on your machine
- **Fast iteration** - Reset database instantly with seed data
- **Offline development** - Work without internet
- **Safe testing** - Can't break production
- **Full control** - Direct database access via Studio
- **Free** - No cloud costs

## Next Steps

- Read [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for detailed docs
- Read [CONTRIBUTING.md](CONTRIBUTING.md) for code guidelines
