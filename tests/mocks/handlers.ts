import { rest } from 'msw';

const { BASE_URL } = import.meta.env;

export const handlers = [
  rest.get(`${BASE_URL}/countries`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ result: [], message: 'it works!' }));
  }),
];
