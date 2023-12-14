import { HttpResponse, http } from 'msw';

const { BACKEND_URL } = import.meta.env;

export const handlers = [
  http.get(`${BACKEND_URL}/webapi/csrf`, () =>
    HttpResponse.json(
      {
        message: 'CSRF cookie set',
      },
      {
        headers: {
          'Set-Cookie': 'csrftoken=1234',
        },
      },
    ),
  ),
  http.post(`${BACKEND_URL}/webapi/login`, () =>
    HttpResponse.json({ message: 'success' }),
  ),
  http.get(`${BACKEND_URL}/webapi/countries`, () =>
    HttpResponse.json({
      result: [{ name: 'Country', code: 'CT' }],
      message: 'it works!',
    }),
  ),
  http.get(`${BACKEND_URL}/webapi/countries`, () =>
    HttpResponse.json({ result: [], message: 'it works!!' }),
  ),
  http.get(`${BACKEND_URL}/webapi/account`, () =>
    HttpResponse.json(
      { result: [], message: 'fail' },
      {
        status: 401,
      },
    ),
  ),
];
