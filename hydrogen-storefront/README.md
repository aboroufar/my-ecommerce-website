# Hydrogen template: Skeleton

Hydrogen is Shopify’s stack for headless commerce. Hydrogen is designed to dovetail with [Remix](https://remix.run/), Shopify’s full stack web framework. This template contains a **minimal setup** of components, queries and tooling to get started with Hydrogen.

[Check out Hydrogen docs](https://shopify.dev/custom-storefronts/hydrogen)
[Get familiar with Remix](https://remix.run/docs/en/v1)

## What's included

- Remix
- Hydrogen
- Oxygen
- Vite
- Shopify CLI
- ESLint
- Prettier
- GraphQL generator
- TypeScript and JavaScript flavors
- Minimal setup of components and routes

## Getting started

**Requirements:**

- Node.js version 18.0.0 or higher

```bash
npm create @shopify/hydrogen@latest
```

## Building for production

```bash
npm run build
```

## Local development

```bash
npm run dev
```

## Setup for using Customer Account API (`/account` section)

Follow step 1 and 2 of <https://shopify.dev/docs/custom-storefronts/building-with-the-customer-account-api/hydrogen#step-1-set-up-a-public-domain-for-local-development>

## Local setup notes (this checkout)

- **Node version**: this scaffold requires Node `^22 || ^24` (see `package.json` `engines`). If your default `node` is a newer major (e.g. 25.x), MiniOxygen's Cloudflare Workers runtime emulator will fail confusingly. Run with an explicit Node 24 binary instead of changing your system default, e.g. via Homebrew's keg-only `node@24`:
  ```bash
  PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run dev
  ```
- **Vite pinned to 7.x, not the scaffold's default 8.x**: as generated (Hydrogen 2026.4.3), this template defaults to Vite 8 with `resolve.tsconfigPaths: true`. In this checkout that combination failed to resolve `~/` path aliases inside MiniOxygen's SSR module graph (`Cannot find module '~/assets/favicon.svg'` etc.), reproducible even from a clean `node_modules/.vite` cache — looks like an upstream compatibility gap since Vite 8 support was only added in the immediately preceding Hydrogen patch (2026.4.2). Worked around by pinning `vite: ^7.1.0` and adding the `vite-tsconfig-paths` plugin explicitly in `vite.config.js` (Vite 7 doesn't have native `resolve.tsconfigPaths` support). Worth retrying Vite 8 on a later Hydrogen patch release.
- **No real store connected**: scaffolded with `--mock-shop`, so it's running against Shopify's public `mock.shop` demo data — no Partner account or dev store needed to explore the framework. Run `npx shopify hydrogen link` once you have a real store to connect it.
