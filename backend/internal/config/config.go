// Package config loads application configuration from environment variables.
package config

import (
	"errors"
	"fmt"
	"io"
	"log/slog"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/rotki/rotki.com/backend/internal/ipfs"
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

	// IPFS gateways, in fallback order (nil uses ipfs.DefaultGateways)
	IPFSGateways []string

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

	// Sitewide discount campaign, exposed via /api/config while within its period.
	// A campaign is configured when CampaignCode is non-empty; the start/end bounds
	// are optional (zero value = unbounded).
	CampaignCode    string
	CampaignPercent int
	CampaignStart   time.Time
	CampaignEnd     time.Time
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

	ipfsGateways, err := ipfs.ParseGateways(envStr("IPFS_GATEWAYS", ""))
	if err != nil {
		return nil, fmt.Errorf("invalid IPFS_GATEWAYS: %w", err)
	}

	campaignPercent, err := envInt("CAMPAIGN_PERCENT", 0)
	if err != nil {
		return nil, fmt.Errorf("invalid CAMPAIGN_PERCENT: %w", err)
	}

	campaignStart, err := envTime("CAMPAIGN_START")
	if err != nil {
		return nil, fmt.Errorf("invalid CAMPAIGN_START: %w", err)
	}

	campaignEnd, err := envTime("CAMPAIGN_END")
	if err != nil {
		return nil, fmt.Errorf("invalid CAMPAIGN_END: %w", err)
	}

	cfg := &Config{
		Port:      port,
		StaticDir: envStr("STATIC_DIR", "./dist"),
		BaseURL:   envStr("BASE_URL", fmt.Sprintf("http://localhost:%d", port)),

		MoneriumAuthBaseURL: envStr("MONERIUM_AUTH_BASE_URL", "https://api.monerium.dev"),

		RedisHost: envStr("REDIS_HOST", ""),

		ImageCacheDir: envStr("IMAGE_CACHE_DIR", "./image-cache"),
		IPFSGateways:  ipfsGateways,

		DevMode:       devMode,
		NuxtDevURL:    envStrOrDefault("NUXT_DEV_URL", nuxtDevDefault),
		ProxyDomain:   envStr("PROXY_DOMAIN", ""),
		ProxyInsecure: envBool("PROXY_INSECURE", false),

		TLSSkipVerify: envBool("TLS_SKIP_VERIFY", false),

		LogLevel:           envLogLevel("LOG_LEVEL", slog.LevelInfo),
		SponsorshipEnabled: envBool("SPONSORSHIP_ENABLED", false),
		Maintenance:        envBool("MAINTENANCE", false),
		Testing:            envBool("TESTING", false),

		CampaignCode:    envStr("CAMPAIGN_CODE", ""),
		CampaignPercent: campaignPercent,
		CampaignStart:   campaignStart,
		CampaignEnd:     campaignEnd,
	}

	for _, s := range cfg.secrets() {
		v, err := envSecret(s.key)
		if err != nil {
			return nil, err
		}
		*s.dst = v
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

	if c.CampaignCode != "" {
		if c.CampaignPercent < 1 || c.CampaignPercent > 100 {
			return fmt.Errorf("CAMPAIGN_PERCENT must be between 1 and 100 when CAMPAIGN_CODE is set, got %d", c.CampaignPercent)
		}
		if !c.CampaignStart.IsZero() && !c.CampaignEnd.IsZero() && c.CampaignEnd.Before(c.CampaignStart) {
			return errors.New("CAMPAIGN_END must be after CAMPAIGN_START")
		}
	}

	return nil
}

type secretField struct {
	key string
	dst *string
}

// secrets lists the variables that also accept a <KEY>_FILE variant, so they
// can come from Docker swarm secrets mounted under /run/secrets.
func (c *Config) secrets() []secretField {
	return []secretField{
		{"GOOGLE_CLIENT_SECRET", &c.GoogleClientSecret},
		{"MONERIUM_CLIENT_SECRET", &c.MoneriumClientSecret},
		{"REDIS_PASSWORD", &c.RedisPassword},
		{"GITHUB_WEBHOOK_SECRET", &c.GitHubWebhookSecret},
	}
}

// maxSecretSize bounds what is read from a secret file; every secret here is
// a short token or password.
const maxSecretSize = 64 << 10

// envSecret reads a secret from the file named by <KEY>_FILE, or from <KEY>
// itself. Setting both is an error, so a stale env var cannot shadow the file.
// Trailing newlines are trimmed, since most editors and `echo` add one. An
// empty file is an error: an empty secret would silently turn the feature off.
// Errors never include the secret's value.
func envSecret(key string) (string, error) {
	fileKey := key + "_FILE"
	path := os.Getenv(fileKey)
	if path == "" {
		return os.Getenv(key), nil
	}
	if os.Getenv(key) != "" {
		return "", fmt.Errorf("set either %s or %s, not both", key, fileKey)
	}
	f, err := os.Open(path) //nolint:gosec // G304: path comes from operator config, not user input
	if err != nil {
		return "", fmt.Errorf("reading %s: %w", fileKey, err)
	}
	defer func() { _ = f.Close() }()
	data, err := io.ReadAll(io.LimitReader(f, maxSecretSize+1))
	if err != nil {
		return "", fmt.Errorf("reading %s: %w", fileKey, err)
	}
	if len(data) > maxSecretSize {
		return "", fmt.Errorf("%s is larger than %d bytes", fileKey, maxSecretSize)
	}
	value := strings.TrimRight(string(data), "\r\n")
	if value == "" {
		return "", fmt.Errorf("%s: %s is empty", fileKey, path)
	}
	return value, nil
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

// envTime parses an RFC 3339 timestamp from the environment. An unset or empty
// variable yields the zero time.
func envTime(key string) (time.Time, error) {
	v := os.Getenv(key)
	if v == "" {
		return time.Time{}, nil
	}
	return time.Parse(time.RFC3339, v)
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
