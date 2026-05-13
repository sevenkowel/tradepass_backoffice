"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, Filter, X, ChevronDown, RefreshCw } from "lucide-react";
import { Button } from "./PageHeader";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  filters?: {
    key: string;
    label: string;
    type?: "text" | "select" | "date" | "daterange";
    placeholder?: string;
    options?: FilterOption[];
    value?: string;
    onChange?: (value: string) => void;
  }[];
  onSearch?: (values: Record<string, string>) => void;
  onClear?: () => void;
  className?: string;
  searchable?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  searchKeys?: string[];
  onSearchChange?: (value: string) => void;
  onRefresh?: () => void;
  /**
   * Whether the filter grid is expanded by default. Pages with many
   * filters (e.g. review queue) should default to `false` so the
   * page opens with the table front-and-center.
   */
  defaultOpen?: boolean;
}

export function FilterBar({
  filters = [],
  onSearch,
  onClear,
  className,
  searchable = false,
  showSearch = true,
  searchPlaceholder = "Search...",
  searchValue,
  onRefresh,
  defaultOpen = true,
}: FilterBarProps) {
  const [localSearch, setLocalSearch] = useState(searchValue || "");
  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    () =>
      filters.reduce((acc, f) => {
        if (f.value) acc[f.key] = f.value;
        return acc;
      }, {} as Record<string, string>)
  );
  // If the page boots with a pre-populated filter (e.g. deep-linked from
  // Workspace KPI: `?assignee=me&slaStatus=near_timeout`), open the
  // filter grid even when `defaultOpen={false}` — otherwise the chips
  // are hidden and the user can't see why the table is narrowed.
  const hasInitialFilter = Object.values(filterValues).some(Boolean);
  const [showFilters, setShowFilters] = useState(defaultOpen || hasInitialFilter);

  const handleApply = () => {
    const values: Record<string, string> = { ...filterValues };
    // Parse daterange into startDate / endDate
    if (values.dateRange) {
      const [start, end] = values.dateRange.split("|");
      if (start) values.startDate = start;
      if (end) values.endDate = end;
      delete values.dateRange;
    }
    if (localSearch) values.search = localSearch;
    onSearch?.(values);
  };

  const handleClear = () => {
    setLocalSearch("");
    setFilterValues({});
    onClear?.();
    onSearch?.({});
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    filters.find((f) => f.key === key)?.onChange?.(value);
  };

  const hasActiveFilters =
    localSearch || Object.values(filterValues).some(Boolean);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search and Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        {showSearch && (
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-10 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(!showFilters && "text-gray-400")}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center">
                {Object.values(filterValues).filter(Boolean).length +
                  (localSearch ? 1 : 0)}
              </span>
            )}
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Filter Options */}
      {showFilters && filters.length > 0 && (
        <div className="flex flex-wrap items-end gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
          {filters.map((filter) => (
            <div key={filter.key} className="min-w-[160px]">
              {filter.type === "select" && (
                <SelectFilter
                  label={filter.label}
                  options={filter.options || []}
                  value={filterValues[filter.key] || ""}
                  onChange={(v) => handleFilterChange(filter.key, v)}
                  placeholder={filter.placeholder}
                />
              )}
              {filter.type === "text" && (
                <TextFilter
                  label={filter.label}
                  value={filterValues[filter.key] || ""}
                  onChange={(v) => handleFilterChange(filter.key, v)}
                  placeholder={filter.placeholder}
                />
              )}
              {filter.type === "date" && (
                <DateFilter
                  label={filter.label}
                  value={filterValues[filter.key] || ""}
                  onChange={(v) => handleFilterChange(filter.key, v)}
                  placeholder={filter.placeholder}
                />
              )}
              {filter.type === "daterange" && (
                <DateRangeFilter
                  label={filter.label}
                  value={filterValues[filter.key] || ""}
                  onChange={(v) => handleFilterChange(filter.key, v)}
                />
              )}
            </div>
          ))}

          {/* Apply Button */}
          <Button
            size="sm"
            onClick={handleApply}
            className="h-9 px-4"
          >
            <Search className="w-4 h-4 mr-1" />
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}

// Sub-components
interface SelectFilterProps {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function SelectFilter({
  label,
  options,
  value,
  onChange,
  placeholder = "All",
}: SelectFilterProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-9 pl-3 pr-8 bg-white border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:border-blue-300 cursor-pointer"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

interface TextFilterProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function TextFilter({
  label,
  value,
  onChange,
  placeholder,
}: TextFilterProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-blue-300"
      />
    </div>
  );
}

interface DateFilterProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function DateFilter({
  label,
  value,
  onChange,
  placeholder = "Select date...",
}: DateFilterProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-300"
      />
    </div>
  );
}

interface DateRangeFilterProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function DateRangeFilter({
  label,
  value,
  onChange,
}: DateRangeFilterProps) {
  const [start, end] = value.split("|");

  const handleStartChange = (newStart: string) => {
    onChange(newStart ? `${newStart}|${end || ""}` : end || "");
  };

  const handleEndChange = (newEnd: string) => {
    onChange(start ? `${start}|${newEnd}` : newEnd);
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={start || ""}
          onChange={(e) => handleStartChange(e.target.value)}
          className="w-[130px] h-9 px-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-300"
        />
        <span className="text-xs text-gray-400">to</span>
        <input
          type="date"
          value={end || ""}
          onChange={(e) => handleEndChange(e.target.value)}
          className="w-[130px] h-9 px-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-300"
        />
      </div>
    </div>
  );
}
