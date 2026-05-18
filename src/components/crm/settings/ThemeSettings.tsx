"use client";

import { Monitor, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserSettings } from "@/types/backoffice/settings";

interface ThemeSettingsProps {
  theme: UserSettings["theme"];
  onChange: (theme: UserSettings["theme"]) => void;
}

const themeOptions = [
  {
    value: "system" as const,
    label: "跟随系统",
    description: "根据系统设置自动切换",
    icon: Monitor,
  },
  {
    value: "light" as const,
    label: "亮色模式",
    description: "始终使用亮色主题",
    icon: Sun,
  },
  {
    value: "dark" as const,
    label: "暗色模式",
    description: "始终使用暗色主题",
    icon: Moon,
  },
];

export function ThemeSettings({ theme, onChange }: ThemeSettingsProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
        主题模式
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {themeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
              theme === option.value
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
            )}
          >
            <option.icon
              className={cn(
                "w-5 h-5",
                theme === option.value
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-slate-400"
              )}
            />
            <div>
              <p
                className={cn(
                  "text-sm font-medium",
                  theme === option.value
                    ? "text-blue-900 dark:text-blue-100"
                    : "text-gray-900 dark:text-white"
                )}
              >
                {option.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {option.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
