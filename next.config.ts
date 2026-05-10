import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  distDir: ".next",

  // Semi Design 需要 transpile
  transpilePackages: [
    "@douyinfe/semi-ui-19",
    "@douyinfe/semi-icons",
    "@douyinfe/semi-illustrations",
  ],

  // 性能优化
  experimental: {
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

  // 开发环境特定配置
  devIndicators: false,

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
      // 优化文件监听 (使用系统原生 fs 事件，避免 polling)
      config.watchOptions = {
        ...config.watchOptions,
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
  async rewrites() {
    return {
      beforeFiles: [
        // ============================================
        // CRM Subdomain Rewrites
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
      ],
    };
  },
};

export default nextConfig;
