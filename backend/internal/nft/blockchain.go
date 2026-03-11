package nft

import (
	"context"
	"fmt"
	"log/slog"
)

// BlockchainService handles all blockchain interactions for NFT sponsorship.
type BlockchainService struct {
	rpc    *RPCClient
	logger *slog.Logger
}

// NewBlockchainService creates a new blockchain service.
func NewBlockchainService(rpc *RPCClient, logger *slog.Logger) *BlockchainService {
	return &BlockchainService{
		rpc:    rpc,
		logger: logger.With("component", "blockchain"),
	}
}

// GetCurrentReleaseID fetches the current release ID from the contract.
func (s *BlockchainService) GetCurrentReleaseID(ctx context.Context, cfg *Config) (int, error) {
	// Try multicall first
	calls := []MulticallCall{{
		Target:       cfg.ContractAddress,
		AllowFailure: true,
		CallData:     EncodeCurrentReleaseID(),
	}}

	results, err := s.rpc.Multicall(ctx, calls)
	if err == nil && len(results) > 0 && results[0].Success && len(results[0].ReturnData) >= 32 {
		releaseID := decodeUint256(results[0].ReturnData)
		s.logger.Debug("retrieved release ID", "release_id", releaseID)
		return releaseID, nil
	}

	// Fallback to direct call
	s.logger.Warn("multicall failed for currentReleaseId, falling back to direct call")
	data, err := s.rpc.EthCall(ctx, cfg.ContractAddress, EncodeCurrentReleaseID())
	if err != nil {
		return 0, fmt.Errorf("fetch current release ID: %w", err)
	}

	if len(data) < 32 {
		return 0, fmt.Errorf("invalid response length for currentReleaseId: %d", len(data))
	}

	return decodeUint256(data), nil
}

// FetchTokenBasicData fetches owner, releaseId, tierId, and metadataURI for a token.
func (s *BlockchainService) FetchTokenBasicData(ctx context.Context, cfg *Config, tokenID int) (*TokenBasicData, error) {
	calls := []MulticallCall{
		{Target: cfg.ContractAddress, AllowFailure: true, CallData: EncodeOwnerOf(tokenID)},
		{Target: cfg.ContractAddress, AllowFailure: true, CallData: EncodeTokenReleaseID(tokenID)},
		{Target: cfg.ContractAddress, AllowFailure: true, CallData: EncodeTokenTierID(tokenID)},
		{Target: cfg.ContractAddress, AllowFailure: true, CallData: EncodeTokenURI(tokenID)},
	}

	results, err := s.rpc.Multicall(ctx, calls)
	if err != nil {
		s.logger.Warn("multicall failed for token basic data, trying direct calls", "token_id", tokenID, "error", err)
		return s.fetchTokenBasicDataDirect(ctx, cfg, tokenID)
	}

	// Check if all results are empty (token doesn't exist)
	allEmpty := true
	for _, r := range results {
		if r.Success && len(r.ReturnData) > 0 {
			allEmpty = false
			break
		}
	}
	if allEmpty {
		s.logger.Warn("multicall returned empty results, trying direct calls", "token_id", tokenID)
		return s.fetchTokenBasicDataDirect(ctx, cfg, tokenID)
	}

	// Check owner exists
	if len(results) < 4 || !results[0].Success {
		s.logger.Warn("token does not exist", "token_id", tokenID)
		return nil, nil
	}

	owner := decodeAddress(results[0].ReturnData)
	releaseID := decodeUint256(results[1].ReturnData)
	tierID := decodeUint256(results[2].ReturnData)
	metadataURI := decodeString(results[3].ReturnData)

	s.logger.Debug("token basic data", "token_id", tokenID, "owner", owner, "release_id", releaseID, "tier_id", tierID)

	return &TokenBasicData{
		Owner:       owner,
		ReleaseID:   releaseID,
		TierID:      tierID,
		MetadataURI: metadataURI,
	}, nil
}

// fetchTokenBasicDataDirect makes individual eth_calls for each field.
func (s *BlockchainService) fetchTokenBasicDataDirect(ctx context.Context, cfg *Config, tokenID int) (*TokenBasicData, error) {
	ownerData, err := s.rpc.EthCall(ctx, cfg.ContractAddress, EncodeOwnerOf(tokenID))
	if err != nil {
		s.logger.Warn("token does not exist or error occurred", "token_id", tokenID, "error", err)
		return nil, nil
	}

	releaseData, err := s.rpc.EthCall(ctx, cfg.ContractAddress, EncodeTokenReleaseID(tokenID))
	if err != nil {
		return nil, fmt.Errorf("fetch tokenReleaseId: %w", err)
	}

	tierData, err := s.rpc.EthCall(ctx, cfg.ContractAddress, EncodeTokenTierID(tokenID))
	if err != nil {
		return nil, fmt.Errorf("fetch tokenTierId: %w", err)
	}

	uriData, err := s.rpc.EthCall(ctx, cfg.ContractAddress, EncodeTokenURI(tokenID))
	if err != nil {
		return nil, fmt.Errorf("fetch tokenURI: %w", err)
	}

	return &TokenBasicData{
		Owner:       decodeAddress(ownerData),
		ReleaseID:   decodeUint256(releaseData),
		TierID:      decodeUint256(tierData),
		MetadataURI: decodeString(uriData),
	}, nil
}

