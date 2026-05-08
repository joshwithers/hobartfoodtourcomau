#!/usr/bin/env node
/**
 * Post-build: generate /.well-known/agent-skills/index.json by walking the
 * sibling SKILL.md files and computing their sha256 digests.
 *
 * Implements the Agent Skills Discovery RFC v0.2.0 from Cloudflare:
 *   https://github.com/cloudflare/agent-skills-discovery-rfc
 *
 * Each entry in the index points at a SKILL.md file and pins its content via
 * sha256 so consumers can detect drift between the index and the skill body.
 */

import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SKILLS_SRC = join(ROOT, 'public', '.well-known', 'agent-skills')
// Astro copies public/ → dist/client/. We write the index into dist/client/ so
// it's always fresh on deploy without committing a generated file to source.
const SKILLS_DIST = join(ROOT, 'dist', 'client', '.well-known', 'agent-skills')
const INDEX_PATH = join(SKILLS_DIST, 'index.json')

function parseFrontmatter(text) {
  if (!text.startsWith('---')) return {}
  const end = text.indexOf('\n---', 3)
  if (end === -1) return {}
  const block = text.slice(3, end)
  const out = {}
  for (const raw of block.split('\n')) {
    const m = raw.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/)
    if (!m) continue
    let [, key, value] = m
    value = value.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
    out[key] = value
  }
  return out
}

const skills = []

for (const entry of readdirSync(SKILLS_SRC)) {
  const dir = join(SKILLS_SRC, entry)
  if (!statSync(dir).isDirectory()) continue
  const skillPath = join(dir, 'SKILL.md')
  let body
  try { body = readFileSync(skillPath, 'utf8') } catch { continue }

  const fm = parseFrontmatter(body)
  const sha256 = createHash('sha256').update(body).digest('hex')

  skills.push({
    name: fm.name ?? entry,
    type: 'skill',
    description: fm.description ?? '',
    url: `/.well-known/agent-skills/${entry}/SKILL.md`,
    sha256,
  })
}

skills.sort((a, b) => a.name.localeCompare(b.name))

const index = {
  $schema: 'https://agentskills.io/schemas/v0.2.0/index.json',
  generated: new Date().toISOString(),
  skills,
}

writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + '\n', 'utf8')
console.log(
  `[agent-skills] wrote ${relative(ROOT, INDEX_PATH)} (${skills.length} skill${skills.length === 1 ? '' : 's'})`
)
