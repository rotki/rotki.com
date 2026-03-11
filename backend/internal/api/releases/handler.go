// Package releases handles GitHub release information endpoints.
package releases

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/rotki/rotki.com/backend/internal/cache"
	"github.com/rotki/rotki.com/backend/internal/validate"
)

// Cache keys
const (
	cacheKey      = "github:releases:latest"
	staleCacheKey = "github:releases:latest:stale"
	etagCacheKey  = "github:releases:latest:etag"
	lockKey       = "github:releases:latest"
)

// TTL configuration
const (
	l1CacheTTL         = 1 * time.Hour                // in-memory
	l2CacheTTL         = 2*time.Hour + 10*time.Minute // Redis (outlives 2h scheduler interval)
	staleCacheTTL      = 24 * time.Hour               // Redis fallback
	staleWhileRevalSec = 3600                         // HTTP header (1 hour)
	lockTTL            = 30 * time.Second
	lockWaitDuration   = 100 * time.Millisecond
)

const githubAPIURL = "https://api.github.com/repos/rotki/rotki/releases/latest"

// Release represents the minimized GitHub release data.
type Release struct {
	TagName string  `json:"tag_name"`
	Assets  []Asset `json:"assets"`
}

// Asset represents a downloadable release asset.
type Asset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

// githubAPIRelease is the full GitHub API response (we only use a subset).
type githubAPIRelease struct {
	TagName string        `json:"tag_name"`
	Assets  []githubAsset `json:"assets"`
}

type githubAsset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

// Handler serves the latest GitHub release with multi-level caching.
type Handler struct {
	memory     *cache.Memory
	redis      *cache.Redis
	lock       *cache.Lock
	httpClient *http.Client
	logger     *slog.Logger
}

// NewHandler creates a new releases handler.
func NewHandler(memory *cache.Memory, redis *cache.Redis, lock *cache.Lock, logger *slog.Logger) *Handler {
	return &Handler{
		memory: memory,
		redis:  redis,
		lock:   lock,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:        10,
				MaxIdleConnsPerHost: 5,
				IdleConnTimeout:     90 * time.Second,
			},
		},
		logger: logger.With("handler", "releases"),
	}
}

// ServeHTTP handles GET /api/releases/latest.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Set HTTP cache headers
	w.Header().Set("Cache-Control", fmt.Sprintf("public, max-age=%d, stale-while-revalidate=%d", int(l2CacheTTL.Seconds()), staleWhileRevalSec))

	// 1. Check L1 cache (in-memory, instant)
	if data, ok := h.memory.Get(cacheKey); ok {
		h.logger.Debug("L1 cache hit")
		if release, ok := data.(*Release); ok {
			validate.WriteJSON(w, http.StatusOK, release)
			return
		}
	}

	// 2. Check L2 cache (Redis)
	var l2Release Release
	if h.redis.Get(ctx, cacheKey, &l2Release) {
		h.logger.Debug("L2 cache hit")
		h.updateL1(&l2Release)
		validate.WriteJSON(w, http.StatusOK, &l2Release)
		return
	}

	// 3. Cache miss — try to acquire lock
	token := h.lock.Acquire(ctx, lockKey, lockTTL)

	if token == "" {
		// Another instance is fetching — try stale data
		h.logger.Debug("lock busy, trying stale data")
		if release := h.tryStaleOrRetry(ctx); release != nil {
			validate.WriteJSON(w, http.StatusOK, release)
			return
		}
		http.Error(w, "Release data temporarily unavailable, please retry", http.StatusServiceUnavailable)
		return
	}

	// 4. We have the lock — fetch from GitHub
	release, err := h.FetchFromGitHub(ctx)
	h.lock.Release(ctx, lockKey, token)

	if err != nil {
		h.logger.Error("failed to fetch from GitHub", "error", err)

		// Try stale data as fallback
		var stale Release
		if h.redis.Get(ctx, staleCacheKey, &stale) {
			h.logger.Warn("returning stale data", "tag", stale.TagName)
			h.updateL1(&stale)
			validate.WriteJSON(w, http.StatusOK, &stale)
			return
		}

		http.Error(w, "Failed to fetch release information from GitHub", http.StatusBadGateway)
		return
	}

	validate.WriteJSON(w, http.StatusOK, release)
}

