// ─────────────────────────────────────────────────────────────
// SITE CONFIG — edit this file to set up a new region
// ─────────────────────────────────────────────────────────────

export const SITE = {
  // ── Identity ──────────────────────────────────────────────
  name: 'Hobart Food Tour',
  shortName: 'Hobart Food Tour',
  brandLine1: 'Hobart',
  brandLine2: 'Food Tour',
  tagline: 'Bite-seeing in the Tassie capital.',
  description:
    "Small-group walking food tours of Hobart with Dave's Eats. Tasmanian seafood, scallop pies, chocolate and oysters across Salamanca and the waterfront.",
  url: 'https://hobartfoodtour.com.au',
  logo: '/favicon.svg',
  defaultOgImage: '/og-default.jpg',

  // ── Contact ───────────────────────────────────────────────
  email: 'info@daves.com.au',
  phone: '+61 (0)492 938 244',
  phoneHref: 'tel:+61492938244',
  salesEmail: 'sales@daves.com.au',

  // ── Address ───────────────────────────────────────────────
  address: {
    street: '163 Macquarie St',
    locality: 'Hobart',
    region: 'TAS',
    postcode: '7000',
    country: 'AU',
  },

  // ── Business ──────────────────────────────────────────────
  abn: '29 602 277 458',
  legalName: "Dave's Travel Group",
  established: 2014,
  priceRange: 'A$115–A$165',

  // ── Analytics ─────────────────────────────────────────────
  /** Google Analytics 4 measurement ID (e.g. 'G-XXXXXXXXXX'). Empty string disables analytics. */
  gaId: 'G-TNF6WW8VR2',

  // ── Social ────────────────────────────────────────────────
  social: {
    instagram: 'https://instagram.com/davestravelgroup',
    facebook: 'https://facebook.com/davestravelgroup',
    youtube: 'https://youtube.com/@davestravelgroup',
    tripadvisor: 'https://www.tripadvisor.com/AttractionProductReview-g255097-d33058634-Dave_s_Eats_Hobart_Hobart_Food_Tour-Hobart_Greater_Hobart_Tasmania.html',
    google: 'https://maps.app.goo.gl/XfQX4H6Ake5gheVh6',
  },

  // ── Tour options (for contact form dropdown + API labels) ─
  // Keep in sync with your src/content/tours/ slugs
  tourOptions: [
    { value: '', label: 'General enquiry' },
    { value: 'hobart-food-tour', label: "Dave's Eats Hobart — Food Tour" },
    { value: 'liquid-history-pub-tour', label: 'Hobart Liquid History Pub Tour' },
    { value: 'meet-the-makers', label: 'Meet The Makers Hobart' },
    { value: 'wine-whiskey-wallop', label: 'Wine, Whiskey & Wallop' },
    { value: 'hobart-bucks-party-tour', label: 'Hobart bucks party tour' },
    { value: 'hobart-hens-party-tour', label: 'Hobart hens party tour' },
    { value: 'private-charter', label: 'Private charter' },
  ] as { value: string; label: string }[],

  // ── About section venues (SVG art in AboutStrip) ──────────
  aboutVenues: [
    { name: 'Salamanca', location: 'Place' },
    { name: 'Constitution', location: 'Dock' },
  ],

  // ── Awards (AboutStrip) ───────────────────────────────────
  awards: [
    { rank: '01', title: 'Tasmanian Tourism Awards', detail: 'Tour Operator finalist' },
    { rank: '02', title: 'TripAdvisor', detail: 'Travellers’ Choice' },
    { rank: '03', title: 'Australian Good Food Guide', detail: 'Featured experience' },
  ],

  // ── Press mentions (marquee) ──────────────────────────────
  press: [
    { name: 'TripAdvisor', style: 'font-weight: 700; letter-spacing: -0.02em;' },
    { name: 'Gourmet Traveller', style: 'font-weight: 500; letter-spacing: 0.04em;' },
    { name: 'Broadsheet', style: 'font-weight: 700;' },
    { name: 'The Mercury', style: 'font-style: italic; font-weight: 600;' },
    { name: 'ABC Hobart', style: 'font-weight: 700; letter-spacing: 0.24em;' },
    { name: 'Tourism Tasmania', style: 'font-weight: 500;' },
    { name: 'Time Out', style: 'font-style: italic; font-weight: 500;' },
    { name: 'Australian Traveller', style: 'font-weight: 600; letter-spacing: 0.05em;' },
  ],

  // ── Schema / SEO ──────────────────────────────────────────
  knowsAbout: [
    'Tasmanian food',
    'Hobart food tours',
    'Walking food tours',
    'Tasmanian seafood',
    'Tasmanian cheese',
    'Tasmanian chocolate',
    'Salamanca Place',
    'Hobart waterfront',
    'Food tourism',
  ],
  areaServed: [
    {
      '@type': 'City' as const,
      name: 'Hobart',
      containedInPlace: { '@type': 'AdministrativeArea' as const, name: 'Tasmania' },
    },
    { '@type': 'AdministrativeArea' as const, name: 'Tasmania' },
  ],
  attractions: [
    { name: 'Salamanca Place', address: 'Salamanca Pl, Battery Point TAS 7004' },
    { name: 'Victoria Dock', address: 'Victoria Dock, Hobart TAS 7000' },
    { name: 'Machine Laundry Cafe', address: '12 Salamanca Sq, Battery Point TAS 7004' },
  ],
  destinationDescription:
    "Hobart is one of Australia's great eating cities — a working harbour ringed by sandstone warehouses, with Tasmanian produce coming in by boat, plane and orchard truck within a day of being on a plate. The food tour is a walking introduction to the bakers, fishmongers, chocolatiers and ice cream makers who make it work.",
}

// ── Navigation ──────────────────────────────────────────────

export const NAV_PRIMARY = [
  { label: 'The food tour', href: '/tours/hobart-food-tour/' },
  { label: 'Other Hobart tours', href: '/tours/' },
  { label: 'Merch', href: '/merch/' },
  { label: 'Field journal', href: '/journal/' },
  { label: 'About', href: '/about/' },
] as const

export const NAV_FOOTER = {
  Tours: [
    { label: "Dave's Eats Hobart", href: '/tours/hobart-food-tour/' },
    { label: 'All Hobart tours', href: '/tours/' },
    { label: 'Private charter', href: '/contact/?tour=private-charter' },
  ],
  'Other regions': [
    { label: 'Sydney', href: '/regions/sydney/' },
    { label: 'All regions', href: '/regions/' },
  ],
  Shop: [
    { label: 'All merch', href: '/merch/' },
    { label: 'Hobart Food Tour Cap', href: '/merch/hat/' },
    { label: 'Hobart Food Tour Tee', href: '/merch/shirt/' },
  ],
  Company: [
    { label: `About ${SITE.name}`, href: '/about/' },
    { label: 'Field journal', href: '/journal/' },
    { label: 'Gift vouchers', href: '/contact/' },
    { label: 'For travel agents', href: '/contact/' },
    { label: 'Contact', href: '/contact/' },
  ],
}

// ── Helpers ─────────────────────────────────────────────────

export function formatPrice(amount: number, currency = 'AUD') {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function tourLabels(): Record<string, string> {
  return Object.fromEntries(
    SITE.tourOptions.filter((o) => o.value).map((o) => [o.value, o.label])
  )
}
