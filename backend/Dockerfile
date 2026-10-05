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
    && pnpm install --frozen-lockfile

# Copy backend source
COPY backend/ ./backend/

# Generate Prisma client and build
WORKDIR /app/backend
RUN pnpm db:generate && pnpm build

# Production stage
FROM node:22-slim AS runner

WORKDIR /app

# Create non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs -s /bin/bash -m nodejs

# Copy built application
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/prisma.config.ts ./

# Copy generated Prisma client
COPY --from=builder /app/backend/src/generated ./src/generated

# Create directory for SQLite database
RUN mkdir -p prisma && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000

ENV NODE_ENV=production
ENV DATABASE_URL="file:./prisma/prod.db"

CMD ["node", "dist/main.js"]