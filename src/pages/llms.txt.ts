import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'
import { SITE } from '~/lib/site'

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

function formatDays(days: string[]) {
  if (!days.length) return 'By arrangement'
  if (days.length === 7) return 'Any day'
  const sorted = [...days].sort((a, b) => DAY_ORDER.indexOf(a as (typeof DAY_ORDER)[number]) - DAY_ORDER.indexOf(b as (typeof DAY_ORDER)[number]))
  return sorted.join(', ')
}

export async function GET(context: APIContext) {
  const site = context.site?.href.replace(/\/$/, '') ?? SITE.url
  const tours = (await getCollection('tours')).sort((a, b) => a.data.order - b.data.order)
  const regions = (await getCollection('regions')).sort((a, b) => a.data.order - b.data.order)

  const publicTours = tours.filter((t) => t.data.bookingProvider !== 'enquiry')
  const privateTours = tours.filter((t) => t.data.bookingProvider === 'enquiry')

  const lines: string[] = []

  lines.push(`# ${SITE.name}`, '')
  lines.push(
    `> ${SITE.description} A Daves company, running since ${SITE.established}. Every guide is a Dave — the company isn't a person, it's the format. We are all Dave. Daves is all of us. We take care of the details. You bring your appetite.`,
    ''
  )
  lines.push(
    `The flagship Hobart food tour meets at Machine Laundry Cafe in Salamanca Square at 10:30am on weekdays. Walking only, all-ages welcome, no booking fees. Free cancellation up to 24 hours before departure.`,
    ''
  )

  lines.push('## Public tours', '')
  for (const t of publicTours) {
    const url = `${site}/tours/${t.id}/`
    const days = formatDays(t.data.daysOfWeek)
    lines.push(
      `- [${t.data.title}](${url}): ${t.data.summary} ${t.data.duration}. ${days}. A$${t.data.price} per adult (${t.data.minimumAge}+).`
    )
  }
  lines.push('')

  if (privateTours.length) {
    lines.push('## By enquiry & private groups', '')
    for (const t of privateTours) {
      const url = `${site}/tours/${t.id}/`
      lines.push(`- [${t.data.title}](${url}): ${t.data.summary} ${t.data.duration}. ${t.data.groupSize}. By enquiry.`)
    }
    lines.push('')
  }

  lines.push('## Company', '')
  lines.push(
    `- [About ${SITE.name}](${site}/about/): The flagship Daves tour in ${SITE.address.locality} — a small-group walking food tour of Salamanca and the Hobart waterfront. ${SITE.address.locality} crew opened in ${SITE.established}. Every guide is a Dave — the company isn't a person, it's the format: small group, local Dave, makers doing the talking. Member of Tourism Industry Council ${SITE.address.region}, A$20m public liability cover. We are all Dave. Daves is all of us.`
  )
  lines.push(
    `- [Contact](${site}/contact/): Phone ${SITE.phone}, email ${SITE.email}, private groups ${SITE.salesEmail}.`
  )
  lines.push(
    `- [Field journal](${site}/journal/): Articles on ${SITE.address.locality}'s eating scene, Tasmanian seasonal produce, and how we pick the food stops.`
  )
  lines.push('')

  const merch = (await getCollection('merch')).sort((a, b) => a.data.order - b.data.order)
  if (merch.length) {
    lines.push('## Merch', '')
    for (const m of merch) {
      const u = `${site}/merch/${m.id}/`
      lines.push(
        `- [${m.data.title}](${u}): ${m.data.summary} A$${m.data.price}. ${m.data.inStock ? 'In stock.' : 'Sold out.'} Sold via FareHarbor (item ${m.data.fareharborItem}).`
      )
    }
    lines.push('')
  }

  if (regions.length) {
    lines.push('## Optional', '')
    const regionList = regions.map((r) => r.data.title).join(', ')
    lines.push(`- [Other regions we run](${site}/regions/): ${regionList}.`)
    lines.push('')
  }

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
