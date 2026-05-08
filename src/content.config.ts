import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { glob } from 'astro/loaders'

const tourCategories = [
  'beer',
  'craft-beer',
  'cider',
  'distillery',
  'spirits',
  'food',
  'history',
  'private',
] as const

const itineraryStop = z.object({
  /** Optional — leave blank on bespoke / private-charter tours where timing is flexible. */
  time: z.string().optional(),
  title: z.string(),
  note: z.string().optional(),
})

const tours = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/tours' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    summary: z.string(),
    badge: z.string().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(0),

    /* Pricing & duration */
    price: z.number(),
    currency: z.string().default('AUD'),
    duration: z.string(),
    durationShort: z.string(),
    durationISO: z.string().optional(),

    /* Logistics */
    departs: z.string(),
    daysOfWeek: z.array(z.string()).default([]),
    meetingPoint: z.string(),
    meetingAddress: z.string(),
    groupSize: z.string().default('Up to 12 guests'),
    minimumAge: z.number().default(18),

    /* Categorisation */
    categories: z.array(z.enum(tourCategories)).default(['craft-beer']),
    inclusions: z.array(z.string()).default([]),

    /* Content */
    itinerary: z.array(itineraryStop).default([]),
    highlights: z.array(z.string()).default([]),
    faq: z
      .array(
        z.object({
          q: z.string(),
          a: z.string(),
        })
      )
      .default([]),

    /* Reviews */
    rating: z.number().min(0).max(5).default(4.9),
    reviewCount: z.number().default(0),

    /* Booking */
    bookingProvider: z.enum(['fareharbor', 'getyourguide', 'external', 'enquiry']).default('enquiry'),
    bookingUrl: z.url().optional(),
    fareharborFlow: z.string().optional(),
    fareharborItem: z.string().optional(),

    /* SEO / OG */
    ogImage: z.string().optional(),
    keywords: z.array(z.string()).default([]),

    /* Optional bespoke hero illustration — when set, replaces the generated Postcard on the tour detail page. */
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),

    /* Visual swatch (3 hex colors) used by hand-drawn postcard */
    swatch: z.tuple([z.string(), z.string(), z.string()]).default(['#b3651e', '#e0b04a', '#2c2118']),
    sceneKey: z.enum(['hops', 'pub', 'distillery', 'bridge', 'lake', 'axes', 'bus', 'beers', 'crowd']).default('hops'),

    publishDate: z.coerce.date().default(() => new Date()),
    updatedDate: z.coerce.date().optional(),
  }),
})

const featureKeys = [
  'medals',
  'city-map',
  'winter',
  'still',
  'coach',
  'flowers',
  'water',
  'two-cities',
  'boots',
  'checklist',
] as const

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    /** Optional override for the <title> tag. Use when the editorial title runs long for SERP. */
    seoTitle: z.string().optional(),
    description: z.string(),
    kicker: z.string().default('Field notes'),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    readingTime: z.string(),
    author: z.string().default('Dave'),
    city: z.string(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    keywords: z.array(z.string()).default([]),
    ogImage: z.string().optional(),

    /* Feature image */
    featureKey: z.enum(featureKeys).default('city-map'),
    featureSwatch: z.tuple([z.string(), z.string(), z.string()]).default(['#3a2418', '#a85a2c', '#e6c79a']),
  }),
})

const regions = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/regions' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    summary: z.string(),
    state: z.string(),
    tourCount: z.number(),
    departureCity: z.string(),
    drinks: z.array(z.string()).default([]),
    highlights: z.array(z.string()).default([]),
    bookingUrl: z.url().optional(),
    swatch: z.tuple([z.string(), z.string(), z.string()]).default(['#2a6f8f', '#e6c79a', '#3a2418']),
    sceneKey: z.enum(['sydney', 'hobart', 'hunter', 'melbourne', 'brisbane', 'cairns', 'adelaide', 'perth', 'margaret-river', 'darwin']).default('sydney'),
    order: z.number().default(0),
    keywords: z.array(z.string()).default([]),
  }),
})

const merch = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/merch' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    summary: z.string(),
    badge: z.string().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(0),

    /* Pricing */
    price: z.number(),
    currency: z.string().default('AUD'),

    /* FareHarbor item code (e.g. "82343"). Buyers are sent to the
     * https://fareharbor.com/embeds/book/daves/items/<item>/ flow which
     * handles size selection, payment and shipping. */
    fareharborItem: z.string(),
    /* Optional FareHarbor flow ID — appended as ?flow=<flow>. The Daves
     * group-wide flow is "319240"; leave unset to use the default flow. */
    fareharborFlow: z.string().optional(),

    /* Inventory display (size selection happens in Stripe checkout) */
    sizes: z.array(z.string()).default([]),
    inStock: z.boolean().default(true),

    /* Images — hero + up to 5 gallery shots */
    heroImage: z.string(),
    heroImageAlt: z.string().default(''),
    gallery: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string().default(''),
        })
      )
      .max(5)
      .default([]),

    /* SEO / OG */
    keywords: z.array(z.string()).default([]),
    ogImage: z.string().optional(),

    publishDate: z.coerce.date().default(() => new Date()),
    updatedDate: z.coerce.date().optional(),
  }),
})

export const collections = { tours, posts, regions, merch }
