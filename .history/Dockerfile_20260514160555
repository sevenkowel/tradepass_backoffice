# syntax=docker/dockerfile:1.7

# -----test auto build -----
# ---------- Build Stage ----------
    FROM node:20-alpine AS builder

    WORKDIR /app
    
    # 1) 仅拷贝清单，最大化利用层缓存
    COPY package.json package-lock.json ./
    RUN npm ci --no-audit --no-fund
    
    # 2) 拷源码并构建
    COPY . ./
    # 生产构建关闭 sourcemap（vite.config.ts 也会按 NODE_ENV 处理，这里是兜底）
    ENV NODE_ENV=production
    RUN npm run build
    
    # ---------- Production Stage ----------
    FROM nginx:alpine AS runner
    
    # 去掉默认配置，避免和我们自己的 default.conf 冲突
    RUN rm -f /etc/nginx/conf.d/default.conf
    
    COPY --from=builder /app/dist /usr/share/nginx/html
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    
    # 健康检查（Kubernetes / docker-compose 都能用）
    HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
      CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
    
    EXPOSE 80
    
    CMD ["nginx", "-g", "daemon off;"]
    