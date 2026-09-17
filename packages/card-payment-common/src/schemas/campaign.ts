import { z } from 'zod';

/** Sitewide discount campaign advertised by the Go backend's `/api/config`, keys camelCased. */
export const ActiveCampaignSchema = z.object({
  code: z.string(),
  percent: z.number(),
  periodEnd: z.string().optional(),
});

export type ActiveCampaign = z.infer<typeof ActiveCampaignSchema>;
