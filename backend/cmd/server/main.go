// Package main is the entry point for the rotki.com backend server.
package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rotki/rotki.com/backend/internal/config"
	"github.com/rotki/rotki.com/backend/internal/server"
	"github.com/rotki/rotki.com/backend/internal/version"
)

func main() {
	// Healthcheck subcommand — used by Docker HEALTHCHECK in scratch images
	if len(os.Args) > 1 && os.Args[1] == "healthcheck" {
		port := os.Getenv("PORT")
		if port == "" {
			port = "4000"
		}
		resp, err := http.Get(fmt.Sprintf("http://localhost:%s/health", port)) //nolint:noctx,gosec // healthcheck is a short-lived process, URL is localhost only
		if err != nil {
			os.Exit(1)
		}
		_ = resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			os.Exit(1)
		}
		os.Exit(0)
	}

	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: cfg.LogLevel,
	}))

	// In dev mode with NUXT_DEV_URL, skip static dir check
	if cfg.NuxtDevURL == "" {
		if info, err := os.Stat(cfg.StaticDir); err != nil || !info.IsDir() {
			logger.Error("static directory not found", "path", cfg.StaticDir)
			os.Exit(1)
		}
	}

	// Ensure image cache directory exists
	if err := os.MkdirAll(cfg.ImageCacheDir, 0o755); err != nil { //nolint:gosec // G301: cache dir, 0755 is standard
		logger.Error("failed to create image cache directory", "path", cfg.ImageCacheDir, "error", err)
		os.Exit(1)
	}

	logger.Info("rotki.com backend starting",
		"version", version.Version,
		"git_sha", version.GitSHA,
	)

	srv, deps := server.New(cfg, logger)

	// Start scheduled tasks
	deps.Scheduler.Start(5 * time.Second)

	// Graceful shutdown
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		logger.Info("server starting",
			"port", cfg.Port,
			"base_url", cfg.BaseURL,
			"dev_mode", cfg.DevMode,
			"static_dir", cfg.StaticDir,
			"sponsorship", cfg.SponsorshipEnabled,
		)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	<-ctx.Done()
	logger.Info("shutting down...")

	// Stop scheduled tasks first
	deps.Scheduler.Stop()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("shutdown error", "error", err)
		return // deferred cancel() runs, then process exits
	}

	// Clean up shared resources
	deps.Memory.Close()
	if err := deps.Redis.Close(); err != nil {
		logger.Error("redis close error", "error", err)
	}

	logger.Info("server stopped")
}
