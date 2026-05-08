"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Wallet,
  BarChart3,
  Tag,
  Loader2,
} from "lucide-react";
import { clientService } from "@/lib/crm/services/client.service";
import type { BackofficeUser } from "@/types/backoffice/user";

export default function ClientProfileLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const clientId = params.id as string;
  const [client, setClient] = useState<BackofficeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    clientService.getById(clientId).then((data) => {
      setClient(data);
      setLoading(false);
    });
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-slate-500">Client not found</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-80px)]">
      {/* Left Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-80 flex-shrink-0 overflow-y-auto"
      >
        <div className="space-y-6">
          {/* Avatar & Name */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex flex-col items-center">
              {client.avatar ? (
                <img src={client.avatar} alt={client.name} className="w-20 h-20 rounded-full" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                  {client.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <h2 className="mt-3 text-lg font-semibold text-slate-900">{client.name}</h2>
              <p className="text-sm text-slate-500 font-mono">{client.uid}</p>
              <div className="mt-3 flex gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  client.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                  client.status === 'frozen' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {client.status}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 flex gap-2">
              <button className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors">
                Freeze
              </button>
              <button className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm font-medium text-blue-700 transition-colors">
                Message
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Wallet className="w-4 h-4" />
                Balance
              </div>
              <span className="font-semibold text-slate-900">${client.balance.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <BarChart3 className="w-4 h-4" />
                Equity
              </div>
              <span className="font-semibold text-slate-900">${client.equity.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Shield className="w-4 h-4" />
                Risk
              </div>
              <span className={`font-semibold text-sm ${
                client.riskLevel === 'low' ? 'text-emerald-600' :
                client.riskLevel === 'medium' ? 'text-amber-600' :
                client.riskLevel === 'high' ? 'text-orange-600' :
                'text-red-600'
              }`}>
                {client.riskLevel || '-'} {client.riskScore !== undefined && `(${client.riskScore})`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Shield className="w-4 h-4" />
                KYC
              </div>
              <span className={`font-semibold text-sm ${
                client.kycStatus === 'verified' ? 'text-emerald-600' :
                client.kycStatus === 'pending' ? 'text-amber-600' :
                client.kycStatus === 'rejected' ? 'text-red-600' :
                'text-slate-400'
              }`}>
                {client.kycStatus}
              </span>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-medium text-slate-700">Basic Info</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">{client.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">{client.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">{client.country || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">{new Date(client.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {client.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                  {tag}
                </span>
              ))}
              <button className="px-2 py-1 border border-dashed border-slate-300 text-slate-400 rounded-full text-xs hover:border-slate-400 transition-colors">
                + Add
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Content */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {children}
      </div>
    </div>
  );
}
