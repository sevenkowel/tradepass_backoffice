/**
 * Legacy v1 — Payment Channels split into Wallet Channels + Trading Channels in v2.2.
 */
import { permanentRedirect } from "next/navigation";
export default function ChannelsRedirect() {
  permanentRedirect("/crm/funds/channels/wallet");
}
