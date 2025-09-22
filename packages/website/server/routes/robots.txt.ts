import { defineEventHandler, type H3Event } from 'h3';

export default defineEventHandler((event: H3Event) => {
  const {
    public: {
      baseUrl,
      sponsorshipEnabled,
    },
  } = useRuntimeConfig(event);

  let disallowPaths = [
    '/account',
    '/account/**',
    '/purchase',
    '/purchase/**',
    '/checkout',
    '/checkout/**',
    '/activate',
    '/login',
    '/logout',
    '/login/**',
    '/logout/**',
    '/auth',
    '/auth/**',
  ];

  if (!sponsorshipEnabled) {
    disallowPaths = [...disallowPaths, '/sponsor', '/sponsor/**'];
  }

  const robotsContent = `User-agent: *
${disallowPaths.map(path => `Disallow: ${path}`).join('\n')}

User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;

  event.node.res.setHeader('Content-Type', 'text/plain');
  return robotsContent;
});
