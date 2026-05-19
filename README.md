# Limen

> *limen* (Latin): the stone at the base of a doorway — the threshold one crosses to enter.
> Root of *liminal*.

Limen is the codename and repo for **Telotia's** website at `telotia.com`. This README is intentionally thin and will fill out with the project's aesthetic, voice, and design philosophy as those crystallize.

For everything operational — how to set up locally, the branching model, conventional-commit rules, how to ship — see **[CONTRIBUTING.md](./CONTRIBUTING.md)**.

## Quick start

```sh
bun install
bun run hooks:install   # one-time: enable commit-msg + pre-push hooks
bun run dev             # http://localhost:4321
```

## What you're shipping

- **Production** → `limen` Worker → `telotia.com` (shows only "Coming soon" until launch)
- **Dev preview** → `limen-dev` Worker → `dev.telotia.com` and `limen-dev.<subdomain>.workers.dev` (shows the debugging dashboard)

Same Astro page, two builds. The `LIMEN_ENV` env var switches between them.

## Stack

Astro 6 (static) · TypeScript (strict) · Bun · Cloudflare Workers (assets-only) · Wrangler 4
