package appconfig

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

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

			if resp.ActiveCampaign != nil {
				t.Errorf("expected no active campaign, got %+v", resp.ActiveCampaign)
			}
		})
	}
}

func TestActiveCampaign(t *testing.T) {
	now := time.Now()
	tests := []struct {
		name   string
		cfg    config.Config
		active bool
	}{
		{"no campaign configured", config.Config{}, false},
		{"unbounded campaign", config.Config{CampaignCode: "SUMMER", CampaignPercent: 20}, true},
		{
			"within period",
			config.Config{CampaignCode: "SUMMER", CampaignPercent: 20, CampaignStart: now.Add(-time.Hour), CampaignEnd: now.Add(time.Hour)},
			true,
		},
		{
			"not yet started",
			config.Config{CampaignCode: "SUMMER", CampaignPercent: 20, CampaignStart: now.Add(time.Hour)},
			false,
		},
		{
			"already ended",
			config.Config{CampaignCode: "SUMMER", CampaignPercent: 20, CampaignEnd: now.Add(-time.Hour)},
			false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			campaign := activeCampaign(&tt.cfg, now)
			if tt.active != (campaign != nil) {
				t.Fatalf("expected active=%v, got %+v", tt.active, campaign)
			}
			if !tt.active {
				return
			}
			if campaign.Code != tt.cfg.CampaignCode || campaign.Percent != tt.cfg.CampaignPercent {
				t.Errorf("expected code=%q percent=%d, got %+v", tt.cfg.CampaignCode, tt.cfg.CampaignPercent, campaign)
			}
			if tt.cfg.CampaignEnd.IsZero() != (campaign.PeriodEnd == "") {
				t.Errorf("period_end mismatch: cfg end %v, got %q", tt.cfg.CampaignEnd, campaign.PeriodEnd)
			}
		})
	}
}

func TestHandlerServesCampaign(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
	cfg := &config.Config{CampaignCode: "SUMMER", CampaignPercent: 20, CampaignEnd: time.Now().Add(time.Hour)}
	handler := NewHandler(cfg, logger)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/config", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	var resp Response
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.ActiveCampaign == nil {
		t.Fatal("expected an active campaign in the response")
	}
	if resp.ActiveCampaign.Code != "SUMMER" || resp.ActiveCampaign.Percent != 20 || resp.ActiveCampaign.PeriodEnd == "" {
		t.Errorf("unexpected campaign payload: %+v", resp.ActiveCampaign)
	}
}
