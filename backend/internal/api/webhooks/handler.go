package webhooks

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/rotki/rotki.com/backend/internal/api/releases"
	"github.com/rotki/rotki.com/backend/internal/nft"
	"github.com/rotki/rotki.com/backend/internal/validate"
)

// ReleaseType classifies a GitHub release for cache invalidation purposes.
type ReleaseType int

const (
	// ReleasePatch is a patch release (e.g. v1.35.1) — only release cache is invalidated.
	ReleasePatch ReleaseType = iota
	// ReleaseMinorOrMajor is a minor/major release (e.g. v1.35.0, v2.0.0) — both release and NFT caches are invalidated.
	ReleaseMinorOrMajor
)

const (
	maxBodySize    = 64 << 10 // 64 KB
	rateLimitDelay = time.Minute
)

// githubWebhookPayload is the subset of the GitHub release event payload we need.
type githubWebhookPayload struct {
	Action  string `json:"action"`
	Release struct {
		TagName string `json:"tag_name"`
	} `json:"release"`
}

// webhookResponse is the JSON response returned by the webhook handler.
type webhookResponse struct {
	Status              string `json:"status"`
	Tag                 string `json:"tag,omitempty"`
	ReleaseType         string `json:"release_type,omitempty"`
	ReleaseCacheCleared bool   `json:"release_cache_cleared,omitempty"`
	NFTCacheCleared     bool   `json:"nft_cache_cleared,omitempty"`
}

// Handler handles GitHub webhook requests.
type Handler struct {
	secret   string
	releases *releases.Handler
	nftCore  *nft.CoreService // may be nil if sponsorship is disabled
	logger   *slog.Logger

	mu             sync.Mutex
	lastInvalidate time.Time

	// onInvalidated is called after async invalidation completes (testing only).
	onInvalidated func()
}

// NewHandler creates a new GitHub webhook handler.
func NewHandler(secret string, releasesHandler *releases.Handler, nftCore *nft.CoreService, logger *slog.Logger) *Handler {
	return &Handler{
		secret:   secret,
		releases: releasesHandler,
		nftCore:  nftCore,
		logger:   logger.With("handler", "webhooks"),
	}
}

// ServeHTTP handles POST /api/webhooks/github.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// 1. Read body with size limit
	body, err := io.ReadAll(io.LimitReader(r.Body, maxBodySize+1))
	if err != nil {
		http.Error(w, "failed to read body", http.StatusBadRequest)
		return
	}
	if len(body) > maxBodySize {
		http.Error(w, "request body too large", http.StatusRequestEntityTooLarge)
		return
	}

	// 2. Verify HMAC signature
	sig := r.Header.Get("X-Hub-Signature-256")
	if !VerifySignature(body, sig, h.secret) {
		h.logger.Warn("webhook signature verification failed")
		http.Error(w, "invalid signature", http.StatusForbidden)
		return
	}

	// 3. Check event type — accept ping silently
	event := r.Header.Get("X-GitHub-Event")
	if event == "ping" {
		validate.WriteJSON(w, http.StatusOK, webhookResponse{Status: "pong"})
		return
	}

	if event != "release" {
		validate.WriteJSON(w, http.StatusOK, webhookResponse{Status: "ignored"})
		return
	}

	// 4. Parse payload
	var payload githubWebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		http.Error(w, "invalid JSON payload", http.StatusBadRequest)
		return
	}

	// 5. Only act on "published"
	if payload.Action != "published" {
		validate.WriteJSON(w, http.StatusOK, webhookResponse{Status: "ignored"})
		return
	}

	tag := payload.Release.TagName
	h.logger.Info("received release webhook", "tag", tag, "action", payload.Action, "delivery", r.Header.Get("X-GitHub-Delivery"))

	// 6. Rate limit
	if !h.tryRateLimit() {
		h.logger.Warn("webhook rate limited", "tag", tag)
		validate.WriteJSON(w, http.StatusOK, webhookResponse{Status: "rate_limited", Tag: tag})
		return
	}

	// 7. Classify, respond immediately, and invalidate in background
	releaseType := ClassifyRelease(tag)
	resp := h.buildResponse(tag, releaseType)
	validate.WriteJSON(w, http.StatusOK, resp)

	// Cache invalidation + re-warm runs after the response is sent.
	// Use a detached context so it isn't cancelled when the request ends.
	go h.invalidateAsync(tag, releaseType)
}

// buildResponse constructs the webhook response without performing any I/O.
func (h *Handler) buildResponse(tag string, releaseType ReleaseType) webhookResponse {
	resp := webhookResponse{
		Status: "accepted",
		Tag:    tag,
	}

	if releaseType == ReleaseMinorOrMajor {
		resp.ReleaseType = "minor_or_major"
	} else {
		resp.ReleaseType = "patch"
	}

	return resp
}

// invalidateAsync performs cache invalidation in a background goroutine.
// Uses a detached context with a timeout since the request context is already done.
func (h *Handler) invalidateAsync(tag string, releaseType ReleaseType) {
	defer func() {
		if h.onInvalidated != nil {
			h.onInvalidated()
		}
	}()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	// Always invalidate release cache
	release, err := h.releases.InvalidateCache(ctx)
	if err != nil {
		h.logger.Error("failed to invalidate release cache", "tag", tag, "error", err)
	} else {
		h.logger.Info("release cache invalidated", "tag", release.TagName)
	}

	// Invalidate NFT cache for minor/major releases
	if releaseType == ReleaseMinorOrMajor && h.nftCore != nil {
		deleted, err := h.nftCore.InvalidateAll(ctx)
		if err != nil {
			h.logger.Error("failed to invalidate NFT cache", "tag", tag, "error", err)
		} else {
			h.logger.Info("NFT cache invalidated", "tag", tag, "keys_deleted", deleted)
		}
	}
}

// tryRateLimit returns true if enough time has passed since the last invalidation.
func (h *Handler) tryRateLimit() bool {
	h.mu.Lock()
	defer h.mu.Unlock()

	now := time.Now()
	if now.Sub(h.lastInvalidate) < rateLimitDelay {
		return false
	}
	h.lastInvalidate = now
	return true
}

// ClassifyRelease determines if a tag is a patch or minor/major release.
// Tags are expected in "vMAJOR.MINOR.PATCH" format (e.g. "v1.35.1").
// Unparseable tags default to MinorOrMajor (invalidate more, not less).
func ClassifyRelease(tag string) ReleaseType {
	tag = strings.TrimPrefix(tag, "v")
	parts := strings.SplitN(tag, ".", 3)
	if len(parts) != 3 {
		return ReleaseMinorOrMajor
	}

	patch, err := strconv.Atoi(parts[2])
	if err != nil {
		return ReleaseMinorOrMajor
	}

	if patch > 0 {
		return ReleasePatch
	}
	return ReleaseMinorOrMajor
}

// SetNFTCore sets the NFT core service for minor/major release invalidation.
// This allows deferred injection when the NFT service is created after the webhook handler.
func (h *Handler) SetNFTCore(core *nft.CoreService) {
	h.nftCore = core
}
