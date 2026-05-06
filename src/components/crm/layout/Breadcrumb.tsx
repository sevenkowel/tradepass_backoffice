"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items = [], className }: BreadcrumbProps) {
  const pathname = usePathname();
  
  // Auto-generate breadcrumbs from pathname if not provided
  const breadcrumbs = items.length > 0 ? items : generateBreadcrumbs(pathname);

  return (
    <nav className={cn("flex items-center gap-1 text-sm", className)}>
      <Link
        href="/crm"
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4 text-gray-300" />
          {item.href && index < breadcrumbs.length - 1 ? (
            <Link
              href={item.href}
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = "";
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Skip 'backoffice' or 'crm' in path display
    if (segment === "backoffice" || segment === "crm") continue;

    // Format segment label
    const label = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    breadcrumbs.push({
      label,
      href: i < segments.length - 1 ? currentPath : undefined,
    });
  }

  return breadcrumbs;
}
