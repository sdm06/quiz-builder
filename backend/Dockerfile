# Build stage
FROM node:22-slim AS builder

WORKDIR /app

# Install dependencies for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/

# Install dependencies
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate \
    && pnpm install

# Copy backend source
COPY backend/ ./backend/

# Generate Prisma client and build
WORKDIR /app/backend
# prisma.config.ts requires DATABASE_URL to be resolvable. The client is only
# generated here, so a throwaway value is enough; the real one is set at runtime.
ENV DATABASE_URL="file:/tmp/build.db"
RUN pnpm db:generate && pnpm build

# Production stage
FROM node:22-slim AS runner

WORKDIR /app/backend

# Prisma query/schema engines require OpenSSL at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs -s /bin/bash -m nodejs

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./

# Install production dependencies using pnpm
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate \
    && pnpm install --prod --prefer-offline

# Copy built application
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/prisma.config.ts ./
COPY --from=builder /app/backend/src/generated ./src/generated

# Create the SQLite data directory. Kept outside ./prisma so the volume mount
# does not shadow the schema and migrations baked into the image.
RUN mkdir -p /data && chown -R nodejs:nodejs /app/backend /data

USER nodejs

EXPOSE 4000

ENV NODE_ENV=production
ENV DATABASE_URL="file:/data/prod.db"

# Apply migrations, then seed sample data only when the database is empty, then
# serve. The seed is idempotent, so restarts neither duplicate nor wipe data.
# node_modules/.bin is put on PATH explicitly: invoking binaries by path does
# not add it, and Prisma spawns the seed command (`tsx ...`) through a shell
# that inherits this PATH. Using `pnpm exec` instead is not an option because
# pnpm re-verifies the lockfile on every run and fails its release-age policy.
CMD ["sh", "-c", "export PATH=\"$PWD/node_modules/.bin:$PATH\" && prisma migrate deploy && prisma db seed && node dist/main.js"]