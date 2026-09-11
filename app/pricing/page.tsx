import Link from "next/link";

type Plan = {
  name: string;
  price: string;
  description: string;
  features: readonly string[];
  highlighted?: boolean;
};

const plans = [
  {
    name: "Starter",
    price: "$0",
    description: "For smaller teams validating an assistant-led engineering workflow.",
    features: [
      "Dashboard workspace",
      "Streaming assistant sessions",
      "Bring your AI Gateway key",
    ],
  },
  {
    name: "Team",
    price: "$29",
    description: "For delivery teams that need shared context and review-ready outputs.",
    features: [
      "Everything in Starter",
      "Cross-project knowledge panels",
      "Rollout and review summaries",
    ],
    highlighted: true,
  },
  {
    name: "Scale",
    price: "$79",
    description: "For larger organizations standardizing investigations and release prep.",
    features: [
      "Program-level reporting",
      "Priority support",
      "Workflow analytics exports",
    ],
  },
] satisfies ReadonlyArray<Plan>;

export default function PricingPage() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 xl:px-8">
      <div className="rounded-[32px] border border-border bg-surface px-6 py-8 shadow-sm sm:px-8">
        <p className="label-mono text-primary">Pricing</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
          Choose the RoxAI workspace that fits your team.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          The package layout follows the same dashboard language as the reference:
          clear cards, soft surfaces, and product details kept close to the actions.
        </p>

        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-[28px] border p-6 shadow-sm ${
                plan.highlighted
                  ? "border-primary bg-[linear-gradient(180deg,#f7f2ff_0%,#ffffff_100%)]"
                  : "border-border bg-background"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">{plan.name}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {plan.description}
                  </p>
                </div>
                {plan.highlighted ? (
                  <span className="rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold text-primary">
                    Popular
                  </span>
                ) : null}
              </div>

              <p className="mt-8 text-4xl font-semibold tracking-[-0.03em] text-foreground">
                {plan.price}
                <span className="ml-1 text-sm font-medium text-muted-foreground">/ seat</span>
              </p>

              <ul className="mt-8 space-y-3 text-sm text-secondary">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/chat"
                className={`mt-8 inline-flex rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  plan.highlighted
                    ? "bg-primary text-primary-foreground shadow-[0_12px_24px_rgba(140,87,255,0.24)] hover:opacity-90"
                    : "border border-border bg-surface text-foreground hover:bg-muted"
                }`}
              >
                Start with {plan.name}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
