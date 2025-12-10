# Local Setup Quickstart

Get up and running with local Supabase in 5 minutes!

## For New Contributors

**You don't need access to any hosted Supabase project!** Run everything locally with Docker.

### Prerequisites

1. **Node.js 18+**
   ```bash
   node -v  # Should be v18 or higher
   ```

2. **Docker Desktop**
   - macOS: `brew install --cask docker` or download from docker.com
   - Must be running before starting Supabase

3. **Supabase CLI** (we'll help you install if missing)
   ```bash
   brew install supabase/tap/supabase
   ```

### Automated Setup (Easiest)

```bash
# Clone and navigate to project
git clone https://github.com/YOUR_USERNAME/openhamprep.git
cd openhamprep

# Run setup script
./scripts/local-dev-setup.sh
```

The script will:
- ✓ Check all prerequisites
- ✓ Install dependencies
- ✓ Start local Supabase
- ✓ Apply migrations
- ✓ Seed test data
- ✓ Create `.env.local`

Then start developing:
```bash
npm run dev
```

### Manual Setup (Step by Step)

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USERNAME/openhamprep.git
cd openhamprep
npm install

# 2. Start local Supabase (downloads images on first run)
npm run supabase:start

# 3. Start dev server
npm run dev
```

### What You Get

- **Application**: http://localhost:8080
- **Database GUI**: http://localhost:54323 (Supabase Studio)
- **Email Testing**: http://localhost:54324 (see all emails)
- **PostgreSQL**: localhost:54322 (direct database access)

### Sample Data Included

When you start local Supabase, you get:
- 7 sample questions (Technician, General, Extra)
- 10 glossary terms
- 2 upcoming exam sessions

### Creating an Admin User

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

### Daily Workflow

```bash
# Start both Supabase and dev server
npm run dev:full

# When done
npm run supabase:stop
```

### Common Commands

```bash
npm run dev                # Start dev server
npm run supabase:start     # Start local Supabase
npm run supabase:stop      # Stop (keeps data)
npm run supabase:reset     # Reset database (wipes data)
npm run supabase:studio    # Open database GUI
npm run dev:full           # Start everything
```

### Troubleshooting

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

### Next Steps

- Read [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for detailed docs
- Read [CONTRIBUTING.md](CONTRIBUTING.md) for code guidelines
- Check [docs/SUPABASE_MIGRATION.md](docs/SUPABASE_MIGRATION.md) if setting up hosted Supabase

### Why Local Supabase?

✅ **No hosted account needed** - Everything runs on your machine
✅ **Fast iteration** - Reset database instantly with seed data
✅ **Offline development** - Work without internet
✅ **Safe testing** - Can't break production
✅ **Full control** - Direct database access via Studio
✅ **Free** - No cloud costs

### Resources

- Supabase Local Docs: https://supabase.com/docs/guides/cli/local-development
- Docker Desktop: https://www.docker.com/products/docker-desktop
- Project README: [README.md](README.md)
