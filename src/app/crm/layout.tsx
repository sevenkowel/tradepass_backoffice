// CRM Layout - Demo Mode (完全开放)

import ClientLayout from "./ClientLayout";

export async function generateMetadata() {
  return {
    title: {
      template: `%s | TradePass CRM`,
      default: "TradePass CRM",
    },
    description: "TradePass CRM - Manage your brokerage operations.",
  };
}

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}
