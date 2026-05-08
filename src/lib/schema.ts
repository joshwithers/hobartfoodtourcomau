import { SITE } from './site'

const orgId = `${SITE.url}/#organization`

const orgImage = new URL(SITE.defaultOgImage, SITE.url).href

function withTrailingSlash(path: string) {
  if (!path.startsWith('/')) path = `/${path}`
  const [pathname, ...rest] = path.split(/(?=[?#])/)
  const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`
  return [normalized, ...rest].join('')
}

function pageUrl(path: string) {
  return new URL(withTrailingSlash(path), SITE.url).href
}

/**
 * Static organization graph node — TravelAgency + TourOperator + LocalBusiness.
 * Emitted on every page via Base.astro. Pages with the tours collection loaded
 * (homepage, tours index) should use buildOrganizationWithCatalog() instead to
 * also include aggregateRating + hasOfferCatalog.
 */
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': ['TravelAgency', 'LocalBusiness'],
  '@id': orgId,
  name: SITE.name,
  legalName: SITE.legalName,
  url: `${SITE.url}/`,
  logo: `${SITE.url}/favicon.svg`,
  image: orgImage,
  description: SITE.description,
  email: SITE.email,
  telephone: SITE.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: SITE.address.street,
    addressLocality: SITE.address.locality,
    addressRegion: SITE.address.region,
    postalCode: SITE.address.postcode,
    addressCountry: SITE.address.country,
  },
  areaServed: SITE.areaServed,
  knowsAbout: SITE.knowsAbout,
  priceRange: SITE.priceRange,
  paymentAccepted: ['Credit Card', 'Debit Card', 'Bank Transfer'],
  currenciesAccepted: 'AUD',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '09:00',
      closes: '19:00',
      validFrom: '2025-01-01',
    },
  ],
  sameAs: Object.values(SITE.social),
} as const

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE.url}/#website`,
  url: `${SITE.url}/`,
  name: SITE.name,
  publisher: { '@id': orgId },
  inLanguage: 'en-AU',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE.url}/journal/?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: pageUrl(it.url),
    })),
  }
}

interface TourEntry {
  id: string
  data: {
    title: string
    description: string
    summary: string
    price: number
    currency: string
    duration: string
    durationISO?: string
    departs: string
    daysOfWeek: string[]
    meetingPoint: string
    meetingAddress: string
    minimumAge: number
    rating: number
    reviewCount: number
    categories: readonly string[] | string[]
    inclusions: string[]
    itinerary: { time: string; title: string; note?: string }[]
    publishDate: Date
    updatedDate?: Date
    keywords: string[]
    ogImage?: string
  }
}

/**
 * Per-tour schema — multi-typed as Product + TouristTrip so it can show in both
 * travel rich results and product/shopping results.
 */
