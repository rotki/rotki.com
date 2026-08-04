// Package appconfig serves runtime application configuration to the frontend.
package appconfig

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/rotki/rotki.com/backend/internal/config"
	"github.com/rotki/rotki.com/backend/internal/validate"
)

// Campaign describes a sitewide discount campaign advertised to the frontend.
type Campaign struct {
	Code      string `json:"code"`
	Percent   int    `json:"percent"`
	PeriodEnd string `json:"period_end,omitempty"`
}

// Response is the JSON shape returned by GET /api/config.
type Response struct {
	SponsorshipEnabled bool      `json:"sponsorship_enabled"`
	Maintenance        bool      `json:"maintenance"`
	Testing            bool      `json:"testing"`
	ActiveCampaign     *Campaign `json:"active_campaign,omitempty"`
}

// activeCampaign returns the configured campaign when now falls inside its
// period, or nil when no campaign is configured or it is not yet/no longer active.
func activeCampaign(cfg *config.Config, now time.Time) *Campaign {
	if cfg.CampaignCode == "" {
		return nil
	}
	if !cfg.CampaignStart.IsZero() && now.Before(cfg.CampaignStart) {
		return nil
	}
	if !cfg.CampaignEnd.IsZero() && now.After(cfg.CampaignEnd) {
		return nil
	}

	campaign := &Campaign{
		Code:    cfg.CampaignCode,
		Percent: cfg.CampaignPercent,
	}
	if !cfg.CampaignEnd.IsZero() {
		campaign.PeriodEnd = cfg.CampaignEnd.Format(time.RFC3339)
	}
	return campaign
}

// NewHandler returns a handler that serves runtime config as JSON. The campaign
// is evaluated per request so it activates and expires without a restart.
func NewHandler(cfg *config.Config, logger *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		logger.Debug("serving app config")
		validate.WriteJSON(w, http.StatusOK, Response{
			SponsorshipEnabled: cfg.SponsorshipEnabled,
			Maintenance:        cfg.Maintenance,
			Testing:            cfg.Testing,
			ActiveCampaign:     activeCampaign(cfg, time.Now()),
		})
	})
}
