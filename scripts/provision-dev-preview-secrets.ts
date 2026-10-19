/** Dev only: forward repository Actions secrets over stdin, never CLI arguments. */
export function previewSecretPayload(env: Record<string, string | undefined>): string | null {
  const client = env.PREVIEW_GITHUB_CLIENT_SECRET;
  const session = env.PREVIEW_SESSION_SECRET;
  if (!client && !session) return null;
  if (!client || !session || session.length < 32) {
    throw new Error('Configure both dev preview Actions secrets; the session secret must have at least 32 characters.');
  }
  return JSON.stringify({ PREVIEW_GITHUB_CLIENT_SECRET: client, PREVIEW_SESSION_SECRET: session });
}

if (import.meta.main) {
  const payload = previewSecretPayload(process.env);
  if (!payload) {
    console.info('No preview secrets supplied; existing dev Worker secrets are unchanged.');
  } else {
    // Explicit default environment and worker prevent accidental production writes.
    const child = Bun.spawn(['bunx', 'wrangler', 'secret', 'bulk', '--env=', '--name', 'limen-dev'], {
      stdin: new Blob([payload]), stdout: 'ignore', stderr: 'ignore',
    });
    if (await child.exited !== 0) {
      // Upstream output is intentionally suppressed: no credential contents in logs.
      throw new Error('Dev preview secret provisioning failed. Verify the existing deployment token can edit limen-dev Worker secrets.');
    }
    console.info('Dev preview authentication secrets provisioned on limen-dev.');
  }
}
