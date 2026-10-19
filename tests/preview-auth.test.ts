import { expect, test, spyOn } from 'bun:test';
import { handlePreviewAuth, type PreviewAuthEnv } from '../worker/preview-auth';

const origin = 'https://dev.telotia.com';
const root = '/auth/task-preview';
const sessionName = '__Host-telotia-preview';
const token = 'ghu_fixtureOnly_NotARealCredential';
function fixture() {
  let reads = 0, checks = 0, status = 200;
  let repo = { full_name: 'Telotia/Telotia', private: true };
  const env: PreviewAuthEnv = {
    ENVIRONMENT: 'development', PREVIEW_GITHUB_CLIENT_ID: 'fixture-client',
    PREVIEW_GITHUB_CLIENT_SECRET: 'fixture-only-secret', PREVIEW_SESSION_SECRET: 'fixture-session-secret-at-least-32-characters',
    ASSETS: { fetch: async () => { reads++; return new Response('private fixture', { headers: { 'Cache-Control': 'public,max-age=3600' } }); } },
  };
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url === 'https://github.com/login/oauth/access_token') {
      const form = new URLSearchParams(String(init?.body));
      expect(form.get('redirect_uri')).toBe(origin + root + '/callback');
      expect(form.get('code_verifier')).toMatch(/^[A-Za-z0-9_-]{43}$/);
      return Response.json({ access_token: token, token_type: 'bearer', expires_in: 28800 });
    }
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer ' + token);
    if (url === 'https://api.github.com/user') return Response.json({ id: 123 });
    expect(url).toBe('https://api.github.com/repos/Telotia/Telotia');
    checks++;
    return Response.json(repo, { status });
  }) as typeof fetch;
  const request = (path: string, cookie?: string, init: RequestInit = {}) => handlePreviewAuth(new Request(origin + path, { ...init, headers: { ...(cookie ? { Cookie: cookie } : {}), ...init.headers } }), env, fetcher);
  return { env, fetcher, request, reads: () => reads, checks: () => checks,
    deny: (next = 404) => { status = next; }, publicRepo: () => { repo.private = false; } };
}
function cookieOf(response: Response, name: string) {
  const value = response.headers.getSetCookie().find(c => c.startsWith(name + '='));
  expect(value).toBeDefined();
  return value!.split(';')[0];
}
async function signIn(f: ReturnType<typeof fixture>) {
  const start = (await f.request(root + '/start'))!;
  const auth = new URL(start.headers.get('Location')!);
  const callback = (await f.request(root + '/callback?code=fixture&state=' + auth.searchParams.get('state'), cookieOf(start, '__Host-telotia-preview-flow')))!;
  expect(callback.status).toBe(303);
  expect(callback.headers.get('Location')).toBe('/preview/task-loop#task-story');
  return { callback, cookie: cookieOf(callback, sessionName) };
}
test('OAuth uses fixed callback, state, PKCE and secure encrypted flow cookie without broad repo scopes', async () => {
  const f = fixture(), start = (await f.request(root + '/start'))!;
  const url = new URL(start.headers.get('Location')!);
  expect(url.origin).toBe('https://github.com');
  expect(url.searchParams.get('redirect_uri')).toBe(origin + root + '/callback');
  expect(url.searchParams.get('state')).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  expect(url.searchParams.has('scope')).toBe(false);
  const cookie = start.headers.get('Set-Cookie')!;
  for (const flag of ['Secure', 'HttpOnly', 'SameSite=Lax', 'Path=/', 'Max-Age=600']) expect(cookie).toContain(flag);
  expect(cookie).not.toContain(url.searchParams.get('state')!);
});
test('invalid state or tampered flow never reaches GitHub or private assets', async () => {
  const f = fixture(), start = (await f.request(root + '/start'))!;
  const result = (await f.request(root + '/callback?code=fixture&state=wrong', cookieOf(start, '__Host-telotia-preview-flow')))!;
  expect(result.status).toBe(403); expect(f.checks()).toBe(0); expect(f.reads()).toBe(0);
  expect((await f.request(root + '/callback?code=fixture&state=wrong', '__Host-telotia-preview-flow=forged'))!.status).toBe(403);
});
test('authorized HTML and JS recheck access each time and cannot be cached', async () => {
  const f = fixture(), login = await signIn(f);
  expect(login.cookie).not.toContain(token);
  expect(login.callback.headers.get('Set-Cookie')).toContain('Max-Age=900');
  const initial = f.checks();
  for (const path of ['/preview/task-loop', '/_astro/TaskLoopPreview.astro_fixture.js']) {
    const response = (await f.request(path, login.cookie))!;
    expect(response.status).toBe(200); expect(await response.text()).toBe('private fixture');
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(response.headers.get('Cloudflare-CDN-Cache-Control')).toBe('no-store');
  }
  expect(f.checks()).toBe(initial + 2); expect(f.reads()).toBe(2);
  const head = (await f.request('/preview/task-loop', login.cookie, { method: 'HEAD' }))!;
  expect(head.status).toBe(200); expect(await head.text()).toBe('');
});
test('revoked access, public repository, API failures and forged sessions all fail closed', async () => {
  for (const status of [401, 403, 404, 429, 500]) {
    const f = fixture(), login = await signIn(f); f.deny(status);
    const denied = (await f.request('/preview/task-loop', login.cookie))!;
    expect(denied.status).toBe(status >= 500 || status === 429 ? 503 : 403); expect(f.reads()).toBe(0);
  }
  const f = fixture(), login = await signIn(f); f.publicRepo();
  expect((await f.request('/preview/task-loop', login.cookie))!.status).toBe(403);
  expect((await f.request('/_astro/TaskLoopPreview.fixture.js', sessionName + '=forged'))!.status).toBe(403);
  expect((await f.request('/preview/task-loop', login.cookie + '; ' + login.cookie))!.status).toBe(303);
  expect(f.reads()).toBe(0);
});
test('expired sessions and flow cookies cannot grant access', async () => {
  const f = fixture(), login = await signIn(f);
  const clock = spyOn(Date, 'now').mockReturnValue(Date.now() + 901000);
  try { expect((await f.request('/preview/task-loop', login.cookie))!.status).toBe(303); expect(f.reads()).toBe(0); }
  finally { clock.mockRestore(); }
});
test('callbacks reject non-user tokens and network failures without serving preview assets', async () => {
  for (const credential of ['ghs_installationFixture', 'ghp_personalFixture', 'invalid']) {
    const f = fixture(), start = (await f.request(root + '/start'))!;
    const state = new URL(start.headers.get('Location')!).searchParams.get('state');
    const request = new Request(origin + root + '/callback?code=fixture&state=' + state, { headers: { Cookie: cookieOf(start, '__Host-telotia-preview-flow') } });
    const fetcher = (async () => Response.json({ access_token: credential, token_type: 'bearer' })) as typeof fetch;
    expect((await handlePreviewAuth(request, f.env, fetcher))!.status).toBe(403);
    expect(f.reads()).toBe(0);
  }
  const f = fixture(), login = await signIn(f);
  const fetcher = (async () => { throw new Error('fixture network outage'); }) as typeof fetch;
  const response = await handlePreviewAuth(new Request(origin + '/preview/task-loop', { headers: { Cookie: login.cookie } }), f.env, fetcher);
  expect(response!.status).toBe(503); expect(f.reads()).toBe(0);
});
test('logout requires same-origin POST and clears both cookies', async () => {
  const f = fixture();
  expect((await f.request(root + '/logout'))!.status).toBe(405);
  expect((await f.request(root + '/logout', undefined, { method: 'POST', headers: { Origin: 'https://other.example' } }))!.status).toBe(403);
  const result = (await f.request(root + '/logout', undefined, { method: 'POST', headers: { Origin: origin } }))!;
  expect(result.status).toBe(303); expect(result.headers.getSetCookie()).toHaveLength(2);
  for (const cookie of result.headers.getSetCookie()) expect(cookie).toContain('Max-Age=0');
});
test('authentication cannot enable production, aliases or missing configuration; public routes are untouched', async () => {
  const f = fixture();
  expect(await f.request('/intro')).toBeNull(); expect(await f.request('/resource')).toBeNull();
  expect((await handlePreviewAuth(new Request(origin + '/preview/task-loop'), { ...f.env, PREVIEW_SESSION_SECRET: undefined }, f.fetcher))!.status).toBe(403);
  expect((await handlePreviewAuth(new Request(origin + root), { ...f.env, ENVIRONMENT: 'production' }, f.fetcher))!.status).toBe(404);
  expect((await handlePreviewAuth(new Request('https://example.workers.dev' + root), f.env, f.fetcher))!.status).toBe(403);
  expect(f.reads()).toBe(0);
});
