import { expect, test } from 'bun:test';
import worker from '../worker';
const ctx = { waitUntil: (_promise: Promise<unknown>) => {} };
function environment() {
  let reads = 0;
  return { env: { ASSETS: { fetch: async () => { reads++; return new Response('public asset'); } }, ENVIRONMENT: 'development' as const }, reads: () => reads };
}
test('private preview HTML, aliases, encoded paths and old bundles never reach static assets', async () => {
  for (const host of ['dev.telotia.com', 'example.workers.dev']) {
    for (const path of ['/preview/task-loop', '/preview/task-loop.html', '/preview/task-loop/', '/private-preview/revision.json', '/preview//task-loop?x=1', '/%70review/task-loop', '/preview%2Ftask-loop', '/%2570review/task-loop', '/_astro/TaskLoopPreview.astro_oldhash.js', '/_astro/%54askLoopPreview.astro_newhash.js']) {
      const e = environment();
      const response = await worker.fetch(new Request('https://' + host + path, { headers: { 'Cf-Access-Jwt-Assertion': 'forged', Cookie: 'CF_Authorization=forged' } }), e.env, ctx);
      expect(response.status).toBe(403); expect(e.reads()).toBe(0);
      expect(response.headers.get('Cache-Control')).toContain('no-store');
      expect(await response.text()).not.toContain('T-01');
    }
  }
});
test('HEAD stays closed and production does not expose the preview', async () => {
  const e = environment();
  const head = await worker.fetch(new Request('https://dev.telotia.com/preview/task-loop', { method: 'HEAD' }), e.env, ctx);
  expect(head.status).toBe(403); expect(await head.text()).toBe('');
  const prod = await worker.fetch(new Request('https://telotia.com/preview/task-loop'), { ...e.env, ENVIRONMENT: 'production' }, ctx);
  expect(prod.status).toBe(404); expect(e.reads()).toBe(0);
});
test('public pages and shared branding assets keep their normal asset behavior', async () => {
  for (const path of ['/', '/intro', '/resource', '/assets/resource-intro/Inter-latin-wght-normal.woff2', '/_astro/ResourceIntro.public.js']) {
    const e = environment();
    const response = await worker.fetch(new Request('https://dev.telotia.com' + path), e.env, ctx);
    expect(response.status).toBe(200); expect(e.reads()).toBe(1);
  }
});
