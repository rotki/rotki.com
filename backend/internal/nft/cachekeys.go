package nft

import (
	"fmt"
	"net/url"
	"slices"
	"strings"
)

// Cache key factories matching the TypeScript implementation.

// TierCacheKey returns the cache key for a specific tier.
func TierCacheKey(contractAddress string, releaseID, tierID int) string {
	return fmt.Sprintf("tier:%s:%d:%d", strings.ToLower(contractAddress), releaseID, tierID)
}

// MetadataCacheKey returns the cache key for metadata at a given URI.
func MetadataCacheKey(metadataURI string) string {
	return "metadata:" + normalizeURL(metadataURI)
}

// ImageCacheKey returns the cache key for a cached image.
func ImageCacheKey(imageURL string) string {
	return "image:" + normalizeURL(imageURL)
}

// TokenCacheKey returns the cache key for a specific token.
func TokenCacheKey(contractAddress string, tokenID int) string {
	return fmt.Sprintf("token:%s:%d", strings.ToLower(contractAddress), tokenID)
}

// normalizeURL normalizes a URL for consistent cache keys.
// IPFS URLs are reduced to ipfs:{cid}, HTTP URLs get sorted query params.
func normalizeURL(rawURL string) string {
	rawURL = strings.TrimSpace(rawURL)
	if rawURL == "" {
		return ""
	}

	// IPFS: extract CID
	if strings.HasPrefix(rawURL, "ipfs://") {
		cid := strings.TrimPrefix(rawURL, "ipfs://")
		if idx := strings.IndexByte(cid, '?'); idx != -1 {
			cid = cid[:idx]
		}
		if idx := strings.IndexByte(cid, '#'); idx != -1 {
			cid = cid[:idx]
		}
		return "ipfs:" + strings.ToLower(cid)
	}

	// Also handle gateway URLs
	if strings.Contains(rawURL, "/ipfs/") {
		idx := strings.Index(rawURL, "/ipfs/")
		cid := rawURL[idx+6:]
		if i := strings.IndexByte(cid, '?'); i != -1 {
			cid = cid[:i]
		}
		if i := strings.IndexByte(cid, '#'); i != -1 {
			cid = cid[:i]
		}
		return "ipfs:" + strings.ToLower(cid)
	}

	// HTTP(S): parse, filter params, sort, lowercase
	u, err := url.Parse(rawURL)
	if err != nil {
		return strings.ToLower(strings.TrimSpace(rawURL))
	}

	// Only keep allowed query params (case-insensitive match)
	allowed := map[string]bool{"token": true, "network": true, "tierids": true, "skipcache": true}
	filtered := url.Values{}
	for k, vals := range u.Query() {
		if allowed[strings.ToLower(k)] {
			slices.Sort(vals)
			filtered[strings.ToLower(k)] = vals
		}
	}

	u.RawQuery = filtered.Encode()
	u.Fragment = ""
	return strings.ToLower(u.String())
}
