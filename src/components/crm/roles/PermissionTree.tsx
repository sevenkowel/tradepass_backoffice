"use client";

import { useState, useCallback, useEffect } from "react";
import { ChevronRight, ChevronDown, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Permission,
  PermissionModuleConfig,
} from "@/types/backoffice/role";
import type { PermissionAction } from "@/types/backoffice/common";

interface PermissionTreeProps {
  modules: PermissionModuleConfig[];
  value: Permission[];
  onChange: (permissions: Permission[]) => void;
  disabled?: boolean;
}

interface ModuleState {
  checked: boolean;
  indeterminate: boolean;
  actions: Record<PermissionAction, boolean>;
}

export function PermissionTree({
  modules,
  value,
  onChange,
  disabled = false,
}: PermissionTreeProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    () => new Set(modules.map((m) => m.id))
  );

  // Convert value to module states
  const getModuleStates = useCallback((): Record<string, ModuleState> => {
    const states: Record<string, ModuleState> = {};

    modules.forEach((module) => {
      const modulePermission = value.find((p) => p.module === module.id);
      const selectedActions = new Set(modulePermission?.actions || []);

      const actions: Record<PermissionAction, boolean> = {} as Record<
        PermissionAction,
        boolean
      >;
      module.actions.forEach((action) => {
        actions[action.action] = selectedActions.has(action.action);
      });

      const actionValues = Object.values(actions);
      const allChecked = actionValues.every(Boolean);
      const someChecked = actionValues.some(Boolean);

      states[module.id] = {
        checked: allChecked,
        indeterminate: someChecked && !allChecked,
        actions,
      };
    });

    return states;
  }, [modules, value]);

  const [moduleStates, setModuleStates] = useState<Record<string, ModuleState>>(
    getModuleStates
  );

  // Sync with external value changes
  useEffect(() => {
    setModuleStates(getModuleStates());
  }, [value, getModuleStates]);

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  // Toggle all permissions for a module
  const toggleModuleAll = (module: PermissionModuleConfig, checked: boolean) => {
    if (disabled) return;

    const newPermissions = [...value];
    const existingIndex = newPermissions.findIndex(
      (p) => p.module === module.id
    );

    if (checked) {
      // Add all actions
      const allActions = module.actions.map((a) => a.action);
      if (existingIndex >= 0) {
        newPermissions[existingIndex] = {
          module: module.id,
          actions: allActions,
        };
      } else {
        newPermissions.push({
          module: module.id,
          actions: allActions,
        });
      }
    } else {
      // Remove module permission
      if (existingIndex >= 0) {
        newPermissions.splice(existingIndex, 1);
      }
    }

    onChange(newPermissions);
  };

  // Toggle single action
  const toggleAction = (
    module: PermissionModuleConfig,
    action: PermissionAction,
    checked: boolean
  ) => {
    if (disabled) return;

    const newPermissions = [...value];
    const existingIndex = newPermissions.findIndex(
      (p) => p.module === module.id
    );

    if (existingIndex >= 0) {
      const existing = newPermissions[existingIndex];
      if (checked) {
        // Add action
        if (!existing.actions.includes(action)) {
          existing.actions = [...existing.actions, action];
        }
      } else {
        // Remove action
        existing.actions = existing.actions.filter((a) => a !== action);
        // Remove module if no actions left
        if (existing.actions.length === 0) {
          newPermissions.splice(existingIndex, 1);
        }
      }
    } else if (checked) {
      // Create new module permission
      newPermissions.push({
        module: module.id,
        actions: [action],
      });
    }

    onChange(newPermissions);
  };

  // Toggle all modules
  const toggleAll = (checked: boolean) => {
    if (disabled) return;

    if (checked) {
      const allPermissions: Permission[] = modules.map((module) => ({
        module: module.id,
        actions: module.actions.map((a) => a.action),
      }));
      onChange(allPermissions);
    } else {
      onChange([]);
    }
  };

  // Check if all permissions are selected
  const allSelected = modules.every((module) => {
    const state = moduleStates[module.id];
    return state?.checked;
  });

  // Check if some permissions are selected
  const someSelected = modules.some((module) => {
    const state = moduleStates[module.id];
    return state?.checked || state?.indeterminate;
  });

  return (
    <div className="space-y-3">
      {/* Select All Header */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => toggleAll(!allSelected)}
          disabled={disabled}
          className={cn(
            "flex items-center justify-center w-5 h-5 rounded border transition-colors",
            allSelected
              ? "bg-[var(--tp-accent)] border-[var(--tp-accent)] text-white"
              : someSelected
              ? "bg-[var(--tp-accent)] border-[var(--tp-accent)]"
              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {allSelected ? (
            <Check className="w-3.5 h-3.5" />
          ) : someSelected ? (
            <Minus className="w-3.5 h-3.5 text-white" />
          ) : null}
        </button>
        <span className="font-medium text-sm text-[var(--tp-fg)]">
          全选所有权限
        </span>
        <span className="text-xs text-[var(--tp-fg-muted)] ml-auto">
          已选择 {value.reduce((sum, p) => sum + p.actions.length, 0)} 项权限
        </span>
      </div>

      {/* Module List */}
      <div className="space-y-2">
        {modules.map((module) => {
          const state = moduleStates[module.id];
          const isExpanded = expandedModules.has(module.id);

          return (
            <div
              key={module.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              {/* Module Header */}
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900">
                <button
                  type="button"
                  onClick={() => toggleModule(module.id)}
                  className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => toggleModuleAll(module, !state?.checked)}
                  disabled={disabled}
                  className={cn(
                    "flex items-center justify-center w-5 h-5 rounded border transition-colors",
                    state?.checked
                      ? "bg-[var(--tp-accent)] border-[var(--tp-accent)] text-white"
                      : state?.indeterminate
                      ? "bg-[var(--tp-accent)] border-[var(--tp-accent)]"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {state?.checked ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : state?.indeterminate ? (
                    <Minus className="w-3.5 h-3.5 text-white" />
                  ) : null}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-[var(--tp-fg)]">
                    {module.name}
                  </div>
                  <div className="text-xs text-[var(--tp-fg-muted)]">
                    {module.description}
                  </div>
                </div>

                <span className="text-xs text-[var(--tp-fg-muted)]">
                  {state &&
                    Object.values(state.actions).filter(Boolean).length}{" "}
                  / {module.actions.length}
                </span>
              </div>

              {/* Actions List */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {module.actions.map((action) => {
                      const isChecked = state?.actions[action.action] || false;

                      return (
                        <label
                          key={action.action}
                          className={cn(
                            "flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                            !disabled && "hover:bg-gray-100 dark:hover:bg-gray-800",
                            disabled && "cursor-not-allowed opacity-60"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              toggleAction(module, action.action, e.target.checked)
                            }
                            disabled={disabled}
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[var(--tp-accent)] focus:ring-[var(--tp-accent)]"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-[var(--tp-fg)]">
                              {action.name}
                            </div>
                            <div className="text-xs text-[var(--tp-fg-muted)]">
                              {action.description}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
