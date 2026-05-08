"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { useDepartmentStore } from "@/store/crm/departmentStore";
import { CRM_MODULES, type CrmModule, type Department } from "@/types/crm/department";
import type { Staff } from "@/types/backoffice/staff";

interface DepartmentFormProps {
  department: Department | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  departments: Department[];
  staff: Staff[];
}

export function DepartmentForm({
  department,
  open,
  onOpenChange,
  onSuccess,
  departments,
  staff,
}: DepartmentFormProps) {
  const { createDepartment, updateDepartment, isSubmitting } = useDepartmentStore();
  const isEditing = !!department;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string>("__none__");
  const [managerId, setManagerId] = useState<string>("__none__");
  const [moduleAccess, setModuleAccess] = useState<CrmModule[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (department) {
        setName(department.name);
        setDescription(department.description || "");
        setParentId(department.parentId || "__none__");
        setManagerId(department.managerId || "__none__");
        setModuleAccess([...department.moduleAccess]);
      } else {
        setName("");
        setDescription("");
        setParentId("__none__");
        setManagerId("__none__");
        setModuleAccess(["Dashboard"]);
      }
      setErrors({});
    }
  }, [open, department]);

  const toggleModule = (module: CrmModule) => {
    setModuleAccess((prev) =>
      prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "请输入部门名称";
    if (moduleAccess.length === 0) newErrors.moduleAccess = "至少选择一个可访问模块";

    // Prevent self-referencing parent
    if (parentId === department?.id) {
      newErrors.parentId = "不能将自己设为父部门";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      parentId: parentId === "__none__" ? undefined : parentId,
      managerId: managerId === "__none__" ? undefined : managerId,
      moduleAccess,
    };

    if (isEditing && department) {
      await updateDepartment(department.id, data);
    } else {
      await createDepartment(data);
    }
    onSuccess();
  };

  // 预计算当前部门的所有后代 ID（避免每次渲染都递归）
  const descendantIds = useMemo(() => {
    if (!department) return new Set<string>();
    const ids = new Set<string>();
    const queue = [department.id];
    while (queue.length) {
      const current = queue.shift()!;
      const children = departments.filter((d) => d.parentId === current);
      for (const child of children) {
        ids.add(child.id);
        queue.push(child.id);
      }
    }
    return ids;
  }, [department, departments]);

  // 可用的父部门选项（排除自身及后代）
  const availableParents = useMemo(
    () => departments.filter((d) => d.id !== department?.id && !descendantIds.has(d.id)),
    [departments, department, descendantIds]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "编辑部门" : "新建部门"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "修改部门信息和组织架构" : "创建新部门，设置层级关系和模块权限"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Department Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              部门名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：技术部、开发组"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="部门的职能说明"
            />
          </div>

          {/* Parent Department */}
          <div className="space-y-2">
            <Label htmlFor="parentId">上级部门</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger>
                <SelectValue placeholder="无（一级部门）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">无（一级部门）</SelectItem>
                {availableParents.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.parentId && <p className="text-sm text-red-500">{errors.parentId}</p>}
          </div>

          {/* Manager */}
          <div className="space-y-2">
            <Label htmlFor="managerId">部门主管</Label>
            <Select value={managerId} onValueChange={setManagerId}>
              <SelectTrigger>
                <SelectValue placeholder="请选择主管" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">未设置</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.fullName} ({s.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Module Access */}
          <div className="space-y-2">
            <Label>
              可访问模块 <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border">
              {CRM_MODULES.map((mod) => (
                <label
                  key={mod}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                    moduleAccess.includes(mod)
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={moduleAccess.includes(mod)}
                    onChange={() => toggleModule(mod)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600"
                  />
                  <span className="text-sm">{mod}</span>
                </label>
              ))}
            </div>
            {errors.moduleAccess && <p className="text-sm text-red-500">{errors.moduleAccess}</p>}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "保存修改" : "创建部门"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
