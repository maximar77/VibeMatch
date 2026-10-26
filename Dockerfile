# syntax=docker/dockerfile:1

# Node 22 LTS: Next.js 16 y @capacitor/cli lo requieren.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Datos semilla mínimos (el volumen de Oracle se monta encima en producción).
# Se copian archivos explícitos para no incluir perfiles, asistencia ni secretos
# que existan en el directorio local durante la compilación.
RUN mkdir -p /app/data
COPY --from=builder --chown=nextjs:nodejs /app/data/cards.json ./data/
COPY --from=builder --chown=nextjs:nodejs /app/data/teachers.json ./data/

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

CMD ["node", "server.js"]
