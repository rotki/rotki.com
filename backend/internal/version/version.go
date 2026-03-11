// Package version holds build-time version info injected via ldflags.
package version //nolint:revive // "version" doesn't conflict with stdlib; go/version is a different package

// Set via -ldflags at build time:
//
//	go build -ldflags "-X github.com/rotki/rotki.com/backend/internal/version.Version=1.0.0
//	                    -X github.com/rotki/rotki.com/backend/internal/version.GitSHA=abc123"
var (
	Version = "dev"
	GitSHA  = "unknown"
)
