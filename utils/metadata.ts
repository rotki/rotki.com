export function getMetadata(
  title: string,
  description: string,
  url: string,
  baseUrl: string,
) {
  const imageUrl = `${baseUrl}/img/share.png`;
  return [
    {
      content: description,
      key: 'description',
      name: 'description',
    },
    // Open graph/FB sharing metadata
    { content: 'website', property: 'og:type' },
    { content: url, property: 'og:url' },
    { content: title, property: 'og:title' },
    {
      content: description,
      property: 'og:description',
    },
    { content: imageUrl, property: 'og:image' },
    // Twitter sharing metadata
    { content: 'summary_large_image', property: 'twitter:card' },
    { content: url, property: 'twitter:url' },
    { content: title, property: 'twitter:title' },
    {
      content: description,
      property: 'twitter:description',
    },
    { content: imageUrl, property: 'twitter:image' },
  ];
}

export function noIndex() {
  return {
    content: 'noindex',
    name: 'robots',
  };
}

export function commonAttrs() {
  return {
    bodyAttrs: {
      class: 'body',
    },
    htmlAttrs: {
      class: 'page',
      lang: 'en',
    },
  };
}
