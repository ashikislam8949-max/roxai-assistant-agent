"use client";

import { useState } from "react";
import type {
  AuditCategory,
  AuditCheck,
  AuditStatus,
  SiteAuditReport,
} from "@/lib/site-audit";

const categories: AuditCategory[] = [
  "SEO",
  "Accessibility",
  "Security",
  "Age gate",
];

const statusLabels: Record<AuditStatus, string> = {
  pass: "Looks good",
  attention: "Check this",
  review: "Manual review",
};

function StatusBadge({ status }: { status: AuditStatus }) {
  const style =
    status === "pass"
      ? "border-primary/40 text-primary"
      : status === "review"
        ? "border-border text-foreground"
        : "border-destructive/40 text-destructive";
  return (
    <span className={`rounded-full border px-2 py-1 text-xs ${style}`}>
      {statusLabels[status]}
    </span>
  );
}

function AuditResult({ check }: { check: AuditCheck }) {
  return (
    <li className="flex flex-col gap-3 border-t border-border py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-2xl">
        <h3 className="text-sm font-medium">{check.title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {check.detail}
        </p>
        {check.recommendation ? (
          <p className="mt-2 text-sm leading-6 text-foreground">
            Suggestion: {check.recommendation}
          </p>
        ) : null}
      </div>
      <StatusBadge status={check.status} />
    </li>
  );
}

export function SiteAudit() {
  const [report, setReport] = useState<SiteAuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAudit() {
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const result = (await response.json()) as
        | SiteAuditReport
        | { error?: string };
      if (!response.ok) {
        throw new Error(
          "error" in result && result.error
            ? result.error
            : "The audit could not be completed.",
        );
      }
      setReport(result as SiteAuditReport);
    } catch (auditError) {
      setError(
        auditError instanceof Error
          ? auditError.message
          : "The audit could not be completed. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      <p className="label-mono">Private tools</p>
      <h1 className="mt-3 text-3xl font-medium tracking-tight">
        Public site audit
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Check publicly reachable pages on sbtech.sa for basic SEO,
        accessibility, security-header, and age-gate indicators. The scan
        follows same-site links from the home page and checks up to five pages.
      </p>
      <button
        type="button"
        onClick={() => void runAudit()}
        disabled={loading}
        className="mt-6 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
      >
        {loading ? "Auditing public pages…" : "Run audit for sbtech.sa"}
      </button>

      <p className="mt-4 max-w-3xl text-xs leading-5 text-muted-foreground">
        Read-only and limited to public HTTPS pages on sbtech.sa. This is a
        heuristic review, not a full accessibility, security, or legal
        compliance assessment. In particular, detected age-gate text does not
        prove that age verification blocks restricted content.
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      {report ? (
        <div className="mt-8">
          <div className="grid gap-3 sm:grid-cols-3">
            {(["attention", "review", "pass"] as const).map((status) => (
              <div
                key={status}
                className="border border-border bg-surface p-4"
              >
                <p className="label-mono">{statusLabels[status]}</p>
                <p className="mt-2 text-2xl font-medium">
                  {report.summary[status]}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Scanned {report.pages.length} page
            {report.pages.length === 1 ? "" : "s"} · Completed{" "}
            {new Date(report.completedAt).toLocaleString()}
          </p>

          <div className="mt-6 space-y-5">
            {report.pages.map((page) => (
              <article
                key={page.url}
                className="border border-border bg-surface p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="break-all font-mono text-sm">
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-border underline-offset-4 hover:text-primary"
                    >
                      {page.url}
                    </a>
                  </h2>
                  <span className="label-mono">
                    {page.httpStatus ? `HTTP ${page.httpStatus}` : "Unavailable"}
                  </span>
                </div>
                {categories.map((category) => {
                  const checks = page.checks.filter(
                    (check) => check.category === category,
                  );
                  if (!checks.length) return null;
                  return (
                    <section key={category} className="mt-5">
                      <h3 className="label-mono">{category}</h3>
                      <ul className="mt-2">
                        {checks.map((check) => (
                          <AuditResult key={check.title} check={check} />
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
