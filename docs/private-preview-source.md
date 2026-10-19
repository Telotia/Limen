# Deploy private preview source without public commits

The local private animation source remains outside the public Git history. The
public repository contains only a generic two-file overlay loader and synthetic
test fixtures. Never commit a private overlay, encrypted package or compiled
private build. Do not upload private source/build artifacts or cache decoded files.

`PREVIEW_PRIVATE_SOURCE_BUNDLE` is a repository Actions Secret containing an
AES-256-GCM encrypted, compressed source manifest. Its key is derived with HKDF
from `PREVIEW_SESSION_SECRET` using a separate source-overlay context; it is not
the session cookie encryption key. GitHub additionally encrypts Actions secrets.

Prepare the package locally, writing it outside both Git checkouts:

```sh
bun scripts/pack-private-preview.ts --source /local/private-checkout --base /local/public-checkout --key-file /local/session-secret.txt --out /local/private-storage/preview-overlay.enc
```

Store that file's contents as Actions Secret `PREVIEW_PRIVATE_SOURCE_BUNDLE`.
Only the dev deployment receives it. It is never passed in command arguments or
printed. GitHub Actions temporarily decodes it on the runner after the normal
public build, validates both base hashes and the fixed file allowlist, then
checks, tests and builds quietly. File paths cannot target authentication,
Worker routing, production or mentor sources. Stale bases fail before any writes.
Source files are restored after the build even on failure.

Before deployment, the build compares every output byte to the public build and
refuses any changed asset outside the existing private-preview gate. The
authenticated `/private-preview/revision.json` records the source revision and
protected asset names for verification. It contains no source code. Private
compiled JavaScript still requires the normal per-request GitHub repository check.

The encrypted package persists in Actions Secrets so later dev deployments retain
the private preview. Regenerate it when the two public source bases change; keep
the session secret synchronized when rotating its key. Removing the source-bundle
secret restores the public baseline on the next dev deployment. Production's
workflow never applies this overlay.
