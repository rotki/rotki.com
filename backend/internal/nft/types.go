package nft

// Config holds the NFT contract configuration fetched from the backend API.
type Config struct {
	ChainID            int    `json:"chain_id"`
	ContractAddress    string `json:"contract_address"`
	ReleaseID          int    `json:"release_id"`
	HasContractChanged bool   `json:"has_contract_changed"`
}

// TierInfo holds raw blockchain tier data.
type TierInfo struct {
	MaxSupply     int    `json:"maxSupply"`
	CurrentSupply int    `json:"currentSupply"`
	MetadataURI   string `json:"metadataURI"`
}

// TierInfoResult extends TierInfo with processed metadata.
type TierInfoResult struct {
	MaxSupply     int    `json:"maxSupply"`
	CurrentSupply int    `json:"currentSupply"`
	MetadataURI   string `json:"metadataURI"`
	ImageURL      string `json:"imageUrl"`
	ReleaseName   string `json:"releaseName"`
	Benefits      string `json:"benefits"`
}

// TierMetadata is the JSON metadata fetched from IPFS for a tier or token.
type TierMetadata struct {
	Name        string              `json:"name"`
	Description string              `json:"description"`
	Image       string              `json:"image"`
	Attributes  []MetadataAttribute `json:"attributes,omitempty"`
}

// MetadataAttribute represents a single attribute in NFT metadata.
type MetadataAttribute struct {
	TraitType string `json:"trait_type"`
	Value     string `json:"value"`
}

// TokenMetadata represents full token data including blockchain and IPFS info.
type TokenMetadata struct {
	ImageURL    string        `json:"imageUrl"`
	Metadata    *TierMetadata `json:"metadata"`
	MetadataURI string        `json:"metadataURI"`
	Owner       string        `json:"owner"`
	ReleaseID   int           `json:"releaseId"`
	ReleaseName string        `json:"releaseName"`
	TierID      int           `json:"tierId"`
	TierName    string        `json:"tierName"`
	TokenID     int           `json:"tokenId"`
}

// TokenBasicData holds the raw blockchain data for a token.
type TokenBasicData struct {
	Owner       string
	ReleaseID   int
	TierID      int
	MetadataURI string
}

// TiersResponse is the API response for the tier-info endpoint.
type TiersResponse struct {
	ReleaseID *int                   `json:"releaseId"`
	Tiers     map[int]TierInfoResult `json:"tiers"`
}

// SponsorshipMetadata is the response from /webapi/nfts/release/current/.
type SponsorshipMetadata struct {
	Chain           string `json:"chain"`
	ContractAddress string `json:"contractAddress"`
	ReleaseID       int    `json:"releaseId"`
}

// SponsorshipTier defines a named tier with its on-chain ID.
type SponsorshipTier struct {
	Key    string
	Label  string
	TierID int
}

// SponsorshipTiers is the list of known sponsorship tiers.
var SponsorshipTiers = []SponsorshipTier{
	{Key: "bronze", Label: "Bronze", TierID: 0},
	{Key: "silver", Label: "Silver", TierID: 1},
	{Key: "gold", Label: "Gold", TierID: 2},
}

// FindTierByID returns the tier with the given ID, or nil.
func FindTierByID(tierID int) *SponsorshipTier {
	for i := range SponsorshipTiers {
		if SponsorshipTiers[i].TierID == tierID {
			return &SponsorshipTiers[i]
		}
	}
	return nil
}

// ChainConfig holds RPC URLs for a blockchain network.
type ChainConfig struct {
	ChainID int
	RPCURLs []string
}

// ChainConfigs maps chain names to their configurations.
var ChainConfigs = map[string]ChainConfig{
	"ethereum": {ChainID: 1, RPCURLs: []string{
		"https://ethereum-rpc.publicnode.com",
		"https://eth.drpc.org",
		"https://rpc.ankr.com/eth",
		"https://1rpc.io/eth",
		"https://eth.llamarpc.com",
	}},
	"sepolia": {ChainID: 11155111, RPCURLs: []string{
		"https://ethereum-sepolia-rpc.publicnode.com",
		"https://1rpc.io/sepolia",
		"https://eth-sepolia.public.blastapi.io",
		"https://sepolia.drpc.org",
		"https://rpc.ankr.com/eth_sepolia",
	}},
}

// ChainConfigByID finds chain config by chain ID.
func ChainConfigByID(chainID int) *ChainConfig {
	for _, cfg := range ChainConfigs {
		if cfg.ChainID == chainID {
			return &cfg
		}
	}
	return nil
}

// IPFSGateway is the IPFS gateway URL prefix.
const IPFSGateway = "https://ipfs.io/ipfs/"
