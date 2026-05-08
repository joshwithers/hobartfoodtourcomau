#!/usr/bin/env node
/**
 * Post-build: generate index.md alongside every prerendered index.html in
 * dist/client/, so the worker can serve Markdown for Agents (Accept: text/markdown).
 *
 *  - Extracts <main> only (drops header/footer/nav chrome).
 *  - Strips scripts, styles, decorative SVG and aria-hidden subtrees.
 *  - Converts via turndown with sane defaults (ATX headings, fenced code, GFM-ish).
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'
import { parse } from 'node-html-parser'
import TurndownService from 'turndown'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DIST = join(ROOT, 'dist', 'client')

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('_')) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (name === 'index.html' || name === '404.html') out.push(full)
  }
  return out
}

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
  hr: '---',
  linkStyle: 'inlined',
})

turndown.remove(['script', 'style', 'noscript', 'svg'])

turndown.addRule('strip-aria-hidden', {
  filter: (node) => node.getAttribute && node.getAttribute('aria-hidden') === 'true',
  replacement: () => '',
})

turndown.addRule('strip-skip-link', {
  filter: (node) =>
    node.nodeName === 'A' &&
    typeof node.getAttribute === 'function' &&
    (node.getAttribute('class') ?? '').split(/\s+/).includes('skip-link'),
  replacement: () => '',
})

const files = walk(DIST)
let written = 0

for (const html of files) {
  const src = readFileSync(html, 'utf8')
  const root = parse(src, { blockTextElements: { script: true, style: true } })

  const main = root.querySelector('main') ?? root
  for (const el of main.querySelectorAll('script, style, noscript, svg')) el.remove()
  for (const el of main.querySelectorAll('[aria-hidden="true"]')) el.remove()
  for (const el of main.querySelectorAll('.skip-link')) el.remove()

  const title = root.querySelector('title')?.text?.trim() ?? ''
  const desc = root.querySelector('meta[name="description"]')?.getAttribute('content') ?? ''
  const canonical = root.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? ''

  const body = turndown.turndown(main.toString()).trim()

  const frontmatter = [
    '---',
    title && `title: ${JSON.stringify(title)}`,
    desc && `description: ${JSON.stringify(desc)}`,
    canonical && `canonical: ${JSON.stringify(canonical)}`,
    'generated_by: build-markdown.mjs',
    '---',
    '',
  ].filter(Boolean).join('\n')

  const output = `${frontmatter}\n${body}\n`

  const mdPath = html.replace(/\.html$/, '.md')
  writeFileSync(mdPath, output, 'utf8')
  written++
}

console.log(`[markdown] wrote ${written} .md files under ${relative(ROOT, DIST)}/`)
