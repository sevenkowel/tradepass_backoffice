"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { defaultLocale, dictionaries, locales, type Locale } from "./config";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LocaleCtx = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "tp_locale";

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && (locales as string[]).includes(stored)) return stored as Locale;
  return defaultLocale;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    setLocaleState(readStoredLocale());
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, l);
  };

  const value = useMemo<LocaleContextValue>(() => {
    const dict = dictionaries[locale] || dictionaries[defaultLocale];
    return {
      locale,
      setLocale,
      t: (key, params) => {
        let text = dict[key] || dictionaries[defaultLocale][key] || key;
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            text = text.replace(new RegExp(`{{${k}}}`, "g"), v);
          }
        }
        return text;
      },
    };
  }, [locale]);

  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export function useT() {
  const ctx = useContext(LocaleCtx);
  if (!ctx) {
    return {
      locale: defaultLocale,
      setLocale: () => {},
      t: (key: string, params?: Record<string, string>) => {
        const dict = dictionaries[defaultLocale];
        let text = dict[key] || key;
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            text = text.replace(new RegExp(`{{${k}}}`, "g"), v);
          }
        }
        return text;
      },
    } satisfies LocaleContextValue;
  }
  return ctx;
}
