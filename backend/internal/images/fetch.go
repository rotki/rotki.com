package images

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"strconv"
	"time"

	"github.com/rotki/rotki.com/backend/internal/safedialer"
)

// ResponseHeaders holds parsed headers from an upstream image response.
type ResponseHeaders struct {
	ContentLength int
	ContentType   string
	ETag          string
	LastModified  string
}

// Fetcher handles HTTP image fetching with retry and validation.
type Fetcher struct {
	client *http.Client
	logger *slog.Logger
}

// NewFetcher creates a new image fetcher with SSRF-safe dialer.
func NewFetcher(logger *slog.Logger) *Fetcher {
	return newFetcher(logger, safedialer.New())
}

// newFetcher creates a fetcher with a custom dial function (nil uses default).
func newFetcher(logger *slog.Logger, dialCtx func(ctx context.Context, network, addr string) (net.Conn, error)) *Fetcher {
	transport := &http.Transport{
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 10,
		IdleConnTimeout:     90 * time.Second,
	}
	if dialCtx != nil {
		transport.DialContext = dialCtx
	}
	return &Fetcher{
		client: &http.Client{
			Timeout:   FetchTimeout,
			Transport: transport,
		},
		logger: logger.With("component", "image-fetcher"),
	}
}

// FetchImage fetches image data from a URL with retry logic.
// Returns the body bytes and parsed response headers.
func (f *Fetcher) FetchImage(ctx context.Context, url string) ([]byte, *ResponseHeaders, error) {
	var lastErr error
	delay := initialRetryDelay

	for attempt := 0; attempt <= maxRetries; attempt++ {
		if attempt > 0 {
			f.logger.Debug("retrying image fetch", "url", url, "attempt", attempt)
			select {
			case <-ctx.Done():
				return nil, nil, ctx.Err()
			case <-time.After(delay):
			}
			delay *= 2
		}

		data, headers, err := f.doFetch(ctx, url)
		if err == nil {
			return data, headers, nil
		}

		// Don't retry 4xx client errors — only retry 5xx server errors
		var fetchErr *FetchError
		if errors.As(err, &fetchErr) && fetchErr.StatusCode >= 400 && fetchErr.StatusCode < 500 {
			return nil, nil, err
		}

		lastErr = err
	}

	return nil, nil, fmt.Errorf("image fetch failed after %d attempts: %w", maxRetries+1, lastErr)
}

func (f *Fetcher) doFetch(ctx context.Context, url string) ([]byte, *ResponseHeaders, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, nil, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Accept", "image/*")
	req.Header.Set("User-Agent", "rotki.com/1.0")

	resp, err := f.client.Do(req) //nolint:gosec // G704: URLs are from cached NFT metadata, not user input
	if err != nil {
		return nil, nil, fmt.Errorf("http request: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	headers := extractHeaders(resp)

	if resp.StatusCode == http.StatusNotFound {
		return nil, nil, &FetchError{
			StatusCode:   404,
			Message:      "Image not found",
			ETag:         headers.ETag,
			LastModified: headers.LastModified,
		}
	}

	if resp.StatusCode != http.StatusOK {
		return nil, nil, &FetchError{
			StatusCode: resp.StatusCode,
			Message:    fmt.Sprintf("Image fetch failed: %d %s", resp.StatusCode, resp.Status),
		}
	}

	// Read body with size limit
	limited := io.LimitReader(resp.Body, MaxImageSize+1)
	data, err := io.ReadAll(limited)
	if err != nil {
		return nil, nil, fmt.Errorf("read response body: %w", err)
	}

	if len(data) > MaxImageSize {
		return nil, nil, &FetchError{
			StatusCode: http.StatusRequestEntityTooLarge,
			Message:    "Image too large (max 10MB)",
		}
	}

	// Update content length from actual data if header was missing
	if headers.ContentLength == 0 {
		headers.ContentLength = len(data)
	}

	return data, headers, nil
}

func extractHeaders(resp *http.Response) *ResponseHeaders {
	cl, _ := strconv.Atoi(resp.Header.Get("Content-Length"))
	return &ResponseHeaders{
		ContentLength: cl,
		ContentType:   resp.Header.Get("Content-Type"),
		ETag:          resp.Header.Get("ETag"),
		LastModified:  resp.Header.Get("Last-Modified"),
	}
}

// FetchError represents an HTTP error from fetching an image.
type FetchError struct {
	StatusCode   int
	Message      string
	ETag         string
	LastModified string
}

func (e *FetchError) Error() string {
	return e.Message
}
