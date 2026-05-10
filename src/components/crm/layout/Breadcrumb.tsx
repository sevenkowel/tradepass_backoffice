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
    // Breadcrumb doubles as the page heading: ancestor crumbs render as
    // small grey links, the current page renders as a real <h1> at
    // text-lg so it carries both the navigation path and the page
    // title in a single line. Page-level `<PageHeader>` no longer
    // renders its own H1 to avoid duplication.
    <nav className={cn("flex items-center gap-1.5 mb-2", className)} aria-label="Breadcrumb">
      <Link
        href="/crm"
        className="text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Home"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <div key={index} className="flex items-center gap-1.5 min-w-0">
            <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
            {!isLast && item.href ? (
              <Link
                href={item.href}
                className="text-xs text-slate-500 hover:text-slate-700 transition-colors truncate"
              >
                {item.label}
              </Link>
            ) : isLast ? (
              <h1
                className="text-lg font-semibold text-slate-900 tracking-tight truncate"
                aria-current="page"
              >
                {item.label}
              </h1>
            ) : (
              <span className="text-xs text-slate-500 truncate">{item.label}</span>
            )}
          </div>
        );
      })}
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
