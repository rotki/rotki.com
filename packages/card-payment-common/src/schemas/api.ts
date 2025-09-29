import { z } from 'zod';

export const ActionResultResponseSchema = z.object({
  message: z.string().optional(),
  result: z.boolean().optional(),
});

export interface ApiResponse<T, M = string> {
  readonly result: T | null;
  readonly message: M;
}

export type ActionResultResponse = z.infer<typeof ActionResultResponseSchema>;
