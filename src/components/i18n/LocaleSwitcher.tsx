"use client";

import { useState } from "react";
import { locales, localeNames, localeFlags, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { Globe, Check } from "lucide-react";

interface LocaleSwitcherProps {
  currentLocale: Locale;
  onChange: (locale: Locale) => void;
  compact?: boolean;
}

export function LocaleSwitcher({ currentLocale, onChange, compact = false }: LocaleSwitcherProps) {
  const [open, setOpen] = useState(false);

  if (compact) {
    return (
      <select
        value={currentLocale}
        onChange={(e) => onChange(e.target.value as Locale)}
        className="text-sm bg-transparent border border-[var(--tp-border)] rounded-md px-2 py-1 text-[rgb(var(--tp-fg-rgb))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--tp-accent-rgb))]"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {localeFlags[loc]} {localeNames[loc]}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--tp-border)] hover:bg-[rgba(var(--tp-fg-rgb),0.03)] transition-colors text-sm text-[rgb(var(--tp-fg-rgb))]"
      >
        <Globe className="w-4 h-4 text-[rgba(var(--tp-fg-rgb),0.5)]" />
        <span>{localeFlags[currentLocale]}</span>
        <span className="text-[rgba(var(--tp-fg-rgb),0.7)]">{localeNames[currentLocale]}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-[var(--tp-border)] z-50 py-1">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => {
                  onChange(loc);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[rgba(var(--tp-fg-rgb),0.05)] transition-colors",
                  currentLocale === loc
                    ? "text-[rgb(var(--tp-accent-rgb))] font-medium"
                    : "text-[rgb(var(--tp-fg-rgb))]"
                )}
              >
                <span className="flex items-center gap-2">
                  <span>{localeFlags[loc]}</span>
                  <span>{localeNames[loc]}</span>
                </span>
                {currentLocale === loc && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
