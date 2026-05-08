import sharp from 'sharp'
import { readFileSync, statSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

const svg = readFileSync(resolve(root, 'public/og-default.svg'))

// 1) OG image — 1200×630 (the OG-spec 1.91:1) JPEG. Sharp will render the SVG
//    at 2× density and resize to fit. We use cover-with-attention so the city
//    silhouette stays vertically centred even after the 16:9 → 1.91:1 crop.
const ogPath = resolve(root, 'public/og-default.jpg')
await sharp(svg, { density: 200 })
  .resize(1200, 630, { fit: 'cover', position: 'attention' })
  .jpeg({ quality: 82, mozjpeg: true, progressive: true })
  .toFile(ogPath)

// 2) Hero image — 1600×900 WebP at quality 80. Wire size is dramatically smaller
//    than the source SVG (which is ~1.1 MB even after svgo) and decodes faster
//    above the fold. A 2× retina version is also rendered for hi-DPI displays.
const heroPath = resolve(root, 'public/hobart-hero.webp')
await sharp(svg, { density: 200 })
  .resize(1600, 900)
  .webp({ quality: 80, effort: 6 })
  .toFile(heroPath)

const hero2xPath = resolve(root, 'public/hobart-hero@2x.webp')
await sharp(svg, { density: 300 })
  .resize(3200, 1800)
  .webp({ quality: 78, effort: 6 })
  .toFile(hero2xPath)

function kb(p) {
  return `${(statSync(p).size / 1024).toFixed(0)} KB`
}

console.log(`Wrote public/og-default.jpg     1200×630 JPEG · ${kb(ogPath)}`)
console.log(`Wrote public/hobart-hero.webp   1600×900 WebP · ${kb(heroPath)}`)
console.log(`Wrote public/hobart-hero@2x.webp 3200×1800 WebP · ${kb(hero2xPath)}`)
