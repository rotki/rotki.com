// Package appconfig serves runtime application configuration to the frontend.
package appconfig

import (
	"log/slog"
	"net/http"

	"github.com/rotki/rotki.com/backend/internal/config"
	"github.com/rotki/rotki.com/backend/internal/validate"
)

// Response is the JSON shape returned by GET /api/config.
type Response struct {
	SponsorshipEnabled bool `json:"sponsorship_enabled"`
	Maintenance        bool `json:"maintenance"`
	Testing            bool `json:"testing"`
}

// NewHandler returns a handler that serves runtime config as JSON.
func NewHandler(cfg *config.Config, logger *slog.Logger) http.Handler {
	resp := Response{
		SponsorshipEnabled: cfg.SponsorshipEnabled,
		Maintenance:        cfg.Maintenance,
		Testing:            cfg.Testing,
	}

	return http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		logger.Debug("serving app config")
		validate.WriteJSON(w, http.StatusOK, resp)
	})
}
