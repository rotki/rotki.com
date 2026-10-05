// Package messages serves the homepage dashboard messages published in rotki/data from the site's own origin.
package messages

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/rotki/rotki.com/backend/internal/cache"
)

// Cache keys
const (
	dashboardCacheKey      = "messages:dashboard"
	staleDashboardCacheKey = "messages:dashboard:stale"
	lockKey                = "messages:dashboard"
)

// TTL configuration
const (
	// A message edited in rotki/data shows up within dashboardTTL + clientMaxAge of its commit.
	dashboardTTL      = 10 * time.Minute
	staleDashboardTTL = 7 * 24 * time.Hour
	clientMaxAge      = 5 * time.Minute
	lockTTL           = 30 * time.Second
)

const dataRepoURL = "https://raw.githubusercontent.com/rotki/data"

// errNoMessages is returned when rotki/data cannot be read and no earlier copy is cached.
var errNoMessages = errors.New("dashboard messages unavailable")

// entry is one message as published, kept verbatim, with its end time pulled out for filtering.
type entry struct {
	End float64         `json:"end"`
	Raw json.RawMessage `json:"raw"`
}

// Handler serves rotki/data's `messages/dashboard.json`, without the messages that already ended.
type Handler struct {
	memory     *cache.Memory
	redis      *cache.Redis
	lock       *cache.Lock
	httpClient *http.Client
	baseURL    string
	branch     string
	now        func() time.Time
	logger     *slog.Logger
}

// NewHandler creates a dashboard messages handler reading rotki/data's develop branch when testing and main otherwise.
func NewHandler(memory *cache.Memory, redis *cache.Redis, lock *cache.Lock, testing bool, logger *slog.Logger) *Handler {
	branch := "main"
	if testing {
		branch = "develop"
	}
	return &Handler{
		memory:     memory,
		redis:      redis,
		lock:       lock,
		httpClient: &http.Client{Timeout: 15 * time.Second},
		baseURL:    dataRepoURL,
		branch:     branch,
		now:        time.Now,
		logger:     logger.With("handler", "messages"),
	}
}

// ServeHTTP handles GET /api/messages/dashboard. The body is the published JSON array, keys untouched,
// minus messages whose period has ended. Messages that have not started yet stay in, since a browser
// keeps the response for clientMaxAge and the page checks the start itself.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	entries, err := h.dashboard(r.Context())
	if err != nil {
		h.logger.Warn("no dashboard messages", "error", err)
		w.Header().Set("Cache-Control", "no-store")
		http.Error(w, "Messages unavailable", http.StatusServiceUnavailable)
		return
	}

	now := float64(h.now().Unix())
	current := make([]json.RawMessage, 0, len(entries))
	for _, e := range entries {
		if e.End > now {
			current = append(current, e.Raw)
		}
	}

	body, err := json.Marshal(current)
	if err != nil {
		h.logger.Error("failed to encode dashboard messages", "error", err)
		http.Error(w, "Messages unavailable", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", fmt.Sprintf("public, max-age=%d", int(clientMaxAge.Seconds())))
	_, _ = w.Write(body)
}

// dashboard returns the messages from cache, fetching them when they expired.
// When rotki/data cannot be read it falls back to the last copy it saw.
func (h *Handler) dashboard(ctx context.Context) ([]entry, error) {
	if data, ok := h.memory.Get(dashboardCacheKey); ok {
		if entries, ok := data.([]entry); ok {
			return entries, nil
		}
	}

	var cached []entry
	if h.redis.Get(ctx, dashboardCacheKey, &cached) {
		h.memory.Set(dashboardCacheKey, cached, dashboardTTL)
		return cached, nil
	}

	token := h.lock.Acquire(ctx, lockKey, lockTTL)
	if token == "" {
		// Another instance is fetching; the previous copy is good enough meanwhile.
		if stale, err := h.staleDashboard(ctx); err == nil {
			return stale, nil
		}
		// No previous copy yet (empty Redis after a deploy or flush): fetch it too
		// rather than fail, it is one small file.
		return h.refreshDashboard(ctx)
	}
	defer h.lock.Release(ctx, lockKey, token)

	return h.refreshDashboard(ctx)
}

// refreshDashboard fetches the messages and caches them, falling back to the last copy on failure.
func (h *Handler) refreshDashboard(ctx context.Context) ([]entry, error) {
	entries, err := h.fetchDashboard(ctx)
	if err != nil {
		h.logger.Error("failed to fetch dashboard messages", "error", err)
		return h.staleDashboard(ctx)
	}

	h.memory.Set(dashboardCacheKey, entries, dashboardTTL)
	h.memory.Set(staleDashboardCacheKey, entries, staleDashboardTTL)
	_ = h.redis.Set(ctx, dashboardCacheKey, entries, dashboardTTL)
	_ = h.redis.Set(ctx, staleDashboardCacheKey, entries, staleDashboardTTL)
	return entries, nil
}

// staleDashboard returns the last messages fetched, from memory or Redis.
func (h *Handler) staleDashboard(ctx context.Context) ([]entry, error) {
	if data, ok := h.memory.Get(staleDashboardCacheKey); ok {
		if entries, ok := data.([]entry); ok {
			return entries, nil
		}
	}

	var stale []entry
	if h.redis.Get(ctx, staleDashboardCacheKey, &stale) {
		h.memory.Set(staleDashboardCacheKey, stale, staleDashboardTTL)
		return stale, nil
	}
	return nil, errNoMessages
}

// fetchDashboard reads `messages/dashboard.json` from rotki/data. Messages without text or a valid
// period are dropped, so one bad entry does not take the others down with it.
func (h *Handler) fetchDashboard(ctx context.Context) ([]entry, error) {
	url := fmt.Sprintf("%s/%s/messages/dashboard.json", h.baseURL, h.branch)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("User-Agent", "rotki.com")

	resp, err := h.httpClient.Do(req) //nolint:gosec // G704: URL is built from constants and the configured branch, not user input
	if err != nil {
		return nil, fmt.Errorf("request dashboard messages: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("dashboard messages returned %d", resp.StatusCode)
	}

	var raw []json.RawMessage
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&raw); err != nil {
		return nil, fmt.Errorf("parse dashboard messages: %w", err)
	}

	entries := make([]entry, 0, len(raw))
	for _, item := range raw {
		var msg struct {
			Message string `json:"message"`
			Period  struct {
				Start float64 `json:"start"`
				End   float64 `json:"end"`
			} `json:"period"`
		}
		if err := json.Unmarshal(item, &msg); err != nil || msg.Message == "" || msg.Period.Start <= 0 || msg.Period.End <= 0 {
			h.logger.Warn("skipping invalid dashboard message", "message", string(item))
			continue
		}
		entries = append(entries, entry{End: msg.Period.End, Raw: item})
	}

	h.logger.Info("cached dashboard messages", "branch", h.branch, "count", len(entries))
	return entries, nil
}
