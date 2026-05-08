import type { APIRoute } from 'astro'
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, RESEND_API_KEY } from 'astro:env/server'
import { SITE, tourLabels } from '~/lib/site'

export const prerender = false

const TOUR_LABELS = tourLabels()

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function backTo(path: string, search: Record<string, string>) {
  const qs = new URLSearchParams(search).toString()
  return new Response(null, {
    status: 303,
    headers: { Location: `${path}?${qs}` },
  })
}

export const POST: APIRoute = async ({ request }) => {
  let data: FormData | URLSearchParams
  const contentType = request.headers.get('content-type') || ''

  try {
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      data = await request.formData()
    } else if (contentType.includes('application/json')) {
      const json = (await request.json()) as Record<string, unknown>
      data = new URLSearchParams()
      for (const [k, v] of Object.entries(json)) data.set(k, String(v ?? ''))
    } else {
      return backTo('/contact/', { error: 'invalid' })
    }
  } catch {
    return backTo('/contact/', { error: 'invalid' })
  }

  const get = (k: string) => (data.get(k) || '').toString().trim()

  const name = get('name')
  const email = get('email')
  const phone = get('phone')
  const message = get('message')
  const tour = get('tour')
  const about = get('about')
  const groupSize = get('groupSize')
  const preferredDate = get('preferredDate')
  const honeypot = get('website')

  if (honeypot) return backTo('/contact/', { sent: '1' })
  if (!name || !email || !message) return backTo('/contact/', { error: 'missing' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return backTo('/contact/', { error: 'email' })
  if (name.length > 200 || email.length > 200 || message.length > 5000) {
    return backTo('/contact/', { error: 'length' })
  }

  const tourLabel = tour && TOUR_LABELS[tour] ? TOUR_LABELS[tour] : tour || 'General enquiry'
  const aboutLabel = about && TOUR_LABELS[about] ? TOUR_LABELS[about] : about

  const subject =
    tour === 'private-charter' && aboutLabel
      ? `Private charter enquiry · interested in ${aboutLabel}`
      : tour === 'private-charter'
      ? 'Private charter enquiry'
      : tour
      ? `Enquiry · ${tourLabel}`
      : `Website enquiry · ${name}`

  const lines = [
    `<strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;`,
    phone ? `<strong>Phone:</strong> ${escapeHtml(phone)}` : '',
    `<strong>Tour:</strong> ${escapeHtml(tourLabel)}`,
    aboutLabel && tour === 'private-charter' ? `<strong>Originally interested in:</strong> ${escapeHtml(aboutLabel)}` : '',
    groupSize ? `<strong>Group size:</strong> ${escapeHtml(groupSize)}` : '',
    preferredDate ? `<strong>Preferred date:</strong> ${escapeHtml(preferredDate)}` : '',
    '',
    '<strong>Message:</strong>',
    escapeHtml(message).replace(/\n/g, '<br>'),
  ].filter(Boolean)

  const html = `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;">
    ${lines.join('<br>')}
    <hr style="margin-top:24px;border:none;border-top:1px solid #ddd">
    <p style="font-size:12px;color:#666">Sent from ${new URL(SITE.url).hostname}</p>
  </div>`

  const text = lines
    .join('\n')
    .replace(/<strong>|<\/strong>/g, '')
    .replace(/<br>/g, '\n')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  if (!RESEND_API_KEY) {
    console.error('contact form: RESEND_API_KEY not configured')
    return backTo('/contact/', { error: 'config' })
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${SITE.name} <${CONTACT_FROM_EMAIL}>`,
        to: [CONTACT_TO_EMAIL],
        reply_to: email,
        subject,
        html,
        text,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.error('contact form: resend error', res.status, errBody)
      return backTo('/contact/', { error: 'send' })
    }
  } catch (err) {
    console.error('contact form: send threw', err)
    return backTo('/contact/', { error: 'send' })
  }

  return backTo('/contact/', { sent: '1' })
}

export const GET: APIRoute = () => new Response('Method Not Allowed', { status: 405 })
