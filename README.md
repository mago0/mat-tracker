# Mat Tracker

A school-agnostic martial arts student management system for tracking attendance, belts, stripes, ranks, and student notes. Designed for BJJ schools but built to be open-sourceable.

## Features

- **Student Management**: Add, edit, and archive students with contact info
- **Belt & Rank Tracking**: BJJ belt system (White through Black) with 0-4 stripes
- **Attendance**: Daily check-in by class type (Gi, No-Gi, Open Mat, Competition Prep)
- **Promotion History**: Track belt and stripe promotions with notes
- **Student Notes**: Categorized notes (general, technique, injury, goals)
- **Dashboard**: Overview stats and recent activity

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: SQLite with Drizzle ORM
- **Authentication**: Simple password protection
- **Testing**: Vitest, React Testing Library
- **Deployment**: Docker Compose

## Quick Start

1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

2. Set your admin password in `.env`:
   ```
   ADMIN_PASSWORD=your-secure-password
   ```

3. Start the development server:
   ```bash
   docker compose up -d
   ```

4. Run database migrations (first time only):
   ```bash
   docker compose exec dev npm run db:migrate
   ```

5. Open http://localhost:3000 (or your configured HOST_PORT)

## Development

```bash
# Start development server (with hot reload)
docker compose up

# Stop development server
docker compose down

# View logs
docker compose logs -f
```

## Database

The SQLite database is stored in `./data/mat-tracker.db` and persists between container restarts.

```bash
# Generate migrations after schema changes
docker compose exec dev npm run db:generate

# Apply migrations
docker compose exec dev npm run db:migrate

# Open database GUI
docker compose exec dev npm run db:studio
```

## Testing

```bash
# Run tests in watch mode
docker compose exec dev npm test

# Run tests once
docker compose exec dev npm run test:run

# Run tests with coverage
docker compose exec dev npm run test:coverage
```

## Production Deployment

```bash
# Build and run production
docker compose --profile production up -d

# Stop production
docker compose --profile production down
```

Requires an external Docker network named `app_net` for integration with reverse proxy (Traefik, nginx, etc.).

## Project Structure

```
mat-tracker/
├── site/                     # Next.js application
│   ├── src/
│   │   ├── app/              # Pages and API routes
│   │   ├── components/       # React components
│   │   └── lib/              # Database, auth, constants
│   └── drizzle/              # Database migrations
├── data/                     # SQLite database (gitignored)
├── Dockerfile                # Multi-stage build
├── docker-compose.yml        # Dev and production configs
└── CLAUDE.md                 # AI assistant context
```

## License

MIT
