export type TierKey = 'bronze' | 'silver' | 'gold';

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
  description: string;
  benefits: string;
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
