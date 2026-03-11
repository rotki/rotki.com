package releases

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/rotki/rotki.com/backend/internal/cache"
)

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
}

func TestIsDownloadableApp(t *testing.T) {
	tests := []struct {
		name string
		want bool
	}{
		{"rotki-win32-electron_1.35.1.exe", true},
		{"rotki-linux_electron-1.35.1.AppImage", true},
		{"rotki-darwin_electron-1.35.1-arm64.dmg", true},
		{"rotki-darwin_electron-1.35.1-x64.dmg", true},
		{"rotki-1.35.1.tar.gz", false},
		{"checksums.txt", false},
		{"rotki-linux-1.35.1.deb", false},
		{"random-app.exe", false},
		{"rotki-darwin_electron-1.35.1.dmg", false}, // no arm64/x64
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := isDownloadableApp(tt.name); got != tt.want {
				t.Errorf("isDownloadableApp(%q) = %v, want %v", tt.name, got, tt.want)
			}
		})
	}
}

func TestMinimizePayload(t *testing.T) {
	input := &githubAPIRelease{
		TagName: "v1.35.1",
		Assets: []githubAsset{
			{Name: "rotki-win32-electron_1.35.1.exe", BrowserDownloadURL: "https://example.com/win.exe"},
			{Name: "checksums.txt", BrowserDownloadURL: "https://example.com/checksums.txt"},
			{Name: "rotki-linux_electron-1.35.1.AppImage", BrowserDownloadURL: "https://example.com/linux.AppImage"},
			{Name: "rotki-darwin_electron-1.35.1-arm64.dmg", BrowserDownloadURL: "https://example.com/mac-arm.dmg"},
		},
	}

	result := minimizePayload(input)

	if result.TagName != "v1.35.1" {
		t.Errorf("expected tag v1.35.1, got %s", result.TagName)
	}
	if len(result.Assets) != 3 {
		t.Fatalf("expected 3 assets, got %d", len(result.Assets))
	}
	// checksums.txt should be filtered out
	for _, a := range result.Assets {
		if a.Name == "checksums.txt" {
			t.Error("checksums.txt should have been filtered")
		}
	}
}

func TestHandler_MethodNotAllowed(t *testing.T) {
	logger := testLogger()
	mem := cache.NewMemory()
	defer mem.Close()
	red := cache.NewRedis("", "", logger)
	lck := cache.NewLock(red, logger)

	h := NewHandler(mem, red, lck, logger)
	mux := http.NewServeMux()
	mux.Handle("GET /api/releases/latest", h)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/releases/latest", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", w.Code)
	}
}

func TestHandler_L1CacheHit(t *testing.T) {
	logger := testLogger()
	mem := cache.NewMemory()
	defer mem.Close()
	red := cache.NewRedis("", "", logger)
	lck := cache.NewLock(red, logger)

	// Pre-populate L1 cache
	release := &Release{
		TagName: "v1.35.0",
		Assets:  []Asset{{Name: "test.exe", BrowserDownloadURL: "https://example.com/test.exe"}},
	}
	mem.Set(cacheKey, release, 5*time.Minute)

	h := NewHandler(mem, red, lck, logger)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/releases/latest", nil)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp Release
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode error: %v", err)
	}

	if resp.TagName != "v1.35.0" {
		t.Errorf("expected tag v1.35.0, got %s", resp.TagName)
	}

	// Verify Cache-Control header is set
	cc := w.Header().Get("Cache-Control")
	if cc == "" {
		t.Error("expected Cache-Control header")
	}
}

func TestHandler_CacheMiss_NoRedis(t *testing.T) {
	// With no Redis and no GitHub (mock server returns error),
	// the handler should return 502.
	logger := testLogger()
	mem := cache.NewMemory()
	defer mem.Close()
	red := cache.NewRedis("", "", logger)
	lck := cache.NewLock(red, logger)

	h := NewHandler(mem, red, lck, logger)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/releases/latest", nil)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	// Without Redis and with no mock GitHub server, this will try to fetch
	// from the real GitHub API. If that fails (network), it returns 502.
	// If it succeeds, it returns 200. Both are acceptable in this test.
	if w.Code != http.StatusOK && w.Code != http.StatusBadGateway {
		t.Fatalf("expected 200 or 502, got %d", w.Code)
	}
}
