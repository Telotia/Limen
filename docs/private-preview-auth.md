# Private dev preview authentication

This middleware protects `/preview/*`, `/private-preview/*` and TaskLoopPreview
JavaScript bundles on dev, including encoded aliases. Public `/intro`, `/resource`
and production remain unchanged. Configuration absent: 403. Production: 404.

## GitHub App

- Owned by Telotia, installable only on Telotia.
- Homepage: `https://dev.telotia.com`.
- Callback: `https://dev.telotia.com/auth/task-preview/callback`, no wildcards.
- Expiring user tokens enabled; device flow and webhooks disabled.
- Repository Metadata read-only; all other optional permissions disabled.
- Install on selected repository `Telotia/Telotia` only.
- GitHub may require generating a private key before installation. Store it safely
  outside Git; this user OAuth implementation does not load the PEM or mint
  installation tokens. Generate a client secret for the user OAuth exchange.

## Dev Worker configuration

If you do not have Cloudflare dashboard access, use the existing GitHub Actions
deployment identity. In Telotia/Limen Settings > Secrets and variables > Actions,
create repository secrets `PREVIEW_GITHUB_CLIENT_SECRET` and
`PREVIEW_SESSION_SECRET`. The dev workflow forwards only these two values through
Wrangler stdin to `limen-dev`, using the existing Cloudflare deployment credential.
Values are never printed or passed as process arguments. Missing both secrets is
a no-op; partial configuration fails the deployment before writing anything.
The existing token must have Worker secret edit access; the workflow cannot bypass
Cloudflare permission checks. Production deployment does not run this step.
After adding or rotating secrets, run Deploy dev manually against the dev branch
or push a normal dev change. Do not run it against a production branch.

Configure only Worker `limen-dev` (not production `limen`) through Cloudflare's
Variables and Secrets screen, or interactive Wrangler secret prompts:

```sh
bunx wrangler secret put PREVIEW_GITHUB_CLIENT_SECRET --env=""
bunx wrangler secret put PREVIEW_SESSION_SECRET --env=""
```

The public Client ID is already configured for dev in `wrangler.jsonc`.
The session secret must be a cryptographically random value of at least 32
characters (prefer 32 random bytes encoded as base64). Never put actual secrets in
source, shell arguments, logs, chat, or committed `.env` files. The client ID is a
public identifier. Changing the session secret invalidates all existing sessions.

## Behavior and verification

Sign in at `/auth/task-preview`. State and S256 PKCE bind the OAuth callback to a
10-minute encrypted flow cookie. Only GitHub App user tokens are accepted. The
callback checks `/user` and `/repos/Telotia/Telotia`; the repository must be private
and have the exact expected name. App installation alone never authorizes a user.

Each private HTML or JavaScript request rechecks the repository with the user's
token. No positive permission cache is used. Revocation or API failures deny the
next request. Already downloaded content cannot be retracted. Sessions expire
after at most 15 minutes and use encrypted Secure, HttpOnly, SameSite=Lax cookies.
POST `/auth/task-preview/logout` clears the cookies and requires same-origin Origin.
All private responses are no-store for browsers and CDNs. Workers.dev aliases
remain closed even when credentials are present.

Run `bun test`, `bun run check`, dev/prod builds and Wrangler dry-run. Before opening
access, verify a real member succeeds, a GitHub user without repo access is denied,
anonymous HTML redirects to login, direct anonymous private JS is denied, logout
closes the page on refresh, and production and mentor pages stay unchanged.
Mocks exercise protocol and failure cases but do not replace these live checks.

This commit changes access infrastructure only. It does not publish new private
preview designs to the public source repository.
