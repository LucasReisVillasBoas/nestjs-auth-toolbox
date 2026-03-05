# ── Stage 1: Build (compila TypeScript → dist/) ────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ── Stage 2: Dependências de produção apenas ───────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 3: Runner (imagem final, mínima) ─────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 --ingroup nestjs nestjs

COPY --from=deps    --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/dist         ./dist
COPY --from=builder --chown=nestjs:nestjs /app/package.json ./package.json

COPY --chown=nestjs:nestjs docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER nestjs

EXPOSE 3001

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
