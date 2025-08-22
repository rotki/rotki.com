import type { TierKey } from '~/composables/rotki-sponsorship/types';

import { z } from 'zod';

export const NftSubmission = z.object({
  createdAt: z.string(),
  displayName: z.string().optional(),
  email: z.string().optional(),
  imageUrl: z.string().nullable(),
  nftId: z.number(),
  releaseId: z.number().optional(),
  releaseName: z.string().optional(),
  tier: z.custom<TierKey>().optional(),
  updatedAt: z.string(),
});

export type NftSubmission = z.infer<typeof NftSubmission>;

export const NftSubmissions = z.array(NftSubmission);

export type NftSubmissions = z.infer<typeof NftSubmissions>;
