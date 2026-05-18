"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";

const COMMON_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "yahoo.com",
  "qq.com",
  "163.com",
  "126.com",
  "foxmail.com",
  "icloud.com",
  "live.com",
  "sina.com",
  "sohu.com",
  "aliyun.com",
  "yeah.net",
];

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function EmailInput({
  value,
  onChange,
  placeholder = "your@email.com",
  required = false,
  className = "",
  disabled = false,
}: EmailInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const atIndex = value.indexOf("@");
    if (atIndex === -1) return [];

    const localPart = value.slice(0, atIndex);
    const domainPart = value.slice(atIndex + 1).toLowerCase();

    if (!localPart) return [];

    const matched = COMMON_DOMAINS.filter((d) =>
      d.startsWith(domainPart)
    ).slice(0, 5);

    return matched.map((domain) => `${localPart}@${domain}`);
  }, [value]);

  const showSuggestions = isOpen && suggestions.length > 0 && !disabled;

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
      setIsOpen(true);
      setHighlightIndex(0);
    },
    [onChange]
  );

  const selectSuggestion = useCallback(
    (email: string) => {
      onChange(email);
      setIsOpen(false);
      inputRef.current?.focus();
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightIndex((prev) =>
            prev >= suggestions.length - 1 ? 0 : prev + 1
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightIndex((prev) =>
            prev <= 0 ? suggestions.length - 1 : prev - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          selectSuggestion(suggestions[highlightIndex]);
          break;
        case "Escape":
          setIsOpen(false);
          break;
        case "Tab":
          if (suggestions.length > 0) {
            e.preventDefault();
            selectSuggestion(suggestions[highlightIndex]);
          }
          break;
      }
    },
    [showSuggestions, suggestions, highlightIndex, selectSuggestion]
  );

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 高亮项滚动到视野
  useEffect(() => {
    if (listRef.current && showSuggestions) {
      const activeItem = listRef.current.children[highlightIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightIndex, showSuggestions]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="email"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => value.includes("@") && setIsOpen(true)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="email"
        className={`w-full h-11 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${className}`}
      />

      {showSuggestions && (
        <div
          ref={listRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
        >
          {suggestions.map((email, index) => (
            <button
              key={email}
              type="button"
              onClick={() => selectSuggestion(email)}
              onMouseEnter={() => setHighlightIndex(index)}
              className={`w-full px-3 py-2.5 text-left text-sm transition-colors flex items-center gap-2 ${
                index === highlightIndex
                  ? "bg-primary/5 text-primary"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="flex-1 truncate">{email}</span>
              {index === highlightIndex && (
                <kbd className="text-[10px] px-1 py-0.5 bg-gray-100 rounded text-gray-400">
                  ↵
                </kbd>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
