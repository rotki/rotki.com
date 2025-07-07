export interface SponsorshipTier {
  key: string;
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

export interface CurrencyOption {
  key: string;
  label: string;
  symbol: string;
  decimals: number;
  contractAddress?: string;
  iconUrl?: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  {
    decimals: 18,
    iconUrl: '/img/chains/ethereum.svg',
    key: 'ETH',
    label: 'ETH',
    symbol: 'ETH',
  },
  {
    decimals: 6,
    iconUrl: '/img/usdc.svg',
    key: 'USDC',
    label: 'USDC',
    symbol: 'USDC',
  },
];

export interface SponsorshipState {
  status: 'idle' | 'pending' | 'success' | 'error';
  txHash?: string;
  error?: string;
}
