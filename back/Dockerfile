# Multi-stage Dockerfile for Express backend with pnpm & Prisma
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# 1. Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json ./
RUN pnpm install --no-frozen-lockfile

# 2. Build application & Prisma
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
RUN npx prisma generate
RUN pnpm run build

# 3. Production runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

USER expressjs

EXPOSE 4000

CMD ["node", "dist/server.js"]
