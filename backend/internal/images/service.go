package images

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/rotki/rotki.com/backend/internal/nft"
)

// maxInflight is the maximum number of concurrent dedup fetch entries.
const maxInflight = 100

// ErrFetchPending is returned when an uncached image is still being fetched after the
// request stopped waiting. The fetch continues in the background and fills the cache.
var ErrFetchPending = errors.New("image fetch still in progress")

// Service is the main image proxy service handling fetch, cache, and serving.
type Service struct {
	cache   *CacheManager
	fetcher *Fetcher
	logger  *slog.Logger

	// Request deduplication: prevents multiple concurrent fetches for the same URL.
	inflight   map[string]*inflightEntry
	inflightMu sync.Mutex

	// Overridable in tests
	requestWait        time.Duration
	sharedFetchTimeout time.Duration
}

// inflightEntry is a shared upstream fetch. Its result fields are written once, before
// done is closed, and only read after done is closed.
type inflightEntry struct {
	done    chan struct{}
	data    []byte
	headers *ResponseHeaders
	err     error
}

// NewService creates a new image service.
func NewService(cache *CacheManager, fetcher *Fetcher, logger *slog.Logger) *Service {
	return &Service{
		cache:              cache,
		fetcher:            fetcher,
		logger:             logger.With("component", "image-service"),
		inflight:           make(map[string]*inflightEntry),
		requestWait:        RequestWaitTimeout,
		sharedFetchTimeout: SharedFetchTimeout,
	}
}

// ServeImage handles an image proxy request with the default client cache lifetime (CacheTTL).
func (s *Service) ServeImage(ctx context.Context, w http.ResponseWriter, r *http.Request, rawURL string) {
	s.ServeImageWithMaxAge(ctx, w, r, rawURL, CacheTTL)
}

// ServeImageWithMaxAge handles an image proxy request: checks cache, conditional headers,
// fetches from upstream if needed, caches the result, and writes the response.
// maxAge controls the Cache-Control lifetime sent to clients; it does not affect
// how long the image is kept in the server-side cache.
func (s *Service) ServeImageWithMaxAge(ctx context.Context, w http.ResponseWriter, r *http.Request, rawURL string, maxAge time.Duration) {
	normalizedURL := nft.NormalizeIPFSURL(rawURL)
	cacheKey := nft.ImageCacheKey(rawURL)

	// Check conditional request headers against cached metadata
	if s.handleConditional(ctx, w, r, normalizedURL, maxAge) {
		return
	}

	// Try to serve from cache
	meta, hasMeta := s.cache.GetMetadata(ctx, normalizedURL)
	if hasMeta {
		if meta.Is404() {
			s.logger.Debug("serving cached 404", "url", normalizedURL)
			w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
			http.Error(w, "Image not found", http.StatusNotFound)
			return
		}

		if meta.Filename != "" && meta.Size > 0 {
			if served := s.serveCached(ctx, w, r, meta, normalizedURL, maxAge); served {
				return
			}
			// File missing on disk — metadata was invalidated, fall through to re-fetch
		}
	} else if s.recoverFromDisk(ctx, normalizedURL) {
		if diskMeta, ok := s.cache.GetMetadata(ctx, normalizedURL); ok && s.serveCached(ctx, w, r, diskMeta, normalizedURL, maxAge) {
			return
		}
		// Without Redis the restored metadata can't be read back: serve straight from disk
		if diskMeta, ok := s.cache.DiskMetadata(normalizedURL); ok && s.serveCached(ctx, w, r, diskMeta, normalizedURL, maxAge) {
			return
		}
	}

	// Cache miss — fetch once for all concurrent requests
	s.logger.Debug("cache miss, fetching", "url", normalizedURL)
	data, headers, err := s.fetchShared(ctx, cacheKey, normalizedURL)
	if err != nil {
		if s.serveStale(ctx, w, r, normalizedURL, err) {
			return
		}
		s.handleFetchError(ctx, w, normalizedURL, err)
		return
	}

	// Validate content type against allowlist
	if !isAllowedContentType(headers.ContentType) {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		http.Error(w, "Unsupported image type", http.StatusBadRequest)
		return
	}

	// The shared fetch already stored the image in the cache
	s.writeImageResponse(w, data, headers, maxAge)
}

