"use client";

import { Drawer } from "@/components/crm/ui/Drawer";
import { StatusBadge } from "@/components/crm/ui/StatusBadge";
import { Users, DollarSign, TrendingUp, Activity, Link2 } from "lucide-react";
import type { IBPartner } from "@/types/backoffice";
import type { StatusType } from "@/types/backoffice";

interface IBDrawerProps {
  ib: IBPartner | null;
  open: boolean;
  onClose: () => void;
}

const levelColors: Record<string, StatusType> = {
  manager: "info",
  ib: "info",
  sub_ib: "warning",
};

export function IBDrawer({ ib, open, onClose }: IBDrawerProps) {
  if (!ib) return null;

  return (
    <Drawer
      isOpen={open}
      onClose={onClose}
      title={`${ib.ibId} - ${ib.name}`}
      description={ib.email}
    >
      <div className="space-y-6">
        {/* Status & Level */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <div className="mt-1">
              <StatusBadge
                status={ib.status}
                type={
                  ib.status === "active"
                    ? "success"
                    : ib.status === "inactive"
                      ? "default"
                      : "error"
                }
              />
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Level</div>
            <div className="mt-1">
              <StatusBadge
                status={ib.level}
                type={levelColors[ib.level] || "default"}
              />
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Referral Code</div>
            <div className="mt-1 font-mono text-sm font-medium text-gray-900">
              {ib.referralCode}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Users className="w-4 h-4" />
              Total Clients
            </div>
            <div className="text-2xl font-bold text-gray-900">{ib.totalClients}</div>
            <div className="text-xs text-gray-500">{ib.activeClients} active</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <DollarSign className="w-4 h-4" />
              Total Commission
            </div>
            <div className="text-2xl font-bold text-green-600">
              ${ib.totalCommission.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Pending Commission */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Pending Commission</div>
              <div className="text-2xl font-bold text-orange-600">
                ${ib.pendingCommission.toLocaleString()}
              </div>
            </div>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
              Process Payout
            </button>
          </div>
        </div>

        {/* Volume & Deposit */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              Total Volume
            </div>
            <div className="text-xl font-bold text-gray-900">
              ${ib.totalVolume.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Activity className="w-4 h-4" />
              Net Deposit
            </div>
            <div className="text-xl font-bold text-gray-900">
              ${(ib.totalDeposit - ib.totalWithdrawal).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Hierarchy */}
        {ib.parentName && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Upline</h4>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Users className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {ib.parentName}
                </div>
                <div className="text-xs text-gray-500">
                  Parent IB Partner
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Contact Information
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-900">{ib.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone</span>
              <span className="font-medium text-gray-900">{ib.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">IB ID</span>
              <span className="font-medium text-gray-900">{ib.ibId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">User ID</span>
              <span className="font-medium text-gray-900">{ib.userId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Joined</span>
              <span className="font-medium text-gray-900">
                {new Date(ib.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Last Active</span>
              <span className="font-medium text-gray-900">
                {ib.lastActiveAt
                  ? new Date(ib.lastActiveAt).toLocaleDateString()
                  : "Never"}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Edit Partner
          </button>
          <button className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
            View Clients
          </button>
        </div>
      </div>
    </Drawer>
  );
}
