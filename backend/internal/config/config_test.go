package config

import (
	"log/slog"
	"testing"
)

func TestLoad_Defaults(t *testing.T) {
	// Unset all relevant env vars to ensure defaults
	for _, key := range []string{
		"PORT", "STATIC_DIR", "BASE_URL",
		"GOOGLE_CLIENT_SECRET", "MONERIUM_CLIENT_SECRET", "MONERIUM_AUTH_BASE_URL",
		"REDIS_HOST", "REDIS_PASSWORD", "IMAGE_CACHE_DIR",
		"DEV_MODE", "NUXT_DEV_URL", "PROXY_DOMAIN", "PROXY_INSECURE",
		"TLS_SKIP_VERIFY", "LOG_LEVEL", "SPONSORSHIP_ENABLED",
	} {
		t.Setenv(key, "")
	}

	// envStr treats "" as unset, so we need to actually unset them
	// t.Setenv("") still sets the var to empty string, which envStr sees as empty
	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.Port != 4000 {
		t.Errorf("expected default Port 4000, got %d", cfg.Port)
	}
	if cfg.StaticDir != "./dist" {
		t.Errorf("expected default StaticDir ./dist, got %s", cfg.StaticDir)
	}
	if cfg.BaseURL != "http://localhost:4000" {
		t.Errorf("expected default BaseURL, got %s", cfg.BaseURL)
	}
	if cfg.MoneriumAuthBaseURL != "https://api.monerium.dev" {
		t.Errorf("expected default MoneriumAuthBaseURL, got %s", cfg.MoneriumAuthBaseURL)
	}
	if cfg.ImageCacheDir != "./image-cache" {
		t.Errorf("expected default ImageCacheDir, got %s", cfg.ImageCacheDir)
	}
	if cfg.ProxyInsecure {
		t.Error("expected ProxyInsecure false by default")
	}
	if cfg.DevMode {
		t.Error("expected DevMode false by default")
	}
	if cfg.NuxtDevURL != "" {
		t.Error("expected empty NuxtDevURL by default")
	}
	if cfg.LogLevel != slog.LevelInfo {
		t.Errorf("expected default LogLevel info, got %s", cfg.LogLevel)
	}
	if cfg.SponsorshipEnabled {
		t.Error("expected SponsorshipEnabled false by default")
	}
}

func TestLoad_EnvOverrides(t *testing.T) {
	t.Setenv("PORT", "8080")
	t.Setenv("STATIC_DIR", "/var/www")
	t.Setenv("BASE_URL", "https://rotki.com")
	t.Setenv("REDIS_HOST", "redis:6379")
	t.Setenv("IMAGE_CACHE_DIR", "/tmp/images")
	t.Setenv("DEV_MODE", "true")
	t.Setenv("NUXT_DEV_URL", "") // override dev default to avoid mutual exclusivity with STATIC_DIR
	t.Setenv("PROXY_DOMAIN", "rotki.com")
	t.Setenv("PROXY_INSECURE", "true")
	t.Setenv("SPONSORSHIP_ENABLED", "true")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.Port != 8080 {
		t.Errorf("expected Port 8080, got %d", cfg.Port)
	}
	if cfg.StaticDir != "/var/www" {
		t.Errorf("expected StaticDir /var/www, got %s", cfg.StaticDir)
	}
	if cfg.BaseURL != "https://rotki.com" {
		t.Errorf("expected BaseURL https://rotki.com, got %s", cfg.BaseURL)
	}
	if cfg.RedisHost != "redis:6379" {
		t.Errorf("expected RedisHost redis:6379, got %s", cfg.RedisHost)
	}
	if cfg.ImageCacheDir != "/tmp/images" {
		t.Errorf("expected ImageCacheDir /tmp/images, got %s", cfg.ImageCacheDir)
	}
	if cfg.ProxyDomain != "rotki.com" {
		t.Errorf("expected ProxyDomain rotki.com, got %s", cfg.ProxyDomain)
	}
	if !cfg.DevMode {
		t.Error("expected DevMode true")
	}
	if !cfg.ProxyInsecure {
		t.Error("expected ProxyInsecure true")
	}
	if !cfg.SponsorshipEnabled {
		t.Error("expected SponsorshipEnabled true")
	}
}

func TestLoad_InvalidPort(t *testing.T) {
	t.Setenv("PORT", "not-a-number")

	_, err := Load()
	if err == nil {
		t.Fatal("expected error for invalid PORT")
	}
}

