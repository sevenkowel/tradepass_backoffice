"use client";

import { Megaphone, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { BaseTabProps } from "@/types/backoffice/client";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Marketing Tab — placeholder (v1).
 *
 * Shows the marketing history prompt and links to the Marketing module.
 * Full implementation (campaigns/messages timeline filtered by clientId)
 * is slated for M8 once the Marketing service exposes a per-user API.
 */
export default function MarketingTab({ data }: BaseTabProps) {
  const { t } = useT();
  const { user } = data;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">{t("clients.detail.marketing.title")}</h3>

      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center">
          <Megaphone className="w-8 h-8 text-violet-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700 mb-1">{t("clients.detail.marketing.title")}</p>
          <p className="text-xs text-slate-400 max-w-sm">{t("clients.detail.marketing.coming")}</p>
        </div>
        <Link
          href={`/crm/marketing/campaigns?clientId=${encodeURIComponent(user.id)}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-50 text-violet-700 text-sm font-medium hover:bg-violet-100 transition-colors"
        >
          {t("clients.detail.tabs.marketing")}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
