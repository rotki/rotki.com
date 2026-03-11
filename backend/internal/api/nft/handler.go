// Package nft handles NFT-related HTTP endpoints.
package nft

import (
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/rotki/rotki.com/backend/internal/images"
	nftpkg "github.com/rotki/rotki.com/backend/internal/nft"
	"github.com/rotki/rotki.com/backend/internal/validate"
)

// Handler serves NFT sponsorship API endpoints.
type Handler struct {
	core               *nftpkg.CoreService
	imageSvc           *images.Service
	sponsorshipEnabled bool
	logger             *slog.Logger
}

// NewHandler creates a new NFT API handler.
func NewHandler(core *nftpkg.CoreService, imageSvc *images.Service, sponsorshipEnabled bool, logger *slog.Logger) *Handler {
	return &Handler{
		core:               core,
		imageSvc:           imageSvc,
		sponsorshipEnabled: sponsorshipEnabled,
		logger:             logger.With("handler", "nft"),
	}
}

// RegisterRoutes registers all NFT API routes on the given mux.
func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/nft/tier-info", h.handleTierInfo)
	mux.HandleFunc("GET /api/nft/image", h.handleImage)
	// Token ID handler uses a prefix match pattern
	mux.HandleFunc("GET /api/nft/", h.handleTokenID)
}

// handleTierInfo handles GET /api/nft/tier-info?tierIds=0,1,2
func (h *Handler) handleTierInfo(w http.ResponseWriter, r *http.Request) {
	if !h.sponsorshipEnabled {
		http.NotFound(w, r)
		return
	}

	// Parse tierIds query param
	var tierIDs []int
	if raw := r.URL.Query().Get("tierIds"); raw != "" {
		for _, s := range strings.Split(raw, ",") {
			s = strings.TrimSpace(s)
			id, err := strconv.Atoi(s)
			if err == nil && id >= 0 {
				tierIDs = append(tierIDs, id)
			}
		}
	}

	result, err := h.core.FetchTiers(r.Context(), tierIDs)
	if err != nil {
		h.logger.Error("failed to fetch tiers", "error", err)
		validate.WriteJSON(w, http.StatusBadGateway, map[string]string{
			"error": "Failed to fetch tier information from upstream",
		})
		return
	}

	// Convert internal IPFS URLs to opaque proxy URLs for the client
	for tierID, info := range result.Tiers {
		if info.ImageURL != "" {
			info.ImageURL = tierImageProxyURL(tierID)
			result.Tiers[tierID] = info
		}
	}

	validate.WriteJSON(w, http.StatusOK, result)
}

// tokenIDPattern matches /api/nft/{integer}
var tokenIDPattern = regexp.MustCompile(`^/api/nft/(\d+)$`)

// handleTokenID handles GET /api/nft/:token-id
func (h *Handler) handleTokenID(w http.ResponseWriter, r *http.Request) {
	// Match /api/nft/{number} but not /api/nft/tier-info or /api/nft/image
	matches := tokenIDPattern.FindStringSubmatch(r.URL.Path)
	if matches == nil {
		// Not a token ID request — let other handlers deal with it
		// (tier-info and image are registered as exact matches)
		http.NotFound(w, r)
		return
	}

	if !h.sponsorshipEnabled {
		http.NotFound(w, r)
		return
	}

	tokenID, err := strconv.Atoi(matches[1])
	if err != nil || tokenID < 0 {
		validate.WriteJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid token ID",
		})
		return
	}

	tokenData, err := h.core.FetchCachedTokenData(r.Context(), tokenID)
	if err != nil {
		if errors.Is(err, nftpkg.ErrTokenNotFound) {
			http.NotFound(w, r)
			return
		}
		h.logger.Error("failed to fetch token data", "token_id", tokenID, "error", err)
		validate.WriteJSON(w, http.StatusBadGateway, map[string]string{
			"error": "Failed to fetch token data from upstream",
		})
		return
	}

	// Convert internal IPFS URL to opaque proxy URL for the client
	if tokenData.ImageURL != "" {
		tokenData.ImageURL = tokenImageProxyURL(tokenID)
	}

	validate.WriteJSON(w, http.StatusOK, tokenData)
}

// handleImage handles GET /api/nft/image?tier=<id> or /api/nft/image?token=<id>
// Resolves the IPFS URL internally and proxies the image through the caching service.
// No user-supplied URLs are accepted — only opaque tier/token IDs.
func (h *Handler) handleImage(w http.ResponseWriter, r *http.Request) {
	if !h.sponsorshipEnabled {
		http.NotFound(w, r)
		return
	}

	ctx := r.Context()
	q := r.URL.Query()
	tierStr := q.Get("tier")
	tokenStr := q.Get("token")

	var imageURL string

	switch {
	case tierStr != "":
		tierID, err := strconv.Atoi(tierStr)
		if err != nil || tierID < 0 {
			validate.WriteJSON(w, http.StatusBadRequest, map[string]string{
				"error": "Invalid tier ID",
			})
			return
		}

		imageURL, err = h.core.GetTierImageURL(ctx, tierID)
		if err != nil {
			h.logger.Error("failed to resolve tier image", "tier_id", tierID, "error", err)
			http.Error(w, "Image not found for tier", http.StatusNotFound)
			return
		}

	case tokenStr != "":
		tokenID, err := strconv.Atoi(tokenStr)
		if err != nil || tokenID < 0 {
			validate.WriteJSON(w, http.StatusBadRequest, map[string]string{
				"error": "Invalid token ID",
			})
			return
		}

		imageURL, err = h.core.GetTokenImageURL(ctx, tokenID)
		if err != nil {
			if errors.Is(err, nftpkg.ErrTokenNotFound) {
				http.NotFound(w, r)
				return
			}
			h.logger.Error("failed to resolve token image", "token_id", tokenID, "error", err)
			http.Error(w, "Image not found for token", http.StatusNotFound)
			return
		}

	default:
		validate.WriteJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Required: tier=<id> or token=<id>",
		})
		return
	}

	h.imageSvc.ServeImage(ctx, w, r, imageURL)
}

// tierImageProxyURL returns the opaque proxy URL for a tier image.
func tierImageProxyURL(tierID int) string {
	return fmt.Sprintf("/api/nft/image?tier=%d", tierID)
}

// tokenImageProxyURL returns the opaque proxy URL for a token image.
func tokenImageProxyURL(tokenID int) string {
	return fmt.Sprintf("/api/nft/image?token=%d", tokenID)
}
