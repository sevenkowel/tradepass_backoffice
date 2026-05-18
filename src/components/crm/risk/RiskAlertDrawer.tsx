"use client";

import { Drawer } from "@/components/crm/ui/Drawer";
import { StatusBadge } from "@/components/crm/ui/StatusBadge";
import { AlertTriangle, Clock, CheckCircle, AlertCircle } from "lucide-react";
import type { RiskAlert } from "@/types/backoffice";
import type { StatusType } from "@/types/backoffice";

interface RiskAlertDrawerProps {
  alert: RiskAlert | null;
  open: boolean;
  onClose: () => void;
}

const levelColors: Record<string, StatusType> = {
  info: "info",
  warning: "warning",
  critical: "error",
};

export function RiskAlertDrawer({ alert, open, onClose }: RiskAlertDrawerProps) {
  if (!alert) return null;

  return (
    <Drawer
      isOpen={open}
      onClose={onClose}
      title={`Alert ${alert.alertId}`}
      description={alert.title}
    >
      <div className="space-y-6">
        {/* Alert Level & Status */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Level</div>
            <div className="mt-1 flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  alert.level === "critical"
                    ? "bg-red-100"
                    : alert.level === "warning"
                      ? "bg-yellow-100"
                      : "bg-blue-100"
                }`}
              >
                <AlertTriangle
                  className={`w-4 h-4 ${
                    alert.level === "critical"
                      ? "text-red-600"
                      : alert.level === "warning"
                        ? "text-yellow-600"
                        : "text-blue-600"
                  }`}
                />
              </div>
              <StatusBadge
                status={alert.level}
                type={levelColors[alert.level] || "default"}
              />
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <div className="mt-1 flex items-center gap-2">
              {alert.status === "new" && (
                <Clock className="w-4 h-4 text-blue-500" />
              )}
              {alert.status === "acknowledged" && (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              {alert.status === "resolved" && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              <span className="text-sm font-medium capitalize">{alert.status}</span>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Type</div>
            <div className="mt-1 text-sm font-medium text-gray-900 capitalize">
              {alert.type.replace(/_/g, " ")}
            </div>
          </div>
        </div>

        {/* Alert Details Card */}
        <div
          className={`rounded-xl p-4 ${
            alert.level === "critical"
              ? "bg-red-50 border border-red-200"
              : alert.level === "warning"
                ? "bg-yellow-50 border border-yellow-200"
                : "bg-blue-50 border border-blue-200"
          }`}
        >
          <div className="text-sm font-medium text-gray-900 mb-2">
            Description
          </div>
          <p className="text-sm text-gray-700">{alert.description}</p>
        </div>

        {/* Account Info */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Account Information</h4>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500">Account ID</div>
                <div className="text-sm font-medium text-gray-900">
                  {alert.accountId}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Username</div>
                <div className="text-sm font-medium text-gray-900">
                  {alert.username}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Alert Metrics
          </h4>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="space-y-3">
              {Object.entries(alert.metrics).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {typeof value === "number"
                      ? value.toLocaleString()
                      : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Timeline</h4>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Alert Created
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(alert.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
            {alert.acknowledgedAt && (
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Acknowledged
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(alert.acknowledgedAt).toLocaleString()}
                  </div>
                  {alert.acknowledgedBy && (
                    <div className="text-xs text-gray-400">
                      by {alert.acknowledgedBy}
                    </div>
                  )}
                </div>
              </div>
            )}
            {alert.resolvedAt && (
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Resolved
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(alert.resolvedAt).toLocaleString()}
                  </div>
                  {alert.resolvedBy && (
                    <div className="text-xs text-gray-400">
                      by {alert.resolvedBy}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {alert.status !== "resolved" && (
          <div className="flex gap-3 pt-4 border-t">
            <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              {alert.status === "new" ? "Acknowledge" : "Mark Resolved"}
            </button>
            <button className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Escalate
            </button>
          </div>
        )}
      </div>
    </Drawer>
  );
}
