// Markdown-for-AI Edge Function
// ──────────────────────────────────────────────────────────────────────────────
// When an AI agent (or any client that asks for Markdown) sends
// `Accept: text/markdown`, this edge function fetches the regular HTML
// response from the origin, strips non-content elements, converts what's
// left to Markdown using Turndown, and returns the result. For everything
// else it passes through to the origin unchanged.
//
// Why: serving Markdown is roughly ~80% smaller (token-wise) than the
// rendered HTML SPA shell, so AI crawlers and agents that consume this
// site can do so without burning through their context window.
//
// Test it (deployed):
//   curl -H "Accept: text/markdown" https://acmvp.netlify.app/checkin
//   curl -H "Accept: text/markdown" https://acmvp.netlify.app/legal
//
// Test it locally with `netlify dev` (port 8888):
//   netlify dev
//   curl -H "Accept: text/markdown" http://localhost:8888/checkin
//
// Add or remove paths from the edge function scope:
//   Edit `netlify.toml` under the `[[edge_functions]]` blocks at the bottom.
//   Each block has `path = "/some/path"` (or `pattern = "/regex/"` for
//   wildcards) and `function = "markdown"`. To exclude a path entirely,
//   either remove its block or add the path to the `EXCLUDED_PATHS` set
//   below, which is checked first.
// ──────────────────────────────────────────────────────────────────────────────

import TurndownService from "https://esm.sh/turndown@7.2.0";
import type { Config, Context } from "https://edge.netlify.com";

// Paths that must always pass through to the origin even if they would
// otherwise match a configured edge route. Add to this list if you need
// to exclude something quickly without redeploying netlify.toml.
const EXCLUDED_PATHS: ReadonlySet<string> = new Set<string>([
  // {{EXCLUDED_PATHS}}
]);

// HTML elements that are pure chrome / don't carry meaningful content.
// Stripped before Markdown conversion.
const STRIP_TAGS = [
  "script",
  "style",
  "noscript",
  "nav",
  "footer",
  "header",
  "aside",
  "form",
  "iframe",
  "svg",
  "link",
  "meta",
];

// Common selectors used by SPA shells, blogs and doc sites for sidebars,
// menus, sponsor widgets, cookie banners, etc. Conservative — we'd rather
// keep too much than strip a content paragraph.
const STRIP_SELECTORS = [
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
  '[role="complementary"]',
  ".sidebar",
  ".nav",
  ".navbar",
  ".menu",
  ".drawer",
  ".cookie-banner",
  ".ac-drawer",
  ".ac-top",
  ".ac-scrim",
  ".ac-sponsor-ribbon",
];

function stripBoilerplate(html: string): string {
  let out = html;

  for (const tag of STRIP_TAGS) {
    const re = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}>`, "gi");
    out = out.replace(re, "");
    const selfClosing = new RegExp(`<${tag}\\b[^>]*/?>`, "gi");
    out = out.replace(selfClosing, "");
  }

  for (const sel of STRIP_SELECTORS) {
    const className = sel.startsWith(".") ? sel.slice(1) : null;
    if (className) {
      const re = new RegExp(
        `<(div|section|aside|header|footer|nav)\\b[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>[\\s\\S]*?</\\1>`,
        "gi",
      );
      out = out.replace(re, "");
    }
  }

  out = out.replace(/<!--[\s\S]*?-->/g, "");

  return out;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export default async function markdown(
  request: Request,
  context: Context,
): Promise<Response> {
  const accept = request.headers.get("accept") || "";
  const url = new URL(request.url);

  if (!accept.toLowerCase().includes("text/markdown")) {
    return context.next();
  }

  if (EXCLUDED_PATHS.has(url.pathname)) {
    return context.next();
  }

  let originResponse: Response;
  try {
    originResponse = await context.next();
  } catch (err) {
    console.error("[markdown] origin fetch failed:", err);
    return context.next();
  }

  const contentType = originResponse.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("text/html")) {
    return originResponse;
  }

  try {
    const html = await originResponse.clone().text();
    const cleaned = stripBoilerplate(html);

    const turndown = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
      emDelimiter: "_",
    });

    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || url.pathname;

    let md = turndown.turndown(cleaned).trim();
    md = md.replace(/\n{3,}/g, "\n\n");

    const body = `# ${title}\n\n_Source: ${url.pathname}_\n\n${md}\n`;

    return new Response(body, {
      status: originResponse.status,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "X-Markdown-Tokens": String(estimateTokens(body)),
        "Content-Signal": "ai-train=yes, search=yes, ai-input=yes",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    console.error("[markdown] conversion failed, falling back to HTML:", err);
    return originResponse;
  }
}

export const config: Config = {
  // Routes are configured in netlify.toml so they can be edited without
  // touching this file. The block below is a defensive fallback so the
  // function still runs on the home page even if the toml is wiped.
  path: "/",
};
