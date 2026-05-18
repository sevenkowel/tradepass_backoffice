/**
 * Legacy route — `/crm/funds/withdrawal-review` was renamed to
 * `/crm/funds/withdrawals` as part of the Funds module redesign
 * (see `docscc/产品文档/2026-05-17-funds-module-design.md`).
 *
 * This file stays as a server-side permanent redirect so any
 * bookmarks, audit-log links, or external references keep working.
 */

import { redirect, permanentRedirect } from "next/navigation";

export default function WithdrawalReviewRedirect() {
  // Use the permanent variant when available — long-term we want
  // browsers and crawlers to update their cached link to the new path.
  if (typeof permanentRedirect === "function") {
    permanentRedirect("/crm/funds/withdrawals");
  }
  redirect("/crm/funds/withdrawals");
}
