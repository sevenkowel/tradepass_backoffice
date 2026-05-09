"use client";

import { Monitor, LogOut, Lock, KeyRound, AlertTriangle, CheckCircle } from "lucide-react";
import type { ClientDetailData } from "@/types/backoffice/client-detail";

interface Props {
  data: ClientDetailData;
}

export default function DevicesTab({ data }: Props) {
  const { devices } = data;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">设备与安全</h3>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500">
              <th className="px-4 py-3 text-left font-medium">IP 地址</th>
              <th className="px-4 py-3 text-left font-medium">地区</th>
              <th className="px-4 py-3 text-left font-medium">设备</th>
              <th className="px-4 py-3 text-left font-medium">浏览器</th>
              <th className="px-4 py-3 text-left font-medium">时区</th>
              <th className="px-4 py-3 text-left font-medium">最后使用</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-slate-700">{device.ipAddress}</td>
                <td className="px-4 py-3 text-slate-700">
                  {device.country}
                  {device.city && ` · ${device.city}`}
                </td>
                <td className="px-4 py-3 text-slate-700">{device.os}</td>
                <td className="px-4 py-3 text-slate-700">{device.browser}</td>
                <td className="px-4 py-3 text-slate-700">{device.timezone}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(device.lastUsedAt).toLocaleString("zh-CN")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {device.isCurrent ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        <CheckCircle className="w-3 h-3" />
                        当前
                      </span>
                    ) : device.isRisky ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                        <AlertTriangle className="w-3 h-3" />
                        风险
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                        历史
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="强制登出">
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-red-100 text-red-500" title="冻结账户">
                      <Lock className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-amber-100 text-amber-500" title="重置 2FA">
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                    {!device.isRisky && (
                      <button className="p-1.5 rounded hover:bg-red-100 text-red-500" title="标记风险">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
