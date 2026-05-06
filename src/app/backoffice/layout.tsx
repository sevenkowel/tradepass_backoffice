"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  LayoutDashboard,
  Users,
  KeyRound,
  CreditCard,
  ClipboardList,
  Building2,
} from "lucide-react";

const navItems = [
  { href: "/backoffice", label: "仪表盘", icon: LayoutDashboard },
  { href: "/backoffice/users", label: "用户管理", icon: Users },
  { href: "/backoffice/tenants", label: "租户管理", icon: Building2 },
  { href: "/backoffice/licenses", label: "License 管理", icon: KeyRound },
  { href: "/backoffice/billing", label: "计费管理", icon: CreditCard },
  { href: "/backoffice/audit-logs", label: "审计日志", icon: ClipboardList },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout
      navItems={navItems}
      title="Admin"
      sidebarBg="bg-slate-950"
      consoleUrl="/console"
    >
      {children}
    </DashboardLayout>
  );
}
