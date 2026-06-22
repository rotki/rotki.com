/**
 * The Rotki Sponsorship NFT contract ABI, in viem JSON format. Replaces the
 * ethers human-readable `ROTKI_SPONSORSHIP_ABI` from the sponsorship constants
 * (only the members the app actually calls are included).
 *
 * Pure data (`as const` for viem type inference) — no runtime import.
 */
export const ROTKI_SPONSORSHIP_ABI = [
  {
    type: 'function',
    name: 'mint',
    stateMutability: 'payable',
    inputs: [
      { name: 'tierId', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'currentReleaseId',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getTierInfo',
    stateMutability: 'view',
    inputs: [
      { name: 'releaseId', type: 'uint256' },
      { name: 'tierId', type: 'uint256' },
    ],
    outputs: [
      { name: 'maxSupply', type: 'uint256' },
      { name: 'currentSupply', type: 'uint256' },
      { name: 'metadataURI', type: 'string' },
    ],
  },
  {
    type: 'event',
    name: 'NFTMinted',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'releaseId', type: 'uint256', indexed: true },
      { name: 'tierId', type: 'uint256', indexed: true },
      { name: 'minter', type: 'address', indexed: false },
    ],
  },
] as const;
