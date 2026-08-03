package server

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// Assets copied verbatim from public/ (logos, favicons, manifests) had no
// Cache-Control at all, so browsers revalidated them on every navigation.
func TestStaticHandler_PublicAssetsAreCacheable(t *testing.T) {
	dir := setupStaticDir(t)

	// A public/-style asset with a stable, non-hashed filename.
	imgDir := filepath.Join(dir, "img")
	if err := os.MkdirAll(imgDir, 0o750); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(imgDir, "logo-small.svg"), []byte("<svg/>"), 0o600); err != nil {
		t.Fatal(err)
	}

	h := newTestStaticHandler(t, dir)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/img/logo-small.svg", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	cc := rec.Header().Get("Cache-Control")
	if cc == "" {
		t.Fatal("public asset served with no Cache-Control")
	}
	if !strings.Contains(cc, "max-age=") {
		t.Errorf("Cache-Control = %q, want a max-age", cc)
	}
	// Stable filenames must never be immutable: a replaced logo would be
	// stranded in caches until the max-age expired.
	if strings.Contains(cc, "immutable") {
		t.Errorf("Cache-Control = %q, must not be immutable for non-hashed filenames", cc)
	}
}

// The manifest is a build artefact read from disk at startup. Serving it over
// HTTP publishes the client-only route list for no reason, and it sits in the
// static root only because that is where the build writes it.
func TestStaticHandler_ManifestNotServed(t *testing.T) {
	dir := setupStaticDir(t)
	h := newTestStaticHandler(t, dir)

	// Present on disk, since newStaticHandler requires it to start at all.
	if _, err := os.Stat(filepath.Join(dir, spaManifestFile)); err != nil {
		t.Fatalf("fixture should have the manifest on disk: %v", err)
	}

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/"+spaManifestFile, nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("expected 404 for %s, got %d", spaManifestFile, rec.Code)
	}
	if strings.Contains(rec.Body.String(), "spaRoutes") {
		t.Error("manifest contents leaked in the response body")
	}
}

// The hashed-asset and HTML policies must not regress: a new URL every build is
// what makes "immutable" safe there, and HTML still carries a per-request nonce.
func TestStaticHandler_CachePolicyByPath(t *testing.T) {
	dir := setupStaticDir(t)
	h := newTestStaticHandler(t, dir)

	cases := []struct {
		path          string
		wantImmutable bool
		wantNoStore   bool
	}{
		{"/_nuxt/app.abc123.js", true, false},
		{"/", false, true},
		{"/activate/token", false, true},
	}

	for _, tc := range cases {
		t.Run(tc.path, func(t *testing.T) {
			req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, tc.path, nil)
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, req)

			cc := rec.Header().Get("Cache-Control")
			if got := strings.Contains(cc, "immutable"); got != tc.wantImmutable {
				t.Errorf("Cache-Control = %q, immutable = %v, want %v", cc, got, tc.wantImmutable)
			}
			if got := strings.Contains(cc, "no-store"); got != tc.wantNoStore {
				t.Errorf("Cache-Control = %q, no-store = %v, want %v", cc, got, tc.wantNoStore)
			}
		})
	}
}
