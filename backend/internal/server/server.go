package server

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"time"

	"github.com/rotki/rotki.com/backend/internal/api/routing"
	"github.com/rotki/rotki.com/backend/internal/cache"
	"github.com/rotki/rotki.com/backend/internal/config"
	cspmod "github.com/rotki/rotki.com/backend/internal/csp"
	"github.com/rotki/rotki.com/backend/internal/proxy"
	"github.com/rotki/rotki.com/backend/internal/scheduler"
	"github.com/rotki/rotki.com/backend/internal/validate"
	"github.com/rotki/rotki.com/backend/internal/version"
)

// Deps holds shared dependencies created by the server and used across handlers.
type Deps struct {
	Memory    *cache.Memory
	Redis     *cache.Redis
	Lock      *cache.Lock
	Scheduler *scheduler.Scheduler
}

// New creates and configures the HTTP server with all routes and middleware.
func New(cfg *config.Config, logger *slog.Logger) (*http.Server, *Deps) {
	// Create shared cache infrastructure
	mem := cache.NewMemory()
	red := cache.NewRedis(cfg.RedisHost, cfg.RedisPassword, logger)
	lck := cache.NewLock(red, logger)

	deps := &Deps{
		Memory: mem,
		Redis:  red,
		Lock:   lck,
	}

	mux := http.NewServeMux()

	// Register API routes
	svcs := routing.Register(mux, cfg, logger, mem, red, lck)

	// Set up scheduled tasks
	sched := scheduler.New(logger)

	// Releases cache warming: every 8 minutes (before 10 min L2 TTL expires)
	sched.Add("releases:cache", scheduler.ReleasesCacheInterval,
		scheduler.ReleasesCacheTask(svcs.Releases, logger))

	// NFT cache warming: every 5 minutes (when sponsorship is enabled)
	if svcs.NFTCore != nil && cfg.SponsorshipEnabled {
		sched.Add("nft:cache", scheduler.NFTCacheInterval,
			scheduler.NFTCacheTask(svcs.NFTCore, svcs.ImageSvc, logger))
	}

	deps.Scheduler = sched

	// Reverse proxy for /webapi and /media (dev only — in production Traefik handles this)
	if p := proxy.New(proxy.Config{Domain: cfg.ProxyDomain, Insecure: cfg.ProxyInsecure}, logger); p != nil {
		p.RegisterRoutes(mux)
		logger.Info("reverse proxy enabled", "domain", cfg.ProxyDomain, "insecure", cfg.ProxyInsecure)
	}

	// Health check
	mux.HandleFunc("GET /health", handleHealth)

	// Catch-all: dev proxy or static file serving
	if dev := proxy.NewDevServer(cfg.NuxtDevURL, logger); dev != nil {
		mux.Handle("/", dev)
		logger.Info("dev mode: proxying to Nuxt dev server", "url", cfg.NuxtDevURL)
	} else {
		static := newStaticHandler(cfg.StaticDir)
		mux.Handle("/", static)
	}

	// Wrap with middleware (outermost runs first)
	var handler http.Handler = mux
	if cfg.DevMode {
		// Allow Vite HMR WebSocket connections in dev mode
		handler = cspmod.Middleware(handler, "ws:", "wss:")
	} else {
		handler = cspmod.Middleware(handler)
	}
	handler = securityHeaders(handler)
	handler = requestLogger(handler, logger)
	handler = recovery(handler, logger)

	return &http.Server{
		Addr:              fmt.Sprintf(":%d", cfg.Port),
		Handler:           handler,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
	}, deps
}

// handleHealth returns a JSON health check response with version info.
func handleHealth(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"version": version.Version,
		"git_sha": version.GitSHA,
	})
}

// requestLogger logs each request in structured format with real client IP,
// duration, response size, and user agent. Supports X-Forwarded-For and
// X-Real-IP headers from reverse proxies.
// Health checks from loopback addresses are not logged to reduce noise.
func requestLogger(next http.Handler, logger *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rw, r)

		// Skip logging health checks from loopback (e.g. Docker HEALTHCHECK)
		ip := validate.ClientIP(r)
		if r.URL.Path == "/health" && isLoopback(ip) {
			return
		}

		logger.Info("request",
			"method", r.Method,
			"path", r.URL.Path,
			"query", r.URL.RawQuery,
			"status", rw.status,
			"bytes", rw.bytes,
			"duration_ms", time.Since(start).Milliseconds(),
			"ip", ip,
			"user_agent", r.UserAgent(),
			"referer", r.Referer(),
		)
	})
}

// isLoopback returns true if the IP string is a loopback address.
func isLoopback(ip string) bool {
	parsed := net.ParseIP(ip)
	return parsed != nil && parsed.IsLoopback()
}

// recovery catches panics and returns 500 instead of crashing.
func recovery(next http.Handler, logger *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				logger.Error("panic recovered", "error", err, "path", r.URL.Path)
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// responseWriter wraps http.ResponseWriter to capture status code and bytes written.
type responseWriter struct {
	http.ResponseWriter
	status      int
	bytes       int
	wroteHeader bool
}

func (rw *responseWriter) WriteHeader(code int) {
	if !rw.wroteHeader {
		rw.status = code
		rw.wroteHeader = true
	}
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	if !rw.wroteHeader {
		rw.wroteHeader = true
	}
	n, err := rw.ResponseWriter.Write(b)
	rw.bytes += n
	return n, err
}
