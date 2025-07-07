export const CONTRACT_ADDRESS = '0x3b2854f9501Af54d3352AA30F78f92B7668041C7';

export const CHAIN_ID = 11155111; // Sepolia testnet

export const RPC_URL = 'https://sepolia.gateway.tenderly.co';

export const IPFS_URL = 'https://gateway.pinata.cloud/ipfs/';

// Payment token addresses
export const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

export const USDC_ADDRESS = '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238';

export const ROTKI_SPONSORSHIP_ABI = [
  'function tokenURI(uint256 tokenId) external view returns (string memory)',
  'function getPrice(uint256 tierId, address paymentToken) external view returns (uint256)',
  'function getTierInfo(uint256 releaseId, uint256 tierId) external view returns (uint256 maxSupply, uint256 currentSupply, string memory metadataURI)',
  'function currentReleaseId() external view returns (uint256)',
  'function mint(uint256 tierId, address paymentToken) external payable',
  'function paymentTokensEnabled(address token) external view returns (bool)',
];

export const ERC20_ABI = [
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];
