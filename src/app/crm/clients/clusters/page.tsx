/**
 * /crm/clients/clusters — redirect shim (Phase 4).
 *
 * The standalone clusters page was consolidated into `Relationships`
 * with a `?view=clusters` toggle (see `src/app/crm/clients/relationships/page.tsx`).
 * Anyone hitting the old path is silently 308-redirected to the new
 * URL so existing bookmarks / sidebar history keep working.
 */

import { redirect } from "next/navigation";

export default function ClustersRedirect() {
  redirect("/crm/clients/relationships?view=clusters");
}
