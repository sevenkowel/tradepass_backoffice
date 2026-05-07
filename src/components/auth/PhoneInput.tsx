"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  placeholder: string;
}

const HOT_COUNTRIES = ["VN", "TH", "ID", "MY", "SG", "AE", "IN"];

const COUNTRIES: CountryOption[] = [
  { code: "VN", name: "Vietnam", flag: "🇻🇳", dialCode: "+84", placeholder: "9xx xxx xxx" },
  { code: "TH", name: "Thailand", flag: "🇹🇭", dialCode: "+66", placeholder: "8x xxx xxxx" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", dialCode: "+62", placeholder: "8xx xxxx xxxx" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", dialCode: "+60", placeholder: "1x xxxx xxxx" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", dialCode: "+65", placeholder: "xxxx xxxx" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", dialCode: "+63", placeholder: "9xx xxx xxxx" },
  { code: "AE", name: "UAE", flag: "🇦🇪", dialCode: "+971", placeholder: "5x xxx xxxx" },
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91", placeholder: "9xxxx xxxxx" },
  { code: "KR", name: "Korea", flag: "🇰🇷", dialCode: "+82", placeholder: "1x xxxx xxxx" },
  { code: "JP", name: "Japan", flag: "🇯🇵", dialCode: "+81", placeholder: "90 xxxx xxxx" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", dialCode: "+55", placeholder: "xx xxxxx xxxx" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", dialCode: "+52", placeholder: "1 xxx xxx xxxx" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", dialCode: "+57", placeholder: "3xx xxx xxxx" },
];

// 排序：热门置顶，其余按字母序
const SORTED_COUNTRIES = [...COUNTRIES].sort((a, b) => {
  const aHot = HOT_COUNTRIES.indexOf(a.code);
  const bHot = HOT_COUNTRIES.indexOf(b.code);
  if (aHot !== -1 && bHot !== -1) return aHot - bHot;
  if (aHot !== -1) return -1;
  if (bHot !== -1) return 1;
  return a.name.localeCompare(b.name);
});

interface PhoneInputProps {
  value?: string;
  onChange: (value: string) => void;
  defaultCountry?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export default function PhoneInput({
  value = "",
  onChange,
  defaultCountry = "VN",
  disabled = false,
  className = "",
  error = false,
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  // 解析当前值
  const parsed = useMemo(() => {
    const trimmed = value.trim();
    for (const c of COUNTRIES) {
      if (trimmed.startsWith(c.dialCode)) {
        return { country: c, number: trimmed.slice(c.dialCode.length).trim() };
      }
    }
    const defaultC = COUNTRIES.find((c) => c.code === defaultCountry) || COUNTRIES[0];
    return { country: defaultC, number: trimmed.replace(/^\+/, "").replace(/^\d+/, "").trim() };
  }, [value, defaultCountry]);

  const { country, number } = parsed;

  // 过滤列表
  const filtered = useMemo(() => {
    if (!search.trim()) return SORTED_COUNTRIES;
    const q = search.toLowerCase().trim();
    return SORTED_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  // 热门 vs 其他分界
  const hotList = filtered.filter((c) => HOT_COUNTRIES.includes(c.code));
  const otherList = filtered.filter((c) => !HOT_COUNTRIES.includes(c.code));

  const handleCountryChange = (newCountry: CountryOption) => {
    setIsOpen(false);
    setSearch("");
    onChange(`${newCountry.dialCode}${number}`.trim());
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    onChange(`${country.dialCode}${raw}`.trim());
  };

  return (
    <div className={`relative ${className}`}>
      {/* 输入框容器 */}
      <div
        className={`flex rounded-lg border ${
          error ? "border-red-300" : "border-gray-200"
        } bg-white overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all`}
      >
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 border-r border-gray-200 text-sm text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
          disabled={disabled}
        >
          <span className="text-base">{country.flag}</span>
          <span className="font-medium">{country.dialCode}</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>

        <input
          type="tel"
          value={number}
          onChange={handleNumberChange}
          placeholder={country.placeholder}
          disabled={disabled}
          className="flex-1 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
        />
      </div>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setSearch(""); }} />
          <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            {/* 搜索框 */}
            <div className="p-2 border-b border-gray-100">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索国家或区号"
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* 列表 */}
            <div className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">未找到匹配的国家</div>
              ) : (
                <>
                  {/* 热门地区 */}
                  {!search.trim() && hotList.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        热门地区
                      </div>
                      {hotList.map((c) => (
                        <CountryItem
                          key={c.code}
                          country={c}
                          selected={c.code === country.code}
                          onClick={() => handleCountryChange(c)}
                        />
                      ))}
                    </>
                  )}

                  {/* 其他地区 */}
                  {otherList.length > 0 && (
                    <>
                      {!search.trim() && (
                        <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                          其他地区
                        </div>
                      )}
                      {otherList.map((c) => (
                        <CountryItem
                          key={c.code}
                          country={c}
                          selected={c.code === country.code}
                          onClick={() => handleCountryChange(c)}
                        />
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CountryItem({
  country,
  selected,
  onClick,
}: {
  country: CountryOption;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
        selected ? "bg-primary/5 text-primary font-medium" : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className="text-base">{country.flag}</span>
      <span className="flex-1 text-left truncate">{country.name}</span>
      <span className="text-gray-400 font-mono text-xs">{country.dialCode}</span>
      {selected && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
    </button>
  );
}
