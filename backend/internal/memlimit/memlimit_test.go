package memlimit

import (
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func writeFile(t *testing.T, dir, name, content string) string {
	t.Helper()
	p := filepath.Join(dir, name)
	if err := os.WriteFile(p, []byte(content), 0o600); err != nil {
		t.Fatal(err)
	}
	return p
}

func TestParseLimitFile(t *testing.T) {
	dir := t.TempDir()

	cases := []struct {
		name    string
		content string
		want    int64
		wantErr bool
	}{
		{"cgroup v2 value", "402653184\n", 402653184, false},
		{"no trailing newline", "402653184", 402653184, false},
		{"cgroup v2 unlimited", "max\n", 0, true},
		{"cgroup v1 unlimited sentinel", "9223372036854771712\n", 0, true},
		{"garbage", "not-a-number\n", 0, true},
		{"empty", "", 0, true},
		// A limit this small is far more likely a misread than a real cap, and
		// honouring it would wedge the process at startup.
		{"implausibly small", "1024\n", 0, true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			p := writeFile(t, dir, "limit-"+tc.name, tc.content)
			got, err := parseLimitFile(p)
			if tc.wantErr {
				if err == nil {
					t.Fatalf("expected an error, got limit %d", got)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tc.want {
				t.Errorf("got %d, want %d", got, tc.want)
			}
		})
	}
}

// v2 is preferred, but a v2 file that is absent or says "max" must not stop the
// v1 path from being consulted: both layouts exist in the wild.
func TestReadCgroupLimit_PrefersV2ThenFallsBack(t *testing.T) {
	dir := t.TempDir()
	missing := filepath.Join(dir, "does-not-exist")

	t.Run("v2 wins when both are set", func(t *testing.T) {
		v2 := writeFile(t, dir, "v2", "402653184")
		v1 := writeFile(t, dir, "v1", "805306368")
		got, err := readCgroupLimit(v2, v1)
		if err != nil {
			t.Fatal(err)
		}
		if got != 402653184 {
			t.Errorf("got %d, want the v2 value", got)
		}
	})

	t.Run("falls back to v1 when v2 is absent", func(t *testing.T) {
		v1 := writeFile(t, dir, "v1-only", "805306368")
		got, err := readCgroupLimit(missing, v1)
		if err != nil {
			t.Fatal(err)
		}
		if got != 805306368 {
			t.Errorf("got %d, want the v1 value", got)
		}
	})

	t.Run("falls back to v1 when v2 says max", func(t *testing.T) {
		v2 := writeFile(t, dir, "v2-max", "max")
		v1 := writeFile(t, dir, "v1-after-max", "805306368")
		got, err := readCgroupLimit(v2, v1)
		if err != nil {
			t.Fatal(err)
		}
		if got != 805306368 {
			t.Errorf("got %d, want the v1 value", got)
		}
	})

	t.Run("no limit anywhere is an error, not a zero limit", func(t *testing.T) {
		got, err := readCgroupLimit(missing, missing)
		if err == nil {
			t.Fatalf("expected an error, got limit %d", got)
		}
	})

	t.Run("unlimited is reported as errNoLimit", func(t *testing.T) {
		v2 := writeFile(t, dir, "v2-max-only", "max")
		_, err := readCgroupLimit(v2, missing)
		if err == nil {
			t.Fatal("expected an error")
		}
		if !errors.Is(err, os.ErrNotExist) && !errors.Is(err, errNoLimit) {
			t.Errorf("unexpected error: %v", err)
		}
	})
}

// The soft limit must sit below the cgroup ceiling, otherwise the collector and
// the OOM killer trip at the same point and the soft limit buys nothing.
func TestHeadroomLeavesRoom(t *testing.T) {
	cgroupLimit := int64(384 << 20)
	soft := int64(float64(cgroupLimit) * headroomRatio)

	if soft >= cgroupLimit {
		t.Fatalf("soft limit %d is not below the cgroup limit %d", soft, cgroupLimit)
	}
	if soft < cgroupLimit/2 {
		t.Errorf("soft limit %d wastes more than half of %d", soft, cgroupLimit)
	}
}
