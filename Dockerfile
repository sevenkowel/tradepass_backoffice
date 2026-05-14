# syntax=docker/dockerfile:1.7

# ---------- Build Stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# 1) 仅拷贝清单，最大化利用层缓存
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# 2) 拷贝源码并构建
COPY . ./
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- Production Stage ----------
# Next.js standalone 模式输出一个自包含的 Node.js 服务器
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 创建非 root 用户运行
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# standalone 输出包含所有依赖，无需 node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# 修正文件所有权
RUN chown -R nextjs:nodejs /app

USER nextjs

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null 2>&1 || exit 1

EXPOSE 3000

# standalone 模式的入口
CMD ["node", "server.js"]
