import { DevConfigProvider } from "@/lib/dev-config";
import { FloatingDevToolbox } from "@/components/dev-tools/FloatingDevToolbox";

export default function AuthPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DevConfigProvider>
      {children}
      <FloatingDevToolbox />
    </DevConfigProvider>
  );
}
