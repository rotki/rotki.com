package proxy

import (
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"
)

// DevServer is a reverse proxy to the Nuxt dev server.
// It proxies all requests (including WebSocket for HMR) to the Nuxt dev URL.
type DevServer struct {
	proxy  *httputil.ReverseProxy
	target *url.URL
	logger *slog.Logger
}

// NewDevServer creates a reverse proxy to the Nuxt dev server at the given URL.
// Returns nil if rawURL is empty.
func NewDevServer(rawURL string, logger *slog.Logger) *DevServer {
	if rawURL == "" {
		return nil
	}

	target, err := url.Parse(rawURL)
	if err != nil {
		logger.Error("invalid NUXT_DEV_URL", "url", rawURL, "error", err)
		return nil
	}

	devLogger := logger.With("component", "devserver")

	rewrite := func(r *httputil.ProxyRequest) {
		r.Out.URL.Scheme = target.Scheme
		r.Out.URL.Host = target.Host
		r.Out.Host = target.Host
		keepForwardedHeaders(r)
	}

	errorHandler := func(w http.ResponseWriter, r *http.Request, err error) {
		devLogger.Error("dev proxy error",
			"path", r.URL.Path,
			"error", err,
		)
		http.Error(w, "Nuxt dev server unavailable", http.StatusBadGateway)
	}

	rp := &httputil.ReverseProxy{
		Rewrite:      rewrite,
		ErrorHandler: errorHandler,
		Transport: &http.Transport{
			ResponseHeaderTimeout: 60 * time.Second,
			IdleConnTimeout:       90 * time.Second,
			MaxIdleConns:          50,
			MaxIdleConnsPerHost:   10,
		},
	}

	return &DevServer{
		proxy:  rp,
		target: target,
		logger: devLogger,
	}
}

// ServeHTTP proxies the request to the Nuxt dev server.
// WebSocket upgrade requests (HMR) are handled transparently by httputil.ReverseProxy.
func (d *DevServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	d.proxy.ServeHTTP(w, r) //nolint:gosec // G704: target URL is from validated config (NuxtDevURL), not user input
}
