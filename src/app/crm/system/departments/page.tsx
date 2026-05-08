"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Edit2, Trash2, Building, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Button,
  PageHeader,
  Card,
  EmptyState,
  EnhancedDataTable,
  LoadingState,
  type Column,
  type RowAction,
} from "@/components/crm/ui";
import { useDepartmentStore } from "@/store/crm/departmentStore";
import { useStaffStore } from "@/store/crm/staffStore";
import { DepartmentForm } from "./DepartmentForm";
import { buildDepartmentTree, flattenDepartmentTree } from "@/lib/crm/tree-utils";
import type { FlattenedDepartment } from "@/lib/crm/tree-utils";
import type { Department } from "@/types/crm/department";

export default function DepartmentsPage() {
  const router = useRouter();
  const {
    departments,
    isLoading,
    fetchDepartments,
    deleteDepartment,
  } = useDepartmentStore();

  const { staff, fetchStaff } = useStaffStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  useEffect(() => {
    fetchDepartments();
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flatData = useMemo(() => {
    const tree = buildDepartmentTree(departments);
    return flattenDepartmentTree(tree);
  }, [departments]);

  const handleCreate = () => {
    setEditingDept(null);
    setIsFormOpen(true);
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setIsFormOpen(true);
  };

  const handleDelete = async (dept: Department) => {
    if (!confirm(`确认删除部门"${dept.name}"？其子部门也将被删除。`)) return;
    await deleteDepartment(dept.id);
    fetchDepartments();
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchDepartments();
  };

  const columns: Column<FlattenedDepartment>[] = [
    {
      key: "name",
      title: "部门名称",
      render: (row) => (
        <div className="flex items-center gap-2" style={{ paddingLeft: `${row._level * 24}px` }}>
          {row._level === 0 ? (
            <Building className="w-4 h-4 text-slate-400" />
          ) : (
            <div className="w-4 h-4 flex items-center justify-center">
              <div className="w-px h-4 bg-slate-300" />
            </div>
          )}
          <span className="font-medium text-slate-900">{row.name}</span>
          {row.status === "inactive" && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">已禁用</span>
          )}
        </div>
      ),
    },
    {
      key: "description",
      title: "描述",
      width: "200px",
      render: (row) => (
        <span className="text-sm text-slate-500">{row.description || "-"}</span>
      ),
    },
    {
      key: "managerName",
      title: "主管",
      width: "120px",
      render: (row) => (
        <span className="text-sm text-slate-600">{row.managerName || "-"}</span>
      ),
    },
    {
      key: "moduleAccess",
      title: "可访问模块",
      width: "200px",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.moduleAccess.slice(0, 3).map((m) => (
            <span key={m} className="inline-flex items-center px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">
              {m}
            </span>
          ))}
          {row.moduleAccess.length > 3 && (
            <span className="text-xs text-slate-400">+{row.moduleAccess.length - 3}</span>
          )}
        </div>
      ),
    },
    {
      key: "memberCount",
      title: "成员",
      width: "60px",
      align: "center",
      render: (row) => (
        <span className="text-sm text-slate-600">{row.memberCount}</span>
      ),
    },
  ];

  const rowActions: RowAction<FlattenedDepartment>[] = [
    {
      label: "查看详情",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => {
        router.push(`/crm/system/departments/${row.id}`);
      },
    },
    {
      label: "编辑",
      icon: <Edit2 className="w-4 h-4" />,
      onClick: handleEdit,
    },
    {
      label: "删除",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDelete,
      variant: "danger",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="部门管理"
        description="管理组织架构，设置部门层级和模块访问权限"
        actions={
          <div className="flex gap-3">
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4" />
              新建部门
            </Button>
          </div>
        }
      />

      <Card padding="none">
        {isLoading ? (
          <LoadingState size="md" className="py-12" />
        ) : flatData.length === 0 ? (
          <EmptyState
            icon={<Building className="w-6 h-6" />}
            title="暂无部门"
            description="点击上方按钮创建第一个部门"
          />
        ) : (
          <EnhancedDataTable
            columns={columns}
            data={flatData}
            keyExtractor={(row) => row.id}
            rowActions={rowActions}
            emptyText="暂无部门数据"
          />
        )}
      </Card>

      <DepartmentForm
        department={editingDept}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormSuccess}
        departments={departments}
        staff={staff}
      />
    </div>
  );
}
