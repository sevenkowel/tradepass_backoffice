"use client";

import { Monitor, Globe, Smartphone, Download, ExternalLink, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const tools = [
  {
    id: "mt5",
    name: "MT5",
    subtitle: "专业交易平台",
    description: "功能强大，支持 EA 自动化和高级图表分析",
    icon: Monitor,
    platforms: ["iOS", "Android", "PC", "Mac"],
    action: "下载",
    href: "#download-mt5",
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    id: "webtrader",
    name: "WebTrader",
    subtitle: "浏览器交易",
    description: "无需下载安装，打开浏览器即可快速交易",
    icon: Globe,
    platforms: ["全平台"],
    action: "打开",
    href: "/portal/accounts/web",
    color: "bg-violet-500",
    bgColor: "bg-violet-50",
  },
  {
    id: "app",
    name: "TradePass App",
    subtitle: "移动账户管理",
    description: "随时随地查看账户、接收通知和管理资金",
    icon: Smartphone,
    platforms: ["iOS", "Android"],
    action: "下载",
    href: "#download-app",
    color: "bg-emerald-500",
    bgColor: "bg-emerald-50",
  },
];

export function ToolsDownload() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full"
    >
        {/* 头部 */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-900">交易工具</h3>
          <Link
            href="/portal/accounts"
            className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-0.5 transition-colors"
          >
            更多工具
            <ChevronRight size={16} />
          </Link>
        </div>

        {/* 工具卡片网格 - 统一高度 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="h-full"
            >
              <Link
                href={tool.href}
                className="group flex flex-col h-full p-5 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200 bg-slate-50/50 hover:bg-white"
              >
                {/* 顶部：图标 + 标题 */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 ${tool.color} rounded-lg flex items-center justify-center shadow-lg shadow-${tool.color}/30 group-hover:scale-110 transition-transform duration-200`}>
                    <tool.icon size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-slate-900 leading-tight">
                      {tool.name}
                    </h4>
                    <p className="text-xs text-slate-500">{tool.subtitle}</p>
                  </div>
                </div>

                {/* 描述 - 固定高度 */}
                <p className="text-sm text-slate-600 mb-4 line-clamp-2 flex-grow">
                  {tool.description}
                </p>

                {/* 底部：操作按钮 + 平台标签 */}
                <div className="mt-auto">
                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                      {tool.action}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                      {tool.id === "webtrader" ? (
                        <ExternalLink size={16} className="text-slate-600" />
                      ) : (
                        <Download size={16} className="text-slate-600" />
                      )}
                    </div>
                  </div>

                  {/* 平台标签 */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {tool.platforms.map((platform) => (
                      <span
                        key={platform}
                        className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
    </motion.div>
  );
}