func TestEnvBool_InvalidValue(t *testing.T) {
	t.Setenv("TEST_BOOL", "maybe")

	got := envBool("TEST_BOOL", true)
	if !got {
		t.Error("expected fallback true for invalid bool")
	}

	got = envBool("TEST_BOOL", false)
	if got {
		t.Error("expected fallback false for invalid bool")
	}
}

func TestEnvBool_ValidValues(t *testing.T) {
	tests := []struct {
		value string
		want  bool
	}{
		{"true", true},
		{"false", false},
		{"1", true},
		{"0", false},
		{"TRUE", true},
		{"FALSE", false},
	}

	for _, tt := range tests {
		t.Run(tt.value, func(t *testing.T) {
			t.Setenv("TEST_BOOL", tt.value)
			got := envBool("TEST_BOOL", !tt.want)
			if got != tt.want {
				t.Errorf("envBool(%q) = %v, want %v", tt.value, got, tt.want)
			}
		})
	}
}

func TestLoad_DevFlagsRequireDevMode(t *testing.T) {
	tests := []struct {
		name string
		envs map[string]string
	}{
		{
			name: "NUXT_DEV_URL without DEV_MODE",
			envs: map[string]string{"NUXT_DEV_URL": "http://localhost:3000"},
		},
		{
			name: "PROXY_DOMAIN without DEV_MODE",
			envs: map[string]string{"PROXY_DOMAIN": "rotki.com"},
		},
		{
			name: "PROXY_INSECURE without DEV_MODE",
			envs: map[string]string{"PROXY_INSECURE": "true"},
		},
		{
			name: "all dev flags without DEV_MODE",
			envs: map[string]string{
				"NUXT_DEV_URL":   "http://localhost:3000",
				"PROXY_DOMAIN":   "rotki.com",
				"PROXY_INSECURE": "true",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			for k, v := range tt.envs {
				t.Setenv(k, v)
			}
			_, err := Load()
			if err == nil {
				t.Error("expected error when dev flags set without DEV_MODE")
			}
		})
	}
}

func TestLoad_DevFlagsWithDevMode(t *testing.T) {
	t.Setenv("DEV_MODE", "true")
	t.Setenv("NUXT_DEV_URL", "http://localhost:3000")
	t.Setenv("PROXY_DOMAIN", "rotki.com")
	t.Setenv("PROXY_INSECURE", "true")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if !cfg.DevMode {
		t.Error("expected DevMode true")
	}
	if cfg.NuxtDevURL != "http://localhost:3000" {
		t.Errorf("expected NuxtDevURL http://localhost:3000, got %s", cfg.NuxtDevURL)
	}
	if cfg.ProxyDomain != "rotki.com" {
		t.Errorf("expected ProxyDomain rotki.com, got %s", cfg.ProxyDomain)
	}
}

func TestLoad_NuxtDevURLAndStaticDirMutuallyExclusive(t *testing.T) {
	t.Setenv("DEV_MODE", "true")
	t.Setenv("NUXT_DEV_URL", "http://localhost:3000")
	t.Setenv("STATIC_DIR", "/custom/path")

	_, err := Load()
	if err == nil {
		t.Error("expected error when both NUXT_DEV_URL and STATIC_DIR are set")
	}
}

func TestLoad_DevModeDefaults(t *testing.T) {
	t.Setenv("DEV_MODE", "true")
	t.Setenv("BASE_URL", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.Port != 3000 {
		t.Errorf("expected dev default Port 3000, got %d", cfg.Port)
	}
	if cfg.NuxtDevURL != "http://localhost:3001" {
		t.Errorf("expected dev default NuxtDevURL http://localhost:3001, got %s", cfg.NuxtDevURL)
	}
	if cfg.BaseURL != "http://localhost:3000" {
		t.Errorf("expected dev default BaseURL http://localhost:3000, got %s", cfg.BaseURL)
	}
}

func TestEnvLogLevel(t *testing.T) {
	tests := []struct {
		value string
		want  slog.Level
	}{
		{"debug", slog.LevelDebug},
		{"DEBUG", slog.LevelDebug},
		{"info", slog.LevelInfo},
		{"warn", slog.LevelWarn},
		{"warning", slog.LevelWarn},
		{"error", slog.LevelError},
		{"invalid", slog.LevelInfo},
		{"", slog.LevelInfo},
	}

	for _, tt := range tests {
		t.Run(tt.value, func(t *testing.T) {
			t.Setenv("TEST_LOG_LEVEL", tt.value)
			got := envLogLevel("TEST_LOG_LEVEL", slog.LevelInfo)
			if got != tt.want {
				t.Errorf("envLogLevel(%q) = %v, want %v", tt.value, got, tt.want)
			}
		})
	}
}
