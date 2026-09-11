import Link from "next/link";

type NavItem = {
  label: string;
  active?: boolean;
};

const navSections = [
  {
    title: "Dashboards",
    items: [
      { label: "CRM", active: true },
      { label: "Analytics" },
      { label: "Ecommerce" },
    ],
  },
  {
    title: "Apps",
    items: [{ label: "Email" }, { label: "Chat" }, { label: "Calendar" }],
  },
  {
    title: "Pages",
    items: [{ label: "User Profile" }, { label: "Invoice" }, { label: "Settings" }],
  },
] satisfies ReadonlyArray<{ title: string; items: ReadonlyArray<NavItem> }>;

const metricCards = [
  {
    title: "Sessions",
    value: "24.8k",
    trend: "+18.2%",
    detail: "Assistant conversations this month",
    tone: "from-violet-500 to-fuchsia-500",
  },
  {
    title: "Resolved tasks",
    value: "1,284",
    trend: "+12.4%",
    detail: "Review-ready engineering requests",
    tone: "from-sky-500 to-cyan-500",
  },
  {
    title: "Team satisfaction",
    value: "4.8/5",
    trend: "+0.6",
    detail: "Average internal handoff rating",
    tone: "from-emerald-500 to-teal-500",
  },
] as const;

const timeline = [
  {
    title: "Investigated auth latency",
    time: "09:24",
    detail: "Linked the issue to an upstream session refresh retry.",
  },
  {
    title: "Prepared rollout checklist",
    time: "11:10",
    detail: "Captured release gates for the billing webhook update.",
  },
  {
    title: "Drafted code review notes",
    time: "13:45",
    detail: "Summarized test coverage gaps before merging.",
  },
] as const;

const activityBars = [64, 82, 58, 92, 76, 88, 68];

export default function Home() {
  return (
    <div className="dashboard-shell mx-auto flex w-full max-w-[1440px] flex-1 gap-6 px-4 py-6 sm:px-6 xl:px-8">
      <aside className="dashboard-sidebar hidden w-72 shrink-0 flex-col rounded-[28px] border border-border bg-surface px-5 py-6 shadow-sm lg:flex">
        <div>
          <p className="label-mono text-primary">Materio-inspired</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">
            RoxAI Workspace
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            A dashboard shell for engineering investigations, release prep, and
            review-ready changes.
          </p>
        </div>

        <nav aria-label="Dashboard navigation" className="mt-8 space-y-7">
          {navSections.map((section) => (
            <section key={section.title}>
              <p className="label-mono">{section.title}</p>
              <div className="mt-3 space-y-1.5">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                      item.active
                        ? "bg-primary text-primary-foreground shadow-[0_14px_30px_rgba(140,87,255,0.28)]"
                        : "text-secondary hover:bg-background hover:text-foreground"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-xs opacity-70">›</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </nav>

        <div className="mt-auto rounded-[24px] bg-[linear-gradient(135deg,#8c57ff_0%,#c3adff_100%)] p-5 text-primary-foreground shadow-[0_16px_36px_rgba(140,87,255,0.3)]">
          <p className="label-mono !text-primary-foreground/75">Need a draft?</p>
          <h2 className="mt-3 text-lg font-semibold">Open the assistant workspace</h2>
          <p className="mt-2 text-sm leading-6 text-primary-foreground/85">
            Move from investigation to implementation without leaving the dashboard.
          </p>
          <Link
            href="/chat"
            className="mt-5 inline-flex rounded-2xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-white/20"
          >
            Launch assistant
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-6">
        <section className="rounded-[28px] border border-border bg-surface px-6 py-6 shadow-sm sm:px-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="label-mono text-primary">CRM dashboard</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                An operations dashboard for engineering delivery and assistant-led workflows.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                Monitor engineering workflows, keep release context visible, and jump
                straight into the assistant when a card needs investigation.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/chat"
                className="inline-flex rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_14px_28px_rgba(140,87,255,0.24)] transition hover:opacity-90"
              >
                Create investigation
              </Link>
              <Link
                href="/pricing"
                className="inline-flex rounded-2xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                Review plans
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          {metricCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[24px] border border-border bg-surface p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-secondary">{card.title}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground">
                    {card.value}
                  </p>
                </div>
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone} text-lg font-semibold text-white`}
                >
                  •
                </span>
              </div>
              <p className="mt-4 text-sm text-emerald-600">{card.trend}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-5 2xl:grid-cols-[1.7fr_1fr]">
          <article className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium text-secondary">Revenue report</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                  Engineering impact across the last 7 days
                </h3>
              </div>
              <div className="rounded-2xl bg-background px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Total change value
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">$84.2k</p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
              <div className="rounded-[24px] bg-background p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-secondary">Activity overview</p>
                  <p className="text-sm text-primary">+24.6%</p>
                </div>
                <svg
                  viewBox="0 0 640 260"
                  className="mt-6 h-64 w-full"
                  aria-label="Weekly dashboard line chart"
                >
                  <defs>
                    <linearGradient id="dashboard-line" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8c57ff" />
                      <stop offset="100%" stopColor="#56cfe1" />
                    </linearGradient>
                  </defs>
                  {[40, 90, 140, 190, 240].map((line) => (
                    <line
                      key={line}
                      x1="0"
                      y1={line}
                      x2="640"
                      y2={line}
                      stroke="#ececf3"
                      strokeDasharray="6 10"
                    />
                  ))}
                  <path
                    d="M20 205 C80 180, 120 92, 170 116 S270 226, 330 182 S430 62, 490 98 S580 164, 620 124"
                    fill="none"
                    stroke="url(#dashboard-line)"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <path
                    d="M20 224 C80 205, 120 138, 170 150 S270 232, 330 218 S430 114, 490 132 S580 198, 620 174"
                    fill="none"
                    stroke="#d9d4f8"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="space-y-4">
                <div className="rounded-[24px] bg-background p-5">
                  <p className="text-sm font-medium text-secondary">Sales overview</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">76%</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Assisted delivery rate for changes opened from investigations.
                  </p>
                </div>
                <div className="rounded-[24px] bg-background p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-secondary">Weekly volume</p>
                    <p className="text-sm text-primary">7 days</p>
                  </div>
                  <div className="mt-5 flex h-28 items-end gap-2">
                    {activityBars.map((height, index) => (
                      <div
                        key={height}
                        className={`flex-1 rounded-t-2xl ${
                          index === 5 ? "bg-primary" : "bg-primary/20"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </article>

          <div className="space-y-5">
            <article className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
              <p className="text-sm font-medium text-secondary">Project milestone</p>
              <h3 className="mt-3 text-xl font-semibold text-foreground">
                Dashboard migration
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Replace the existing marketing shell with a reference-inspired admin
                experience for RoxAI.
              </p>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-background">
                <div className="h-full w-[72%] rounded-full bg-primary" />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>72% complete</span>
                <span>Design system refresh</span>
              </div>
            </article>

            <article className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
              <p className="text-sm font-medium text-secondary">Team notes</p>
              <div className="mt-5 space-y-4">
                {timeline.map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-primary" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
