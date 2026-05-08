# Daves Brewery Tours — Astro Template

Reusable template for deploying region-specific Daves brewery tour websites.

## Stack

- **Astro 6** with MDX, Sitemap
- **Tailwind CSS 4** via Vite plugin
- **Cloudflare Workers** adapter
- **Resend** for contact form emails
- Content collections: `tours`, `regions`, `posts`

## Setup for a new region

### 1. Edit `src/lib/site.ts`

This is the **single config file** for all region-specific values:

- Identity: `name`, `shortName`, `brandLine1`, `brandLine2`, `description`, `url`
- Contact: `email`, `phone`, `salesEmail`
- Address: `locality`, `region`, `country`
- Business: `abn`, `legalName`, `established`, `priceRange`
- Social: Instagram, Facebook, YouTube, TripAdvisor URLs
- `tourOptions`: array for the contact form dropdown — keep in sync with your `src/content/tours/` slugs
- `aboutVenues`: two venues shown in the AboutStrip SVG art
- `awards`: array of awards shown in the about section
- `press`: array of press mentions for the marquee
- Schema SEO: `knowsAbout`, `areaServed`, `attractions`, `destinationDescription`
- Navigation: `NAV_PRIMARY`, `NAV_FOOTER`

### 2. Update config files

- `astro.config.ts` — set `site` to your production URL and update email defaults
- `wrangler.jsonc` — set `name` to your Cloudflare Worker name
- `package.json` — set `name`
- `public/robots.txt` — update sitemap URL

### 3. Add content

- `src/content/tours/` — one `.md` per tour (see `example-tour.md` for frontmatter schema)
- `src/content/regions/` — one `.md` per sister region (see `sydney.md`)
- `src/content/posts/` — journal posts (see `example-post.md`)

### 4. Add OG image

Place your OG image SVG at `public/og-default.svg`, then run `npm run render-og` to generate the JPEG.

### 5. Deploy

```bash
npm install
npm run build
npx wrangler deploy
npx wrangler secret put RESEND_API_KEY
```

## Content schemas

See `src/content.config.ts` for the full Zod schemas. Key fields:

**Tours**: title, description, summary, price, duration, departs, meetingPoint, categories, itinerary, faq, bookingProvider (fareharbor/getyourguide/external/enquiry), swatch, sceneKey

**Regions**: title, description, summary, state, tourCount, departureCity, drinks, highlights, swatch, sceneKey

**Posts**: title, description, kicker, publishDate, readingTime, author, city, tags, featureKey, featureSwatch

## Architecture notes

- All region-specific text interpolates from `SITE` config — no hardcoded city names in pages/components
- `src/lib/schema.ts` generates structured data (JSON-LD) from SITE config
- The contact form POSTs to `/api/contact` which sends via Resend
- The `tourLabels()` helper in site.ts derives tour name lookups from `tourOptions`
- SVG illustrations are inline (no image dependencies) — Postcard scenes for tours, RegionScene for regions, PostFeature for journal posts
- Site uses `trailingSlash: 'always'` — every internal href, canonical, and JSON-LD URL ends with `/`. The middleware-style helpers in `lib/schema.ts` (`pageUrl`, `withTrailingSlash`) and `components/SEO.astro` enforce this regardless of caller input.

## Markdown for Agents

Pages are served with content negotiation: agents that send `Accept: text/markdown` get a Markdown response, browsers continue to get HTML.

Implementation:
- `scripts/build-markdown.mjs` runs after `astro build` and walks `dist/client/**/index.html`. For each, it extracts the `<main>` element, strips scripts/styles/SVG/aria-hidden, runs `turndown` with sensible defaults, and writes a sibling `index.md` with YAML frontmatter (title, description, canonical).
- `scripts/wrap-worker.mjs` then wraps `dist/server/entry.mjs` with a thin fetch handler that intercepts `Accept: text/markdown`, serves the sibling `.md` from the ASSETS binding, and sets `Content-Type: text/markdown; charset=utf-8`, `Vary: Accept`, and `x-markdown-tokens: <approx-count>`. Everything else falls through to Astro.
- `wrangler.jsonc` sets `assets.run_worker_first: true` so the wrapper runs before the static-asset binding (default would otherwise serve the HTML before the wrapper sees it).
- SSR routes (e.g. `/contact/`) and assets without an `.md` sibling fall through to HTML naturally.

To verify after deploy:
```sh
curl -sI -H "Accept: text/markdown" https://your.site/about/ \
  | grep -iE 'content-type|x-markdown-tokens|vary'
```
Expected: `Content-Type: text/markdown; charset=utf-8`, `x-markdown-tokens: <n>`, `Vary: Accept`.
