import { redirect } from "next/navigation";

/** /crm/approvals → /crm/approvals/inbox
 *
 * The Inbox is the v2 entry point for the Approval Center; the old
 * Workspace redirect was retired along with the page itself.
 * See docs/Approval-Center-v2-Architecture.md.
 */
export default function ApprovalsRootPage() {
  redirect("/crm/approvals/inbox");
}
