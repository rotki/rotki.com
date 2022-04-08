export function getMetadata(
  title: string,
  description: string,
  url: string,
  baseUrl: string
) {
  const imageUrl = `${baseUrl}/img/share.png`
  return [
    {
      hid: 'description',
      name: 'description',
      content: description,
    },
    // Open graph/FB sharing metadata
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: url },
    { property: 'og:title', content: title },
    {
      property: 'og:description',
      content: description,
    },
    { property: 'og:image', content: imageUrl },
    // Twitter sharing metadata
    { property: 'twitter:card', content: 'summary_large_image' },
    { property: 'twitter:url', content: url },
    { property: 'twitter:title', content: title },
    {
      property: 'twitter:description',
      content: description,
    },
    { property: 'twitter:image', content: imageUrl },
  ]
}

export const noIndex = () => ({
  name: 'robots',
  content: 'noindex',
})

export const commonAttrs = () => ({
  htmlAttrs: {
    class: 'page',
  },
  bodyAttrs: {
    class: 'body',
  },
})
