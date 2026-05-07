"use client";

import { Gift, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import { useBannerStore } from "@/store/bannerStore";
import { getActiveBanners } from "@/lib/banner-config";
import { useDevConfig } from "@/lib/dev-config";
import { BANNER_REGISTRY } from "@/lib/banner-config";
import type { BannerType } from "@/types/banner";

function BannerToggle({
  id,
  label,
  icon: Icon,
  override,
  onToggle,
}: {
  id: BannerType;
  label: string;
  icon: typeof Gift;
  override: boolean | null;
  onToggle: () => void;
}) {
  const isForcedOn = override === true;
  const isForcedOff = override === false;

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-slate-500" />
        <span className="text-sm text-slate-700">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggle}
          className={[
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors text-xs font-medium",
            isForcedOn
              ? "bg-emerald-500 text-white"
              : isForcedOff
              ? "bg-slate-300 text-slate-500"
              : "bg-slate-200 text-slate-400",
          ].join(" ")}
        >
          <span className="sr-only">Toggle</span>
          <motion.span
            className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
            animate={{ x: isForcedOn ? 22 : isForcedOff ? 2 : 14 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
        <span className="text-xs text-slate-400 w-10">
          {isForcedOn ? "ON" : isForcedOff ? "OFF" : "Auto"}
        </span>
      </div>
    </div>
  );
}

export function BannerDevPanel() {
  const {
    overrides,
    setOverride,
    welcomeRegisteredDays,
    setWelcomeRegisteredDays,
    welcomeClaimed,
    setWelcomeClaimed,
    stackMode,
    setStackMode,
  } = useBannerStore();

  const { currentPerspective } = useDevConfig();
  const activeBanners = getActiveBanners(currentPerspective);

  const handleToggle = (type: BannerType) => {
    const current = overrides[type];
    if (current === null) {
      setOverride(type, true);
    } else if (current === true) {
      setOverride(type, false);
    } else {
      setOverride(type, null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner Toggles */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-500 mb-2">Banner Override</p>

        <BannerToggle
          id="welcome_rewards"
          label="Welcome Rewards"
          icon={Gift}
          override={overrides.welcome_rewards}
          onToggle={() => handleToggle("welcome_rewards")}
        />

        {/* Welcome Rewards 专用控制 */}
        {overrides.welcome_rewards !== false && (
          <div className="pl-6 space-y-2 border-l-2 border-slate-100 ml-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-500 flex items-center justify-between">
                <span>Registered</span>
                <span className="font-medium text-slate-700">{welcomeRegisteredDays} days ago</span>
              </label>
              <input
                type="range"
                min={0}
                max={90}
                step={1}
                value={welcomeRegisteredDays}
                onChange={(e) => setWelcomeRegisteredDays(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>Today</span>
                <span>90 days</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Not yet claimed</span>
              <button
                onClick={() => setWelcomeClaimed(!welcomeClaimed)}
                className={[
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors text-xs",
                  !welcomeClaimed ? "bg-emerald-500" : "bg-slate-300",
                ].join(" ")}
              >
                <motion.span
                  className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm"
                  animate={{ x: !welcomeClaimed ? 16 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          </div>
        )}

        <BannerToggle
          id="app_download"
          label="App Download"
          icon={Smartphone}
          override={overrides.app_download}
          onToggle={() => handleToggle("app_download")}
        />
      </div>

      {/* 叠加模式 */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-500">Stack Mode</span>
        <button
          onClick={() => setStackMode(!stackMode)}
          className={[
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors text-xs font-medium",
            stackMode ? "bg-emerald-500 text-white" : "bg-slate-300 text-slate-500",
          ].join(" ")}
        >
          <motion.span
            className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
            animate={{ x: stackMode ? 22 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* 当前生效 Banner */}
      <div className="space-y-1 pt-2 border-t border-slate-100">
        <p className="text-xs font-medium text-slate-500">Active Banners</p>
        {activeBanners.length === 0 ? (
          <p className="text-xs text-slate-400 py-1">None</p>
        ) : (
          activeBanners.map((b) => (
            <div key={b.id} className="flex items-center gap-2 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-600">{b.title}</span>
              <span className="text-xs text-slate-400 ml-auto">#{b.priority}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
