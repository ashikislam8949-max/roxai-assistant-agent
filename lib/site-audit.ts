import { parse } from "parse5";

export type AuditCategory = "SEO" | "Accessibility" | "Security" | "Age gate";
export type AuditStatus = "pass" | "attention" | "review";

export type AuditCheck = {
  category: AuditCategory;
  status: AuditStatus;
  title: string;
  detail: string;
  recommendation?: string;
};

export type AuditedPage = {
  url: string;
  httpStatus: number;
  checks: AuditCheck[];
};

export type SiteAuditReport = {
  site: string;
  completedAt: string;
  pages: AuditedPage[];
  summary: Record<AuditStatus, number>;
};

type HtmlNode = {
  nodeName: string;
  tagName?: string;
  attrs?: Array<{ name: string; value: string }>;
  childNodes?: HtmlNode[];
  value?: string;
};

const ROOT_URL = "https://sbtech.sa/";
const ALLOWED_HOSTS = new Set(["sbtech.sa", "www.sbtech.sa"]);
const MAX_PAGES = 5;
const MAX_HTML_BYTES = 1_000_000;
const PAGE_TIMEOUT_MS = 4_000;
const SKIP_TEXT_TAGS = new Set(["script", "style", "template", "noscript"]);

function attributes(node: HtmlNode) {
  return new Map((node.attrs ?? []).map(({ name, value }) => [name, value]));
}

function textContent(node: HtmlNode): string {
  if (node.tagName && SKIP_TEXT_TAGS.has(node.tagName)) return "";
  if (node.nodeName === "#text") return node.value ?? "";
  return (node.childNodes ?? []).map(textContent).join(" ");
}

function visit(node: HtmlNode, callback: (node: HtmlNode) => void) {
  const stack = [node];
  while (stack.length) {
    const current = stack.pop()!;
    callback(current);
    for (const child of current.childNodes ?? []) stack.push(child);
  }
}

function getText(node: HtmlNode) {
  return textContent(node).replace(/\s+/g, " ").trim();
}

function hasAccessibleName(node: HtmlNode) {
  const attrs = attributes(node);
  let hasImageAlternative = false;
  visit(node, (child) => {
    if (
      child.tagName === "img" &&
      attributes(child).get("alt")?.trim()
    ) {
      hasImageAlternative = true;
    }
  });
  return Boolean(
    attrs.get("aria-label")?.trim() ||
      attrs.get("aria-labelledby")?.trim() ||
      attrs.get("title")?.trim() ||
      hasImageAlternative ||
      getText(node),
  );
}

function readElementText(node: HtmlNode, tag: string) {
  const parts: string[] = [];
  visit(node, (element) => {
    if (element.tagName === tag) parts.push(getText(element));
  });
  return parts;
}

function getMetaContent(nodes: HtmlNode[], name: string) {
  const meta = nodes.find(
    (node) =>
      node.tagName === "meta" &&
      attributes(node).get("name")?.toLowerCase() === name,
  );
  return meta ? attributes(meta).get("content")?.trim() ?? "" : "";
}

function addCheck(
  checks: AuditCheck[],
  category: AuditCategory,
  status: AuditStatus,
  title: string,
  detail: string,
  recommendation?: string,
) {
  checks.push({ category, status, title, detail, recommendation });
}

