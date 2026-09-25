# Vercel adapter: 404 on paths rewritten by Astro middleware

Minimal reproduction for [withastro/astro#18134](https://github.com/withastro/astro/issues/18134).

With `output: 'server'` on `@astrojs/vercel`, any path that **Astro middleware**
rewrites to a valid route (here: locale-prefixed URLs de-localized to clean
paths, the Paraglide JS / i18n pattern) is served with the correct HTML but a
**404 HTTP status**, because Vercel's platform routing layer forces a 404
before the middleware/function runs.

## Try it

**Deployed reproduction:** https://astro-vercel-middleware-rewrite-404.vercel.app

| Path                    | Expected | Actual (bug) |
| ----------------------- | -------- | ------------ |
| `/`                     | 200      | 200          |
| `/about`                | 200      | 200          |
| `/en` (rewritten to `/`) | 200      | **404** (HTML of `/` is rendered) |
| `/en/about` (rewritten to `/about`) | 200 | **404** (HTML of `/about` is rendered) |
| `/nope`                 | 404      | 404          |

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://astro-vercel-middleware-rewrite-404.vercel.app/en/about
# 404  ← wrong: the body is the "About" page
```

## Locally

```bash
npm install
npm run dev
```

In dev (no platform routing layer) `/en/about` correctly returns 200, which
confirms the middleware itself is fine — the 404 is introduced by the deployed
platform configuration.

## How it works

- `astro.config.mjs` — `output: 'server'` + `adapter: vercel()` (defaults)
- `src/middleware.ts` — rewrites `/en[/…]` → `/[/…]` inside the function
- `src/pages/index.astro`, `about.astro`, `404.astro` — clean, unprefixed routes

The generated `.vercel/output/config.json` contains a catch-all route that
forces `status: 404` for every path not in the static route table:

```json
{ "src": "^/.*$", "dest": "_render", "status": 404 }
```

The platform evaluates this before the function runs. Middleware rewrites are
invisible to it, so `/en` and `/en/about` fall into the catch-all and get
stamped `404` — even though the render function produces `200` for the
rewritten request. The fix (PR: https://github.com/withastro/astro/pull/18135)
lets the server-rendered function resolve the real status instead.