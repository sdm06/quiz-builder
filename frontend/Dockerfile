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
COPY frontend/package.json ./frontend/

# Install dependencies
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate \
    && pnpm install --frozen-lockfile

# Copy frontend source
COPY frontend/ ./frontend/

# Build frontend
WORKDIR /app/frontend
RUN pnpm build

# Production stage
FROM node:22-slim AS runner

WORKDIR /app

# Create non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs -s /bin/bash -m nodejs

# Copy built application (standalone output).
# The directory layout must be preserved: the bundled node_modules entries are
# relative symlinks into the root .pnpm store, so they only resolve at the same
# nesting depth Next.js emitted them at.
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
# No public/ copy: the app ships no static assets, and the directory does not
# exist in the repository. Re-add the line above if public/ is ever introduced.

USER nodejs

WORKDIR /app/frontend

EXPOSE 3000

ENV NODE_ENV=production
# Set at runtime via compose; read server-side by src/lib/api.ts
ENV API_URL=http://backend:4000

CMD ["node", "server.js"]