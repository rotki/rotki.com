// Package ens handles ENS avatar proxy requests.
package ens

import (
	"fmt"
	"log/slog"
	"net/http"
	"regexp"

	"github.com/rotki/rotki.com/backend/internal/images"
)

var ensNamePattern = regexp.MustCompile(`^[\dA-Za-z-]+\.[\dA-Za-z]+$`)

var validNetworks = map[string]bool{
	"mainnet": true,
	"sepolia": true,
}

// Handler proxies ENS avatar requests through the image caching service.
type Handler struct {
	imageSvc *images.Service
	logger   *slog.Logger
}

// NewHandler creates a new ENS avatar handler.
func NewHandler(imageSvc *images.Service, logger *slog.Logger) *Handler {
	return &Handler{
		imageSvc: imageSvc,
		logger:   logger.With("handler", "ens.avatar"),
	}
}

// ServeHTTP handles GET /api/ens/avatar?name=vitalik.eth&network=mainnet
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" || len(name) > 255 || !ensNamePattern.MatchString(name) {
		http.Error(w, "Invalid ENS name format", http.StatusBadRequest)
		return
	}

	network := r.URL.Query().Get("network")
	if network == "" {
		network = "mainnet"
	}
	if !validNetworks[network] {
		http.Error(w, "Invalid network (mainnet or sepolia)", http.StatusBadRequest)
		return
	}

	metadataURL := fmt.Sprintf("https://metadata.ens.domains/%s/avatar/%s", network, name)

	// Use the image service to proxy with caching
	h.imageSvc.ServeImage(r.Context(), w, r, metadataURL)
}
