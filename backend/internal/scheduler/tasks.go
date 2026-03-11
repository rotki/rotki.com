package scheduler

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/rotki/rotki.com/backend/internal/api/releases"
	"github.com/rotki/rotki.com/backend/internal/images"
	"github.com/rotki/rotki.com/backend/internal/nft"
)

// Task intervals matching the TypeScript implementation.
const (
	NFTCacheInterval      = 5 * time.Minute
	ReleasesCacheInterval = 8 * time.Minute
	InitialDelay          = 5 * time.Second
)

// NFTCacheTask creates the NFT tier + image cache warming task.
func NFTCacheTask(coreSvc *nft.CoreService, imgSvc *images.Service, logger *slog.Logger) TaskFunc {
	taskLogger := logger.With("task", "nft:cache")

	return func(ctx context.Context) error {
		// Fetch all tiers for the current release (skips cache check)
		tierIDs := make([]int, len(nft.SponsorshipTiers))
		for i, t := range nft.SponsorshipTiers {
			tierIDs[i] = t.TierID
		}

		releaseID, tiers, err := coreSvc.FetchAllTiersForRelease(ctx, tierIDs)
		if err != nil {
			return fmt.Errorf("fetch tiers: %w", err)
		}

		taskLogger.Info("fetched tier data", "release_id", releaseID, "tiers", len(tiers))

		// Count successes and collect image URLs (raw IPFS URLs)
		imageURLs := make([]string, 0, len(nft.SponsorshipTiers))
		successCount := 0

		for _, tier := range nft.SponsorshipTiers {
			info := tiers[tier.TierID]
			if info == nil {
				taskLogger.Warn("no data for tier", "tier", tier.Key, "tier_id", tier.TierID)
				continue
			}
			successCount++

			if info.ImageURL != "" {
				imageURLs = append(imageURLs, info.ImageURL)
			}
		}

		if successCount == 0 {
			return fmt.Errorf("no tiers returned data")
		}

		taskLogger.Info("tier caching complete", "succeeded", successCount, "total", len(nft.SponsorshipTiers))

		// Warm image cache
		if len(imageURLs) > 0 {
			succeeded, failed := imgSvc.WarmCache(ctx, imageURLs)
			taskLogger.Info("image cache warming done", "succeeded", succeeded, "failed", failed)
		}

		return nil
	}
}

// ReleasesCacheTask creates the GitHub releases cache warming task.
func ReleasesCacheTask(releasesHandler *releases.Handler, logger *slog.Logger) TaskFunc {
	taskLogger := logger.With("task", "releases:cache")

	return func(ctx context.Context) error {
		release, err := releasesHandler.FetchFromGitHub(ctx)
		if err != nil {
			return fmt.Errorf("refresh releases cache: %w", err)
		}

		taskLogger.Info("refreshed releases cache", "version", release.TagName)
		return nil
	}
}
