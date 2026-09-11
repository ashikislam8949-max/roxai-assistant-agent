"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { RoxMark } from "@/components/rox-mark";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/pricing", label: "Pricing" },
  { href: "/chat", label: "Assistant" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-4 px-4 py-4 sm:px-6 xl:px-8">
        <div className="flex flex-1 items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-controls="mobile-nav"
            aria-expanded={open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface text-secondary transition hover:bg-background hover:text-foreground lg:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              {open ? (
                <>
                  <path d="M6 6l12 12" />
                  <path d="M18 6 6 18" />
                </>
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              )}
            </svg>
          </button>

          <Link href="/" className="flex items-center gap-3 rounded-2xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <RoxMark className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">RoxAI</p>
              <p className="text-xs text-muted-foreground">Admin dashboard</p>
            </div>
          </Link>
        </div>

        <div className="hidden min-w-0 flex-[1.2] items-center gap-3 rounded-[24px] border border-border bg-surface px-4 py-3 lg:flex">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="h-5 w-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4.5 4.5" />
          </svg>
          <span className="truncate text-sm text-muted-foreground">
            Search reports, task summaries, or deployment notes
          </span>
        </div>

        <nav aria-label="Primary" className="hidden items-center gap-1 xl:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow-[0_12px_24px_rgba(140,87,255,0.24)]"
                    : "text-secondary hover:bg-surface hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-[24px] border border-border bg-surface px-3 py-2 md:flex">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M12 5a4 4 0 0 0-4 4v2.5c0 .8-.27 1.58-.76 2.2L6 15.5h12l-1.24-1.8a3.9 3.9 0 0 1-.76-2.2V9a4 4 0 0 0-4-4Z" />
                <path d="M10 18a2.3 2.3 0 0 0 4 0" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">4 alerts</p>
              <p className="text-xs text-muted-foreground">Pending triage</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-[24px] border border-border bg-surface px-3 py-2 md:flex">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Workspace style</p>
              <p className="text-xs text-muted-foreground">Light dashboard shell</p>
            </div>
          </div>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface text-secondary md:hidden">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M12 5a4 4 0 0 0-4 4v2.5c0 .8-.27 1.58-.76 2.2L6 15.5h12l-1.24-1.8a3.9 3.9 0 0 1-.76-2.2V9a4 4 0 0 0-4-4Z" />
              <path d="M10 18a2.3 2.3 0 0 0 4 0" />
            </svg>
          </div>
          <div className="flex items-center gap-3 rounded-[24px] border border-border bg-surface px-3 py-2">
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">Rox Team</p>
              <p className="text-xs text-muted-foreground">Product ops</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-sm font-semibold text-primary">
              RT
            </div>
          </div>
        </div>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 px-4 pb-4 sm:px-6 xl:px-8 lg:hidden"
        >
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-surface text-secondary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </header>
  );
}
