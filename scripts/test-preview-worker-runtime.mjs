import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { Miniflare, Response } from 'miniflare';

// Exercise the real Workers runtime, not Bun's compatible-but-different fetch.
const output = '.wrangler/preview-runtime-test';
await mkdir(output, { recursive: true });
execFileSync('bun', ['build', 'worker/index.ts', '--target', 'browser', '--format', 'esm', '--outdir', output], { stdio: 'pipe' });
const replies = new Map();
let unexpectedOutbound = 0;
function enqueue(url, status, body, headers = { 'content-type': 'application/json' }) {
  const queue = replies.get(url) || [];
  queue.push({ status, body: typeof body === 'string' ? body : JSON.stringify(body), headers });
  replies.set(url, queue);
}
const repoPath = '/repos/Telotia/Telotia';
const repo = { full_name: 'Telotia/Telotia', private: true };
const origin = 'https://dev.telotia.com';
let assetReads = 0;
const mf = new Miniflare({
  modules: true, script: await readFile(output + '/index.js', 'utf8'),
  compatibilityDate: '2026-05-18',
  outboundService: async request => {
    const next = replies.get(request.url)?.shift();
    if (!next) { unexpectedOutbound++; throw new Error('Unexpected outbound request in isolated runtime fixture'); }
    return new Response(next.body, { status: next.status, headers: next.headers });
  },
  bindings: {
    ENVIRONMENT: 'development', PREVIEW_GITHUB_CLIENT_ID: 'fixture-client',
    PREVIEW_GITHUB_CLIENT_SECRET: 'fixture-client-secret',
    PREVIEW_SESSION_SECRET: 'fixture-session-secret-at-least-32-characters',
  },
  serviceBindings: { ASSETS: async () => { assetReads++; return new Response('private runtime fixture'); } },
});
const request = (path, cookie) => mf.dispatchFetch(origin + path, { redirect: 'manual', headers: cookie ? { Cookie: cookie } : {} });
function repositoryReply(status, body = repo) {
  enqueue('https://api.github.com' + repoPath, status, body);
}
async function login(repoStatus = 200) {
  enqueue('https://github.com/login/oauth/access_token', 200, { access_token: 'ghu_runtime_fixture', token_type: 'bearer', expires_in: 28800 });
  enqueue('https://api.github.com/user', 200, { id: 123 });
  repositoryReply(repoStatus);
  return callback();
}
async function callback() {
  const start = await request('/auth/task-preview/start');
  assert.equal(start.status, 303);
  const state = new URL(start.headers.get('Location')).searchParams.get('state');
  const cookie = start.headers.get('Set-Cookie').split(';')[0];
  return request('/auth/task-preview/callback?code=fixture&state=' + state, cookie);
}
try {
  assert.equal((await request('/preview/task-loop')).status, 303);
  assert.equal((await request('/private-preview/revision.json')).status, 303);
  assert.equal((await request('/_astro/TaskLoopPreview.fixture.js')).status, 403);
  const member = await login();
  assert.equal(member.status, 303, member.headers.get('X-Preview-Auth-Error') || 'member callback failed');
  assert.equal(member.headers.get('Location'), '/preview/task-loop#task-story');
  const cookie = member.headers.getSetCookie().find(c => c.startsWith('__Host-telotia-preview=')).split(';')[0];
  for (const path of ['/preview/task-loop', '/_astro/TaskLoopPreview.fixture.js', '/private-preview/revision.json']) {
    repositoryReply(200);
    const result = await request(path, cookie);
    assert.equal(result.status, 200);
    assert.match(result.headers.get('Cache-Control'), /no-store/);
    assert.equal(await result.text(), 'private runtime fixture');
  }
  repositoryReply(404);
  assert.equal((await request('/preview/task-loop', cookie)).status, 403, 'revoked membership must be rechecked');
  assert.equal((await login(404)).status, 403, 'signed-in user without repository access must be denied');
  repositoryReply(200, { ...repo, private: false });
  assert.equal((await request('/preview/task-loop', cookie)).status, 403);
  repositoryReply(503);
  assert.equal((await request('/preview/task-loop', cookie)).status, 503);
  enqueue('https://api.github.com' + repoPath, 302, '', { Location: 'https://redirect.invalid/' });
  assert.equal((await request('/preview/task-loop', cookie)).status, 403, 'never follow repository redirects with a user token');
  enqueue('https://github.com/login/oauth/access_token', 302, '', { Location: 'https://redirect.invalid/' });
  const redirect = await callback();
  assert.equal(redirect.status, 503);
  assert.equal(redirect.headers.get('X-Preview-Auth-Error'), 'exchange-http-302');
  assert.equal(assetReads, 3, 'no denied request may read private assets');
  assert.equal(unexpectedOutbound, 0, 'all requests must stay on the fixed GitHub endpoints');
  for (const queue of replies.values()) assert.equal(queue.length, 0);
  console.info('Workers runtime: member HTML/JS, nonmember, revocation, public-repo fallback, API outage and redirect refusal passed.');
} finally {
  await mf.dispose();
}
