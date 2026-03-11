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
