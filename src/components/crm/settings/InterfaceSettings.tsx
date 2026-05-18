"use client";

import { Layout, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserSettings } from "@/types/backoffice/settings";

interface InterfaceSettingsProps {
  sidebarCollapsed: boolean;
  tablePageSize: UserSettings["tablePageSize"];
  onSidebarChange: (collapsed: boolean) => void;
  onPageSizeChange: (size: UserSettings["tablePageSize"]) => void;
}

const pageSizeOptions = [10, 20, 50, 100] as const;

export function InterfaceSettings({
  sidebarCollapsed,
  tablePageSize,
  onSidebarChange,
  onPageSizeChange,
}: InterfaceSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Sidebar Setting */}
      <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700">
            <Layout className="w-5 h-5 text-gray-600 dark:text-slate-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              侧边栏默认折叠
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              登录后侧边栏默认处于折叠状态
            </p>
          </div>
        </div>
        <button
          onClick={() => onSidebarChange(!sidebarCollapsed)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            sidebarCollapsed
              ? "bg-blue-600"
              : "bg-gray-200 dark:bg-slate-700"
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              sidebarCollapsed ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>

      {/* Table Page Size */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700">
            <Table2 className="w-5 h-5 text-gray-600 dark:text-slate-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              表格默认分页大小
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              数据表格每页默认显示的行数
            </p>
          </div>
        </div>
        <select
          value={tablePageSize}
          onChange={(e) =>
            onPageSizeChange(Number(e.target.value) as UserSettings["tablePageSize"])
          }
          className="h-10 px-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-400"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} 条/页
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
