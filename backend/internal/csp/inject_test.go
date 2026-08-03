package csp

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
)

// The single pass has to handle both tag types interleaved. The previous
// implementation made one pass per tag type, so ordering could not matter;
// now it can.
func TestInjectNonceInterleavedTags(t *testing.T) {
	html := []byte(`<head>` +
		`<link rel="modulepreload" href="/a.js">` +
		`<script src="/b.js"></script>` +
		`<link rel="stylesheet" href="/c.css">` +
		`<script>inline()</script>` +
		`</head>`)

	got := string(injectNonce(html, "N"))

	if n := strings.Count(got, `nonce="N"`); n != 3 {
		t.Errorf("expected 3 nonces (2 script + 1 modulepreload), got %d in %q", n, got)
	}
	// The stylesheet link must not get one.
	if strings.Contains(got, `<link nonce="N" rel="stylesheet"`) {
		t.Error("nonce injected into a non-modulepreload link")
	}
	// Closing tags must never be touched.
	if strings.Contains(got, `</script nonce`) {
		t.Error("nonce injected into a closing tag")
	}
}

// A tag that never closes must not lose content or spin. Malformed HTML can
// reach here from a truncated build artefact.
func TestInjectNonceUnterminatedTag(t *testing.T) {
	html := []byte(`<p>before</p><script src="/x.js"`)

	got := string(injectNonce(html, "N"))

	if !strings.Contains(got, "before") {
		t.Errorf("content before the unterminated tag was lost: %q", got)
	}
	if !strings.HasSuffix(got, `<script src="/x.js"`) {
		t.Errorf("unterminated tail not copied verbatim: %q", got)
	}
}

// Content with no tags at all must pass through byte for byte.
func TestInjectNoncePlainContent(t *testing.T) {
	html := []byte("no markup here at all")

	if got := string(injectNonce(html, "N")); got != string(html) {
		t.Errorf("plain content altered: %q", got)
	}
}

// Buffers are pooled and reused, so a response must never carry bytes left
// over from the one before it.
func TestMiddlewarePooledBuffersDoNotLeakBetweenRequests(t *testing.T) {
	// Markers contain a hyphen so they cannot collide with a base64 nonce,
	// whose alphabet is alphanumeric plus + / =.
	bodies := []string{
		"<html><script>payload-one</script></html>",
		"<html><script>payload-two</script></html>",
		"<html><script>payload-three-considerably-longer-than-the-others</script></html>",
		"<html><script>payload-four</script></html>",
	}

	var current string
	h := Middleware(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		_, _ = w.Write([]byte(current))
	}))

	for i, want := range bodies {
		current = want
		t.Run(fmt.Sprintf("request-%d", i), func(t *testing.T) {
			req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/", nil)
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, req)

			got := rec.Body.String()
			// The nonce is injected, so compare on the payload rather than exactly.
			inner := want[len("<html><script>") : len(want)-len("</script></html>")]
			if !strings.Contains(got, inner) {
				t.Errorf("body %d lost its content: %q", i, got)
			}
			for j, other := range bodies {
				if j == i {
					continue
				}
				stale := other[len("<html><script>") : len(other)-len("</script></html>")]
				if strings.Contains(got, stale) {
					t.Errorf("response %d contained bytes from response %d: %q", i, j, got)
				}
			}
		})
	}
}

// Pooled buffers are shared across goroutines; run the middleware concurrently
// so the race detector has something to look at.
func TestMiddlewareConcurrent(t *testing.T) {
	h := Middleware(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		_, _ = w.Write([]byte("<html><script>x</script></html>"))
	}))

	var wg sync.WaitGroup
	for range 50 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/", nil))
			if !strings.Contains(rec.Body.String(), `nonce=`) {
				t.Error("no nonce injected")
			}
		}()
	}
	wg.Wait()
}

// An oversized buffer must not be retained, or one large response would pin
// that memory for the life of the process.
func TestPutBufDropsOversizedBuffers(t *testing.T) {
	big := new(bytes.Buffer)
	big.Grow(maxBufferSize + 1)
	putBuf(big)

	// Not a guarantee about pool internals, just that we did not hand it back:
	// getBuf must not return a buffer with that capacity.
	for range 10 {
		if got := getBuf(); got.Cap() > maxBufferSize {
			t.Fatalf("pool handed back an oversized buffer: cap=%d", got.Cap())
		}
	}
}

// buildPage produces a document shaped like the real 404 page: mostly markup,
// a couple of scripts, a modulepreload link.
func buildPage(size int) []byte {
	var sb strings.Builder
	sb.WriteString(`<html><head><script>window.__NUXT__={}</script>`)
	sb.WriteString(`<link rel="modulepreload" href="/_nuxt/entry.js">`)
	sb.WriteString(`<link rel="stylesheet" href="/_nuxt/style.css">`)
	sb.WriteString(`</head><body>`)
	for sb.Len() < size {
		sb.WriteString(`<div class="prose"><p>not found</p></div>`)
	}
	sb.WriteString(`<script>console.log(1)</script></body></html>`)

	return []byte(sb.String())
}

func BenchmarkInjectNonce(b *testing.B) {
	page := buildPage(47 * 1024)

	b.ReportAllocs()
	b.ResetTimer()
	for range b.N {
		buf := getBuf()
		injectNonceTo(buf, page, "benchmarkNonce123456")
		putBuf(buf)
	}
}

// End to end through the middleware, which is what production pays.
func BenchmarkMiddlewareHTML(b *testing.B) {
	page := buildPage(47 * 1024)

	h := Middleware(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Content-Length", fmt.Sprint(len(page)))
		_, _ = w.Write(page)
	}))
	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/some-page", nil)

	b.ReportAllocs()
	b.ResetTimer()
	for range b.N {
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
	}
}
