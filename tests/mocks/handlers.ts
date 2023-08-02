import { rest } from 'msw';

const { BACKEND_URL } = import.meta.env;

export const handlers = [
  rest.get(`${BACKEND_URL}/webapi/countries`, (req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        result: [{ name: 'Country', code: 'CT' }],
        message: 'it works!',
      }),
    ),
  ),
  rest.get(`${BACKEND_URL}/webapi/countries`, (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ result: [], message: 'it works!!' })),
  ),
  rest.get(`${BACKEND_URL}/webapi/account`, (req, res, ctx) =>
    res(ctx.status(401), ctx.json({ result: [], message: 'fail' })),
  ),
];
