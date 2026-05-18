"use client";

/**
 * CountrySelect — searchable, **multi-select** country picker.
 *
 * Trigger shows up to 3 selected flags + a count badge for the rest.
 * Dropdown shows search input + virtualised-style list with checkboxes.
 * Clicking a country toggles it in the value array; clicking outside or
 * pressing ESC closes the popover. The X button next to the trigger
 * clears all selections at once.
 *
 * Wire format: `string[]` of ISO-3166 alpha-2 codes (uppercase). Empty
 * array (or undefined) means "no country filter".
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown, X, Check } from "lucide-react";
import * as CountryFlags from "country-flag-icons/react/3x2";
import { useT } from "@/lib/i18n/LocaleProvider";
import { COUNTRIES, findCountry, countryName, type CountryOption } from "./lib/countries";

interface Props {
  value: string[] | undefined;
  onChange: (codes: string[] | undefined) => void;
  placeholder?: string;
}

export function CountrySelect({ value, onChange, placeholder }: Props) {
  const { t, locale } = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Always work with a Set internally for O(1) toggles.
  const selectedSet = useMemo(() => new Set(value ?? []), [value]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) =>
      c.code.toLowerCase().includes(q) ||
      c.en.toLowerCase().includes(q) ||
      c.zh.toLowerCase().includes(q),
    );
  }, [query]);

  const toggle = (code: string) => {
    const next = new Set(selectedSet);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange(next.size === 0 ? undefined : [...next]);
  };

  const clearAll = () => {
    onChange(undefined);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full min-h-9 px-3 py-1 inline-flex items-center justify-between gap-2 border rounded-lg text-sm transition-colors ${
          open
            ? "border-blue-300 bg-white ring-2 ring-blue-100"
            : "border-slate-200 bg-white hover:border-slate-300"
        }`}
      >
        <span className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap py-0.5">
          {selectedSet.size === 0 ? (
            <span className="text-slate-400 truncate">
              {placeholder ?? t("clients.advanced.country.placeholder")}
            </span>
          ) : (
            <Selection selectedCodes={[...selectedSet]} locale={locale} />
          )}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selectedSet.size > 0 && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => { e.stopPropagation(); clearAll(); }}
              className="p-0.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
              aria-label="Clear all"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search + selected count + clear */}
          <div className="border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("clients.advanced.country.search")}
                className="w-full h-9 pl-9 pr-3 text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
            {selectedSet.size > 0 && (
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 text-[11px] text-slate-500">
                <span>
                  {t("clients.advanced.country.selected", { n: String(selectedSet.size) })}
                </span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-blue-600 hover:underline"
                >
                  {t("clients.advanced.country.clearAll")}
                </button>
              </div>
            )}
          </div>

          {/* Options */}
          <ul className="max-h-64 overflow-y-auto py-1" role="listbox" aria-multiselectable="true">
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-slate-400">
                {t("clients.advanced.country.noMatch")}
              </li>
            )}
            {filtered.map((c) => {
              const isSelected = selectedSet.has(c.code);
              return (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => toggle(c.code)}
                    className={`w-full px-3 py-1.5 inline-flex items-center gap-2 text-sm text-left transition-colors ${
                      isSelected ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {/* Checkbox */}
                    <span className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-slate-300"
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </span>
                    <FlagInline cc={c.code} />
                    <span className="flex-1 truncate">
                      {locale === "zh" ? c.zh : c.en}
                    </span>
                    <span className={`font-mono text-[11px] tabular-nums shrink-0 ${
                      isSelected ? "text-blue-500" : "text-slate-400"
                    }`}>
                      {c.code}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* Selection — render the trigger label for one or more selected codes   */
/* --------------------------------------------------------------------- */

function Selection({ selectedCodes, locale }: { selectedCodes: string[]; locale: string }) {
  const MAX_VISIBLE = 3;
  const visible = selectedCodes.slice(0, MAX_VISIBLE);
  const rest = selectedCodes.length - visible.length;

  return (
    <>
      {visible.map((code) => {
        const c = findCountry(code);
        if (!c) return null;
        return (
          <span
            key={code}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
          >
            <FlagInline cc={code} small />
            {locale === "zh" ? c.zh : c.en}
          </span>
        );
      })}
      {rest > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[11px] font-medium tabular-nums">
          +{rest}
        </span>
      )}
    </>
  );
}

/* --------------------------------------------------------------------- */
/* Inline flag                                                            */
/* --------------------------------------------------------------------- */

function FlagInline({ cc, small = false }: { cc: string; small?: boolean }) {
  const Flag = (CountryFlags as Record<string, React.FC<{ className?: string }>>)[cc.toUpperCase()];
  if (!Flag) return null;
  const size = small ? { width: 14, height: 10 } : { width: 18, height: 12 };
  return (
    <span
      className="inline-flex items-center justify-center rounded-sm overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.08)] shrink-0"
      style={size}
      aria-hidden
    >
      <Flag className="w-full h-full object-cover" />
    </span>
  );
}

export { countryName, type CountryOption };
