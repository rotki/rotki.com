// Package images provides image fetching, caching, and proxy services.
package images

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"time"

	"github.com/rotki/rotki.com/backend/internal/cache"
	"github.com/rotki/rotki.com/backend/internal/nft"
)

// Metadata holds cached image metadata stored in Redis.
type Metadata struct {
	ContentType  string `json:"contentType"`
	ETag         string `json:"etag,omitempty"`
	LastModified string `json:"lastModified,omitempty"`
	Filename     string `json:"filename"`
	Size         int    `json:"size"`
	CachedAt     string `json:"cachedAt"`
}

// Is404 returns true if this metadata represents a cached 404 response.
func (m *Metadata) Is404() bool {
	return m.Filename == "" && m.ContentType == "application/not-found"
}

// CacheManager handles filesystem-based image storage with Redis metadata.
type CacheManager struct {
	dir    string
	redis  *cache.Redis
	logger *slog.Logger
}

// NewCacheManager creates a new image cache manager.
// The dir must already exist.
func NewCacheManager(dir string, redis *cache.Redis, logger *slog.Logger) *CacheManager {
	return &CacheManager{
		dir:    dir,
		redis:  redis,
		logger: logger.With("component", "image-cache"),
	}
}

// metadataKey returns the Redis key for image metadata.
func (m *CacheManager) metadataKey(url string) string {
	return nft.ImageCacheKey(url) + ":metadata"
}

// hashFilename returns a SHA-256 hex filename for a URL.
func hashFilename(url string) string {
	h := sha256.Sum256([]byte(url))
	return hex.EncodeToString(h[:])
}

// filePath returns the full filesystem path for a cached image.
// Uses a 2-char prefix subdirectory to avoid flat directories with many files.
func (m *CacheManager) filePath(filename string) string {
	return filepath.Join(m.dir, filename[:2], filename)
}

// GetMetadata retrieves cached image metadata from Redis.
func (m *CacheManager) GetMetadata(ctx context.Context, url string) (*Metadata, bool) {
	key := m.metadataKey(url)
	var meta Metadata
	if m.redis.Get(ctx, key, &meta) {
		return &meta, true
	}
	return nil, false
}

// SetMetadata stores image metadata in Redis.
func (m *CacheManager) SetMetadata(ctx context.Context, url string, meta *Metadata) {
	key := m.metadataKey(url)
	if err := m.redis.Set(ctx, key, meta, CacheTTL); err != nil {
		m.logger.Error("failed to cache image metadata", "url", url, "error", err)
	}
}

// OpenImage opens a cached image file for reading.
// Returns the open file or nil if the file doesn't exist.
func (m *CacheManager) OpenImage(filename string) (*os.File, error) {
	path := m.filePath(filename)
	f, err := os.Open(path) //nolint:gosec // G304: path is SHA-256 hash derived from URL, not user-controlled
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("open cached image: %w", err)
	}
	return f, nil
}

// StoreImage writes image data to disk and stores metadata in Redis.
// The write is atomic: data goes to a temp file first, then renamed.
func (m *CacheManager) StoreImage(ctx context.Context, url string, data []byte, contentType, etag, lastModified string) {
	filename := hashFilename(url)
	path := m.filePath(filename)

	// Ensure subdirectory exists
	subdir := filepath.Dir(path)
	if err := os.MkdirAll(subdir, dirPermissions); err != nil { //nolint:gosec // G703: path is SHA-256 hash, not user input
		m.logger.Error("failed to create cache subdir", "path", subdir, "error", err)
		return
	}

	// Atomic write: temp file + rename
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, data, filePermissions); err != nil { //nolint:gosec // G703: path is SHA-256 hash, not user input
		m.logger.Error("failed to write image temp file", "path", tmp, "error", err)
		return
	}
	if err := os.Rename(tmp, path); err != nil { //nolint:gosec // G703: path is SHA-256 hash, not user input
		m.logger.Error("failed to rename image file", "from", tmp, "to", path, "error", err)
		_ = os.Remove(tmp) //nolint:gosec // G703: cleaning up temp file from SHA-256 path
		return
	}

	meta := &Metadata{
		ContentType:  contentType,
		ETag:         etag,
		LastModified: lastModified,
		Filename:     filename,
		Size:         len(data),
		CachedAt:     time.Now().UTC().Format(time.RFC3339),
	}
	m.SetMetadata(ctx, url, meta)
	m.logger.Debug("stored image", "url", url, "bytes", len(data), "file", filename)
}

// Store404 caches a 404 response to avoid repeated upstream requests.
func (m *CacheManager) Store404(ctx context.Context, url, etag, lastModified string) {
	meta := &Metadata{
		ContentType:  "application/not-found",
		ETag:         etag,
		LastModified: lastModified,
		CachedAt:     time.Now().UTC().Format(time.RFC3339),
	}
	m.SetMetadata(ctx, url, meta)
	m.logger.Debug("cached 404 response", "url", url)
}

// Invalidate removes the cached file and Redis metadata for an image.
func (m *CacheManager) Invalidate(ctx context.Context, url string) {
	meta, ok := m.GetMetadata(ctx, url)
	if !ok {
		return
	}

	if meta.Filename != "" {
		path := m.filePath(meta.Filename)
		if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
			m.logger.Error("failed to remove cached image", "path", path, "error", err)
		}
	}
	_ = m.redis.Delete(ctx, m.metadataKey(url))
	m.logger.Debug("invalidated image cache", "url", url)
}
