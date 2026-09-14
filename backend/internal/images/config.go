package images

import "time"

// Image processing configuration constants.
const (
	// CacheTTL is how long cached images are stored (7 days).
	CacheTTL = 7 * 24 * time.Hour

	// CacheTTLSeconds is CacheTTL in seconds, for HTTP Cache-Control headers.
	CacheTTLSeconds = int(CacheTTL / time.Second)

	// MaxImageSize is the maximum allowed image size (10MB).
	MaxImageSize = 10 * 1024 * 1024

	// FetchTimeout is the HTTP timeout for fetching images.
	FetchTimeout = 30 * time.Second

	// GatewayFetchTimeout bounds a single IPFS image request to one gateway
	// before falling back to the next one.
	GatewayFetchTimeout = 15 * time.Second

	// SharedFetchTimeout bounds a shared upstream image fetch. It runs detached from the
	// request that started it, so it can outlive that request and still fill the cache.
	SharedFetchTimeout = 60 * time.Second

	// RequestWaitTimeout is how long a request waits for an uncached image before it gets
	// a 503 with Retry-After. The shared fetch keeps running and caches the result.
	RequestWaitTimeout = 20 * time.Second

	// StaleMaxAge is the client cache lifetime for an image served from disk after its
	// upstream failed, so clients check back soon.
	StaleMaxAge = 5 * time.Minute

	// IPFSNotFoundTTL is how long a 404 for IPFS content is cached. Artwork can be pinned
	// shortly after a release's metadata is published, so a 404 there is only kept briefly.
	IPFSNotFoundTTL = 10 * time.Minute

	// fetchPendingRetryAfter is the Retry-After (seconds) sent while a fetch is still running.
	fetchPendingRetryAfter = 10

	// MaxConcurrency is the max number of concurrent image fetches during cache warming.
	MaxConcurrency = 5

	// maxRetries is the number of retry attempts for image fetches.
	maxRetries = 3

	// initialRetryDelay is the initial backoff delay for retries.
	initialRetryDelay = 500 * time.Millisecond

	// dirPermissions is the filesystem permission for cache directories.
	dirPermissions = 0o755

	// filePermissions is the filesystem permission for cached image files.
	filePermissions = 0o644
)

// SupportedContentTypes lists the valid image content types.
var SupportedContentTypes = map[string]bool{
	"image/jpeg":    true,
	"image/png":     true,
	"image/webp":    true,
	"image/gif":     true,
	"image/svg+xml": true,
}
