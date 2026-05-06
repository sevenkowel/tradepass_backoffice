"use client";

import { motion } from "framer-motion";
import {
  Monitor,
  Smartphone,
  Apple,
  Globe,
  Server,
  Copy,
  Check,
  Download,
  ExternalLink,
  ChevronRight,
  Shield,
  Clock,
  Wifi,
} from "lucide-react";
import { PageHeader } from "@/components/portal/widgets/PageHeader";
import { cn } from "@/lib/utils";
import { useState } from "react";

// ─── Mock Data ─────────────────────────────────────────────
const downloadOptions = [
  {
    id: "windows",
    title: "Windows",
    description: "For Windows 7, 8, 10, 11",
    icon: Monitor,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    size: "15 MB",
    url: "#",
  },
  {
    id: "mac",
    title: "macOS",
    description: "For macOS 10.15+",
    icon: Apple,
    iconBg: "bg-gray-50",
    iconColor: "text-gray-800",
    size: "12 MB",
    url: "#",
  },
  {
    id: "ios",
    title: "iOS",
    description: "For iPhone & iPad",
    icon: Smartphone,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    size: "App Store",
    url: "#",
  },
  {
    id: "android",
    title: "Android",
    description: "For Android 5.0+",
    icon: Smartphone,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    size: "Google Play",
    url: "#",
  },
  {
    id: "web",
    title: "Web Terminal",
    description: "Trade in browser",
    icon: Globe,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    size: "No download",
    url: "#",
  },
];

const servers = [
  {
    id: "live",
    name: "TradePass-Live",
    type: "Real Account",
    location: "London, UK",
    latency: "12ms",
    status: "online",
    address: "trade-live.tradepass.com:443",
  },
  {
    id: "demo",
    name: "TradePass-Demo",
    type: "Demo Account",
    location: "London, UK",
    latency: "14ms",
    status: "online",
    address: "trade-demo.tradepass.com:443",
  },
];

// ─── Components ────────────────────────────────────────────
function DownloadCard({
  option,
}: {
  option: (typeof downloadOptions)[0];
}) {
  const Icon = option.icon;
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-md p-5 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            option.iconBg
          )}
        >
          <Icon size={24} className={option.iconColor} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-800">{option.title}</h3>
          <p className="text-sm text-gray-500">{option.description}</p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-400">{option.size}</span>
            <button className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1">
              <Download size={12} />
              Download
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ServerCard({
  server,
}: {
  server: (typeof servers)[0];
}) {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(server.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center">
            <Server size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{server.name}</h3>
            <p className="text-sm text-gray-500">{server.type}</p>
          </div>
        </div>
        <span
          className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-lg border",
            server.status === "online"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          )}
        >
          {server.status === "online" ? "Online" : "Offline"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-1">Location</p>
          <p className="text-sm font-semibold text-gray-800">{server.location}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-1">Latency</p>
          <p className="text-sm font-semibold text-emerald-600">{server.latency}</p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-xs text-gray-400 mb-1">Server Address</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm font-mono text-gray-700">
            {server.address}
          </code>
          <button
            onClick={copyAddress}
            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {copied ? (
              <Check size={16} className="text-emerald-600" />
            ) : (
              <Copy size={16} className="text-gray-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function MT5Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="MT5 Trading Platform"
        description="Download MetaTrader 5 and connect to our trading servers"
      />

      {/* Download Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border-2 border-gray-200 p-5"
      >
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
            <Download size={14} className="text-blue-600" />
          </div>
          Download MT5
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {downloadOptions.map((option) => (
            <DownloadCard key={option.id} option={option} />
          ))}
        </div>
      </motion.div>

      {/* Server Info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border-2 border-gray-200 p-5"
      >
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <Server size={14} className="text-emerald-600" />
          </div>
          Server Information
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {servers.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      </motion.div>

      {/* Setup Guide */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-5"
      >
        <h2 className="font-bold text-gray-800 mb-4">Quick Setup Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-blue-100">
            <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold text-sm mb-3">
              1
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Download MT5</h3>
            <p className="text-sm text-gray-500">
              Choose your platform and download the MT5 application
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-blue-100">
            <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold text-sm mb-3">
              2
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Add Server</h3>
            <p className="text-sm text-gray-500">
              Open MT5 and search for &quot;TradePass&quot; in the broker list
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-blue-100">
            <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold text-sm mb-3">
              3
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Login</h3>
            <p className="text-sm text-gray-500">
              Enter your account ID and password to start trading
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
