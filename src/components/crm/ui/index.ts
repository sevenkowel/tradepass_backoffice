// Single barrel for CRM-flavored UI components.
//
// Anything in this file that simply re-exports from `@/components/ui`
// is here so existing call sites like
//   import { Button, Card, EmptyState } from "@/components/crm/ui";
// keep working. New code should prefer the canonical path
// `@/components/ui` for primitives, and reserve this barrel for
// CRM-specific components (badges, page header, table, drawer, etc.).

// CRM-specific
export { PageHeader } from "./PageHeader";
export { StatusBadge, LevelBadge, TypeBadge } from "./StatusBadge";
export { Drawer, DrawerFooter } from "./Drawer";
export { FilterBar } from "./FilterBar";
export { EnhancedDataTable, type Column, type RowAction } from "./EnhancedDataTable";
export { PlaceholderPage } from "./PlaceholderPage";
export { LoadingState } from "./LoadingState";
export { BadgeBase, type BadgeTone } from "./BadgeBase";
export { RiskBadge } from "./RiskBadge";
export { KYCStatusBadge } from "./KYCStatusBadge";
export { CaseTypeBadge } from "./CaseTypeBadge";
export { SLABadge } from "./SLABadge";
export { AMLStatusBadge } from "./AMLStatusBadge";

// Re-exports — single source of truth lives in `@/components/ui`
export { Button, type ButtonProps } from "@/components/ui/Button";
export { EmptyState } from "@/components/ui/EmptyState";

// Backward-compatible Card wrapper (keeps `padding` prop API). For granular
// CardHeader/CardTitle/CardContent, import from `@/components/ui/card`.
export { Card } from "./CardCompat";
