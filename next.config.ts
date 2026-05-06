import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  distDir: ".next",

  // 性能优化
  experimental: {
    // 启用 Turbopack (Next.js 15+)
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
    // 优化包体积
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "@radix-ui/react-icons",
    ],
  },

  // 构建缓存优化
  generateBuildId: async () => {
    return "build-" + Date.now();
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  poweredByHeader: false,

  // 编译优化
  compiler: {
    // 移除 console 和 debugger (生产环境)
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },

  // 模块打包优化
  webpack: (config, { dev, isServer }) => {
    // 开发环境优化
    if (dev) {
      // 减少 source map 生成范围
      config.devtool = "eval-cheap-module-source-map";

      // 优化文件监听
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          "**/node_modules/**",
          "**/.next/**",
          "**/tests/**",
          "**/docs/**",
        ],
      };
    }

    return config;
  },
  async headers() {
    return [
      {
        source: "/api/health",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // ============================================
      // Phase 6: Legacy Route Redirects to Subdomains
      // ============================================

      // Demo 模式：注释掉 broker 重定向，允许直接访问 /broker
      // {
      //   source: "/broker",
      //   destination: "/",
      //   permanent: true,
      // },
      // {
      //   source: "/broker/:path*",
      //   destination: "/:path*",
      //   permanent: true,
      // },

      // Old redirects (keep for compatibility)
      { source: "/admin", destination: "/backoffice", permanent: true },
      { source: "/admin/:path*", destination: "/backoffice/:path*", permanent: true },
      { source: "/api/admin/:path*", destination: "/api/backoffice/:path*", permanent: true },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        // ============================================
        // Phase 3: Portal Subdomain Rewrites
        // portal.dupoin.localhost:3002/* → /portal/*
        // ============================================
        {
          source: "/:path*",
          has: [
            {
              type: "host",
              value: "portal.(?<tenant>[^.]+).localhost:3002",
            },
          ],
          destination: "/portal/:path*",
        },

        // ============================================
        // Phase 4: CRM Subdomain Rewrites
        // crm.dupoin.localhost:3002/* → /crm/*
        // ============================================
        {
          source: "/:path*",
          has: [
            {
              type: "host",
              value: "crm.(?<tenant>[^.]+).localhost:3002",
            },
          ],
          destination: "/crm/:path*",
        },

        // ============================================
        // Phase 5: Platform Subdomain Rewrites
        // ============================================
        {
          source: "/:path*",
          has: [
            {
              type: "host",
              value: "console.localhost:3002",
            },
          ],
          destination: "/console/:path*",
        },
        {
          source: "/:path*",
          has: [
            {
              type: "host",
              value: "backoffice.localhost:3002",
            },
          ],
          destination: "/backoffice/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
