import { defineConfig, envField, fontProviders } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://hobartfoodtour.com.au',
  trailingSlash: 'always',
  integrations: [mdx(), sitemap()],

  build: {
    // Inline ALL stylesheets directly into the HTML to break the critical-path
    // chain on first paint. PageSpeed flagged the 6 KB (gzipped) Base CSS as a
    // chained dependency adding ~378 ms; inlining moves it into the HTML which
    // Cloudflare already brotli-encodes, so the wire-size cost is negligible.
    inlineStylesheets: 'always',
  },

  env: {
    schema: {
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_TO_EMAIL: envField.string({ context: 'server', access: 'public', default: 'info@daves.com.au' }),
      CONTACT_FROM_EMAIL: envField.string({ context: 'server', access: 'public', default: 'noreply@davesgroup.com.au' }),
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: ['400', '500', '600', '700', '800'],
      styles: ['normal'],
      display: 'swap',
    },
    {
      provider: fontProviders.google(),
      name: 'Fraunces',
      cssVariable: '--font-fraunces',
      weights: ['300', '400', '500'],
      styles: ['normal', 'italic'],
      display: 'swap',
    },
  ],

  adapter: cloudflare(),
})