// FetchFromGitHub fetches the latest release from the GitHub API,
// updates all cache levels, and returns the minimized release.
// Uses ETag-based conditional requests when a cached ETag is available.
// Exported for use by the scheduled cache warming task.
func (h *Handler) FetchFromGitHub(ctx context.Context) (*Release, error) {
	// Try conditional request with cached ETag
	if etag, ok := h.redis.GetString(ctx, etagCacheKey); ok {
		release, err := h.doGitHubRequest(ctx, etag)
		if err != nil {
			return nil, err
		}
		if release != nil {
			return release, nil
		}
		// 304 but stale cache expired — clear ETag and fall through to fresh fetch
		_ = h.redis.Delete(ctx, etagCacheKey)
		h.logger.Info("stale cache expired after 304, fetching fresh")
	}

	// Fresh fetch without ETag (no 304 possible, no recursion)
	return h.doGitHubRequest(ctx, "")
}

// doGitHubRequest performs a single GitHub API request.
// If etag is non-empty, sends If-None-Match for conditional request.
// Returns (nil, nil) when GitHub returns 304 but stale cache has expired.
func (h *Handler) doGitHubRequest(ctx context.Context, etag string) (*Release, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, githubAPIURL, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "rotki.com")
	if etag != "" {
		req.Header.Set("If-None-Match", etag)
	}

	h.logger.Info("fetching latest release from GitHub API")
	resp, err := h.httpClient.Do(req) //nolint:gosec // G704: URL is a constant (githubAPIURL), not user input
	if err != nil {
		return nil, fmt.Errorf("GitHub API request: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	// 304 Not Modified — refresh cache TTL with stale data
	if resp.StatusCode == http.StatusNotModified {
		h.logger.Debug("GitHub returned 304, refreshing cache TTL")
		var stale Release
		if h.redis.Get(ctx, staleCacheKey, &stale) {
			h.cacheRelease(ctx, &stale)
			return &stale, nil
		}
		// Stale cache expired — signal caller to retry without ETag
		return nil, nil
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return nil, fmt.Errorf("GitHub API returned %d: %s", resp.StatusCode, string(body))
	}

	// Read and parse response with size limit
	body, err := io.ReadAll(io.LimitReader(resp.Body, 5<<20)) // 5MB limit
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	var apiRelease githubAPIRelease
	if err := json.Unmarshal(body, &apiRelease); err != nil {
		return nil, fmt.Errorf("parse response: %w", err)
	}

	release := minimizePayload(&apiRelease)
	h.cacheRelease(ctx, release)

	// Store ETag for future conditional requests
	if respEtag := resp.Header.Get("ETag"); respEtag != "" {
		_ = h.redis.SetString(ctx, etagCacheKey, respEtag, staleCacheTTL)
	}

	h.logger.Info("cached GitHub release", "tag", release.TagName)
	return release, nil
}

// cacheRelease writes the release to L1, L2, and stale caches.
func (h *Handler) cacheRelease(ctx context.Context, release *Release) {
	h.updateL1(release)
	_ = h.redis.Set(ctx, cacheKey, release, l2CacheTTL)
	_ = h.redis.Set(ctx, staleCacheKey, release, staleCacheTTL)
}

// updateL1 sets the release in the in-memory L1 cache.
func (h *Handler) updateL1(release *Release) {
	h.memory.Set(cacheKey, release, l1CacheTTL)
}

// tryStaleOrRetry tries stale cache, then waits briefly and retries L2.
func (h *Handler) tryStaleOrRetry(ctx context.Context) *Release {
	var stale Release
	if h.redis.Get(ctx, staleCacheKey, &stale) {
		h.updateL1(&stale)
		return &stale
	}

	// Wait briefly and retry L2, respecting context cancellation
	select {
	case <-ctx.Done():
		return nil
	case <-time.After(lockWaitDuration):
	}

	var l2 Release
	if h.redis.Get(ctx, cacheKey, &l2) {
		h.updateL1(&l2)
		return &l2
	}

	return nil
}

// isDownloadableApp checks if an asset is a downloadable app.
func isDownloadableApp(name string) bool {
	isWindows := strings.HasSuffix(name, ".exe") && strings.HasPrefix(name, "rotki-win32")
	isLinux := strings.HasSuffix(name, ".AppImage")
	isMacOS := strings.HasSuffix(name, ".dmg") && (strings.Contains(name, "arm64") || strings.Contains(name, "x64"))
	return isWindows || isLinux || isMacOS
}

// minimizePayload extracts only needed fields and filters to downloadable assets.
func minimizePayload(release *githubAPIRelease) *Release {
	var assets []Asset
	for _, a := range release.Assets {
		if isDownloadableApp(a.Name) {
			assets = append(assets, Asset(a))
		}
	}
	return &Release{
		TagName: release.TagName,
		Assets:  assets,
	}
}
