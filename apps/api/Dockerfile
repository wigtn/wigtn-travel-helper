# Travel Helper API Dockerfile
# Build from monorepo root: docker build -f apps/api/Dockerfile .

FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Build shared package first
RUN pnpm --filter @wigtn/shared build

# Generate Prisma client
RUN cd apps/api && pnpm prisma generate

# Build API
RUN pnpm --filter @wigtn/api build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install prisma CLI globally for migrations
RUN npm install -g prisma

# Copy built files
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm

# Expose port
EXPOSE 3000

# Run migrations and start server
CMD ["sh", "-c", "prisma migrate deploy && node dist/main"]
