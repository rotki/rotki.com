import { z } from 'zod';

export type TierKey = 'bronze' | 'silver' | 'gold';

export const TierKeyEnum = z.enum(['bronze', 'silver', 'gold']);

export interface SponsorshipTier {
  key: TierKey;
  label: string;
  tierId: number;
}

export const SPONSORSHIP_TIERS: SponsorshipTier[] = [
  { key: 'bronze', label: 'Bronze', tierId: 0 },
  { key: 'silver', label: 'Silver', tierId: 1 },
  { key: 'gold', label: 'Gold', tierId: 2 },
];

export interface TierSupply {
  maxSupply: number;
  currentSupply: number;
  metadataURI: string;
}

export interface TierBenefits {
  benefits: string;
}

export interface TierInfoResult extends TierSupply, TierBenefits {
  imageUrl: string;
  releaseName: string;
}

export interface PaymentToken {
  symbol: string;
  address: string;
  decimals: number;
  icon: string;
  prices: Record<TierKey, string>;
  icon_url: string;
}

export interface SponsorshipState {
  status: 'idle' | 'pending' | 'success' | 'error';
  txHash?: string;
  error?: string;
  tokenId?: string;
}

export interface NftConfig {
  CHAIN_ID: number;
  CONTRACT_ADDRESS: string;
  RPC_URL: string;
  hasContractChanged: boolean;
}

export const TierMetadataAttribute = z.object({
  trait_type: z.string(),
  value: z.string(),
});

export const TierMetadataAttributes = z.array(TierMetadataAttribute);

export const TierMetadata = z.object({
  attributes: TierMetadataAttributes.optional(),
  description: z.string(),
  image: z.string(),
  name: z.string(),
});

export type TierMetadata = z.infer<typeof TierMetadata>;

export const TokenMetadata = z.object({
  imageUrl: z.string().optional(),
  metadata: TierMetadata,
  metadataURI: z.string(),
  owner: z.string(),
  releaseId: z.number(),
  releaseName: z.string(),
  tierId: z.number(),
  tierName: TierKeyEnum,
  tokenId: z.number(),
});

export type TokenMetadata = z.infer<typeof TokenMetadata>;

export interface SimpleTokenMetadata {
  tier: TierKey;
  releaseId: number;
  releaseName: string;
  owner: string;
}

// Zod schema for StoredNft validation
export const StoredNft = z.object({
  address: z.string(),
  id: z.union([z.number(), z.string()]),
  releaseId: z.number().default(1),
  tier: z.number().default(-1),
});

export type StoredNft = z.infer<typeof StoredNft>;

export const StoredNftArraySchema = z.array(StoredNft);
