"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import type { RegionConfig } from "@/lib/auth-config";

const HOT_REGION_CODES = ["VN", "TH", "ID", "MY", "SG", "AE", "IN"];

interface RegionSelectProps {
  value: RegionConfig;
  options: RegionConfig[];
  onChange: (region: RegionConfig) => void;
  disabled?: boolean;
}

export default function RegionSelect({
  value,
  options,
  onChange,
  disabled = false,
}: RegionSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      // 无搜索时：热门置顶，其余按字母排序
      const hot = options.filter((r) => HOT_REGION_CODES.includes(r.code));
      const others = options
        .filter((r) => !HOT_REGION_CODES.includes(r.code))
        .sort((a, b) => a.name.localeCompare(b.name));
      return [...hot, ...others];
    }
    // 搜索时：按匹配度排序
    return options
      .filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.code.toLowerCase().includes(query) ||
          r.defaultPhonePrefix.includes(query)
      )
      .sort((a, b) => {
        const aExact = a.code.toLowerCase() === query || a.name.toLowerCase() === query;
        const bExact = b.code.toLowerCase() === query || b.name.toLowerCase() === query;
        if (aExact && !bExact) return -1;
        if (bExact && !aExact) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [search, options]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [search]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 高亮项滚动到视野
  useEffect(() => {
    if (listRef.current && isOpen) {
      const activeItem = listRef.current.children[highlightIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightIndex, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) => (prev >= filteredOptions.length - 1 ? 0 : prev + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) => (prev <= 0 ? filteredOptions.length - 1 : prev - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions[highlightIndex]) {
          onChange(filteredOptions[highlightIndex]);
          setIsOpen(false);
          setSearch("");
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSearch("");
        break;
    }
  };

  const handleSelect = (region: RegionConfig) => {
    onChange(region);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="w-full h-11 px-3 text-sm text-left bg-white border border-gray-200 rounded-lg flex items-center gap-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-50"
      >
        <span className="text-base">{value.flag}</span>
        <span className="flex-1 text-gray-900">{value.name}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden flex flex-col max-h-[320px]">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索国家或地区..."
              className="flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Options list */}
          <div ref={listRef} className="overflow-y-auto flex-1 py-1">
            {filteredOptions.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">未找到匹配的地区</div>
            )}

            {filteredOptions.map((region, index) => {
              const isSelected = region.code === value.code;
              const isHighlighted = index === highlightIndex;

              // 分组标题：热门
              const showHotHeader =
                !search && index === 0 && HOT_REGION_CODES.includes(region.code);
              // 分组标题：全部
              const showAllHeader =
                !search &&
                index > 0 &&
                HOT_REGION_CODES.includes(filteredOptions[index - 1].code) &&
                !HOT_REGION_CODES.includes(region.code);

              return (
                <div key={region.code}>
                  {showHotHeader && (
                    <div className="px-3 py-1 text-[11px] text-gray-400 font-medium">热门</div>
                  )}
                  {showAllHeader && (
                    <div className="px-3 py-1 text-[11px] text-gray-400 font-medium mt-1">全部</div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelect(region)}
                    onMouseEnter={() => setHighlightIndex(index)}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                      isHighlighted ? "bg-primary/5" : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-base w-6 text-center">{region.flag}</span>
                    <span className={`flex-1 ${isSelected ? "text-primary font-medium" : "text-gray-700"}`}>
                      {region.name}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