export function tourSchema(entry: TourEntry, url: string) {
  const fullUrl = pageUrl(url)
  const image = entry.data.ogImage
    ? new URL(entry.data.ogImage, SITE.url).href
    : orgImage

  // Price valid for one year from publish (or last update)
  const validFrom = entry.data.updatedDate ?? entry.data.publishDate
  const validUntil = new Date(validFrom)
  validUntil.setFullYear(validUntil.getFullYear() + 1)

  const meetingPlace = {
    '@type': 'Place' as const,
    name: entry.data.meetingPoint,
    address: entry.data.meetingAddress,
  }

  const itineraryStops = entry.data.itinerary.map((stop) => ({
    '@type': 'Place' as const,
    name: stop.title,
    ...(stop.note ? { description: stop.note } : {}),
  }))

  // Tours are services, not shipped goods — but the multi-typed Product
  // schema makes Google Search Console flag missing shipping/return fields.
  // We declare the real-world equivalents: zero-cost "shipping" (the guest
  // shows up, nothing is mailed) and a return policy that mirrors our
  // 24-hour cancellation window.
  const shippingDetails = {
    '@type': 'OfferShippingDetails' as const,
    shippingRate: {
      '@type': 'MonetaryAmount' as const,
      value: '0',
      currency: entry.data.currency,
    },
    shippingDestination: {
      '@type': 'DefinedRegion' as const,
      addressCountry: 'AU',
    },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime' as const,
      handlingTime: { '@type': 'QuantitativeValue' as const, minValue: 0, maxValue: 0, unitCode: 'DAY' },
      transitTime: { '@type': 'QuantitativeValue' as const, minValue: 0, maxValue: 0, unitCode: 'DAY' },
    },
  }

  const merchantReturnPolicy = {
    '@type': 'MerchantReturnPolicy' as const,
    applicableCountry: 'AU',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 1,
    returnFees: 'https://schema.org/FreeReturn',
    returnMethod: 'https://schema.org/ReturnByMail',
  }

  return {
    '@context': 'https://schema.org',
    '@type': ['Product', 'TouristTrip'],
    '@id': `${fullUrl}#tour`,
    name: entry.data.title,
    description: entry.data.description,
    url: fullUrl,
    image,
    provider: { '@id': orgId },
    // Google's structured-data validator wants brand as a Brand/Organization
    // object with a name, not a JSON-LD reference. Inline the values rather
    // than @id-pointing at the org node.
    brand: {
      '@type': 'Brand' as const,
      name: SITE.name,
    },
    category: 'Travel & Tours',
    touristType: ['Food enthusiasts', 'Food and drink travelers', 'Couples', 'Families', 'Small groups'],
    audience: {
      '@type': 'PeopleAudience',
      audienceType: 'Adults',
      suggestedMinAge: entry.data.minimumAge,
    },
    itinerary: {
      '@type': 'ItemList',
      numberOfItems: 1 + itineraryStops.length,
      itemListElement: [meetingPlace, ...itineraryStops],
    },
    offers: {
      '@type': 'Offer',
      url: fullUrl,
      price: entry.data.price.toFixed(2),
      priceCurrency: entry.data.currency,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      validFrom: validFrom.toISOString(),
      priceValidUntil: validUntil.toISOString().slice(0, 10),
      eligibleRegion: { '@type': 'Country', name: 'AU' },
      seller: { '@id': orgId },
      shippingDetails,
      hasMerchantReturnPolicy: merchantReturnPolicy,
    },
    aggregateRating:
      entry.data.reviewCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: entry.data.rating.toFixed(1),
            reviewCount: entry.data.reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    keywords: entry.data.keywords.join(', '),
  }
}

/**
 * Enriched organization graph node — basic org plus aggregateRating computed
 * from all tours, plus a hasOfferCatalog listing every tour with its price.
 * Use on the homepage and the tours index.
 */
export function buildOrganizationWithCatalog(tours: TourEntry[]) {
  const totalReviews = tours.reduce((s, t) => s + t.data.reviewCount, 0)
  const ratedTours = tours.filter((t) => t.data.reviewCount > 0)
  const avgRating = totalReviews
    ? ratedTours.reduce((s, t) => s + t.data.rating * t.data.reviewCount, 0) / totalReviews
    : null

  return {
    ...organizationSchema,
    aggregateRating: avgRating
      ? {
          '@type': 'AggregateRating',
          ratingValue: avgRating.toFixed(1),
          reviewCount: totalReviews,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${SITE.address.locality} tours`,
      itemListElement: tours.map((t) => {
        const tourUrl = pageUrl(`/tours/${t.id}`)
        return {
          '@type': 'Offer',
          url: tourUrl,
          price: t.data.price.toFixed(2),
          priceCurrency: t.data.currency,
          availability: 'https://schema.org/InStock',
          itemOffered: {
            '@type': 'TouristTrip',
            '@id': `${tourUrl}#tour`,
            name: t.data.title,
            description: t.data.summary,
            url: tourUrl,
          },
        }
      }),
    },
  }
}

interface MerchEntry {
  id: string
  data: {
    title: string
    description: string
    summary: string
    price: number
    currency: string
    fareharborItem: string
    fareharborFlow?: string
    sizes: string[]
    inStock: boolean
    heroImage: string
    heroImageAlt: string
    gallery: { src: string; alt: string }[]
    keywords: string[]
    ogImage?: string
    publishDate: Date
    updatedDate?: Date
  }
}

export function fareharborMerchUrl(item: string, flow?: string) {
  const qs = new URLSearchParams({ 'full-items': 'yes' })
  if (flow) qs.set('flow', flow)
  return `https://fareharbor.com/embeds/book/daves/items/${item}/?${qs.toString()}`
}

/**
 * Per-merch-item schema — Product with Offer pointing at the Stripe Payment
 * Link. Includes the same shipping/return fields tour offers carry, since
 * Search Console rejects Product schemas without them.
 */
