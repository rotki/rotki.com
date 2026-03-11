package nft

import (
	"testing"
)

func TestTierCacheKey(t *testing.T) {
	key := TierCacheKey("0xAbCdEf", 1, 2)
	if key != "tier:0xabcdef:1:2" {
		t.Errorf("got %q", key)
	}
}

func TestMetadataCacheKey(t *testing.T) {
	key := MetadataCacheKey("ipfs://QmTest123")
	if key != "metadata:ipfs:qmtest123" {
		t.Errorf("got %q", key)
	}
}

func TestImageCacheKey(t *testing.T) {
	key := ImageCacheKey("ipfs://QmImage456")
	if key != "image:ipfs:qmimage456" {
		t.Errorf("got %q", key)
	}
}

func TestTokenCacheKey(t *testing.T) {
	key := TokenCacheKey("0xAbCdEf", 42)
	if key != "token:0xabcdef:42" {
		t.Errorf("got %q", key)
	}
}

func TestNormalizeURL_IPFS(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"ipfs://QmABC123", "ipfs:qmabc123"},
		{"ipfs://QmABC123?foo=bar", "ipfs:qmabc123"},
		{"https://ipfs.io/ipfs/QmABC123", "ipfs:qmabc123"},
		{"https://gateway.pinata.cloud/ipfs/QmXYZ", "ipfs:qmxyz"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			if got := normalizeURL(tt.input); got != tt.want {
				t.Errorf("normalizeURL(%q) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}
}

func TestNormalizeURL_HTTP(t *testing.T) {
	// Only allowed params should be kept, sorted
	input := "https://example.com/api?skipCache=true&foo=bar&token=abc"
	got := normalizeURL(input)
	// foo should be filtered out
	if got != "https://example.com/api?skipcache=true&token=abc" {
		t.Errorf("normalizeURL(%q) = %q", input, got)
	}
}

func TestNormalizeURL_Empty(t *testing.T) {
	if got := normalizeURL(""); got != "" {
		t.Errorf("expected empty string, got %q", got)
	}
}
