package images

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"sync"

	"github.com/rotki/rotki.com/backend/internal/nft"
)

// maxInflight is the maximum number of concurrent dedup fetch entries.
const maxInflight = 100

// Service is the main image proxy service handling fetch, cache, and serving.
type Service struct {
	cache   *CacheManager
	fetcher *Fetcher
	logger  *slog.Logger

	// Request deduplication: prevents multiple concurrent fetches for the same URL.
	inflight   map[string]*inflightEntry
	inflightMu sync.Mutex
}

type inflightEntry struct {
	done chan struct{}
	err  error
}

// NewService creates a new image service.
func NewService(cache *CacheManager, fetcher *Fetcher, logger *slog.Logger) *Service {
	return &Service{
		cache:    cache,
		fetcher:  fetcher,
		logger:   logger.With("component", "image-service"),
		inflight: make(map[string]*inflightEntry),
	}
}

// ServeImage handles an image proxy request: checks cache, conditional headers,
// fetches from upstream if needed, caches the result, and writes the response.
func (s *Service) ServeImage(ctx context.Context, w http.ResponseWriter, r *http.Request, rawURL string) {
	normalizedURL := nft.NormalizeIPFSURL(rawURL)
	cacheKey := nft.ImageCacheKey(rawURL)

	// Check conditional request headers against cached metadata
	if s.handleConditional(ctx, w, r, normalizedURL) {
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
			if served := s.serveCached(ctx, w, r, meta, normalizedURL); served {
				return
			}
			// File missing on disk — metadata was invalidated, fall through to re-fetch
		}
	}

	// Cache miss — fetch with deduplication
	s.logger.Debug("cache miss, fetching", "url", normalizedURL)
	data, headers, err := s.deduplicatedFetch(ctx, cacheKey, normalizedURL)
	if err != nil {
		s.handleFetchError(ctx, w, normalizedURL, err)
		return
	}

	// Validate content type against allowlist
	if !isAllowedContentType(headers.ContentType) {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		http.Error(w, "Unsupported image type", http.StatusBadRequest)
		return
	}

	// Cache the image
	s.cache.StoreImage(ctx, normalizedURL, data, headers.ContentType, headers.ETag, headers.LastModified)

	// Write response
	s.writeImageResponse(w, data, headers)
}

// FetchAndCache fetches an image and caches it without writing an HTTP response.
// Used for cache warming.
func (s *Service) FetchAndCache(ctx context.Context, rawURL string) error {
	normalizedURL := nft.NormalizeIPFSURL(rawURL)

	data, headers, err := s.fetcher.FetchImage(ctx, normalizedURL)
	if err != nil {
		return err
	}

	if !isAllowedContentType(headers.ContentType) {
		return fmt.Errorf("invalid content type: %s", headers.ContentType)
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

// deduplicatedFetch ensures only one fetch is in progress per cache key.
func (s *Service) deduplicatedFetch(ctx context.Context, cacheKey, url string) ([]byte, *ResponseHeaders, error) {
	s.inflightMu.Lock()
	if entry, ok := s.inflight[cacheKey]; ok {
		s.inflightMu.Unlock()
		// Wait for the in-flight request to complete
		select {
		case <-entry.done:
		case <-ctx.Done():
			return nil, nil, ctx.Err()
		}
		if entry.err != nil {
			return nil, nil, entry.err
		}
		// The first request cached it — read metadata and file from cache
		meta, ok := s.cache.GetMetadata(ctx, url)
		if !ok || meta.Is404() || meta.Filename == "" {
			return nil, nil, fmt.Errorf("image not available after dedup wait")
		}
		data, err := s.readCachedFile(meta.Filename)
		if err != nil {
			return nil, nil, err
		}
		return data, &ResponseHeaders{
			ContentLength: meta.Size,
			ContentType:   meta.ContentType,
			ETag:          meta.ETag,
			LastModified:  meta.LastModified,
		}, nil
	}

	if len(s.inflight) >= maxInflight {
		s.inflightMu.Unlock()
		return nil, nil, fmt.Errorf("too many concurrent image fetches")
	}

	entry := &inflightEntry{done: make(chan struct{})}
	s.inflight[cacheKey] = entry
	s.inflightMu.Unlock()

	data, headers, err := s.fetcher.FetchImage(ctx, url)
	entry.err = err
	close(entry.done)

	s.inflightMu.Lock()
	delete(s.inflight, cacheKey)
	s.inflightMu.Unlock()

	return data, headers, err
}

// readCachedFile reads the full contents of a cached image file.
// Used only for dedup waiters who need data for the initial response.
func (s *Service) readCachedFile(filename string) ([]byte, error) {
	f, err := s.cache.OpenImage(filename)
	if err != nil {
		return nil, err
	}
	if f == nil {
		return nil, fmt.Errorf("cached file not found: %s", filename)
	}
	defer func() { _ = f.Close() }()

	data, err := io.ReadAll(f)
	if err != nil {
		return nil, fmt.Errorf("read cached file: %w", err)
	}
	return data, nil
}

// handleConditional checks If-None-Match and If-Modified-Since against cached metadata.
// Returns true if a 304 was sent.
func (s *Service) handleConditional(ctx context.Context, w http.ResponseWriter, r *http.Request, url string) bool {
	meta, ok := s.cache.GetMetadata(ctx, url)
	if !ok {
		return false
	}

	ifNoneMatch := r.Header.Get("If-None-Match")
	if meta.ETag != "" && ifNoneMatch != "" {
		normalizedEtag := strings.TrimPrefix(meta.ETag, "W/")
		normalizedINM := strings.TrimPrefix(ifNoneMatch, "W/")
		if normalizedEtag == normalizedINM {
			s.write304(w, meta)
			return true
		}
	}

	ifModifiedSince := r.Header.Get("If-Modified-Since")
	if meta.LastModified != "" && ifModifiedSince != "" {
		modifiedDate, err1 := http.ParseTime(meta.LastModified)
		ifModDate, err2 := http.ParseTime(ifModifiedSince)
		if err1 == nil && err2 == nil && !modifiedDate.After(ifModDate) {
			s.write304(w, meta)
			return true
		}
	}

	return false
}

func (s *Service) write304(w http.ResponseWriter, meta *Metadata) {
	h := w.Header()
	cacheTTLSec := CacheTTLSeconds
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
func (s *Service) serveCached(ctx context.Context, w http.ResponseWriter, r *http.Request, meta *Metadata, url string) bool {
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
	cacheTTLSec := CacheTTLSeconds
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

func (s *Service) writeImageResponse(w http.ResponseWriter, data []byte, headers *ResponseHeaders) {
	h := w.Header()
	cacheTTLSec := CacheTTLSeconds
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

// handleFetchError handles errors from image fetching, including caching 404s.
func (s *Service) handleFetchError(ctx context.Context, w http.ResponseWriter, url string, err error) {
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")

	var fetchErr *FetchError
	if !errors.As(err, &fetchErr) {
		s.logger.Error("image fetch error", "url", url, "error", err)
		http.Error(w, "Failed to fetch image", http.StatusBadGateway)
		return
	}

	if fetchErr.StatusCode == http.StatusNotFound {
		s.cache.Store404(ctx, url, fetchErr.ETag, fetchErr.LastModified)
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
