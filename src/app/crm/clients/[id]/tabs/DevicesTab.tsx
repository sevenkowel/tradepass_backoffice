"use client";

import { LogOut, Lock, KeyRound, AlertTriangle, CheckCircle } from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";
import { useT } from "@/lib/i18n/LocaleProvider";
import { IPGeoPopover } from "@/components/crm/clm/popovers/IPGeoPopover";
import { lookupIPGeo } from "@/lib/clm/mock";

/**
 * Devices & Security Tab.
 *
 * Each row's IP is interactive — clicking opens the IPGeoPopover used in
 * CLM Case Detail (geo + VPN flags + related UIDs).
 */
export default function DevicesTab({ data }: BaseTabProps) {
  const { t, locale } = useT();
  const { devices } = data;
  const dateLocale = locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : locale === "es" ? "es-ES" : "en-US";

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">{t("clients.detail.devices.title")}</h3>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500">
              <th className="px-4 py-3 text-left font-medium">{t("clients.detail.devices.col.ip")}</th>
              <th className="px-4 py-3 text-left font-medium">{t("clients.detail.devices.col.region")}</th>
              <th className="px-4 py-3 text-left font-medium">{t("clients.detail.devices.col.device")}</th>
              <th className="px-4 py-3 text-left font-medium">{t("clients.detail.devices.col.browser")}</th>
              <th className="px-4 py-3 text-left font-medium">{t("clients.detail.devices.col.timezone")}</th>
              <th className="px-4 py-3 text-left font-medium">{t("clients.detail.devices.col.lastUsed")}</th>
              <th className="px-4 py-3 text-left font-medium">{t("clients.detail.devices.col.status")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("clients.detail.devices.col.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <IPGeoPopover ip={device.ipAddress} geo={lookupIPGeo(device.ipAddress)} />
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {device.country}{device.city && ` · ${device.city}`}
                </td>
                <td className="px-4 py-3 text-slate-700">{device.os}</td>
                <td className="px-4 py-3 text-slate-700">{device.browser}</td>
                <td className="px-4 py-3 text-slate-700">{device.timezone}</td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(device.lastUsedAt).toLocaleString(dateLocale)}
                </td>
                <td className="px-4 py-3">
                  {device.isCurrent ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                      <CheckCircle className="w-3 h-3" />
                      {t("clients.detail.devices.status.current")}
                    </span>
                  ) : device.isRisky ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                      <AlertTriangle className="w-3 h-3" />
                      {t("clients.detail.devices.status.risky")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                      {t("clients.detail.devices.status.history")}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title={t("clients.detail.devices.action.logout")}>
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-red-100 text-red-500" title={t("clients.detail.devices.action.freeze")}>
                      <Lock className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-amber-100 text-amber-500" title={t("clients.detail.devices.action.reset2fa")}>
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                    {!device.isRisky && (
                      <button className="p-1.5 rounded hover:bg-red-100 text-red-500" title={t("clients.detail.devices.action.markRisky")}>
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
