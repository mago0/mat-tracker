# Development
FROM node:20-slim AS dev
WORKDIR /app/site
ENV NODE_ENV=development

# Production dependencies
FROM node:20-slim AS deps
WORKDIR /app/site
COPY site/package.json site/package-lock.json* ./
RUN npm ci --only=production

# Builder
FROM node:20-slim AS builder
WORKDIR /app/site
COPY site/package.json site/package-lock.json* ./
RUN npm ci
COPY site .
RUN npm run build

# Runner
FROM node:20-alpine AS runner
WORKDIR /app/site

ENV NODE_ENV=production

RUN apk add --no-cache wget

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/site/.next/standalone ./
COPY --from=builder /app/site/.next/static ./.next/static
COPY --from=builder /app/site/public ./public

# Copy migration files and script for database setup
COPY --from=builder /app/site/drizzle ./drizzle
COPY --from=builder /app/site/scripts/migrate.mjs ./scripts/migrate.mjs

# Create directories for cache and data
RUN mkdir -p .next/cache /app/data
RUN chown -R nextjs:nodejs .next /app/data drizzle scripts

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "node scripts/migrate.mjs && node server.js"]
