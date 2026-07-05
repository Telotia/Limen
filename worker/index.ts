/**
 * Telotia site Worker.
 *
 * The Astro `dist/` build is served automatically by the `assets` binding, so
 * this script only runs for requests that don't match a static file. The one
 * dynamic route is the pilot-request intake:
 *
 *   POST /api/pilot  ->  verify Cloudflare Turnstile, then log + store + notify
 *
 * No Cloudflare Workers type package is needed; the few runtime shapes we touch
 * are declared inline so the file builds with zero extra dependencies.
 */

interface KVNamespace {
  put(key: string, value: string): Promise<void>;
}
interface AssetFetcher {
  fetch(request: Request): Promise<Response>;
}
interface ExecutionCtx {
  waitUntil(promise: Promise<unknown>): void;
}

interface Env {
  /** Static assets (the Astro dist/ build). */
  ASSETS: AssetFetcher;
  /** Optional durable sink for leads. Enable via kv_namespaces in wrangler.jsonc. */
  PILOT_LEADS?: KVNamespace;
  /** Turnstile secret: `wrangler secret put TURNSTILE_SECRET`. Falls back to the always-pass test secret. */
  TURNSTILE_SECRET?: string;
  /** Resend API key: `wrangler secret put RESEND_API_KEY`. Email notify is skipped when absent. */
  RESEND_API_KEY?: string;
  PILOT_NOTIFY_TO?: string;
  PILOT_NOTIFY_FROM?: string;
}

// Cloudflare's documented "always passes" test secret — lets the endpoint work
// end-to-end before a real Turnstile widget + secret are provisioned.
const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA";

interface Lead {
  name: string;
  email: string;
  organization: string;
  evidence: string;
  ip: string;
  ua: string;
  hostname: string;
  ts: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionCtx): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/pilot") {
      if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);
      return handlePilot(request, env, ctx);
    }
    // Anything else that reaches the Worker: hand back to static assets.
    return env.ASSETS.fetch(request);
  },
};

async function handlePilot(request: Request, env: Env, ctx: ExecutionCtx): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "Could not read the form." }, 400);
  }

  // Honeypot: a hidden field people never see. If it's filled, it's a bot —
  // accept silently so the bot can't tell it was caught, but drop the lead.
  if (text(form.get("company_url"))) return json({ ok: true });

  const name = clip(form.get("name"), 200);
  const email = clip(form.get("email"), 200);
  const organization = clip(form.get("organization"), 200);
  const evidence = clip(form.get("evidence"), 2000);
  const token = text(form.get("cf-turnstile-response"));

  if (!name || !email) return json({ ok: false, error: "Name and work email are required." }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ ok: false, error: "Please enter a valid email address." }, 400);
  }
  if (!token) return json({ ok: false, error: "Please complete the human-verification check." }, 400);

  const secret = env.TURNSTILE_SECRET || TURNSTILE_TEST_SECRET;
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const verdict = await verifyTurnstile(token, secret, ip);
  if (!verdict.success) return json({ ok: false, error: "Verification failed. Please try again." }, 400);

  const lead: Lead = {
    name,
    email,
    organization,
    evidence,
    ip,
    ua: request.headers.get("User-Agent") || "",
    hostname: verdict.hostname || "",
    ts: new Date().toISOString(),
  };

  // Always log — a last-resort record (visible in `wrangler tail`) even before
  // KV storage or email notification are configured.
  console.log("pilot-lead", JSON.stringify(lead));

  if (env.PILOT_LEADS) {
    try {
      await env.PILOT_LEADS.put(`lead:${lead.ts}:${crypto.randomUUID()}`, JSON.stringify(lead));
    } catch (err) {
      console.error("kv-put-failed", String(err));
    }
  }

  if (env.RESEND_API_KEY) {
    ctx.waitUntil(notify(env, lead));
  }

  return json({ ok: true });
}

interface TurnstileVerdict {
  success: boolean;
  hostname?: string;
}

async function verifyTurnstile(token: string, secret: string, ip: string): Promise<TurnstileVerdict> {
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    if (!res.ok) return { success: false };
    return (await res.json()) as TurnstileVerdict;
  } catch {
    return { success: false };
  }
}

async function notify(env: Env, lead: Lead): Promise<void> {
  const to = env.PILOT_NOTIFY_TO || "hello@telotia.com";
  const from = env.PILOT_NOTIFY_FROM || "Telotia pilot <onboarding@resend.dev>";
  const subject = `Pilot request — ${lead.name}${lead.organization ? ` (${lead.organization})` : ""}`;
  const body = [
    "New pilot request",
    "",
    `Name:         ${lead.name}`,
    `Work email:   ${lead.email}`,
    `Organization: ${lead.organization || "—"}`,
    `Validating:   ${lead.evidence || "—"}`,
    "",
    `Received:     ${lead.ts}`,
    `IP:           ${lead.ip}`,
    `Hostname:     ${lead.hostname}`,
  ].join("\n");
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, text: body, reply_to: lead.email }),
    });
  } catch (err) {
    console.error("resend-failed", String(err));
  }
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}
function clip(value: unknown, max: number): string {
  return text(value).trim().slice(0, max);
}