function inspectHtml(url: string, httpStatus: number, response: Response, html: string) {
  const checks: AuditCheck[] = [];
  const document = parse(html) as unknown as HtmlNode;
  const nodes: HtmlNode[] = [];
  visit(document, (node) => nodes.push(node));
  const elements = nodes.filter((node) => Boolean(node.tagName));
  const title = readElementText(document, "title")[0] ?? "";
  const description = getMetaContent(elements, "description");
  const robots = getMetaContent(elements, "robots").toLowerCase();
  const canonical = elements.find((node) => {
    if (node.tagName !== "link") return false;
    const attrs = attributes(node);
    return attrs.get("rel")?.toLowerCase().split(/\s+/).includes("canonical");
  });
  const canonicalHref = canonical
    ? attributes(canonical).get("href") ?? ""
    : "";
  let canonicalSameOrigin = false;
  if (canonicalHref) {
    try {
      canonicalSameOrigin =
        new URL(canonicalHref, url).origin === new URL(url).origin;
    } catch {
      canonicalSameOrigin = false;
    }
  }
  const headings = elements
    .filter((node) => /^h[1-6]$/.test(node.tagName ?? ""))
    .map((node) => Number(node.tagName?.slice(1)));
  const h1Count = headings.filter((level) => level === 1).length;

  addCheck(
    checks,
    "Security",
    httpStatus >= 200 && httpStatus < 300 ? "pass" : "attention",
    "Public page response",
    `The page returned HTTP ${httpStatus}.`,
    "Confirm public pages return a successful response to visitors and search crawlers.",
  );
  addCheck(
    checks,
    "SEO",
    title.length >= 10 && title.length <= 70 ? "pass" : "attention",
    "Page title",
    title
      ? `Found a ${title.length}-character title.`
      : "No page title was found.",
    title
      ? "Keep the title descriptive and concise (roughly 10–70 characters)."
      : "Add a unique, descriptive <title> to the page.",
  );
  addCheck(
    checks,
    "SEO",
    description.length >= 50 && description.length <= 160
      ? "pass"
      : "attention",
    "Meta description",
    description
      ? `Found a ${description.length}-character description.`
      : "No meta description was found.",
    description
      ? "Use a clear, page-specific description (roughly 50–160 characters)."
      : "Add a concise meta description for search results.",
  );
  addCheck(
    checks,
    "SEO",
    canonicalSameOrigin ? "pass" : "attention",
    "Canonical URL",
    canonical ? "A canonical link was found." : "No canonical link was found.",
    "Set a canonical URL that points to the preferred version of this page.",
  );
  addCheck(
    checks,
    "SEO",
    h1Count === 1 ? "pass" : "attention",
    "Main heading",
    `Found ${h1Count} level-one heading${h1Count === 1 ? "" : "s"}.`,
    "Use one descriptive H1 and organize the rest of the page with nested headings.",
  );
  addCheck(
    checks,
    "SEO",
    robots.includes("noindex") ? "attention" : "pass",
    "Search indexing directive",
    robots.includes("noindex")
      ? "A robots directive asks search engines not to index this page."
      : "No noindex directive was detected.",
    "Confirm that the page's indexing directive matches your search visibility goals.",
  );

  const htmlElement = elements.find((node) => node.tagName === "html");
  const language = htmlElement ? attributes(htmlElement).get("lang") : "";
  const missingAlt = elements.filter(
    (node) =>
      node.tagName === "img" &&
      !attributes(node).has("alt") &&
      !attributes(node).get("aria-hidden"),
  ).length;
  const labels = elements.filter((node) => node.tagName === "label");
  const explicitLabels = new Set(
    labels
      .map((node) => attributes(node).get("for"))
      .filter((id): id is string => Boolean(id)),
  );
  const labelContents = new Set<HtmlNode>();
  for (const label of labels) {
    visit(label, (node) => {
      if (
        ["input", "select", "textarea"].includes(node.tagName ?? "")
      ) {
        labelContents.add(node);
      }
    });
  }
  const unlabeledControls = elements.filter((node) => {
    const tag = node.tagName;
    if (!tag || !["input", "select", "textarea"].includes(tag)) return false;
    const attrs = attributes(node);
    if (
      tag === "input" &&
      ["hidden", "submit", "button", "reset", "image"].includes(
        (attrs.get("type") ?? "text").toLowerCase(),
      )
    ) {
      return false;
    }
    if (
      attrs.get("aria-label")?.trim() ||
      attrs.get("aria-labelledby")?.trim() ||
      (attrs.get("id") && explicitLabels.has(attrs.get("id")!))
    ) {
      return false;
    }
    return !labelContents.has(node);
  }).length;
  const unnamedControls = elements.filter(
    (node) =>
      ["a", "button"].includes(node.tagName ?? "") &&
      !hasAccessibleName(node) &&
      !attributes(node).has("aria-hidden"),
  ).length;
  let previousHeading = 0;
  let skippedHeading = false;
  for (const level of headings) {
    if (previousHeading > 0 && level > previousHeading + 1) {
      skippedHeading = true;
      break;
    }
    previousHeading = level;
  }

  addCheck(
    checks,
    "Accessibility",
    language ? "pass" : "attention",
    "Document language",
    language ? `The HTML language is set to "${language}".` : "The HTML language is missing.",
    "Set the correct lang attribute on the root HTML element.",
  );
  addCheck(
    checks,
    "Accessibility",
    missingAlt === 0 ? "pass" : "attention",
    "Image alternatives",
    missingAlt
      ? `${missingAlt} image${missingAlt === 1 ? "" : "s"} lack an alt attribute.`
      : "No images missing an alt attribute were detected.",
    "Give informative images useful alternative text; use alt=\"\" for decorative images.",
  );
  addCheck(
    checks,
    "Accessibility",
    unlabeledControls === 0 ? "pass" : "attention",
    "Form labels",
    unlabeledControls
      ? `${unlabeledControls} form control${unlabeledControls === 1 ? "" : "s"} may not have an accessible label.`
      : "No unlabeled form controls were detected.",
    "Associate each form control with a visible label or accessible name.",
  );
  addCheck(
    checks,
    "Accessibility",
    unnamedControls === 0 ? "pass" : "attention",
    "Link and button names",
    unnamedControls
      ? `${unnamedControls} link or button${unnamedControls === 1 ? "" : "s"} may not have an accessible name.`
      : "No unnamed links or buttons were detected.",
    "Provide concise visible text or an accessible name for interactive controls.",
  );
  addCheck(
    checks,
    "Accessibility",
    skippedHeading ? "attention" : "pass",
    "Heading structure",
    skippedHeading
      ? "A heading level appears to be skipped."
      : "No skipped heading levels were detected.",
    "Keep heading levels in a logical order so screen-reader users can navigate sections.",
  );

  const headers = response.headers;
  const csp = headers.get("content-security-policy") ?? "";
  const frameAncestors = csp.match(/(?:^|;)\s*frame-ancestors\s+([^;]+)/i)?.[1] ?? "";
  const xFrameOptions = headers.get("x-frame-options")?.toLowerCase() ?? "";
  const framingProtected =
    /^(?:'none'|'self')(?:\s|$)/i.test(frameAncestors.trim()) ||
    ["deny", "sameorigin"].includes(xFrameOptions.trim());
  const hsts = headers.get("strict-transport-security") ?? "";
  const hstsMaxAge = Number(hsts.match(/max-age=(\d+)/i)?.[1] ?? 0);
  const referrerPolicy = headers.get("referrer-policy")?.toLowerCase() ?? "";

  addCheck(
    checks,
    "Security",
    Boolean(csp) ? "pass" : "attention",
    "Content Security Policy",
    csp ? "A Content-Security-Policy header was found." : "No Content-Security-Policy header was found.",
    "Configure a restrictive CSP that fits the site's scripts, styles, and other resources.",
  );
  addCheck(
    checks,
    "Security",
    framingProtected ? "pass" : "attention",
    "Clickjacking protection",
    framingProtected
      ? "A restrictive frame policy was detected."
      : "No restrictive frame-ancestors or X-Frame-Options policy was detected.",
    "Set CSP frame-ancestors to an intentional allowlist (often 'none' or 'self').",
  );
  addCheck(
    checks,
    "Security",
    hstsMaxAge > 0 ? "pass" : "attention",
    "HTTPS strict transport",
    hstsMaxAge > 0
      ? "A Strict-Transport-Security header with a positive max-age was found."
      : "No effective Strict-Transport-Security max-age was detected.",
    "Enable HSTS over HTTPS after confirming all relevant subdomains support HTTPS.",
  );
  addCheck(
    checks,
    "Security",
    headers.get("x-content-type-options")?.toLowerCase() === "nosniff"
      ? "pass"
      : "attention",
    "MIME sniffing protection",
    headers.get("x-content-type-options")
      ? `X-Content-Type-Options is "${headers.get("x-content-type-options")}".`
      : "X-Content-Type-Options was not found.",
    "Set X-Content-Type-Options: nosniff.",
  );
  addCheck(
    checks,
    "Security",
    Boolean(referrerPolicy) && !["unsafe-url", "no-referrer-when-downgrade"].includes(referrerPolicy)
      ? "pass"
      : "attention",
    "Referrer policy",
    referrerPolicy
      ? `Referrer-Policy is "${referrerPolicy}".`
      : "No Referrer-Policy header was found.",
    "Choose a privacy-conscious Referrer-Policy suitable for the site's needs.",
  );
  addCheck(
    checks,
    "Security",
    Boolean(headers.get("permissions-policy")) ? "pass" : "attention",
    "Permissions policy",
    headers.get("permissions-policy")
      ? "A Permissions-Policy header was found."
      : "No Permissions-Policy header was found.",
    "Disable browser capabilities the site does not need using Permissions-Policy.",
  );

  const searchableText = nodes
    .filter((node) => node.nodeName === "#text")
    .map((node) => node.value ?? "")
    .concat(
      elements.flatMap((node) => {
        const attrs = attributes(node);
        return ["aria-label", "title", "alt"].flatMap((name) => {
          const value = attrs.get(name);
          return value ? [value] : [];
        });
      }),
    )
    .join(" ")
    .toLowerCase();
  const ageGateMentioned =
    /(?:18\s*\+|18\s+years?\s+(?:old|of age)|over\s+18|age\s+(?:verification|verify|gate)|verify\s+(?:your\s+)?age|must\s+be\s+18|التحقق\s+من\s+العمر|تأكيد\s+العمر|١٨\s*(?:عام|سنة))/.test(
      searchableText,
    );
  addCheck(
    checks,
    "Age gate",
    ageGateMentioned ? "review" : "attention",
    "18+ age-gate indicator",
    ageGateMentioned
      ? "Age-related verification text was found in the sampled HTML."
      : "No recognizable 18+ age-gate text was found in the sampled HTML.",
    ageGateMentioned
      ? "Manually verify the gate blocks access before age-restricted content is shown and works for all users."
      : "Review the live site manually. This scan may miss scripted, localized, or visually rendered age gates.",
  );

  const discoveredLinks = elements
    .filter((node) => node.tagName === "a")
    .map((node) => attributes(node).get("href"))
    .filter((href): href is string => Boolean(href));

  return { page: { url, httpStatus, checks }, discoveredLinks };
}