// ErrUnsupportedContentType is returned when upstream serves a type outside SupportedContentTypes.
var ErrUnsupportedContentType = errors.New("unsupported image content type")

// FetchAndCache fetches an image and caches it without writing an HTTP response.
// Used for cache warming. Images already cached on disk are skipped, so repeated
// warming (e.g. scheduler retries) doesn't refetch them from upstream.
func (s *Service) FetchAndCache(ctx context.Context, rawURL string) error {
	normalizedURL := nft.NormalizeIPFSURL(rawURL)

	if s.isCached(ctx, normalizedURL) || s.recoverFromDisk(ctx, normalizedURL) {
		return nil
	}

	data, headers, err := s.fetcher.FetchImage(ctx, normalizedURL)
	if err != nil {
		return err
	}

	if !isAllowedContentType(headers.ContentType) {
		return fmt.Errorf("%w: %s", ErrUnsupportedContentType, headers.ContentType)
	}

	s.cache.StoreImage(ctx, normalizedURL, data, headers.ContentType, headers.ETag, headers.LastModified)
	return nil
}

// WarmCache pre-fetches multiple images concurrently with controlled concurrency.
func (s *Service) WarmCache(ctx context.Context, urls []string) (succeeded, failed int) {
	sem := make(chan struct{}, MaxConcurrency)
	var mu sync.Mutex

	var wg sync.WaitGroup
	for _, url := range urls {
		wg.Add(1)
		go func(u string) {
			defer wg.Done()

			select {
			case sem <- struct{}{}:
			case <-ctx.Done():
				mu.Lock()
				failed++
				mu.Unlock()
				return
			}
			defer func() { <-sem }()

			if err := s.FetchAndCache(ctx, u); err != nil {
				if errors.Is(err, ErrUnsupportedContentType) {
					// Permanent content problem: retrying won't help, so it isn't counted as a failure
					s.logger.Warn("cache warm skipped unsupported image", "url", u, "error", err)
					return
				}
				s.logger.Warn("cache warm failed", "url", u, "error", err)
				mu.Lock()
				failed++
				mu.Unlock()
				return
			}
			mu.Lock()
			succeeded++
			mu.Unlock()
		}(url)
	}
	wg.Wait()

	s.logger.Debug("cache warming completed", "succeeded", succeeded, "failed", failed, "total", len(urls))
	return succeeded, failed
}

// fetchShared returns the result of a single upstream fetch per cache key, shared by all
// concurrent requests. The fetch runs detached from the caller's context (bounded by
// sharedFetchTimeout), so one client disconnecting doesn't cancel it for the others, and
// a fetch that finishes after every client left still fills the cache. The caller waits at
// most requestWait and then gets ErrFetchPending.
func (s *Service) fetchShared(ctx context.Context, cacheKey, url string) ([]byte, *ResponseHeaders, error) {
	s.inflightMu.Lock()
	entry, ok := s.inflight[cacheKey]
	if !ok {
		if len(s.inflight) >= maxInflight {
			s.inflightMu.Unlock()
			return nil, nil, fmt.Errorf("too many concurrent image fetches")
		}
		entry = &inflightEntry{done: make(chan struct{})}
		s.inflight[cacheKey] = entry
		go s.runSharedFetch(context.WithoutCancel(ctx), cacheKey, url, entry)
	}
	s.inflightMu.Unlock()

	timer := time.NewTimer(s.requestWait)
	defer timer.Stop()

	select {
	case <-entry.done:
		return entry.data, entry.headers, entry.err
	case <-ctx.Done():
		return nil, nil, ctx.Err()
	case <-timer.C:
		return nil, nil, ErrFetchPending
	}
}

// runSharedFetch performs a shared fetch, stores the result in the cache, and publishes it
// to waiters. Storing here (not in the request) means the cache fills even if no request is
// still waiting.
func (s *Service) runSharedFetch(ctx context.Context, cacheKey, url string, entry *inflightEntry) {
	ctx, cancel := context.WithTimeout(ctx, s.sharedFetchTimeout)
	defer cancel()

	data, headers, err := s.fetcher.FetchImage(ctx, url)

	var fetchErr *FetchError
	switch {
	case err == nil && isAllowedContentType(headers.ContentType):
		s.cache.StoreImage(ctx, url, data, headers.ContentType, headers.ETag, headers.LastModified)
	case errors.As(err, &fetchErr) && fetchErr.StatusCode == http.StatusNotFound:
		s.cache.Store404(ctx, url, fetchErr.ETag, fetchErr.LastModified)
	}

	entry.data, entry.headers, entry.err = data, headers, err
	close(entry.done)

	s.inflightMu.Lock()
	delete(s.inflight, cacheKey)
	s.inflightMu.Unlock()
}

