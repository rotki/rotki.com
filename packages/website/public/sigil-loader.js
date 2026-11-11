/* Loads the Sigil (Umami) tracker with a before-send hook that cleans the URLs it reports.
   The hook is defined before the tracker is added, so the tracker never sends without it.
   Both the website and the card payment page load this file. It is served as is, not bundled.
   Token routes carry one-time e-mail credentials in their path, and OAuth routes carry them
   in the query and hash, so those parts are cut. */
(() => {
  const TOKEN_PATH_PREFIXES = ['/activate/', '/password/reset/'];
  const CREDENTIAL_QUERY_PREFIXES = ['/oauth/'];

  function cleanUrl(value) {
    if (typeof value !== 'string' || value === '')
      return value;

    let url;
    try {
      url = new URL(value, location.origin);
    }
    catch {
      return value;
    }
    if (url.origin !== location.origin)
      return value;

    const tokenPrefix = TOKEN_PATH_PREFIXES.find(prefix => url.pathname.startsWith(prefix));
    if (tokenPrefix)
      url.pathname = tokenPrefix.slice(0, -1);

    if (tokenPrefix || CREDENTIAL_QUERY_PREFIXES.some(prefix => url.pathname.startsWith(prefix))) {
      url.search = '';
      url.hash = '';
    }

    return value.startsWith('/') ? `${url.pathname}${url.search}${url.hash}` : url.href;
  }

  window.sigilBeforeSend = (_type, payload) => {
    if (!payload)
      return payload;

    const data = typeof payload.data?.landing_path === 'string'
      ? { ...payload.data, landing_path: cleanUrl(payload.data.landing_path) }
      : payload.data;
    return { ...payload, url: cleanUrl(payload.url), referrer: cleanUrl(payload.referrer), data };
  };

  const loader = document.currentScript;
  const src = loader?.dataset.trackerSrc;
  if (!src)
    return;

  const tracker = document.createElement('script');
  tracker.src = src;
  tracker.defer = true;
  tracker.dataset.websiteId = loader.dataset.websiteId ?? '';
  tracker.dataset.domains = loader.dataset.domains ?? '';
  tracker.dataset.beforeSend = 'sigilBeforeSend';
  document.head.append(tracker);
})();
