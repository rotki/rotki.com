// Package proxy provides a reverse proxy for /webapi and /media requests
// to the Python backend. Only used in development — in production, Traefik
// routes these paths directly.
package proxy

import (
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"
)

// Config holds the proxy target configuration.
type Config struct {
	// Domain is the backend host (e.g. "rotki.com" or "127.0.0.1:8000").
	Domain string
	// Insecure uses HTTP instead of HTTPS when true.
	Insecure bool
}

// Handler is a reverse proxy that forwards /webapi and /media requests.
type Handler struct {
	webapi *httputil.ReverseProxy
	media  *httputil.ReverseProxy
	logger *slog.Logger
}

// New creates a reverse proxy handler for the given backend config.
// Returns nil if cfg.Domain is empty (proxy disabled).
func New(cfg Config, logger *slog.Logger) *Handler {
	if cfg.Domain == "" {
		return nil
	}

	scheme := "https"
	if cfg.Insecure {
		scheme = "http"
	}

	baseURL := &url.URL{
		Scheme: scheme,
		Host:   cfg.Domain,
	}

	proxyLogger := logger.With("component", "proxy")

	return &Handler{
		webapi: newReverseProxy(baseURL, cfg.Domain, proxyLogger),
		media:  newReverseProxy(baseURL, cfg.Domain, proxyLogger),
		logger: proxyLogger,
	}
}

// RegisterRoutes adds /webapi/ and /media/ proxy routes to the mux.
func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.Handle("/webapi/", h.webapi)
	mux.Handle("/media/", h.media)
}

// newReverseProxy creates an httputil.ReverseProxy that forwards requests
// to target, rewriting Host/Origin/Referer headers to match the backend.
func newReverseProxy(target *url.URL, host string, logger *slog.Logger) *httputil.ReverseProxy {
	referrer := target.String()

	director := func(req *http.Request) {
		req.URL.Scheme = target.Scheme
		req.URL.Host = target.Host
		// Path is preserved as-is (/webapi/... → /webapi/...)

		// Rewrite headers so the backend sees the correct origin
		req.Host = host
		req.Header.Set("Host", host)
		req.Header.Set("Origin", referrer)
		req.Header.Set("Referer", referrer)

		// Remove hop-by-hop headers that shouldn't be forwarded
		req.Header.Del("Te")
		req.Header.Del("Transfer-Encoding")
	}

	errorHandler := func(w http.ResponseWriter, r *http.Request, err error) {
		logger.Error("proxy error",
			"path", r.URL.Path,
			"target", target.String(),
			"error", err,
		)
		http.Error(w, "Bad Gateway", http.StatusBadGateway)
	}

	return &httputil.ReverseProxy{
		Director:     director,
		ErrorHandler: errorHandler,
		Transport: &http.Transport{
			ResponseHeaderTimeout: 30 * time.Second,
			IdleConnTimeout:       90 * time.Second,
			MaxIdleConns:          100,
			MaxIdleConnsPerHost:   10,
		},
	}
}
