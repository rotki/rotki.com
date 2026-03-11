// Package routing registers all HTTP API routes for the rotki.com backend.
package routing

import (
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	"github.com/rotki/rotki.com/backend/internal/api/csp"
	"github.com/rotki/rotki.com/backend/internal/api/ens"
	nftapi "github.com/rotki/rotki.com/backend/internal/api/nft"
	"github.com/rotki/rotki.com/backend/internal/api/oauth"
	"github.com/rotki/rotki.com/backend/internal/api/releases"
	"github.com/rotki/rotki.com/backend/internal/cache"
	"github.com/rotki/rotki.com/backend/internal/config"
	"github.com/rotki/rotki.com/backend/internal/images"
	"github.com/rotki/rotki.com/backend/internal/nft"
)

// Services holds references to services created during route registration
// that may be needed by other components (e.g. the scheduler).
type Services struct {
	Releases *releases.Handler
	NFTCore  *nft.CoreService // nil when BaseURL is not configured
	ImageSvc *images.Service
}

// Register adds all API routes to the given mux and returns the created services.
func Register(mux *http.ServeMux, cfg *config.Config, logger *slog.Logger, mem *cache.Memory, red *cache.Redis, lck *cache.Lock) *Services {
	// OAuth token exchange
	mux.Handle("POST /api/oauth/google/token", oauth.NewGoogleHandler(
		cfg.GoogleClientSecret, logger,
	))
	mux.Handle("POST /api/oauth/monerium/token", oauth.NewMoneriumHandler(
		cfg.MoneriumClientSecret, cfg.MoneriumAuthBaseURL, logger,
	))

	// CSP violation reporting
	mux.Handle("POST /api/csp/violation", csp.NewHandler(logger))

	// GitHub releases
	releasesHandler := releases.NewHandler(mem, red, lck, logger)
	mux.Handle("GET /api/releases/latest", releasesHandler)

	// Shared image caching service
	imgCache := images.NewCacheManager(cfg.ImageCacheDir, red, logger)
	imgFetcher := images.NewFetcher(logger)
	imgSvc := images.NewService(imgCache, imgFetcher, logger)

	// ENS avatar proxy (with image caching)
	mux.Handle("GET /api/ens/avatar", ens.NewHandler(imgSvc, logger))

	svcs := &Services{
		Releases: releasesHandler,
		ImageSvc: imgSvc,
	}

	// NFT sponsorship endpoints
	if cfg.BaseURL != "" {
		// Build NFT service stack
		chainCfg := nft.ChainConfigByID(1) // default to ethereum mainnet
		var rpcURLs []string
		if chainCfg != nil {
			rpcURLs = chainCfg.RPCURLs
		}
		rpcClient := nft.NewRPCClient(rpcURLs, logger)
		blockchainSvc := nft.NewBlockchainService(rpcClient, logger)
		cacheMgr := nft.NewCacheManager(red, logger)
		configSvc := nft.NewConfigService(cfg.BaseURL, cfg.ProxyInsecure, logger)
		coreSvc := nft.NewCoreService(blockchainSvc, cacheMgr, configSvc, logger)

		nftHandler := nftapi.NewHandler(coreSvc, imgSvc, cfg.SponsorshipEnabled, logger)
		nftHandler.RegisterRoutes(mux)

		svcs.NFTCore = coreSvc
	}

	// In dev mode, Nuxt handles robots.txt
	if cfg.NuxtDevURL == "" {
		mux.HandleFunc("/robots.txt", robotsTxtHandler(cfg))
	}

	// Redirects
	mux.HandleFunc("/pricing", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/checkout/pay", http.StatusMovedPermanently)
	})

	// Deprecated route
	mux.HandleFunc("/bespoke", func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, "Gone", http.StatusGone)
	})

	return svcs
}

// robotsTxtHandler returns a handler that serves a pre-built robots.txt.
func robotsTxtHandler(cfg *config.Config) http.HandlerFunc {
	disallowPaths := []string{
		"/account",
		"/account/**",
		"/purchase",
		"/purchase/**",
		"/checkout",
		"/checkout/**",
		"/activate",
		"/login",
		"/logout",
		"/login/**",
		"/logout/**",
		"/auth",
		"/auth/**",
	}

	if !cfg.SponsorshipEnabled {
		disallowPaths = append(disallowPaths, "/sponsor", "/sponsor/**")
	}

	var b strings.Builder
	b.WriteString("User-agent: *\n")
	for _, p := range disallowPaths {
		fmt.Fprintf(&b, "Disallow: %s\n", p)
	}
	b.WriteString("\nUser-agent: *\nAllow: /\n\n")
	fmt.Fprintf(&b, "Sitemap: %s/sitemap.xml\n", strings.TrimRight(cfg.BaseURL, "/"))

	body := []byte(b.String())

	return func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		_, _ = w.Write(body)
	}
}