async function readLimitedHtml(response: Response) {
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_HTML_BYTES) {
    await response.body?.cancel();
    throw new Error("The page exceeds the 1 MB scan limit.");
  }
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_HTML_BYTES) {
        await reader.cancel();
        throw new Error("The page exceeds the 1 MB scan limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function isAllowedUrl(url: URL) {
  return (
    url.protocol === "https:" &&
    ALLOWED_HOSTS.has(url.hostname.toLowerCase()) &&
    !url.username &&
    !url.password &&
    !url.port
  );
}

async function fetchPublicPage(startUrl: URL, deadline: number) {
  let url = startUrl;
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    if (!isAllowedUrl(url)) throw new Error("A redirect left the approved public site.");
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error("The audit time limit was reached.");
    const response = await fetch(url, {
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(Math.min(PAGE_TIMEOUT_MS, remaining)),
      headers: {
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
        "user-agent": "RoxAI-Public-Site-Audit/1.0",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) throw new Error("The page returned a redirect without a location.");
      if (redirects === 3) throw new Error("The page exceeded the redirect limit.");
      url = new URL(location, url);
      continue;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) {
      await response.body?.cancel();
      throw new Error("The URL did not return an HTML page.");
    }
    const html = await readLimitedHtml(response);
    return { response, html, url };
  }
  throw new Error("The page could not be fetched.");
}

export async function auditSbtechPublicSite(): Promise<SiteAuditReport> {
  const deadline = Date.now() + 23_000;
  const queue = [new URL(ROOT_URL)];
  const visited = new Set<string>();
  const pages: AuditedPage[] = [];

  while (queue.length && pages.length < MAX_PAGES && Date.now() < deadline) {
    const url = queue.shift()!;
    const key = `${url.origin}${url.pathname}`;
    if (visited.has(key)) continue;
    visited.add(key);

    try {
      const { response, html, url: finalUrl } = await fetchPublicPage(url, deadline);
      const { page, discoveredLinks } = inspectHtml(
        finalUrl.toString(),
        response.status,
        response,
        html,
      );
      pages.push(page);

      for (const href of discoveredLinks) {
        if (pages.length + queue.length >= MAX_PAGES) break;
        try {
          const link = new URL(href, finalUrl);
          link.hash = "";
          link.search = "";
          if (isAllowedUrl(link)) {
            const linkKey = `${link.origin}${link.pathname}`;
            if (!visited.has(linkKey)) queue.push(link);
          }
        } catch {
          continue;
        }
      }
    } catch (error) {
      pages.push({
        url: url.toString(),
        httpStatus: 0,
        checks: [
          {
            category: "Security",
            status: "attention",
            title: "Page could not be audited",
            detail:
              error instanceof Error
                ? error.message
                : "The public page could not be fetched.",
            recommendation:
              "Check that the public page is reachable and serves HTML over HTTPS.",
          },
        ],
      });
    }
  }

  if (!pages.length) {
    pages.push({
      url: ROOT_URL,
      httpStatus: 0,
      checks: [
        {
          category: "Security",
          status: "attention",
          title: "Audit time limit reached",
          detail: "No pages could be scanned before the time limit.",
          recommendation: "Try again when the public site is responding normally.",
        },
      ],
    });
  }

  const summary: SiteAuditReport["summary"] = {
    pass: 0,
    attention: 0,
    review: 0,
  };
  for (const page of pages) {
    for (const check of page.checks) summary[check.status] += 1;
  }

  return {
    site: "sbtech.sa",
    completedAt: new Date().toISOString(),
    pages,
    summary,
  };
}
