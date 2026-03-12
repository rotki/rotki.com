import { defineEventHandler, type H3Event } from 'h3';

export default defineEventHandler((event: H3Event) => {
  const {
    public: {
      baseUrl,
    },
  } = useRuntimeConfig(event);

  const disallowPaths = [
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

  const robotsContent = `User-agent: *
${disallowPaths.map(path => `Disallow: ${path}`).join('\n')}

User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;

  event.node.res.setHeader('Content-Type', 'text/plain');
  return robotsContent;
});
