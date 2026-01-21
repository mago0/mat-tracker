# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
# Development
docker compose up                    # Start dev server with hot reload (localhost:3000)
docker compose down                  # Stop dev server

# Production
docker compose --profile production up -d    # Build and run production
docker compose --profile production down     # Stop production

# Database
docker compose exec dev npm run db:generate  # Generate migrations from schema changes
docker compose exec dev npm run db:migrate   # Apply pending migrations
docker compose exec dev npm run db:studio    # Open Drizzle Studio (database GUI)

# Unit Testing
docker compose exec dev npm test             # Run tests in watch mode
docker compose exec dev npm run test:run     # Run tests once
docker compose exec dev npm run test:coverage # Run tests with coverage

# E2E Testing (Playwright in Docker)
docker compose run --rm test                 # Run full E2E suite against dev container
```

## Architecture Overview

**mat-tracker** is a school-agnostic martial arts student management system for tracking attendance, belts, stripes, ranks, and student notes.

### Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: SQLite with Drizzle ORM
- **Authentication**: Simple password protection (env var)
- **Testing**: Vitest, React Testing Library, Playwright (E2E)
- **Deployment**: Docker Compose

### Key Directories

```
site/src/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes
│   ├── students/           # Student management pages
│   ├── attendance/         # Attendance check-in
│   ├── reports/            # Attendance reports & heatmap
│   │   └── promotions/     # Promotion status report
│   ├── settings/           # Promotion threshold configuration
│   └── login/              # Authentication
├── components/             # Reusable React components
└── lib/
    ├── db/                 # Drizzle schema and client
    ├── auth.ts             # Session management
    └── promotionStats.ts   # Promotion tracking utilities
```

### Visualization Components

- **MonthlyCalendar**: Small calendar grid showing attendance days (used on student detail pages)
- **AttendanceHeatmap**: GitHub-style contribution graph for school-wide attendance (used on reports page)

### Database Schema

- **students**: Core student data (name, contact, belt, stripes, active status)
- **attendance**: Check-in records with class type (gi, no-gi, open mat)
- **promotions**: Belt/stripe promotion history
- **notes**: Timestamped notes per student with categories
- **settings**: Key-value store for app configuration (promotion thresholds)

### Promotion Tracking

Students can be marked as "Due for stripe" or "Eligible for belt" based on configurable attendance thresholds:

- **Stripe thresholds**: Classes required between stripes (per belt level)
- **Belt thresholds**: Classes required at 4 stripes to be eligible for next belt

Thresholds are configured at `/settings`. Promotion status is displayed on:
- Individual student detail pages (progress bar + badge)
- `/reports/promotions` (sortable/filterable table of all students)

### Belt System (BJJ)

Belts: White, Blue, Purple, Brown, Black
Stripes: 0-4 per belt (awarded before promotion to next belt)

### Authentication

Simple password-based auth:
- `ADMIN_PASSWORD` env var stores the password
- Login sets HTTP-only session cookie
- Middleware protects all routes except `/login`

### E2E Tests

E2E tests live in `site/e2e/` and run via Playwright in a dedicated Docker container:

```
site/e2e/
├── fixtures/test-utils.ts    # Login helper, test utilities
├── auth.spec.ts              # Authentication flows
├── students.spec.ts          # Student CRUD operations
├── attendance.spec.ts        # Check-in functionality
├── reports.spec.ts           # Attendance & promotion reports
└── settings.spec.ts          # Threshold configuration
```

The `test` service in docker-compose.yml uses `mcr.microsoft.com/playwright:v1.50.0-jammy` and connects to the dev container via Docker network.

### Important Patterns

1. **Server Components**: Use React Server Components by default, `"use client"` only when needed
2. **Server Actions**: Prefer Server Actions over API routes for mutations
3. **Path Alias**: Use `@/*` for imports from `src/*`
4. **Soft Delete**: Students are archived (isActive=false), never hard deleted
5. **Unit Tests**: Add tests for new functionality, especially components with logic (see `*.test.tsx` files)
6. **E2E Tests**: Add E2E tests for new user flows (see `site/e2e/*.spec.ts` files)
