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
    )),
  http.post(`${BACKEND_URL}/webapi/login`, () =>
    HttpResponse.json({ message: 'success' })),
  http.get(`${BACKEND_URL}/webapi/countries`, () =>
    HttpResponse.json({
      message: 'it works!',
      result: [{ code: 'CT', name: 'Country' }],
    })),
  http.get(`${BACKEND_URL}/webapi/countries`, () =>
    HttpResponse.json({ message: 'it works!!', result: [] })),
  http.get(`${BACKEND_URL}/webapi/account`, () =>
    HttpResponse.json(
      { message: 'fail', result: [] },
      {
        status: 401,
      },
    )),
];
