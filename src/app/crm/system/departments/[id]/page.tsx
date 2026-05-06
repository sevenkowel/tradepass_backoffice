"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, Building, Loader2, Trash2, Shield } from "lucide-react";
import {
  Button,
  PageHeader,
  Card,
  EmptyState,
} from "@/components/crm/ui";
import { useDepartmentStore } from "@/store/crm/departmentStore";
import { useStaffStore } from "@/store/crm/staffStore";
import { DepartmentForm } from "../DepartmentForm";
import { getDepartmentPath } from "@/lib/crm/mock-departments";
import type { Department } from "@/types/crm/department";

export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deptId = params.id as string;

  const {
    departments,
    isLoading,
    fetchDepartments,
    deleteDepartment,
  } = useDepartmentStore();

  const { staff, fetchStaff } = useStaffStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [dept, setDept] = useState<Department | null>(null);
  const [children, setChildren] = useState<Department[]>([]);

  useEffect(() => {
    fetchDepartments();
    fetchStaff();
  }, [fetchDepartments, fetchStaff]);

  useEffect(() => {
    const found = departments.find((d) => d.id === deptId);
    setDept(found || null);
    setChildren(departments.filter((d) => d.parentId === deptId));
  }, [departments, deptId]);

  const handleEdit = () => {
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!confirm(`确认删除部门"${dept?.name}"？其子部门也将被删除。`)) return;
    const success = await deleteDepartment(deptId);
    if (success) {
      router.push("/crm/system/departments");
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchDepartments();
  };

  if (isLoading && !dept) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!dept) {
    return (
      <div className="space-y-6">
        <Link href="/crm/system/departments" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回部门列表
        </Link>
        <EmptyState icon={<Building className="w-6 h-6" />} title="部门不存在" description="该部门可能已被删除" />
      </div>
    );
  }

  const parentDept = dept.parentId ? departments.find((d) => d.id === dept.parentId) : undefined;

  return (
    <div className="space-y-6">
      <Link href="/crm/system/departments" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回部门列表
      </Link>

      <PageHeader
        title={dept.name}
        description={dept.description || dept.name}
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleEdit}>
              <Edit2 className="w-4 h-4" />
              编辑
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
              删除
            </Button>
          </div>
        }
      />

      <Card className="!p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-slate-500">部门名称</p>
            <p className="text-slate-900">{dept.name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">上级部门</p>
            <p className="text-slate-900">{parentDept ? parentDept.name : "无（一级部门）"}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">主管</p>
            <p className="text-slate-900">{dept.managerName || "未设置"}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">状态</p>
            <p className={`text-sm ${dept.status === "active" ? "text-emerald-600" : "text-slate-400"}`}>
              {dept.status === "active" ? "启用" : "禁用"}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">成员数</p>
            <p className="text-slate-900">{dept.memberCount}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">创建时间</p>
            <p className="text-slate-900">{new Date(dept.createdAt).toLocaleDateString("zh-CN")}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-slate-500">描述</p>
            <p className="text-slate-900">{dept.description || "-"}</p>
          </div>
        </div>
      </Card>

      {/* Module Access */}
      <Card className="!p-6">
        <h3 className="font-medium text-slate-900 mb-4">可访问模块</h3>
        <div className="flex flex-wrap gap-2">
          {dept.moduleAccess.map((m) => (
            <span key={m} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
              <Shield className="w-3.5 h-3.5" />
              {m}
            </span>
          ))}
        </div>
      </Card>

      {/* Sub-departments */}
      {children.length > 0 && (
        <Card className="!p-6">
          <h3 className="font-medium text-slate-900 mb-4">子部门（{children.length}）</h3>
          <div className="space-y-2">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/crm/system/departments/${child.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{child.name}</p>
                  <p className="text-xs text-slate-500">{child.description || child.managerName ? `主管: ${child.managerName || "未设置"}` : ""}</p>
                </div>
                <span className="text-xs text-slate-400">{child.memberCount} 人</span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <DepartmentForm
        department={dept}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormSuccess}
        departments={departments}
        staff={staff}
      />
    </div>
  );
}
