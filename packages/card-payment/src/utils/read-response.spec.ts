import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { readResponse } from './read-response';

const Schema = z.object({ planId: z.number() });

describe('utils/read-response', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the body in camel case', async () => {
    await expect(readResponse(Response.json({ plan_id: 3 }), Schema, 'plan')).resolves.toEqual({ planId: 3 });
  });

  it('logs a body that does not match and reads it as undefined', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(readResponse(Response.json({ plan_id: 'three' }), Schema, 'plan')).resolves.toBeUndefined();

    expect(log).toHaveBeenCalledWith('Failed to parse plan:', expect.objectContaining({
      data: { plan_id: 'three' },
      transformedData: { planId: 'three' },
    }));
  });

  it('leaves a body that is not JSON to the caller', async () => {
    await expect(readResponse(new Response('<html>'), Schema, 'plan')).rejects.toThrow(SyntaxError);
  });
});
