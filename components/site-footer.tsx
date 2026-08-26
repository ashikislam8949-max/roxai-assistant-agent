import Link from "next/link";
import { RoxMark } from "@/components/rox-mark";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <RoxMark className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-xs text-muted-foreground">
            RoxAI — assistant agent
          </span>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-center gap-5">
          <Link
            href="/pricing"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="/chat"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Assistant
          </Link>
          <span className="font-mono text-xs text-muted-foreground">
            v0.1.0
          </span>
        </nav>
      </div>
    </footer>
  );
}
