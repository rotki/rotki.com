export const IPFS_URL = 'https://gateway.pinata.cloud/ipfs/';

// Payment token addresses
export const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

export const ROTKI_SPONSORSHIP_ABI = [
  'function tokenURI(uint256 tokenId) external view returns (string memory)',
  'function getPrice(uint256 tierId, address paymentToken) external view returns (uint256)',
  'function getTierInfo(uint256 releaseId, uint256 tierId) external view returns (uint256 maxSupply, uint256 currentSupply, string memory metadataURI)',
  'function currentReleaseId() external view returns (uint256)',
  'function mint(uint256 tierId, address paymentToken) external payable',
  'event NFTMinted(uint256 indexed tokenId, uint256 indexed releaseId, uint256 indexed tierId, address minter)',
];

export const ERC20_ABI = [
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

export const CHAIN_CONFIGS = {
  ethereum: {
    chainId: 1,
    rpcUrl: 'https://ethereum.gateway.tenderly.co',
  },
  sepolia: {
    chainId: 11155111,
    rpcUrl: 'https://sepolia.gateway.tenderly.co',
  },
} as const;

// Fallback values for when metadata is not available
export const FALLBACK_CONTRACT_ADDRESS = '0x9C4Ac51128b3B29c8c4C76c960a07c17b8290557';

export const FALLBACK_CHAIN = 'sepolia';
