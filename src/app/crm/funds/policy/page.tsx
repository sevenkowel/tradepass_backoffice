/**
 * Legacy route — `/crm/funds/policy` was a placeholder. The full
 * Policies & Limits cockpit now lives at `/crm/funds/policies`.
 *
 * This file stays as a permanent redirect so any existing bookmarks
 * or audit-log links don't 404.
 */

import { redirect, permanentRedirect } from "next/navigation";

export default function FundsPolicyRedirect() {
  if (typeof permanentRedirect === "function") {
    permanentRedirect("/crm/funds/policies");
  }
  redirect("/crm/funds/policies");
}
