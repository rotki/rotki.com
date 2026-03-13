package appconfig

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/rotki/rotki.com/backend/internal/config"
)

func TestHandler(t *testing.T) {
	tests := []struct {
		name               string
		sponsorshipEnabled bool
	}{
		{"enabled", true},
		{"disabled", false},
	}

	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := &config.Config{SponsorshipEnabled: tt.sponsorshipEnabled}
			handler := NewHandler(cfg, logger)

			req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/config", nil)
			w := httptest.NewRecorder()
			handler.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				t.Fatalf("expected 200, got %d", w.Code)
			}

			var resp Response
			if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			if resp.SponsorshipEnabled != tt.sponsorshipEnabled {
				t.Errorf("expected sponsorshipEnabled=%v, got %v", tt.sponsorshipEnabled, resp.SponsorshipEnabled)
			}

			ct := w.Header().Get("Content-Type")
			if ct != "application/json" {
				t.Errorf("expected Content-Type application/json, got %q", ct)
			}
		})
	}
}
