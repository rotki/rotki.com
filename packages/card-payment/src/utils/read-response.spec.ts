import { err, ok } from 'plainfp/result';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { failed } from './api-failure';
import { readResponse } from './read-response';

const Schema = z.object({ planId: z.number() });

describe('utils/read-response', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the body in camel case', async () => {
    await expect(readResponse(Response.json({ plan_id: 3 }), Schema, 'plan')).resolves.toEqual(ok({ planId: 3 }));
  });

  it('logs a body that does not match and fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(readResponse(Response.json({ plan_id: 'three' }), Schema, 'plan')).resolves.toEqual(err(failed('Invalid response format from server')));

    expect(log).toHaveBeenCalledWith('Failed to parse plan:', expect.objectContaining({
      data: { plan_id: 'three' },
      transformedData: { planId: 'three' },
    }));
  });

  it('leaves a body that is not JSON to the caller', async () => {
    await expect(readResponse(new Response('<html>'), Schema, 'plan')).rejects.toThrow(SyntaxError);
  });
});
