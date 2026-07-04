# Contributing to Limen

This document is the standard. Read it once end-to-end before your first PR.

> **Limen vs Telotia.** *Limen* is the codename of this project and the GitHub repo. *Telotia* is the brand that ships at `telotia.com`. Use the right name in the right context: inside the repo, Slack, commit history → Limen. On the public site, in marketing, in user-facing copy → Telotia.

---

## Table of contents

- [1. The branching model](#1-the-branching-model)
- [2. Conventional commits](#2-conventional-commits)
- [3. Local setup](#3-local-setup)
- [4. Working on a change](#4-working-on-a-change)
- [5. Opening a PR into `dev`](#5-opening-a-pr-into-dev)
- [6. Releasing to production (`dev` → `main`)](#6-releasing-to-production-dev--main)
- [7. Hotfixes (skipping `dev`)](#7-hotfixes-skipping-dev)
- [8. Deployment internals](#8-deployment-internals)
- [9. The dev page (TODO dashboard)](#9-the-dev-page-todo-dashboard)
- [10. Common commands](#10-common-commands)
- [11. Troubleshooting](#11-troubleshooting)
- [12. Human action items (🚧)](#12-human-action-items-)

---

## 1. The branching model

Limen uses a two-branch [GitLab-Flow](https://about.gitlab.com/topics/version-control/what-is-gitlab-flow/)-style model:

```
feature/* ──PR──► dev ──release PR──► main
                  │                    │
                  ▼                    ▼
              limen-dev            limen (prod)
              auto-deploys         deploys + tags + drafts release
```

| Branch | Who pushes | Merge style | Reviews required | What deploys |
|--------|------------|-------------|------------------|--------------|
| `feature/*` | Any developer | — | — | Nothing |
| `dev` | Via PR only | **Squash** (one conventional commit per merge) | None (CI green required) | `limen-dev` Worker debug page |
| `main` | Via release PR only | **Merge commit** (preserves dev's history) | 1 approval (admin can bypass during bootstrap) | `limen` Worker at `telotia.com` + tag + GitHub Release |

Direct push to `dev` and `main` is blocked by branch protection. Force-push and deletion are blocked on both.

### Why this model and not GitHub Flow

We want batched releases with an explicit reviewable "release PR" so the team has a tracked, motivating release history. As Limen grows or we adopt feature flags, the natural evolution is to collapse to single-trunk GitHub Flow with per-PR previews.

---

## 2. Conventional commits

Conventional-commit format is **enforced** at the PR-title level by CI. Format:

```
<type>(<scope>): <subject>
```

- **Types** *(required)*: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- **Scopes** *(required)*: `pages`, `layouts`, `components`, `styles`, `content`, `assets`, `config`, `ci`, `deps`, `docs`, `infra`
- **Subject**: lower-case start, no period at the end

### Examples

```
feat(pages): add about page
fix(styles): correct mobile breakpoint at 480px
chore(deps): bump astro to 6.4
docs(infra): document hotfix procedure
ci(config): pin bun to 1.3.13
```

### Breaking changes

Append `!` after the type/scope for a breaking change. This drives a **major** version bump:

```
feat(config)!: rename LIMEN_ENV to BUILD_TARGET
```

### Adding a new scope

Need a scope that isn't in the list? Open a PR that edits `.commitlintrc.json` under `scope-enum`. Use scope `config` for the PR itself: `chore(config): add 'blog' scope`.

### Versioning rules (auto-applied)

| Commit prefix | Version bump |
|---------------|--------------|
| `feat!:`, `fix!:`, any `!:` | Major (`X.0.0`) |
| `feat:` | Minor (`x.Y.0`) |
| Everything else | Patch (`x.y.Z`) |

You don't compute versions manually — release-drafter does it from the merged PR titles.

---

## 3. Local setup

You need [Bun ≥ 1.3](https://bun.sh) and Node 22+. Clone, then:

```sh
bun install
bun run hooks:install
```

`hooks:install` points `core.hooksPath` at `.githooks/`, enabling:

- **`commit-msg`** — lints your commit message via commitlint (matches what CI will check on your PR title)
- **`pre-push`** — runs `bun run check`, `bun test`, `bun run build:dev`, and `bun run build:prod` before push

If a hook ever needs bypassing (rare), use `--no-verify`. Don't make a habit of it.

---

## 4. Working on a change

```sh
# 1. Start from a fresh dev
git checkout dev
git pull --ff-only

# 2. Branch off
git checkout -b feature/your-change-here

# 3. Iterate locally
bun run dev   # http://localhost:4321

# 4. Commit (conventional format)
git add .
git commit -m "feat(pages): add hero section"

# 5. Push your feature branch
git push -u origin feature/your-change-here

# 6. Open a PR into dev (see §5)
```

### Test locally before opening a PR

This is the team rule. Specifically:

- [ ] `bun run dev` renders without warnings in the browser console
- [ ] `bun run check` succeeds
- [ ] `bun test` is green
- [ ] `bun run build:dev` succeeds
- [ ] `bun run build:prod` succeeds
- [ ] You've checked the page in mobile width (DevTools → device toolbar)

---

## 5. Opening a PR into `dev`

```sh
gh pr create --base dev --fill
```

Or open one in the UI. The PR template will load automatically. Required:

- **PR title** in conventional-commit format (CI will block the merge if not)
- **What this changes**, **Why**, and the test checklist

The PR triggers:

1. **PR title lint** (`amannn/action-semantic-pull-request`) — must match conventional commits with a valid scope
2. **Validate** (`bun install`, `bun run check`, `bun test`, dev/prod builds, and Cloudflare deploy dry-runs)
3. **Update draft release notes** updates the draft release with your PR's title

You merge using **Squash and merge**. The squash commit message defaults to the PR title, which preserves the conventional-commit format on dev's history.

After merge, `Deploy dev` pushes the debug dashboard to `dev.telotia.com` and smoke-tests the URL.

---

## 6. Releasing to production (`dev` → `main`)

When dev has accumulated enough merged work to be worth shipping (the team's call, no fixed cadence):

```sh
git checkout main
git pull --ff-only
gh pr create --base main --head dev --title "release: <short summary>"
```

The release PR aggregates every conventional commit on dev since the last release. Treat it like any other PR — title, description, smoke-test the dev URL, request review.

When merged, the release PR uses **Merge commit** (not squash) so every individual commit from dev lands on main. This is what enables release-drafter to build a categorized changelog from the actual feature/fix commits.

Merging the release PR triggers `deploy-prod.yml`:

1. `bun run check`, `bun test`, and `bun run build:prod` validate the release
2. `wrangler deploy --env production` ships the `limen` Worker
3. `bun run smoke:prod` checks `https://telotia.com`
4. `release-drafter` publishes the existing draft → creates the tag `vX.Y.Z` and a GitHub Release with categorized notes

The new release appears at `https://github.com/Telotia/Limen/releases` — this is your team's running record of what shipped when, and intentionally so.

### What if the release notes look wrong before merge?

The draft release lives at `https://github.com/Telotia/Limen/releases`. You can preview it before merging the release PR. If commit titles need cleanup, amend them in dev *before* opening the release PR (use squash-merge edits or `git commit --amend` + force-push on the feature branch before merging — never on dev itself).

---

## 7. Hotfixes (skipping `dev`)

If production is broken and dev has WIP that can't ship yet:

```sh
# 1. Branch directly off main
git checkout main
git pull --ff-only
git checkout -b hotfix/short-description

# 2. Make the fix
# ... edits ...
git commit -m "fix(<scope>): describe the fix"
git push -u origin hotfix/short-description

# 3. PR directly into main
gh pr create --base main --head hotfix/short-description

# 4. After it merges and prod deploys, sync main back into dev
git checkout dev
git pull --ff-only
git merge main           # brings the hotfix commits into dev
git push origin dev
```

Hotfix PRs **do** require the conventional-commit title; this fix will show up in the next release's notes.

---

## 8. Deployment internals

### Workers

| Worker name | Environment flag | Where it deploys | Trigger |
|-------------|------------------|------------------|---------|
| `limen-dev` | top-level config, explicitly deployed with `--env=` | `https://dev.telotia.com` and `https://limen-dev.<subdomain>.workers.dev` debugging dashboard | Push to `dev` |
| `limen` | `--env production` in `wrangler.jsonc` | `telotia.com` Worker Custom Domain | Push to `main` (release PR merge) |

`dev.telotia.com` and `telotia.com` are managed as Worker Custom Domains in the Cloudflare dashboard, not as `routes` in `wrangler.jsonc`. This keeps GitHub Actions deploy tokens scoped to Worker code deployment instead of requiring route-management permissions on every deploy.

### Build differences

`LIMEN_ENV=dev` renders the dev dashboard in `src/pages/index.astro`. `LIMEN_ENV=prod` renders only "Telotia — Coming soon" with `<meta name="robots" content="noindex,nofollow">` removed (prod is indexed; dev is not).

### Cloudflare account

All Worker deploys go to Cloudflare account `f39fc97d0e872ca3c6cad23b1a7561d6`. This is a personal account used for both SDPS and Telotia infrastructure — see §12 for the long-term plan.

### GitHub Actions secrets needed

- `CLOUDFLARE_API_TOKEN` — token with `Workers Scripts:Edit` + `Account Settings:Read` scopes
- `CLOUDFLARE_ACCOUNT_ID` — `f39fc97d0e872ca3c6cad23b1a7561d6`

Both are repo secrets at *Settings → Secrets and variables → Actions*.

If you add or change Worker Custom Domains through Wrangler later, the token will also need zone-level `Workers Routes:Edit` for `telotia.com`. The current CI path avoids that by keeping custom domains dashboard-managed.

### Domain owner/contact information

🚧 **[HUMAN]** before this is real:

1. Set the Cloudflare Registrar owner/registrant contact email for `telotia.com`, `telotia.ca`, and `telotia.ai` to `hello@telotia.com`.
2. Watch for Cloudflare approval emails. Email/contact changes can require approval from the current and new registrant addresses.
3. Decide whether to opt out of the 60-day transfer lock when Cloudflare presents that option during approval.

### Pointing `telotia.com` at production

Production depends on this one-time Cloudflare dashboard setup:

1. Add `telotia.com` as an active zone in the Cloudflare account.
2. In `Workers & Pages` → `limen` → `Settings` → `Domains & Routes`, attach the Worker Custom Domain `telotia.com`.
3. Keep the custom domain in Cloudflare unless you intentionally move production elsewhere. GitHub Actions deploys Worker code and smoke-tests `https://telotia.com`; it does not recreate the custom domain on every deploy.

---

## 9. The dev page (TODO dashboard)

`src/pages/index.astro` reads from `src/data/dev-status.json` and renders a checklist on `limen-dev` only. To add or update a TODO:

```jsonc
{
  "items": [
    { "text": "Add CLOUDFLARE_API_TOKEN repo secret", "status": "todo", "owner": "@mohan" }
  ]
}
```

`status` is `"todo"` or `"done"`. `owner` is optional (any string — `@mohan`, `tbd`, `design team`, whatever). Commit as `docs(content): update dev-status`.

When the real site is ready, delete this JSON file and replace the whole page.

---

## 10. Common commands

```sh
# Development
bun run dev                          # local dev server (localhost:4321)
bun run check                        # Astro type/content check
bun run build                        # default Astro build (no LIMEN_ENV set → dev page)
bun run build:dev                    # explicit dev build (with dashboard)
bun run build:prod                   # explicit prod build (Coming soon only)
bun run preview                      # preview the last build

# Testing
bun test                             # run the test suite
bun run smoke:dev                    # smoke-test dev.telotia.com
bun run smoke:prod                   # smoke-test telotia.com

# Hooks
bun run hooks:install                # enable .githooks/ (one-time per clone)

# Cloudflare (rarely needed — workflows handle this)
bun run cf:deploy:dev                # manual dev debug-page deploy (needs local wrangler login)
bun run cf:deploy:production         # manual prod deploy
```

---

## 11. Troubleshooting

### "Commit-msg hook rejected my commit"

You wrote a commit message that doesn't match conventional commits. Fix the message and re-commit. If the format is right but commitlint still rejects, check `.commitlintrc.json` for the allowed scopes.

### "CI is failing on PR title lint"

Your PR title isn't in conventional-commit format. Edit the PR title in the GitHub UI — CI will re-run.

### "I pushed a bad commit message directly to my feature branch"

Doesn't matter — feature branches get squashed on merge to dev. The PR title becomes the commit on dev.

### "Dev preview hasn't updated after my merge"

Check `https://github.com/Telotia/Limen/actions`. If `Deploy dev` failed, the previous good build is still live. Fix forward.

### "release-drafter draft has a weird version"

The draft's version is computed from PR titles since the last published release. If you see `v0.0.1` when you expected `v0.1.0`, no feature-typed PR has been merged since the last release. Either intentional or a labeling error — check the PR titles.

### "I need to deploy production NOW without a release PR"

Use the hotfix path (§7). Don't push directly to main — branch protection will block it.

---

## 12. Human action items (🚧)

These can't be automated. Grep the repo for `🚧 [HUMAN]` to find them all at once.

| Item | Where | Owner |
|------|-------|-------|
| Add `CLOUDFLARE_API_TOKEN` repo secret | Settings → Secrets → Actions | @mohan |
| Add `CLOUDFLARE_ACCOUNT_ID` repo secret (value `f39fc97d0e872ca3c6cad23b1a7561d6`) | Settings → Secrets → Actions | @mohan |
| Set owner/registrant contact email for `telotia.com`, `telotia.ca`, and `telotia.ai` to `hello@telotia.com` | Cloudflare Registrar | @mohan |
| Add `telotia.com` as an active Cloudflare zone for the `limen` Worker Custom Domain | Cloudflare dashboard | @mohan |
| **Long-term:** migrate Cloudflare ownership from personal account to a Telotia-owned account when SDPS provides one | Cloudflare dashboard | @mohan |
