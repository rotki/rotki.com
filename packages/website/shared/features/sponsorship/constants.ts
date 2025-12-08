export const IPFS_URL = 'https://ipfs.io/ipfs/';

// Payment token addresses
export const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

export const ROTKI_SPONSORSHIP_ABI = [
  'function tokenURI(uint256 tokenId) external view returns (string memory)',
  'function getPrice(uint256 tierId, address paymentToken) external view returns (uint256)',
  'function getTierInfo(uint256 releaseId, uint256 tierId) external view returns (uint256 maxSupply, uint256 currentSupply, string memory metadataURI)',
  'function currentReleaseId() external view returns (uint256)',
  'function mint(uint256 tierId, address paymentToken) external payable',
  'event NFTMinted(uint256 indexed tokenId, uint256 indexed releaseId, uint256 indexed tierId, address minter)',
  'function tokenReleaseId(uint256 tokenId) view returns (uint256)',
  'function tokenTierId(uint256 tokenId) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
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
    rpcUrls: [
      'https://eth.merkle.io',
      'https://eth.llamarpc.com',
      'https://ethereum-rpc.publicnode.com',
      'https://rpc.mevblocker.io',
    ],
  },
  sepolia: {
    chainId: 11155111,
    rpcUrls: [
      'https://sepolia.gateway.tenderly.co',
      'https://sepolia.drpc.org',
      'https://ethereum-sepolia-rpc.publicnode.com',
    ],
  },
} as const;
