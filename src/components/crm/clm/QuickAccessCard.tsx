"use client";

import { useRouter } from "next/navigation";
import { User, Wallet, TrendingUp, Shield, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAccessCardProps {
  customerId: string;
  className?: string;
}

const links = [
  { label: "Client Detail", icon: <User className="w-4 h-4" />, href: (id: string) => `/crm/clients/${id}` },
  { label: "Fund History", icon: <Wallet className="w-4 h-4" />, href: (id: string) => `/crm/clients/${id}?tab=funds` },
  { label: "Trading History", icon: <TrendingUp className="w-4 h-4" />, href: (id: string) => `/crm/clients/${id}?tab=trades` },
  { label: "Risk Center", icon: <Shield className="w-4 h-4" />, href: (id: string) => `/crm/clients/${id}?tab=risk` },
];

export function QuickAccessCard({ customerId, className }: QuickAccessCardProps) {
  const router = useRouter();

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quick Access</h4>
      <div className="grid grid-cols-2 gap-2">
        {links.map((link) => (
          <button
            key={link.label}
            onClick={() => router.push(link.href(customerId))}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <span className="text-gray-400">{link.icon}</span>
            <span>{link.label}</span>
            <ExternalLink className="w-3 h-3 text-gray-300 ml-auto" />
          </button>
        ))}
      </div>
    </div>
  );
}
