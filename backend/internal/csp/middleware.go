package csp

import (
	"bytes"
	"net/http"
	stdpath "path"
	"strconv"
	"strings"
	"sync"
)

// maxBufferSize is the maximum HTML response size that will be buffered for
// nonce injection. Responses larger than this pass through unmodified.
const maxBufferSize = 512 << 10 // 512KB — SSG pages are small

// Middleware wraps an HTTP handler to apply per-route CSP headers and inject
// nonces into pre-rendered HTML served from static files (SSG).
//
// For HTML responses it:
//  1. Generates a fresh cryptographic nonce per request
//  2. Adds nonce="..." to all <script> and <link rel="modulepreload"> tags
//  3. Sets the Content-Security-Policy header with that nonce
//  4. Sets route-specific COOP/COEP/CORP overrides
//
// Non-HTML responses pass through without modification.
// Extra connect-src sources (e.g. Vite HMR WebSocket in dev) can be provided.
func Middleware(next http.Handler, devConnectSrc ...string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Only intercept GET/HEAD for HTML pages (not API routes, assets, etc.)
		if !shouldInjectCSP(r.URL.Path) {
			next.ServeHTTP(w, r)
			return
		}

		// Buffer the response to inspect content-type and modify HTML
		capture := getBuf()
		defer putBuf(capture)

		bw := &bufferedWriter{
			ResponseWriter: w,
			buf:            capture,
			header:         w.Header().Clone(),
			// A handler that writes nothing never reaches Write or WriteHeader,
			// and WriteHeader(0) further down would be invalid.
			statusCode: http.StatusOK,
		}
		next.ServeHTTP(bw, r)

		body := bw.buf.Bytes()
		ct := bw.header.Get("Content-Type")

		// Skip nonce injection for oversized or non-HTML responses
		if len(body) > maxBufferSize || !strings.Contains(ct, "text/html") {
			// Write through unmodified
			copyHeaders(w.Header(), bw.header)
			w.WriteHeader(bw.statusCode)
			_, _ = w.Write(body)
			return
		}

		// Generate nonce and inject into HTML
		nonce := GenerateNonce()

		out := getBuf()
		defer putBuf(out)
		injectNonceTo(out, body, nonce)

		// Determine CSP policy for this route
		policy := DefaultCSP
		var extraHeaders map[string]string

		if override := ForRoute(r.URL.Path); override != nil {
			policy = override.CSP
			extraHeaders = override.Headers
		}

		// In dev mode (signalled by dev connect-src being supplied), relax the CSP for
		// local tooling: Vite HMR sockets (connect-src) plus the Nuxt DevTools iframe,
		// which frames same-origin URLs like /__nuxt_devtools__/ (frame-src 'self').
		if len(devConnectSrc) > 0 {
			policy = Merge(policy, Policy{
				"connect-src": devConnectSrc,
				"frame-src":   {"'self'"},
			})
		}

		// Set CSP header with the nonce
		cspHeader := policy.String(nonce)

		// Copy all original headers first
		copyHeaders(w.Header(), bw.header)

		// Then set/override CSP and security headers
		w.Header().Set("Content-Security-Policy", cspHeader)
		w.Header().Set("Reporting-Endpoints", `csp-endpoint="/api/csp/violation"`)

		// Apply route-specific header overrides
		for k, v := range extraHeaders {
			w.Header().Set(k, v)
		}

		// Fix content-length for modified body
		w.Header().Del("Content-Length")
		w.WriteHeader(bw.statusCode)
		_, _ = w.Write(out.Bytes())
	})
}

// shouldInjectCSP returns true for paths that serve HTML pages.
// Excludes API routes, static assets, and other non-HTML paths.
func shouldInjectCSP(path string) bool {
	// Skip API routes
	if strings.HasPrefix(path, "/api/") {
		return false
	}
	// Skip known static asset paths
	if strings.HasPrefix(path, "/_nuxt/") {
		return false
	}
	// Skip paths with asset extensions
	switch stdpath.Ext(path) {
	case ".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
		".woff", ".woff2", ".ttf", ".eot", ".map", ".json", ".xml",
		".webp", ".avif", ".webmanifest", ".txt":
		return false
	}
	return true
}

