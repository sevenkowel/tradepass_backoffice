import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { MockProvider } from "@/components/providers/MockProvider";

export const metadata: Metadata = {
  title: "TradePass - The Operating System for Modern Brokers",
  description: "Launch, operate, and scale your brokerage with a unified trading infrastructure and growth platform. TradePass combines trading technology, broker management, and automated growth tools into one platform.",
  keywords: "forex broker, trading platform, broker solution, margin trading, CFD broker, white label, broker software",
  openGraph: {
    title: "TradePass - The Operating System for Modern Brokers",
    description: "Launch, operate, and scale your brokerage with a unified trading infrastructure and growth platform.",
    type: "website",
    locale: "en_US",
    siteName: "TradePass",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <MockProvider>
            {children}
          </MockProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}