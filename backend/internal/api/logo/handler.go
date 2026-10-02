// Package logo serves the seasonal rotki logos published in rotki/data from the site's own origin.
package logo

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"regexp"
	"time"

	"github.com/rotki/rotki.com/backend/internal/cache"
)

// Cache keys
const (
	mappingCacheKey      = "logo:mapping"
	staleMappingCacheKey = "logo:mapping:stale"
	lockKey              = "logo:mapping"
)

// TTL configuration
const (
	// A new seasonal logo shows up within mappingTTL + clientMaxAge of its rotki/data commit,
	// and a logo file changed in place within imageTTL + clientMaxAge.
	mappingTTL      = 10 * time.Minute
	imageTTL        = 10 * time.Minute
	staleMappingTTL = 7 * 24 * time.Hour
	clientMaxAge    = 5 * time.Minute
	lockTTL         = 30 * time.Second
)

const dataRepoURL = "https://raw.githubusercontent.com/rotki/data"

// names are the logos the site asks for; the mapping also holds the app's, which stay unserved.
var names = map[string]bool{"website": true}

// imageFile is a plain image filename, so the mapping cannot point outside `assets/icons/`.
var imageFile = regexp.MustCompile(`(?i)^[\w.-]+\.(?:png|svg|webp|gif|jpe?g)$`)

// errNoMapping is returned when rotki/data cannot be read and no earlier mapping is cached.
var errNoMapping = errors.New("logo mapping unavailable")

// imageServer serves a remote image through the shared image cache.
type imageServer interface {
	ServeImageWithMaxAge(ctx context.Context, w http.ResponseWriter, r *http.Request, rawURL string, maxAge time.Duration)
	SetPrefixTTL(prefix string, ttl time.Duration)
}

// Handler resolves a logo name through the rotki/data asset mappings and serves its image.
type Handler struct {
	memory     *cache.Memory
	redis      *cache.Redis
	lock       *cache.Lock
	images     imageServer
	httpClient *http.Client
	baseURL    string
	branch     string
	logger     *slog.Logger
}

// NewHandler creates a logo handler reading rotki/data's develop branch when testing and main otherwise.
// rotki/data can replace a logo under the same filename, so its images are only cached for imageTTL.
func NewHandler(memory *cache.Memory, redis *cache.Redis, lock *cache.Lock, images imageServer, testing bool, logger *slog.Logger) *Handler {
	branch := "main"
	if testing {
		branch = "develop"
	}
	images.SetPrefixTTL(dataRepoURL+"/", imageTTL)
	return &Handler{
		memory:     memory,
		redis:      redis,
		lock:       lock,
		images:     images,
		httpClient: &http.Client{Timeout: 15 * time.Second},
		baseURL:    dataRepoURL,
		branch:     branch,
		logger:     logger.With("handler", "logo"),
	}
}

// ServeHTTP handles GET /api/logo/{name}. A 404 lets the page fall back to the bundled logo.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	if !names[name] {
		http.NotFound(w, r)
		return
	}

	mapping, err := h.mapping(r.Context())
	if err != nil {
		h.logger.Warn("no logo mapping", "error", err)
		w.Header().Set("Cache-Control", "no-store")
		http.Error(w, "Logo unavailable", http.StatusServiceUnavailable)
		return
	}

	file := mapping[name]
	if !imageFile.MatchString(file) {
		h.logger.Warn("logo missing from mapping", "name", name, "file", file)
		w.Header().Set("Cache-Control", fmt.Sprintf("public, max-age=%d", int(clientMaxAge.Seconds())))
		http.NotFound(w, r)
		return
	}

	h.images.ServeImageWithMaxAge(r.Context(), w, r, fmt.Sprintf("%s/%s/assets/icons/%s", h.baseURL, h.branch, file), clientMaxAge)
}

// mapping returns the logo section of rotki/data's asset mappings from cache, fetching it when it expired.
// When rotki/data cannot be read it falls back to the last mapping it saw.
func (h *Handler) mapping(ctx context.Context) (map[string]string, error) {
	if data, ok := h.memory.Get(mappingCacheKey); ok {
		if mapping, ok := data.(map[string]string); ok {
			return mapping, nil
		}
	}

	var cached map[string]string
	if h.redis.Get(ctx, mappingCacheKey, &cached) {
		h.memory.Set(mappingCacheKey, cached, mappingTTL)
		return cached, nil
	}

	token := h.lock.Acquire(ctx, lockKey, lockTTL)
	if token == "" {
		// Another instance is fetching; the previous mapping is good enough meanwhile.
		if stale, err := h.staleMapping(ctx); err == nil {
			return stale, nil
		}
		// No previous mapping yet (empty Redis after a deploy or flush): fetch it too
		// rather than fail, it is one small file.
		return h.refreshMapping(ctx)
	}
	defer h.lock.Release(ctx, lockKey, token)

	return h.refreshMapping(ctx)
}

// refreshMapping fetches the mapping and caches it, falling back to the last one on failure.
func (h *Handler) refreshMapping(ctx context.Context) (map[string]string, error) {
	mapping, err := h.fetchMapping(ctx)
	if err != nil {
		h.logger.Error("failed to fetch logo mapping", "error", err)
		return h.staleMapping(ctx)
	}

	h.memory.Set(mappingCacheKey, mapping, mappingTTL)
	h.memory.Set(staleMappingCacheKey, mapping, staleMappingTTL)
	_ = h.redis.Set(ctx, mappingCacheKey, mapping, mappingTTL)
	_ = h.redis.Set(ctx, staleMappingCacheKey, mapping, staleMappingTTL)
	return mapping, nil
}

// staleMapping returns the last mapping fetched, from memory or Redis.
func (h *Handler) staleMapping(ctx context.Context) (map[string]string, error) {
	if data, ok := h.memory.Get(staleMappingCacheKey); ok {
		if mapping, ok := data.(map[string]string); ok {
			return mapping, nil
		}
	}

	var stale map[string]string
	if h.redis.Get(ctx, staleMappingCacheKey, &stale) {
		h.memory.Set(staleMappingCacheKey, stale, staleMappingTTL)
		return stale, nil
	}
	return nil, errNoMapping
}

// fetchMapping reads the logo section of `constants/asset-mappings.json` from rotki/data.
func (h *Handler) fetchMapping(ctx context.Context) (map[string]string, error) {
	url := fmt.Sprintf("%s/%s/constants/asset-mappings.json", h.baseURL, h.branch)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("User-Agent", "rotki.com")

	resp, err := h.httpClient.Do(req) //nolint:gosec // G704: URL is built from constants and the configured branch, not user input
	if err != nil {
		return nil, fmt.Errorf("request asset mappings: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("asset mappings returned %d", resp.StatusCode)
	}

	var body struct {
		Logo map[string]string `json:"logo"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&body); err != nil {
		return nil, fmt.Errorf("parse asset mappings: %w", err)
	}
	if len(body.Logo) == 0 {
		return nil, errors.New("asset mappings have no logo section")
	}

	h.logger.Info("cached logo mapping", "branch", h.branch, "website", body.Logo["website"])
	return body.Logo, nil
}