// recoverFromDisk restores Redis metadata for an IPFS image whose file is still on disk.
// IPFS content never changes for a CID, so a file left behind after its metadata expired
// (or was cleared on a release) is still correct and doesn't need to be fetched again.
// Other URLs can change upstream, so their files are only used as a stale fallback.
func (s *Service) recoverFromDisk(ctx context.Context, url string) bool {
	if !isContentAddressed(url) {
		return false
	}
	meta, ok := s.cache.DiskMetadata(url)
	if !ok {
		return false
	}
	s.cache.SetMetadata(ctx, url, meta)
	s.logger.Debug("restored image metadata from disk", "url", url, "file", meta.Filename)
	return true
}

// serveStale serves an image left on disk when fetching it from upstream failed, with a
// short client cache lifetime. A confirmed 404 or an oversized image is not overridden.
func (s *Service) serveStale(ctx context.Context, w http.ResponseWriter, r *http.Request, url string, err error) bool {
	var fetchErr *FetchError
	if errors.As(err, &fetchErr) &&
		(fetchErr.StatusCode == http.StatusNotFound || fetchErr.StatusCode == http.StatusRequestEntityTooLarge) {
		return false
	}
	if ctx.Err() != nil {
		return false
	}

	meta, ok := s.cache.DiskMetadata(url)
	if !ok {
		return false
	}
	s.logger.Warn("upstream image fetch failed, serving stale copy from disk", "url", url, "error", err)
	return s.serveCached(ctx, w, r, meta, url, StaleMaxAge)
}

// isContentAddressed reports whether a URL points at immutable IPFS content.
func isContentAddressed(url string) bool {
	return strings.Contains(url, "/ipfs/")
}

// isCached reports whether an image has valid metadata and its file is present on disk.
func (s *Service) isCached(ctx context.Context, url string) bool {
	meta, ok := s.cache.GetMetadata(ctx, url)
	if !ok || meta.Is404() || meta.Filename == "" {
		return false
	}
	f, err := s.cache.OpenImage(meta.Filename)
	if err != nil || f == nil {
		return false
	}
	_ = f.Close()
	return true
}

// handleConditional checks If-None-Match and If-Modified-Since against cached metadata.
// Returns true if a 304 was sent.
func (s *Service) handleConditional(ctx context.Context, w http.ResponseWriter, r *http.Request, url string, maxAge time.Duration) bool {
	meta, ok := s.cache.GetMetadata(ctx, url)
	if !ok {
		return false
	}

	ifNoneMatch := r.Header.Get("If-None-Match")
	if meta.ETag != "" && ifNoneMatch != "" {
		normalizedEtag := strings.TrimPrefix(meta.ETag, "W/")
		normalizedINM := strings.TrimPrefix(ifNoneMatch, "W/")
		if normalizedEtag == normalizedINM {
			s.write304(w, meta, maxAge)
			return true
		}
	}

	ifModifiedSince := r.Header.Get("If-Modified-Since")
	if meta.LastModified != "" && ifModifiedSince != "" {
		modifiedDate, err1 := http.ParseTime(meta.LastModified)
		ifModDate, err2 := http.ParseTime(ifModifiedSince)
		if err1 == nil && err2 == nil && !modifiedDate.After(ifModDate) {
			s.write304(w, meta, maxAge)
			return true
		}
	}

	return false
}

func (s *Service) write304(w http.ResponseWriter, meta *Metadata, maxAge time.Duration) {
	h := w.Header()
	cacheTTLSec := int(maxAge / time.Second)
	h.Set("Cache-Control", fmt.Sprintf("public, max-age=%d, s-maxage=%d", cacheTTLSec, cacheTTLSec))
	if meta.ETag != "" {
		h.Set("ETag", meta.ETag)
	}
	if meta.LastModified != "" {
		h.Set("Last-Modified", meta.LastModified)
	}
	w.WriteHeader(http.StatusNotModified)
}

