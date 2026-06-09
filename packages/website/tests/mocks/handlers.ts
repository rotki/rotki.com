import { http, HttpResponse } from 'msw';

const { BACKEND_URL } = import.meta.env;

// Counts attempts against `/webapi/retry/` so the handler can fail the first one
// and succeed on the retry. Reset it from the test before use.
export const retryAttempts = { count: 0 };

export const handlers = [
  // Mock app manifest requests to prevent errors during test initialization
  http.get('*/_nuxt/builds/meta/*.json', () =>
    HttpResponse.json({
      id: 'test',
      timestamp: Date.now(),
    })),
  http.options(`${BACKEND_URL}/webapi/csrf/`, () => HttpResponse.json({}, {
    headers: {
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Origin': '*',
    },
  })),
  http.options(`${BACKEND_URL}/webapi/countries/`, () => HttpResponse.json({}, {
    headers: {
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Origin': '*',
    },
  })),
  http.options(`${BACKEND_URL}/webapi/login/`, () => HttpResponse.json({}, {
    headers: {
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Origin': '*',

    },
  })),
  http.options(`${BACKEND_URL}/webapi/account/`, () => HttpResponse.json({}, {
    headers: {
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Origin': '*',
    },
  })),
  http.options(`${BACKEND_URL}/webapi/retry/`, () => HttpResponse.json({}, {
    headers: {
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Origin': '*',
    },
  })),
  http.get(`${BACKEND_URL}/webapi/csrf/`, () =>
    HttpResponse.json(
      {
        message: 'CSRF cookie set',
      },
      {
        headers: {
          'Set-Cookie': 'csrftoken=1234',
        },
      },
    )),
  http.post(`${BACKEND_URL}/webapi/login/`, () =>
    HttpResponse.json({ message: 'success' })),
  // Fails the first attempt with a retryable status so ofetch retries, letting a
  // test assert the CSRF header isn't duplicated (e.g. "abcd, abcd") on retry.
  http.post(`${BACKEND_URL}/webapi/retry/`, () => {
    retryAttempts.count += 1;
    if (retryAttempts.count === 1)
      return HttpResponse.json({ message: 'retry' }, { status: 503 });
    return HttpResponse.json({ message: 'success' });
  }),
  http.get(`${BACKEND_URL}/webapi/countries/`, () =>
    HttpResponse.json({
      message: 'it works!',
      result: [{ code: 'CT', name: 'Country' }],
    })),
  http.get(`${BACKEND_URL}/webapi/countries/`, () =>
    HttpResponse.json({ message: 'it works!!', result: [] })),
  http.get(`${BACKEND_URL}/webapi/account/`, () =>
    HttpResponse.json(
      { message: 'fail', result: [] },
      {
        status: 401,
      },
    )),
];
