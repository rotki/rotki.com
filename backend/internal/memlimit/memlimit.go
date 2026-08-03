// Package memlimit derives GOMEMLIMIT from the container's cgroup memory limit.
//
// The Go runtime reads the cgroup CPU quota to pick GOMAXPROCS, but it does not
// do the equivalent for memory: GOMEMLIMIT defaults to "no limit" regardless of
// what the container was given. Without it, GC keeps targeting a GOGC=100
// doubling of live heap and will happily grow past the cgroup ceiling, at which
// point the kernel OOM-kills the process instead of the collector working
// harder. Setting a soft limit turns that abrupt failure into back pressure.
package memlimit

import (
	"errors"
	"fmt"
	"log/slog"
	"os"
	"runtime/debug"
	"strconv"
	"strings"
)

const (
	// cgroup v2 and v1 locations for the memory ceiling, in preference order.
	cgroupV2Path = "/sys/fs/cgroup/memory.max"
	cgroupV1Path = "/sys/fs/cgroup/memory/memory.limit_in_bytes"

	// headroomRatio leaves room for memory GOMEMLIMIT does not govern. The
	// limit covers the Go heap plus runtime structures, but not goroutine
	// stacks that have not been reused, and the cgroup also accounts for page
	// cache the process touches. Aiming at the full ceiling means the soft
	// limit and the kernel's hard limit trip at the same moment, which defeats
	// the point of having a soft one.
	headroomRatio = 0.9

	// unlimitedThreshold treats implausibly large values as "no limit set".
	// cgroup v1 reports unlimited as a near-int64-max sentinel rather than a
	// keyword, and the exact value varies by kernel and page size.
	unlimitedThreshold = 1 << 62

	// minLimit guards against a misread producing a limit so small the process
	// cannot start. Below this, leaving GC alone is the safer failure.
	minLimit = 64 << 20
)

// Apply sets the Go soft memory limit from the cgroup memory limit, and reports
// what it did. An explicit GOMEMLIMIT in the environment always wins: the
// runtime has already applied it by the time this runs, and an operator who set
// it deliberately should not be second-guessed.
func Apply(logger *slog.Logger) {
	if v, ok := os.LookupEnv("GOMEMLIMIT"); ok && strings.TrimSpace(v) != "" {
		logger.Info("memory limit taken from GOMEMLIMIT", "value", v)
		return
	}

	limit, err := readCgroupLimit(cgroupV2Path, cgroupV1Path)
	if err != nil {
		// Not a container, or an unreadable cgroup. Neither is fatal: the
		// process runs exactly as it did before.
		logger.Debug("no cgroup memory limit found, leaving GOMEMLIMIT unset", "error", err)
		return
	}

	soft := int64(float64(limit) * headroomRatio)
	debug.SetMemoryLimit(soft)
	logger.Info("GOMEMLIMIT derived from cgroup",
		"cgroup_limit_bytes", limit,
		"soft_limit_bytes", soft,
	)
}

// errNoLimit reports that a cgroup file exists but describes no ceiling.
var errNoLimit = errors.New("no memory limit set")

// readCgroupLimit returns the container's memory ceiling in bytes, preferring
// cgroup v2. Paths are parameters so the parsing is testable.
func readCgroupLimit(v2Path, v1Path string) (int64, error) {
	var lastErr error
	for _, path := range []string{v2Path, v1Path} {
		limit, err := parseLimitFile(path)
		if err == nil {
			return limit, nil
		}
		lastErr = err
	}
	return 0, lastErr
}

func parseLimitFile(path string) (int64, error) {
	raw, err := os.ReadFile(path) //nolint:gosec // G304: fixed cgroup paths, or test fixtures
	if err != nil {
		return 0, err
	}

	text := strings.TrimSpace(string(raw))
	// cgroup v2 spells "unlimited" as the literal "max".
	if text == "max" {
		return 0, fmt.Errorf("%s: %w", path, errNoLimit)
	}

	limit, err := strconv.ParseInt(text, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("%s: parsing %q: %w", path, text, err)
	}
	if limit >= unlimitedThreshold {
		return 0, fmt.Errorf("%s: %w", path, errNoLimit)
	}
	if limit < minLimit {
		return 0, fmt.Errorf("%s: implausible limit %d bytes", path, limit)
	}

	return limit, nil
}