// FetchTierInfo fetches tier info for a single tier.
func (s *BlockchainService) FetchTierInfo(ctx context.Context, cfg *Config, releaseID, tierID int) (*TierInfo, error) {
	calls := []MulticallCall{{
		Target:       cfg.ContractAddress,
		AllowFailure: true,
		CallData:     EncodeGetTierInfo(releaseID, tierID),
	}}

	results, err := s.rpc.Multicall(ctx, calls)
	if err == nil && len(results) > 0 && results[0].Success && len(results[0].ReturnData) >= 96 {
		return decodeTierInfo(results[0].ReturnData), nil
	}

	// Fallback to direct call
	s.logger.Warn("multicall failed for tier info, falling back", "tier_id", tierID, "release_id", releaseID)
	data, err := s.rpc.EthCall(ctx, cfg.ContractAddress, EncodeGetTierInfo(releaseID, tierID))
	if err != nil {
		return nil, fmt.Errorf("fetch tier info: %w", err)
	}

	if len(data) < 96 {
		return nil, fmt.Errorf("invalid tier info response length: %d", len(data))
	}

	return decodeTierInfo(data), nil
}

// FetchMultipleTierInfo batch-fetches tier info for multiple tiers.
func (s *BlockchainService) FetchMultipleTierInfo(ctx context.Context, cfg *Config, releaseID int, tierIDs []int) (map[int]*TierInfo, error) {
	calls := make([]MulticallCall, len(tierIDs))
	for i, tierID := range tierIDs {
		calls[i] = MulticallCall{
			Target:       cfg.ContractAddress,
			AllowFailure: true,
			CallData:     EncodeGetTierInfo(releaseID, tierID),
		}
	}

	results, err := s.rpc.Multicall(ctx, calls)

	// On multicall failure or all-empty results, fall back to individual calls for all tiers
	needsFullFallback := err != nil
	if !needsFullFallback && len(results) > 0 {
		allEmpty := true
		for _, r := range results {
			if r.Success && len(r.ReturnData) > 0 {
				allEmpty = false
				break
			}
		}
		needsFullFallback = allEmpty
	}

	if needsFullFallback {
		if err != nil {
			s.logger.Warn("multicall failed for multiple tier info, falling back to individual calls", "error", err)
		} else {
			s.logger.Warn("all multicall results empty, falling back to individual calls")
		}
		return s.fetchTiersIndividually(ctx, cfg, releaseID, tierIDs), nil
	}

	// Process results, with per-tier fallback for individual failures
	tierInfos := make(map[int]*TierInfo, len(tierIDs))
	for i, tierID := range tierIDs {
		if i >= len(results) || !results[i].Success || len(results[i].ReturnData) < 96 {
			info, fetchErr := s.FetchTierInfo(ctx, cfg, releaseID, tierID)
			if fetchErr != nil {
				s.logger.Warn("failed to fetch tier info (individual fallback)", "tier_id", tierID, "error", fetchErr)
				tierInfos[tierID] = nil
			} else {
				tierInfos[tierID] = info
			}
			continue
		}

		tierInfos[tierID] = decodeTierInfo(results[i].ReturnData)
		s.logger.Debug("tier info", "tier_id", tierID,
			"max_supply", tierInfos[tierID].MaxSupply,
			"current_supply", tierInfos[tierID].CurrentSupply,
		)
	}

	return tierInfos, nil
}

// fetchTiersIndividually fetches tier info one-by-one as a fallback.
func (s *BlockchainService) fetchTiersIndividually(ctx context.Context, cfg *Config, releaseID int, tierIDs []int) map[int]*TierInfo {
	tierInfos := make(map[int]*TierInfo, len(tierIDs))
	for _, tierID := range tierIDs {
		info, err := s.FetchTierInfo(ctx, cfg, releaseID, tierID)
		if err != nil {
			s.logger.Warn("failed to fetch tier info", "tier_id", tierID, "error", err)
			tierInfos[tierID] = nil
		} else {
			tierInfos[tierID] = info
		}
	}
	return tierInfos
}

// decodeTierInfo decodes getTierInfo return data: (uint256 maxSupply, uint256 currentSupply, string metadataURI)
func decodeTierInfo(data []byte) *TierInfo {
	if len(data) < 96 {
		return nil
	}
	maxSupply := decodeUint256(data[0:32])
	currentSupply := decodeUint256(data[32:64])
	// String offset is at position 64, but points relative to data[0]
	metadataURI := decodeStringAt(data, 64)
	return &TierInfo{
		MaxSupply:     maxSupply,
		CurrentSupply: currentSupply,
		MetadataURI:   metadataURI,
	}
}
