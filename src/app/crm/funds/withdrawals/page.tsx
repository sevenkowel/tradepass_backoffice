/**
 * Legacy route — v1 unified "Withdrawals" page is gone in v2.2.
 * Withdrawals split into Wallet Withdrawals (default) and Trading Withdrawals.
 */
import { permanentRedirect } from "next/navigation";
export default function WithdrawalsRedirect() {
  permanentRedirect("/crm/funds/wallet-withdrawals");
}
