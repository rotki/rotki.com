import type { TierKey } from '~/composables/rotki-sponsorship/types';

import { z } from 'zod';

export const NftSubmission = z.object({
  createdAt: z.string(),
  displayName: z.string().nullable(),
  email: z.string().nullable(),
  imageUrl: z.string().nullable(),
  nftId: z.number(),
  releaseVersion: z.string().optional(),
  tierId: z.custom<TierKey>().optional(),
  updatedAt: z.string(),
});

export type NftSubmission = z.infer<typeof NftSubmission>;

export const NftSubmissions = z.array(NftSubmission);

export type NftSubmissions = z.infer<typeof NftSubmissions>;
