package csp

import (
	"bytes"
	"net/http"
	stdpath "path"
	"strings"
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
		bw := &bufferedWriter{
			ResponseWriter: w,
			buf:            &bytes.Buffer{},
			header:         w.Header().Clone(),
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
		modified := injectNonce(body, nonce)

		// Determine CSP policy for this route
		policy := DefaultCSP
		var extraHeaders map[string]string

		if override := ForRoute(r.URL.Path); override != nil {
			policy = override.CSP
			extraHeaders = override.Headers
		}

		// In dev mode, add extra connect-src sources (e.g. Vite HMR WebSocket)
		if len(devConnectSrc) > 0 {
			policy = Merge(policy, Policy{"connect-src": devConnectSrc})
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
		_, _ = w.Write(modified)
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

// injectNonce adds nonce="..." attributes to <script> and
// <link rel="modulepreload"> tags in the HTML body.
func injectNonce(html []byte, nonce string) []byte {
	nonceAttr := []byte(` nonce="` + nonce + `"`)

	// Inject nonce into <script> tags (but not those that already have a nonce)
	html = injectAttr(html, []byte("<script"), nonceAttr)

	// Inject nonce into <link rel="modulepreload"> tags
	html = injectAttrFiltered(html, []byte("<link"), []byte("modulepreload"), nonceAttr)

	return html
}

// injectAttr adds attrBytes after every occurrence of tagOpen in html,
// unless the tag already contains "nonce=".
func injectAttr(html, tagOpen, attrBytes []byte) []byte {
	result := make([]byte, 0, len(html)+256)
	remaining := html

	for {
		idx := bytes.Index(remaining, tagOpen)
		if idx == -1 {
			result = append(result, remaining...)
			break
		}

		// Find end of opening tag
		tagEnd := bytes.IndexByte(remaining[idx:], '>')
		if tagEnd == -1 {
			result = append(result, remaining...)
			break
		}
		tagEnd += idx

		tag := remaining[idx : tagEnd+1]

		// Skip if already has nonce
		if bytes.Contains(tag, []byte("nonce=")) {
			result = append(result, remaining[:tagEnd+1]...)
			remaining = remaining[tagEnd+1:]
			continue
		}

		// Insert nonce attribute right after the tag name
		insertPos := idx + len(tagOpen)
		result = append(result, remaining[:insertPos]...)
		result = append(result, attrBytes...)
		result = append(result, remaining[insertPos:tagEnd+1]...)
		remaining = remaining[tagEnd+1:]
	}

	return result
}

// injectAttrFiltered adds attrBytes after tagOpen occurrences that also
// contain filterBytes in the tag body (e.g., <link ... modulepreload ...>).
func injectAttrFiltered(html, tagOpen, filterBytes, attrBytes []byte) []byte {
	result := make([]byte, 0, len(html)+256)
	remaining := html

	for {
		idx := bytes.Index(remaining, tagOpen)
		if idx == -1 {
			result = append(result, remaining...)
			break
		}

		tagEnd := bytes.IndexByte(remaining[idx:], '>')
		if tagEnd == -1 {
			result = append(result, remaining...)
			break
		}
		tagEnd += idx

		tag := remaining[idx : tagEnd+1]

		// Only inject if filter matches and no existing nonce
		if bytes.Contains(tag, filterBytes) && !bytes.Contains(tag, []byte("nonce=")) {
			insertPos := idx + len(tagOpen)
			result = append(result, remaining[:insertPos]...)
			result = append(result, attrBytes...)
			result = append(result, remaining[insertPos:tagEnd+1]...)
		} else {
			result = append(result, remaining[:tagEnd+1]...)
		}

		remaining = remaining[tagEnd+1:]
	}

	return result
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
	return bw.buf.Write(b)
}

// copyHeaders copies all headers from src to dst, preserving multi-valued headers.
func copyHeaders(dst, src http.Header) {
	for k, vv := range src {
		dst[k] = vv
	}
}
