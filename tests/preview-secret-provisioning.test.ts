import { expect, test } from 'bun:test';
import { previewSecretPayload } from '../scripts/provision-dev-preview-secrets';

test('missing configuration is a no-op; partial configuration is rejected before any write', () => {
  expect(previewSecretPayload({})).toBeNull();
  expect(() => previewSecretPayload({ PREVIEW_GITHUB_CLIENT_SECRET: 'fixture' })).toThrow('Configure both');
  expect(() => previewSecretPayload({ PREVIEW_GITHUB_CLIENT_SECRET: 'fixture', PREVIEW_SESSION_SECRET: 'short' })).toThrow('Configure both');
});
test('only the two preview secrets are forwarded; deployment credentials are excluded', () => {
  const payload = previewSecretPayload({
    PREVIEW_GITHUB_CLIENT_SECRET: 'fixture-client-secret',
    PREVIEW_SESSION_SECRET: 'fixture-session-secret-at-least-32-characters',
    CLOUDFLARE_API_TOKEN: 'fixture-deploy-token', UNRELATED_SECRET: 'fixture-unrelated',
  });
  expect(Object.keys(JSON.parse(payload!)).sort()).toEqual(['PREVIEW_GITHUB_CLIENT_SECRET', 'PREVIEW_SESSION_SECRET']);
  expect(payload).not.toContain('fixture-deploy-token');
  expect(payload).not.toContain('fixture-unrelated');
});
