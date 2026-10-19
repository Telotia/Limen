import { closedPreview, isPrivatePreview } from './private-preview';

export interface PreviewAuthEnv {
  ENVIRONMENT?: string;
  ASSETS: { fetch(request: Request): Promise<Response> };
  PREVIEW_GITHUB_CLIENT_ID?: string;
  PREVIEW_GITHUB_CLIENT_SECRET?: string;
  PREVIEW_SESSION_SECRET?: string;
}
const ORIGIN = 'https://dev.telotia.com';
const ROOT = '/auth/task-preview';
const CALLBACK = ORIGIN + ROOT + '/callback';
const PREVIEW = '/preview/task-loop';
const REPOSITORY = 'Telotia/Telotia';
const SESSION = '__Host-telotia-preview';
const FLOW = '__Host-telotia-preview-flow';
const encoder = new TextEncoder();
const headers = {
  'Cache-Control': 'private, no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Cloudflare-CDN-Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow, nosnippet',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};
type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type Payload = { kind: 'flow'; state: string; verifier: string; exp: number } |
  { kind: 'session'; token: string; exp: number };
const now = () => Math.floor(Date.now() / 1000);
const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
function decode(value: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid encoding');
  return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));
}
const random = () => encode(crypto.getRandomValues(new Uint8Array(32)));
async function key(secret: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function seal(payload: Payload, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(ORIGIN + ':' + payload.kind) }, await key(secret), encoder.encode(JSON.stringify(payload)));
  return encode(iv) + '.' + encode(new Uint8Array(ciphertext));
}
async function open(value: string | undefined, secret: string, kind: Payload['kind']): Promise<Payload | null> {
  if (!value || value.length > 4096) return null;
  try {
    const parts = value.split('.');
    if (parts.length !== 2) return null;
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(parts[0]), additionalData: encoder.encode(ORIGIN + ':' + kind) }, await key(secret), decode(parts[1]));
    const payload = JSON.parse(new TextDecoder().decode(plain)) as Payload;
    if (payload.kind !== kind || !Number.isSafeInteger(payload.exp) || payload.exp <= now()) return null;
    return payload;
  } catch { return null; }
}
function readCookie(request: Request, name: string) {
  const matches = (request.headers.get('Cookie') || '').split(';').map(s => s.trim()).filter(s => s.startsWith(name + '='));
  return matches.length === 1 ? matches[0].slice(name.length + 1) : undefined;
}
function cookie(name: string, value = '', age = 0) {
  return `${name}=${value}; Path=/; Max-Age=${age}; Secure; HttpOnly; SameSite=Lax`;
}
function response(body: BodyInit | null, status: number, cookies: string[] = [], extra: Record<string, string> = {}) {
  const h = new Headers({ ...headers, ...extra });
  cookies.forEach(c => h.append('Set-Cookie', c));
  return new Response(body, { status, headers: h });
}
const redirect = (location: string, cookies: string[] = []) => response(null, 303, cookies, { Location: location });
function page(status: number, title: string, detail: string, login = false, cookies: string[] = []) {
  // All strings here are fixed application copy; no upstream error or user data is rendered.
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title} | Telotia</title><style>@font-face{font-family:Inter;src:url('/assets/resource-intro/Inter-latin-wght-normal.woff2') format('woff2');font-weight:100 900;font-display:swap}*{box-sizing:border-box}body{margin:0;background:#fff;color:#282D32;font:400 16px/1.6 Inter,Arial,sans-serif}main{max-width:560px;margin:18vh auto;padding:24px}h1{font-weight:400;font-size:clamp(30px,5vw,44px);line-height:1.15;letter-spacing:-.03em}p{color:#617075;max-width:45ch}a{display:inline-flex;align-items:center;min-height:44px;padding:10px 18px;background:#00545A;color:white;text-decoration:none;border-radius:6px;margin-top:16px}a:hover{background:#282D32}a:focus-visible{outline:2px solid #00545A;outline-offset:4px}::selection{background:#EAF4F2}</style><main><h1>${title}</h1><p>${detail}</p>${login ? `<a href="${ROOT}/start">Continue with GitHub</a>` : ''}</main></html>`;
  return response(html, status, cookies, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'" });
}
function ready(env: PreviewAuthEnv) {
  return Boolean(env.PREVIEW_GITHUB_CLIENT_ID && env.PREVIEW_GITHUB_CLIENT_SECRET && env.PREVIEW_SESSION_SECRET && env.PREVIEW_SESSION_SECRET.length >= 32);
}
function unavailable(stage: string, cookies: string[]) {
  const result = page(503, 'Sign-in is temporarily unavailable', 'Access remains closed. Please try again later.', false, cookies);
  // Fixed categories/status only: never upstream response text, tokens or credentials.
  result.headers.set('X-Preview-Auth-Error', stage);
  return result;
}
async function github(url: string, token: string, fetcher: Fetcher) {
  // Workerd supports follow/manual only. Never follow a redirect with a user token.
  return fetcher(url, { redirect: 'manual', headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10', 'User-Agent': 'Telotia-private-dev-preview' }, signal: AbortSignal.timeout(10000) });
}
async function permitted(token: string, fetcher: Fetcher): Promise<'yes' | 'no' | 'unavailable'> {
  try {
    const result = await github('https://api.github.com/repos/' + REPOSITORY, token, fetcher);
    if (result.status >= 500 || result.status === 429) return 'unavailable';
    if (result.status !== 200) return 'no';
    const repo = await result.json() as { full_name?: unknown; private?: unknown };
    // A public response is never accepted as proof of private project access.
    return repo.full_name === REPOSITORY && repo.private === true ? 'yes' : 'no';
  } catch { return 'unavailable'; }
}

export async function handlePreviewAuth(request: Request, env: PreviewAuthEnv, fetcher: Fetcher = fetch): Promise<Response | null> {
  const url = new URL(request.url);
  const authRoute = url.pathname === ROOT || url.pathname.startsWith(ROOT + '/');
  if (!authRoute && !isPrivatePreview(url.pathname)) return null;
  // This auth surface can never turn on in production or on workers.dev aliases.
  if (env.ENVIRONMENT !== 'development' || url.origin !== ORIGIN) return closedPreview(request, env.ENVIRONMENT === 'production');
  if (!ready(env)) return closedPreview(request, false);
  const secret = env.PREVIEW_SESSION_SECRET!;
  const path = url.pathname;
  if (path === ROOT + '/logout') {
    if (request.method !== 'POST') return response(null, 405, [], { Allow: 'POST' });
    if (request.headers.get('Origin') !== ORIGIN) return response('Forbidden.', 403);
    return redirect(ROOT, [cookie(SESSION), cookie(FLOW)]);
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') return response(null, 405, [], { Allow: 'GET, HEAD' });
  if (path === ROOT || path === ROOT + '/') return page(200, 'Private project preview', 'Sign in with GitHub. Only authorized project members can view this preview.', true);
  if (path === ROOT + '/start') {
    const state = random(), verifier = random();
    const challenge = encode(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(verifier))));
    const auth = new URL('https://github.com/login/oauth/authorize');
    auth.search = new URLSearchParams({ client_id: env.PREVIEW_GITHUB_CLIENT_ID!, redirect_uri: CALLBACK, state, code_challenge: challenge, code_challenge_method: 'S256', allow_signup: 'false' }).toString();
    return redirect(auth.href, [cookie(FLOW, await seal({ kind: 'flow', state, verifier, exp: now() + 600 }, secret), 600)]);
  }
  if (path === ROOT + '/callback') {
    const clear = [cookie(FLOW), cookie(SESSION)];
    const flow = await open(readCookie(request, FLOW), secret, 'flow');
    const code = url.searchParams.get('code');
    if (!flow || flow.kind !== 'flow' || typeof flow.state !== 'string' || typeof flow.verifier !== 'string' || url.searchParams.getAll('state').length !== 1 || url.searchParams.getAll('code').length !== 1 || flow.state !== url.searchParams.get('state') || !code || code.length > 1024 || url.searchParams.has('error')) {
      return page(403, 'Sign-in could not be verified', 'Please start a new sign-in attempt.', true, clear);
    }
    let stage = 'exchange';
    try {
      const exchange = await fetcher('https://github.com/login/oauth/access_token', {
        method: 'POST', redirect: 'manual', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Telotia-private-dev-preview' },
        body: new URLSearchParams({ client_id: env.PREVIEW_GITHUB_CLIENT_ID!, client_secret: env.PREVIEW_GITHUB_CLIENT_SECRET!, redirect_uri: CALLBACK, code, code_verifier: flow.verifier }), signal: AbortSignal.timeout(10000),
      });
      if (!exchange.ok) return unavailable('exchange-http-' + exchange.status, clear);
      stage = 'exchange-json';
      const data = await exchange.json() as { access_token?: unknown; token_type?: unknown; expires_in?: unknown; error?: unknown };
      // GitHub App user tokens only. Installation/PAT/OAuth-app tokens are rejected.
      if (data.error || typeof data.access_token !== 'string' || !/^ghu_[A-Za-z0-9_]+$/.test(data.access_token) || data.access_token.length > 512 || data.token_type !== 'bearer') return page(403, 'Access denied', 'This sign-in does not grant project access.', false, clear);
      const token = data.access_token;
      stage = 'identity';
      const [access, identity] = await Promise.all([permitted(token, fetcher), github('https://api.github.com/user', token, fetcher)]);
      if (access === 'unavailable' || identity.status >= 500) return page(503, 'Access check is temporarily unavailable', 'Access remains closed. Please try again later.', false, clear);
      const user = identity.ok ? await identity.json() as { id?: unknown } : null;
      if (access !== 'yes' || !user || !Number.isSafeInteger(user.id)) return page(403, 'Access denied', 'Your account cannot view this private project preview.', false, clear);
      const ttl = Math.min(900, typeof data.expires_in === 'number' && Number.isFinite(data.expires_in) ? Math.floor(data.expires_in) : 900);
      if (ttl < 1) return page(403, 'Access denied', 'Please start a new sign-in attempt.', true, clear);
      stage = 'session';
      const session = await seal({ kind: 'session', token, exp: now() + ttl }, secret);
      return redirect(PREVIEW + '#task-story', [cookie(FLOW), cookie(SESSION, session, ttl)]);
    } catch (error) {
      const name = error instanceof Error && ['TypeError', 'TimeoutError', 'AbortError', 'SyntaxError', 'OperationError'].includes(error.name) ? error.name : 'Error';
      return unavailable(stage + '-' + name, clear);
    }
  }
  if (authRoute) return response('Not found.', 404);
  const session = await open(readCookie(request, SESSION), secret, 'session');
  if (!session || session.kind !== 'session' || typeof session.token !== 'string' || !session.token.startsWith('ghu_')) {
    return url.pathname.toLowerCase().includes('tasklooppreview') || url.pathname.startsWith('/_astro/') ? response('Forbidden.', 403, [cookie(SESSION)]) : redirect(ROOT, [cookie(SESSION)]);
  }
  // Recheck on EVERY private HTML/asset request; no positive authorization cache.
  const access = await permitted(session.token, fetcher);
  if (access !== 'yes') return page(access === 'unavailable' ? 503 : 403, access === 'unavailable' ? 'Access check is temporarily unavailable' : 'Access denied', 'The private preview cannot be opened.', false, access === 'no' ? [cookie(SESSION)] : []);
  const asset = await env.ASSETS.fetch(request);
  const h = new Headers(asset.headers);
  Object.entries(headers).forEach(([k, v]) => h.set(k, v));
  // Never persist private HTML or JS in browser/CDN shared caches.
  return new Response(request.method === 'HEAD' ? null : asset.body, { status: asset.status, statusText: asset.statusText, headers: h });
}