// serveCached opens the cached file and serves it with http.ServeContent
// for zero-copy delivery and automatic Range/conditional request handling.
// Returns true if the response was served, false if the file is missing
// (stale metadata is invalidated so the caller can re-fetch).
func (s *Service) serveCached(ctx context.Context, w http.ResponseWriter, r *http.Request, meta *Metadata, url string, maxAge time.Duration) bool {
	f, err := s.cache.OpenImage(meta.Filename)
	if err != nil || f == nil {
		s.logger.Warn("cached file missing on disk, invalidating metadata", "file", meta.Filename, "url", url, "error", err)
		s.cache.Invalidate(ctx, url)
		return false
	}
	defer func() { _ = f.Close() }()

	stat, err := f.Stat()
	if err != nil {
		s.logger.Warn("failed to stat cached image, invalidating metadata", "file", meta.Filename, "url", url, "error", err)
		s.cache.Invalidate(ctx, url)
		_ = f.Close()
		return false
	}

	h := w.Header()
	cacheTTLSec := int(maxAge / time.Second)
	h.Set("Cache-Control", fmt.Sprintf("public, max-age=%d, s-maxage=%d, stale-while-revalidate=%d", cacheTTLSec, cacheTTLSec, cacheTTLSec*2))
	h.Set("X-Content-Type-Options", "nosniff")
	h.Set("Content-Security-Policy", "sandbox")
	if meta.ContentType != "" {
		h.Set("Content-Type", meta.ContentType)
	}
	if meta.ETag != "" {
		h.Set("ETag", meta.ETag)
	}

	// http.ServeContent handles Range requests and Last-Modified/If-Modified-Since
	http.ServeContent(w, r, meta.Filename, stat.ModTime(), f)
	return true
}

func (s *Service) writeImageResponse(w http.ResponseWriter, data []byte, headers *ResponseHeaders, maxAge time.Duration) {
	h := w.Header()
	cacheTTLSec := int(maxAge / time.Second)
	h.Set("Cache-Control", fmt.Sprintf("public, max-age=%d, s-maxage=%d, stale-while-revalidate=%d", cacheTTLSec, cacheTTLSec, cacheTTLSec*2))
	h.Set("X-Content-Type-Options", "nosniff")
	h.Set("Content-Security-Policy", "sandbox")

	if headers.ContentType != "" {
		h.Set("Content-Type", headers.ContentType)
	}
	if headers.ETag != "" {
		h.Set("ETag", headers.ETag)
	}
	if headers.LastModified != "" {
		h.Set("Last-Modified", headers.LastModified)
	}

	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data) //nolint:gosec // G705: Content-Type is explicitly set, data is from trusted cache
}

// isAllowedContentType checks if a content type is in the supported image types.
func isAllowedContentType(ct string) bool {
	// Extract the media type without parameters (e.g., "image/png; charset=utf-8" -> "image/png")
	mediaType := ct
	if idx := strings.IndexByte(ct, ';'); idx != -1 {
		mediaType = strings.TrimSpace(ct[:idx])
	}
	return SupportedContentTypes[mediaType]
}

// handleFetchError writes the response for a failed image fetch. 404s are cached by the
// shared fetch itself, so they stay cached even when no request is waiting.
func (s *Service) handleFetchError(ctx context.Context, w http.ResponseWriter, url string, err error) {
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")

	if errors.Is(err, ErrFetchPending) {
		w.Header().Set("Retry-After", strconv.Itoa(fetchPendingRetryAfter))
		http.Error(w, "Image is still being fetched, retry shortly", http.StatusServiceUnavailable)
		return
	}
	if ctx.Err() != nil {
		// The client went away; the shared fetch continues without it
		return
	}

	var fetchErr *FetchError
	if !errors.As(err, &fetchErr) {
		s.logger.Error("image fetch error", "url", url, "error", err)
		http.Error(w, "Failed to fetch image", http.StatusBadGateway)
		return
	}

	if fetchErr.StatusCode == http.StatusNotFound {
		http.Error(w, "Image not found", http.StatusNotFound)
		return
	}

	if fetchErr.StatusCode == http.StatusRequestEntityTooLarge {
		http.Error(w, fetchErr.Message, http.StatusRequestEntityTooLarge)
		return
	}

	s.logger.Error("image fetch error", "url", url, "status", fetchErr.StatusCode, "error", fetchErr.Message)
	http.Error(w, "Failed to fetch image", http.StatusBadGateway)
}
