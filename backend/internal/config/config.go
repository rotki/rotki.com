// Package config loads application configuration from environment variables.
package config

import (
	"errors"
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"strings"
)

// Config holds all server configuration, loaded from environment variables.
type Config struct {
	// Server
	Port      int
	StaticDir string
	BaseURL   string

	// OAuth secrets
	GoogleClientSecret   string
	MoneriumClientSecret string
	MoneriumAuthBaseURL  string

	// Redis
	RedisHost     string
	RedisPassword string

	// Image cache
	ImageCacheDir string

	// Dev mode — must set DEV_MODE=true to enable dev-only features
	DevMode       bool
	NuxtDevURL    string
	ProxyDomain   string
	ProxyInsecure bool

	// TLS
	TLSSkipVerify bool

	// Logging
	LogLevel slog.Level

	// Webhooks
	GitHubWebhookSecret string

	// Feature flags
	SponsorshipEnabled bool
	Maintenance        bool
	Testing            bool
}

// Load reads configuration from environment variables with sensible defaults.
func Load() (*Config, error) {
	devMode := envBool("DEV_MODE", false)

	// Dev mode defaults: Go on 3000, Nuxt on 3001
	portDefault := 4000
	nuxtDevDefault := ""
	if devMode {
		portDefault = 3000
		nuxtDevDefault = "http://localhost:3001"
	}

	port, err := envInt("PORT", portDefault)
	if err != nil {
		return nil, fmt.Errorf("invalid PORT: %w", err)
	}

	cfg := &Config{
		Port:      port,
		StaticDir: envStr("STATIC_DIR", "./dist"),
		BaseURL:   envStr("BASE_URL", fmt.Sprintf("http://localhost:%d", port)),

		GoogleClientSecret:   envStr("GOOGLE_CLIENT_SECRET", ""),
		MoneriumClientSecret: envStr("MONERIUM_CLIENT_SECRET", ""),
		MoneriumAuthBaseURL:  envStr("MONERIUM_AUTH_BASE_URL", "https://api.monerium.dev"),

		RedisHost:     envStr("REDIS_HOST", ""),
		RedisPassword: envStr("REDIS_PASSWORD", ""),

		ImageCacheDir: envStr("IMAGE_CACHE_DIR", "./image-cache"),

		DevMode:       devMode,
		NuxtDevURL:    envStrOrDefault("NUXT_DEV_URL", nuxtDevDefault),
		ProxyDomain:   envStr("PROXY_DOMAIN", ""),
		ProxyInsecure: envBool("PROXY_INSECURE", false),

		TLSSkipVerify: envBool("TLS_SKIP_VERIFY", false),

		GitHubWebhookSecret: envStr("GITHUB_WEBHOOK_SECRET", ""),

		LogLevel:           envLogLevel("LOG_LEVEL", slog.LevelInfo),
		SponsorshipEnabled: envBool("SPONSORSHIP_ENABLED", false),
		Maintenance:        envBool("MAINTENANCE", false),
		Testing:            envBool("TESTING", false),
	}

	if err := cfg.validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

// validate checks that dev-only settings are not used without DEV_MODE=true.
func (c *Config) validate() error {
	var devFlags []string
	if c.NuxtDevURL != "" {
		devFlags = append(devFlags, "NUXT_DEV_URL")
	}
	if c.ProxyDomain != "" {
		devFlags = append(devFlags, "PROXY_DOMAIN")
	}
	if c.ProxyInsecure {
		devFlags = append(devFlags, "PROXY_INSECURE")
	}

	if len(devFlags) > 0 && !c.DevMode {
		return fmt.Errorf("dev-only flags %v require DEV_MODE=true", devFlags)
	}

	if c.DevMode && c.NuxtDevURL != "" && c.StaticDir != "./dist" {
		return errors.New("NUXT_DEV_URL and STATIC_DIR are mutually exclusive in dev mode")
	}

	return nil
}

func envStr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// envStrOrDefault returns the env var value if set (even if empty), otherwise the fallback.
func envStrOrDefault(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok {
		return v
	}
	return fallback
}

func envInt(key string, fallback int) (int, error) {
	v := os.Getenv(key)
	if v == "" {
		return fallback, nil
	}
	return strconv.Atoi(v)
}

func envLogLevel(key string, fallback slog.Level) slog.Level {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	switch strings.ToLower(v) {
	case "debug":
		return slog.LevelDebug
	case "info":
		return slog.LevelInfo
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return fallback
	}
}

func envBool(key string, fallback bool) bool {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return fallback
	}
	return b
}