var (
	scriptTag       = []byte("<script")
	linkTag         = []byte("<link")
	modulePreload   = []byte("modulepreload")
	nonceAttrMarker = []byte("nonce=")
)

// injectNonceTo writes html into dst, adding nonce="..." to every <script> and
// every <link rel="modulepreload"> that does not already carry one.
//
// One pass. The previous implementation scanned and copied the whole document
// twice, once per tag type, allocating a full-size buffer for each. On the ~47 KB
// 404 page that was two redundant copies on every request.
func injectNonceTo(dst *bytes.Buffer, html []byte, nonce string) {
	dst.Grow(len(html) + 256)

	nonceAttr := ` nonce="` + nonce + `"`
	rest := html

	for {
		idx := bytes.IndexByte(rest, '<')
		if idx == -1 {
			dst.Write(rest)
			return
		}

		tail := rest[idx:]

		var tagLen int
		var requireModulePreload bool

		switch {
		case bytes.HasPrefix(tail, scriptTag):
			tagLen = len(scriptTag)
		case bytes.HasPrefix(tail, linkTag):
			tagLen = len(linkTag)
			requireModulePreload = true
		default:
			// Not a tag we touch. Copy through this '<' and keep scanning.
			dst.Write(rest[:idx+1])
			rest = rest[idx+1:]
			continue
		}

		end := bytes.IndexByte(tail, '>')
		if end == -1 {
			// Unterminated tag: copy the remainder verbatim rather than guess.
			dst.Write(rest)
			return
		}

		tag := tail[:end+1]
		inject := !bytes.Contains(tag, nonceAttrMarker) &&
			(!requireModulePreload || bytes.Contains(tag, modulePreload))

		if inject {
			dst.Write(rest[:idx+tagLen])
			dst.WriteString(nonceAttr)
			dst.Write(tail[tagLen : end+1])
		} else {
			dst.Write(rest[:idx+end+1])
		}

		rest = rest[idx+end+1:]
	}
}

// injectNonce is the allocating form, kept for tests. The middleware uses
// injectNonceTo with a pooled buffer.
func injectNonce(html []byte, nonce string) []byte {
	var buf bytes.Buffer
	injectNonceTo(&buf, html, nonce)

	return buf.Bytes()
}

// bufPool reuses response buffers across requests. Capturing a ~47 KB page into
// a zero-capacity bytes.Buffer grows it by doubling through roughly eleven
// reallocations, which dominated the allocation cost of serving any HTML.
var bufPool = sync.Pool{
	New: func() any { return new(bytes.Buffer) },
}

func getBuf() *bytes.Buffer {
	buf, ok := bufPool.Get().(*bytes.Buffer)
	if !ok {
		return new(bytes.Buffer)
	}
	buf.Reset()

	return buf
}

// putBuf returns a buffer to the pool, dropping any that grew past what we are
// willing to hold, so a single large response cannot pin memory indefinitely.
func putBuf(buf *bytes.Buffer) {
	if buf.Cap() > maxBufferSize {
		return
	}
	bufPool.Put(buf)
}

// bufferedWriter captures the response body and status code.
type bufferedWriter struct {
	http.ResponseWriter
	buf        *bytes.Buffer
	header     http.Header
	statusCode int
	wroteCode  bool
}

func (bw *bufferedWriter) Header() http.Header {
	return bw.header
}

func (bw *bufferedWriter) WriteHeader(code int) {
	if !bw.wroteCode {
		bw.statusCode = code
		bw.wroteCode = true
	}
}

func (bw *bufferedWriter) Write(b []byte) (int, error) {
	if !bw.wroteCode {
		bw.statusCode = http.StatusOK
		bw.wroteCode = true
	}

	// Size the buffer from Content-Length on the first write. ServeContent sets
	// it before writing, so a pooled buffer that is still too small grows once
	// here rather than by doubling on the way up.
	if bw.buf.Len() == 0 {
		if n, err := strconv.Atoi(bw.header.Get("Content-Length")); err == nil && n > 0 && n <= maxBufferSize {
			bw.buf.Grow(n)
		}
	}

	return bw.buf.Write(b)
}

// copyHeaders copies all headers from src to dst, preserving multi-valued headers.
func copyHeaders(dst, src http.Header) {
	for k, vv := range src {
		dst[k] = vv
	}
}
