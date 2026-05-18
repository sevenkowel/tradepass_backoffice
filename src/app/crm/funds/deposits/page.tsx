/**
 * Legacy route — v1 unified "Deposits" page is gone in v2.2.
 * Deposits split into Wallet Deposits (default) and Trading Deposits.
 * Bookmarks resolve to Wallet Deposits (the common case).
 */
import { permanentRedirect } from "next/navigation";
export default function DepositsRedirect() {
  permanentRedirect("/crm/funds/wallet-deposits");
}
