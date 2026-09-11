import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/80 bg-transparent">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 xl:px-8">
        <p>© 2026 RoxAI. Dashboard workspace for engineering teams.</p>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-4">
          <Link href="/" className="transition hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/pricing" className="transition hover:text-foreground">
            Pricing
          </Link>
          <Link href="/chat" className="transition hover:text-foreground">
            Assistant
          </Link>
        </nav>
      </div>
    </footer>
  );
}
