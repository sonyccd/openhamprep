# Open Ham Prep

![Website](https://img.shields.io/website?url=https%3A%2F%2Fopenhamprep.com)
![GitHub branch status](https://img.shields.io/github/checks-status/sonyccd/openhamprep/main)
[![codecov](https://codecov.io/gh/sonyccd/openhamprep/graph/badge.svg?token=SGUGokGdG1)](https://codecov.io/gh/sonyccd/openhamprep)
![GitHub last commit (branch)](https://img.shields.io/github/last-commit/sonyccd/openhamprep/main)


![GitHub License](https://img.shields.io/github/license/sonyccd/openhamprep)


A modern web application for studying US Amateur Radio license exams. Open source, community-driven, born in North Carolina.

**Live App:** [openhamprep.app](https://openhamprep.com)

## Features

- **Practice Tests** - Simulated exam experience with optional timer
- **Random Practice** - Study questions with instant feedback
- **Study by Topics** - Focus on specific subelements with learning resources
- **Weak Questions** - Review questions you've missed
- **Glossary & Flashcards** - Learn key terms with spaced repetition
- **Progress Tracking** - Dashboard with test readiness, streaks, and goals
- **Bookmarks** - Save questions with personal notes

Supports all three license classes: Technician, General, and Extra.

## Quick Start

**Prerequisites:** Node.js 20+, Docker Desktop

```bash
git clone https://github.com/sonyccd/openhamprep.git
cd openhamprep
npm install
npm run dev:full
```

- App: http://localhost:8080
- Database GUI: http://localhost:54323

See [LOCAL_SETUP_QUICKSTART.md](LOCAL_SETUP_QUICKSTART.md) for details.

## Commands

```bash
npm run dev              # Start dev server
npm run dev:full         # Start Supabase + dev server
npm run supabase:stop    # Stop Supabase
npm run supabase:reset   # Reset database
npm test                 # Run tests
npm run build            # Production build
```

## Tech Stack

React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Supabase (PostgreSQL, Auth, Edge Functions)

## Documentation

- [Local Development Guide](LOCAL_DEVELOPMENT.md)
- [Testing Guide](TESTING.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Deployment Guide](DEPLOYMENT_STEPS.md)
- [Claude Code Instructions](CLAUDE.md)

## Contributing

1. Fork the repo
2. Run locally with `npm install && npm run dev:full`
3. Make your changes
4. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

© Brad Bazemore

## Support

- File issues on [GitHub](https://github.com/sonyccd/openhamprep/issues)
- Visit [ARRL.org](https://www.arrl.org/) for ham radio learning resources
