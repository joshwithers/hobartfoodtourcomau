#!/usr/bin/env node
/**
 * Post-build: wrap dist/server/entry.mjs with a thin fetch handler that
 * implements Accept: text/markdown content negotiation. The wrapper looks up
 * a sibling .md file in the ASSETS binding and serves it with the right
 * Content-Type and x-markdown-tokens header. Falls through to Astro's
 * handler for everything else, so SSR routes and HTML browsers are unaffected.
 *
 * Run after `astro build` and after `build-markdown.mjs`.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SERVER_DIR = join(ROOT, 'dist', 'server')
const ENTRY = join(SERVER_DIR, 'entry.mjs')
const ASTRO_ENTRY = join(SERVER_DIR, 'entry.astro.mjs')

if (!existsSync(ENTRY)) {
  console.error(`[wrap-worker] missing ${relative(ROOT, ENTRY)} — did astro build run?`)
  process.exit(1)
}

const MARKER = '/* markdown-for-agents wrapper */'
const existing = readFileSync(ENTRY, 'utf8')
if (existing.startsWith(MARKER)) {
  console.log('[wrap-worker] entry already wrapped, skipping')
  process.exit(0)
}

renameSync(ENTRY, ASTRO_ENTRY)

const wrapper = `${MARKER}
import astroHandler from './entry.astro.mjs'

// RFC 8288 Link headers for agent discovery.
//   rel="api-catalog"  — RFC 9727; serves a Linkset (RFC 9264) at the bare well-known path
//   rel="describedby"  — IANA, points agents at the LLM-readable site brief
//   rel="sitemap"      — IANA, points crawlers at the sitemap index
// Emitted on every HTML response so agents probing any page can find them.
const DISCOVERY_LINKS = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</llms.txt>; rel="describedby"; type="text/plain"',
  '</sitemap-index.xml>; rel="sitemap"; type="application/xml"',
]

// RFC 9727 §3 + RFC 9264: the api-catalog is a Linkset document. Each linkset
// entry anchors a single API and uses IANA link relations to point at its
// description (OpenAPI), its human docs, and a status endpoint. We currently
// expose a single endpoint (the contact form), so the linkset has one entry.
const API_CATALOG_LINKSET = JSON.stringify({
  linkset: [
    {
      anchor: 'https://hobartfoodtour.com.au/api/contact/',
      'service-desc': [
        { href: 'https://hobartfoodtour.com.au/.well-known/openapi.json', type: 'application/openapi+json' },
      ],
      'service-doc': [
        { href: 'https://hobartfoodtour.com.au/contact/', type: 'text/html' },
      ],
      'service-meta': [
        { href: 'https://hobartfoodtour.com.au/.well-known/api-catalog.json', type: 'application/json', title: 'Human-readable catalog metadata' },
      ],
      status: [
        { href: 'https://hobartfoodtour.com.au/', type: 'text/html', title: 'Site status — 200 OK indicates the API host is reachable' },
      ],
    },
  ],
})

function withTrailingSlash(pathname) {
  return pathname.endsWith('/') ? pathname : pathname + '/'
}

async function tryServeMarkdown(request, env) {
  const url = new URL(request.url)
  const pathname = withTrailingSlash(url.pathname)
  const mdUrl = new URL(pathname + 'index.md', url.origin)
  const mdReq = new Request(mdUrl, { method: 'GET', headers: request.headers })
  const res = await env.ASSETS.fetch(mdReq)
  if (!res.ok) return null
  const text = await res.text()
  const tokens = Math.ceil(text.length / 4)
  const headers = new Headers({
    'Content-Type': 'text/markdown; charset=utf-8',
    'x-markdown-tokens': String(tokens),
    'Vary': 'Accept',
    'Cache-Control': 'public, max-age=300, must-revalidate',
  })
  for (const link of DISCOVERY_LINKS) headers.append('Link', link)
  return new Response(request.method === 'HEAD' ? null : text, { status: 200, headers })
}

function wantsMarkdown(request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false
  const accept = request.headers.get('accept') ?? ''
  if (!accept) return false
  // Explicit text/markdown beats text/html in q-value or order. We accept any
  // accept-list that mentions text/markdown, even alongside text/html — agents
  // often send both.
  return /(?:^|,\\s*)text\\/markdown(?:\\s*;|\\s*,|\\s*$)/i.test(accept)
}

function withDiscoveryLinks(response) {
  const ct = response.headers.get('content-type') || ''
  if (!ct.includes('text/html')) return response
  const headers = new Headers(response.headers)
  for (const link of DISCOVERY_LINKS) headers.append('Link', link)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function serveApiCatalog(request) {
  const headers = new Headers({
    'Content-Type': 'application/linkset+json',
    'Cache-Control': 'public, max-age=3600',
  })
  for (const link of DISCOVERY_LINKS) headers.append('Link', link)
  return new Response(request.method === 'HEAD' ? null : API_CATALOG_LINKSET, {
    status: 200,
    headers,
  })
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    if (url.pathname === '/.well-known/api-catalog' || url.pathname === '/.well-known/api-catalog/') {
      if (request.method === 'GET' || request.method === 'HEAD') {
        return serveApiCatalog(request)
      }
    }
    if (wantsMarkdown(request)) {
      const md = await tryServeMarkdown(request, env)
      if (md) return md
    }
    const response = await astroHandler.fetch(request, env, ctx)
    return withDiscoveryLinks(response)
  },
}
`

writeFileSync(ENTRY, wrapper, 'utf8')
console.log(`[wrap-worker] wrapped ${relative(ROOT, ENTRY)} (original moved to entry.astro.mjs)`)
