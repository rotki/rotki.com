import { z } from 'zod';

export const LeaderboardEntrySchema = z.object({
  rank: z.number().nullable(),
  address: z.string(),
  bronzeCount: z.number(),
  silverCount: z.number(),
  goldCount: z.number(),
  totalCount: z.number(),
  points: z.number(),
  ensName: z.string().nullable(),
});

export const LeaderboardResponseSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(LeaderboardEntrySchema),
});

export const LeaderboardMetadataSchema = z.object({
  lastUpdated: z.string().nullable(),
});

export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;

export type LeaderboardMetadata = z.infer<typeof LeaderboardMetadataSchema>;

export interface PaginationData {
  page: number;
  total: number;
  limit: number;
  limits?: number[];
}

export interface AddressDisplay {
  primary: string;
  showTooltip: boolean;
  isEns: boolean;
}
