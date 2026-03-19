package routing

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/rotki/rotki.com/backend/internal/api/appconfig"
	"github.com/rotki/rotki.com/backend/internal/cache"
	"github.com/rotki/rotki.com/backend/internal/config"
)

func testRegister(mux *http.ServeMux, cfg *config.Config, logger *slog.Logger) {
	mem := cache.NewMemory()
	red := cache.NewRedis("", "", logger)
	lck := cache.NewLock(red, logger)
	Register(mux, cfg, logger, mem, red, lck)
}

func TestRobotsTxt(t *testing.T) {
	cfg := &config.Config{
		BaseURL:       "https://rotki.com",
		ImageCacheDir: t.TempDir(),
	}

	mux := http.NewServeMux()
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
	testRegister(mux, cfg, logger)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/robots.txt", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	body := w.Body.String()
	for _, s := range []string{"Disallow: /checkout/pay/method", "Disallow: /login", "Disallow: /health", "Sitemap:"} {
		if !strings.Contains(body, s) {
			t.Errorf("expected body to contain %q, got:\n%s", s, body)
		}
	}

	ct := w.Header().Get("Content-Type")
	if !strings.HasPrefix(ct, "text/plain") {
		t.Errorf("expected Content-Type text/plain, got %q", ct)
	}
}

func TestBespoke_ReturnsGone(t *testing.T) {
	cfg := &config.Config{BaseURL: "https://rotki.com", ImageCacheDir: t.TempDir()}
	mux := http.NewServeMux()
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
	testRegister(mux, cfg, logger)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/bespoke", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusGone {
		t.Fatalf("expected 410, got %d", w.Code)
	}
}

func TestConfigEndpoint(t *testing.T) {
	tests := []struct {
		name               string
		sponsorshipEnabled bool
	}{
		{"enabled", true},
		{"disabled", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := &config.Config{
				BaseURL:            "https://rotki.com",
				ImageCacheDir:      t.TempDir(),
				SponsorshipEnabled: tt.sponsorshipEnabled,
			}
			mux := http.NewServeMux()
			logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
			testRegister(mux, cfg, logger)

			req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/config", nil)
			w := httptest.NewRecorder()
			mux.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				t.Fatalf("expected 200, got %d", w.Code)
			}

			var resp appconfig.Response
			if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			if resp.SponsorshipEnabled != tt.sponsorshipEnabled {
				t.Errorf("expected sponsorshipEnabled=%v, got %v", tt.sponsorshipEnabled, resp.SponsorshipEnabled)
			}
		})
	}
}
