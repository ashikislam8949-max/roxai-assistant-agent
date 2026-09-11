import Link from "next/link";
import { RoxMark } from "@/components/rox-mark";

const capabilities = [
  ["Grounded answers", "Trace each response back to the code, configuration, and deployment context that supports it."],
  ["Reviewable changes", "Turn an investigation into a focused implementation your team can inspect before it ships."],
  ["Deployment context", "Keep the conversation tied to the environments and operational details that matter."],
];

export default function Home() {
  return (
    <div className="grid-field">
      <section className="mx-auto flex min-h-[calc(100vh-7.5rem)] w-full max-w-6xl flex-col justify-center px-4 py-20 sm:px-6 lg:py-28">
        <p className="label-mono mb-6 flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-primary" /> Engineering intelligence, on demand</p>
        <div className="grid gap-12 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
          <div>
            <h1 className="max-w-3xl text-5xl font-medium tracking-[-0.05em] text-foreground sm:text-6xl lg:text-7xl">
              An assistant that understands how your software works.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
              RoxAI helps engineering teams investigate their codebase, explain deployment behavior, and prepare changes with the context reviewers need.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/chat" className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">Open assistant</Link>
              <Link href="/pricing" className="rounded-md border border-border bg-surface px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent">View pricing</Link>
            </div>
          </div>
          <div className="border border-border bg-surface/90 p-5 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between border-b border-border pb-4"><span className="label-mono">Session status</span><span className="font-mono text-xs text-primary">READY</span></div>
            <div className="space-y-5 py-5 font-mono text-sm leading-6">
              <p className="text-muted-foreground">&gt; explain the authentication flow</p>
              <p className="text-foreground">I found the middleware, session checks, and protected route boundaries. I can walk through the request path or draft a change.</p>
            </div>
            <div className="flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground"><RoxMark className="h-4 w-4 text-primary" /> Context-aware by design</div>
          </div>
        </div>
      </section>
      <section className="border-y border-border bg-background/80">
        <div className="mx-auto grid w-full max-w-6xl divide-y divide-border px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0">
          {capabilities.map(([title, description], index) => <article key={title} className="py-8 md:px-7 md:first:pl-0 md:last:pr-0"><p className="label-mono">0{index + 1}</p><h2 className="mt-4 text-lg font-medium">{title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p></article>)}
        </div>
      </section>
    </div>
  );
}
