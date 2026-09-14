// Package proxy provides a reverse proxy for /webapi and /media requests
// to the Python backend. Only used in development — in production, Traefik
// routes these paths directly.
package proxy

import (
	"log/slog"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"slices"
	"strings"
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

	rewrite := func(r *httputil.ProxyRequest) {
		r.Out.URL.Scheme = target.Scheme
		r.Out.URL.Host = target.Host
		// Path is preserved as-is (/webapi/... → /webapi/...)

		// Rewrite headers so the backend sees the correct origin
		r.Out.Host = host
		r.Out.Header.Set("Origin", referrer)
		r.Out.Header.Set("Referer", referrer)

		// Hop-by-hop headers (Te, Transfer-Encoding, ...) are already
		// stripped by ReverseProxy before Rewrite runs.
		keepForwardedHeaders(r)
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
		Rewrite:      rewrite,
		ErrorHandler: errorHandler,
		Transport: &http.Transport{
			ResponseHeaderTimeout: 30 * time.Second,
			IdleConnTimeout:       90 * time.Second,
			MaxIdleConns:          100,
			MaxIdleConnsPerHost:   10,
		},
	}
}

// keepForwardedHeaders restores the X-Forwarded-* headers that ReverseProxy
// strips before calling Rewrite and appends the client IP to X-Forwarded-For,
// matching what the proxy sent upstream when it used Director. It avoids
// ProxyRequest.SetXForwarded, which derives X-Forwarded-Proto from the local
// connection and would report "http" behind a TLS-terminating proxy.
func keepForwardedHeaders(r *httputil.ProxyRequest) {
	for _, name := range []string{"X-Forwarded-Host", "X-Forwarded-Proto"} {
		if values, ok := r.In.Header[name]; ok {
			r.Out.Header[name] = slices.Clone(values)
		}
	}

	forwardedFor := slices.Clone(r.In.Header["X-Forwarded-For"])
	if ip, _, err := net.SplitHostPort(r.In.RemoteAddr); err == nil {
		forwardedFor = append(forwardedFor, ip)
	}
	if len(forwardedFor) > 0 {
		r.Out.Header.Set("X-Forwarded-For", strings.Join(forwardedFor, ", "))
	}
}
