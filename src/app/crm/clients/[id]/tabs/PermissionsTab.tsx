"use client";

import { useState } from "react";
import { Shield, ToggleLeft, ToggleRight, ChevronDown } from "lucide-react";
import type { ClientDetailData, ClientPermission } from "@/types/backoffice/client-detail";
import type { BaseTabProps } from "@/types/backoffice/client";


export default function PermissionsTab({ data }: BaseTabProps) {
  const { permissions: initialPermissions } = data;
  const [permissions, setPermissions] = useState(initialPermissions);

  const grouped = permissions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, ClientPermission[]>);

  const updatePermission = (key: string, value: boolean | string | number) => {
    setPermissions((prev) => prev.map((p) => (p.key === key ? { ...p, value } : p)));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">权限管理</h3>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            {category}
          </h4>
          <div className="space-y-3">
            {items.map((permission) => (
              <PermissionRow key={permission.key} permission={permission} onChange={updatePermission} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PermissionRow({
  permission,
  onChange,
}: {
  permission: ClientPermission;
  onChange: (key: string, value: boolean | string | number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-700">{permission.label}</span>

      {permission.type === "toggle" && (
        <button
          onClick={() => onChange(permission.key, !permission.value)}
          className="flex items-center gap-2"
        >
          {permission.value ? (
            <ToggleRight className="w-6 h-6 text-blue-600" />
          ) : (
            <ToggleLeft className="w-6 h-6 text-slate-300" />
          )}
          <span className={`text-xs ${permission.value ? "text-blue-600" : "text-slate-400"}`}>
            {permission.value ? "启用" : "禁用"}
          </span>
        </button>
      )}

      {permission.type === "select" && permission.options && (
        <div className="relative">
          <select
            value={String(permission.value)}
            onChange={(e) => onChange(permission.key, e.target.value)}
            className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {permission.options.map((opt) => (
              <option key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      )}

      {permission.type === "number" && (
        <input
          type="number"
          value={permission.value as number}
          onChange={(e) => onChange(permission.key, Number(e.target.value))}
          className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  );
}
