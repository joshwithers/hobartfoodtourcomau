import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import { SITE } from '~/lib/site'
import type { APIContext } from 'astro'

export async function GET(context: APIContext) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf()
  )

  return rss({
    title: `${SITE.name} · Field Journal`,
    description:
      `Field notes from the ${SITE.name} team — vintage reports, primers and seasonal guides.`,
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.publishDate,
      description: post.data.description,
      link: `/journal/${post.id}/`,
      categories: post.data.tags,
    })),
    customData: '<language>en-au</language>',
  })
}