export function merchSchema(entry: MerchEntry, url: string) {
  const fullUrl = pageUrl(url)
  const heroAbs = new URL(entry.data.heroImage, SITE.url).href
  const galleryAbs = entry.data.gallery.map((g) => new URL(g.src, SITE.url).href)
  const images = [heroAbs, ...galleryAbs]

  const validFrom = entry.data.updatedDate ?? entry.data.publishDate
  const validUntil = new Date(validFrom)
  validUntil.setFullYear(validUntil.getFullYear() + 1)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${fullUrl}#product`,
    name: entry.data.title,
    description: entry.data.description,
    url: fullUrl,
    image: images,
    brand: { '@type': 'Brand' as const, name: SITE.name },
    category: 'Apparel & Accessories',
    ...(entry.data.sizes.length > 0
      ? { size: entry.data.sizes.join(', ') }
      : {}),
    offers: {
      '@type': 'Offer' as const,
      url: fareharborMerchUrl(entry.data.fareharborItem, entry.data.fareharborFlow),
      price: entry.data.price.toFixed(2),
      priceCurrency: entry.data.currency,
      availability: entry.data.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      validFrom: validFrom.toISOString(),
      priceValidUntil: validUntil.toISOString().slice(0, 10),
      seller: { '@id': orgId },
      shippingDetails: {
        '@type': 'OfferShippingDetails' as const,
        shippingRate: {
          '@type': 'MonetaryAmount' as const,
          value: '10',
          currency: entry.data.currency,
        },
        shippingDestination: {
          '@type': 'DefinedRegion' as const,
          addressCountry: 'AU',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime' as const,
          handlingTime: { '@type': 'QuantitativeValue' as const, minValue: 1, maxValue: 2, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue' as const, minValue: 2, maxValue: 7, unitCode: 'DAY' },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy' as const,
        applicableCountry: 'AU',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnFees: 'https://schema.org/FreeReturn',
        returnMethod: 'https://schema.org/ReturnByMail',
      },
    },
    keywords: entry.data.keywords.join(', '),
  }
}

interface PostEntry {
  id: string
  data: {
    title: string
    description: string
    publishDate: Date
    updatedDate?: Date
    author: string
    keywords: string[]
  }
}

export function articleSchema(entry: PostEntry, url: string) {
  const fullUrl = pageUrl(url)
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${fullUrl}#article`,
    headline: entry.data.title,
    description: entry.data.description,
    url: fullUrl,
    datePublished: entry.data.publishDate.toISOString(),
    dateModified: (entry.data.updatedDate ?? entry.data.publishDate).toISOString(),
    author: { '@type': 'Person', name: entry.data.author },
    publisher: { '@id': orgId },
    mainEntityOfPage: fullUrl,
    keywords: entry.data.keywords.join(', '),
    inLanguage: 'en-AU',
  }
}

export function faqSchema(faq: { q: string; a: string }[]) {
  if (faq.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

export function aboutPageSchema(url: string, description: string) {
  const fullUrl = pageUrl(url)
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${fullUrl}#about`,
    url: fullUrl,
    name: `About ${SITE.name}`,
    description,
    inLanguage: 'en-AU',
    isPartOf: { '@id': `${SITE.url}/#website` },
    about: { '@id': orgId },
  }
}

export function contactPageSchema(url: string, description: string) {
  const fullUrl = pageUrl(url)
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${fullUrl}#contact`,
    url: fullUrl,
    name: `Contact ${SITE.name}`,
    description,
    inLanguage: 'en-AU',
    isPartOf: { '@id': `${SITE.url}/#website` },
    mainEntity: { '@id': orgId },
  }
}

/**
 * TouristDestination schema for the region — emitted on the homepage
 * to give Google/AI a clear "this site is about <locality>-as-destination" signal.
 */
export const destinationSchema = {
  '@context': 'https://schema.org',
  '@type': 'TouristDestination',
  '@id': `${SITE.url}/#destination`,
  name: SITE.address.locality,
  description: SITE.destinationDescription,
  url: `${SITE.url}/`,
  containedInPlace: {
    '@type': 'AdministrativeArea',
    name: SITE.areaServed[1]?.name ?? SITE.address.region,
  },
  touristType: ['Food enthusiasts', 'Food and drink travelers', 'Cultural tourists'],
  includesAttraction: SITE.attractions.map((a) => ({
    '@type': 'TouristAttraction' as const,
    name: a.name,
    ...(a.address ? { address: a.address } : {}),
  })),
}
