import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: {
    default: "RoxAI — the assistant agent for engineering teams",
    template: "%s — RoxAI",
  },
  description:
    "RoxAI is an AI assistant agent that reads your codebase, answers questions with citations, and drafts changes your team can review.",
  openGraph: {
    title: "RoxAI — the assistant agent for engineering teams",
    description:
      "An AI assistant agent that reads your codebase, answers with citations, and drafts reviewable changes.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f5fa",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full bg-background antialiased">
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
