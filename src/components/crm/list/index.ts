/**
 * Barrel for the CRM list-page primitive components.
 *
 * Reference doc: `docs/ui/list-page-spec.md`.
 *
 * Pages compose these instead of re-implementing search / filter /
 * pagination chrome inline:
 *
 *   ListPageShell      → outer wrapper + breadcrumb + error banner
 *   ListStatsGrid      → clickable KPI cards
 *   ListToolbar        → search + chips + advanced filter + primary CTA
 *   TablePagination    → bottom-of-table pagination
 *
 * Table chrome itself stays in `@/components/crm/ui/EnhancedDataTable`.
 */

export { ListPageShell } from "./ListPageShell";
export { ListStatsGrid, type StatCardDef } from "./ListStatsGrid";
export { ListToolbar, type QuickChipDef } from "./ListToolbar";
export { TablePagination } from "./TablePagination";
export { AdvancedFilterDrawer, type AdvancedField } from "./AdvancedFilterDrawer";
