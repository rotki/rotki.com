package csp

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

func newTestHandler() *Handler {
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
	return NewHandler(logger)
}

const testOriginalPolicy = "default-src 'self'"

func makeReport(blockedURI, documentURI, violatedDirective string) string {
	report := map[string]any{
		"csp-report": map[string]any{
			"blocked-uri":        blockedURI,
			"document-uri":       documentURI,
			"violated-directive": violatedDirective,
			"original-policy":    testOriginalPolicy,
		},
	}
	b, _ := json.Marshal(report)
	return string(b)
}

func TestCSPHandler_ValidReport(t *testing.T) {
	h := newTestHandler()
	body := makeReport("https://evil.com/script.js", "https://rotki.com/", "script-src")
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/csp-report")
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp cspResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if !resp.Success {
		t.Fatal("expected success=true")
	}
}

func TestCSPHandler_MethodNotAllowed(t *testing.T) {
	h := newTestHandler()
	mux := http.NewServeMux()
	mux.Handle("POST /api/csp/violation", h)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/csp/violation", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", w.Code)
	}
}

func TestCSPHandler_TooLarge(t *testing.T) {
	h := newTestHandler()
	// Create a body larger than 8KB
	large := bytes.Repeat([]byte("x"), maxReportSize+1)
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", bytes.NewReader(large))
	req.ContentLength = int64(len(large))
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("expected 413, got %d", w.Code)
	}
}

func TestCSPHandler_InvalidJSON(t *testing.T) {
	h := newTestHandler()
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader("not json"))
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestCSPHandler_MissingRequiredFields(t *testing.T) {
	h := newTestHandler()
	body := `{"csp-report": {"blocked-uri": "https://evil.com"}}`
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestCSPHandler_FiltersBrowserExtension(t *testing.T) {
	h := newTestHandler()
	body := makeReport("chrome-extension://abc123", "https://rotki.com/", "script-src")
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var resp cspResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if resp.Reason != "browser-extension" {
		t.Fatalf("expected reason=browser-extension, got %q", resp.Reason)
	}
}

func TestCSPHandler_FiltersSuspiciousPattern(t *testing.T) {
	h := newTestHandler()
	body := makeReport("https://evil.com/<script>alert(1)</script>", "https://rotki.com/", "script-src")
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	var resp cspResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if resp.Reason != "suspicious-pattern" {
		t.Fatalf("expected reason=suspicious-pattern, got %q", resp.Reason)
	}
}

func TestCSPHandler_FiltersFalsePositive(t *testing.T) {
	h := newTestHandler()
	body := makeReport("https://rotki.com/favicon.ico", "https://rotki.com/", "img-src")
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	var resp cspResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if resp.Reason != "false-positive" {
		t.Fatalf("expected reason=false-positive, got %q", resp.Reason)
	}
}

func TestCSPHandler_FiltersLocalhostDev(t *testing.T) {
	h := newTestHandler()
	body := makeReport("inline", "http://localhost:3000/", "script-src")
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	var resp cspResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if resp.Reason != "localhost-development" {
		t.Fatalf("expected reason=localhost-development, got %q", resp.Reason)
	}
}

func TestCSPHandler_AcceptsUnknownFields(t *testing.T) {
	h := newTestHandler()
	// Simulate a browser sending extra fields not in our struct
	body := `{"csp-report": {
		"blocked-uri": "https://evil.com/script.js",
		"document-uri": "https://rotki.com/",
		"violated-directive": "script-src",
		"original-policy": "default-src 'self'",
		"disposition": "enforce",
		"document-url": "https://rotki.com/",
		"some-future-field": "value"
	}}`
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/csp-report")
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp cspResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if !resp.Success {
		t.Fatal("expected success=true")
	}
}

// makeReportingAPIBatch builds a Reporting API (report-to) payload: a JSON
// array of report objects with camelCase body fields, as sent by modern
// Firefox/Chrome/Edge via the Reporting-Endpoints header.
func makeReportingAPIBatch(reports ...map[string]any) string {
	b, _ := json.Marshal(reports)
	return string(b)
}

func cspViolationReport(blockedURL, effectiveDirective string) map[string]any {
	const documentURL = "https://rotki.com/"
	return map[string]any{
		"age":  0,
		"type": "csp-violation",
		"url":  documentURL,
		"body": map[string]any{
			"blockedURL":         blockedURL,
			"documentURL":        documentURL,
			"effectiveDirective": effectiveDirective,
			"originalPolicy":     testOriginalPolicy,
			"disposition":        "enforce",
			"statusCode":         200,
		},
	}
}

func TestCSPHandler_ReportingAPIValidReport(t *testing.T) {
	h := newTestHandler()
	body := makeReportingAPIBatch(cspViolationReport("https://evil.com/script.js", "script-src-elem"))
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/reports+json")
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var resp cspResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if !resp.Success {
		t.Fatalf("expected success=true, got %+v", resp)
	}
}

// TestCSPHandler_ReportingAPIFirefoxPayload reproduces the real-world Firefox
// 151 wire payload that previously 400'd: a reports+json array whose body uses
// `effectiveDirective` with no `violatedDirective`.
func TestCSPHandler_ReportingAPIFirefoxPayload(t *testing.T) {
	h := newTestHandler()
	body := `[{"age":0,"body":{"blockedURL":"https://evil.com/x.js","columnNumber":12,"disposition":"enforce","documentURL":"https://rotki.com/","effectiveDirective":"script-src-elem","lineNumber":1,"originalPolicy":"default-src 'self'","referrer":"","sample":"","sourceFile":"https://rotki.com/","statusCode":200},"type":"csp-violation","url":"https://rotki.com/","user_agent":"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0"}]`
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/reports+json")
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var resp cspResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if !resp.Success {
		t.Fatalf("expected success=true, got %+v", resp)
	}
}

func TestCSPHandler_ReportingAPIBatchMultiple(t *testing.T) {
	h := newTestHandler()
	body := makeReportingAPIBatch(
		cspViolationReport("https://evil.com/a.js", "script-src-elem"),
		cspViolationReport("https://evil.com/b.css", "style-src-elem"),
	)
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/reports+json")
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var resp cspResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if !resp.Success {
		t.Fatalf("expected success=true, got %+v", resp)
	}
}

// Single-report batches preserve the precise per-report filter reason, just
// like the legacy path.
func TestCSPHandler_ReportingAPIFiltersBrowserExtension(t *testing.T) {
	h := newTestHandler()
	body := makeReportingAPIBatch(cspViolationReport("moz-extension://abc123/inject.js", "script-src-elem"))
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/reports+json")
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	var resp cspResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if resp.Reason != "browser-extension" {
		t.Fatalf("expected reason=browser-extension, got %q", resp.Reason)
	}
}

// Non-csp-violation report types (deprecation/intervention) are dropped; a
// batch containing only those is accepted as a valid no-op.
func TestCSPHandler_ReportingAPIIgnoresNonCSPTypes(t *testing.T) {
	h := newTestHandler()
	body := makeReportingAPIBatch(map[string]any{
		"age":  0,
		"type": "deprecation",
		"url":  "https://rotki.com/",
		"body": map[string]any{"id": "WebSQL", "message": "WebSQL is deprecated"},
	})
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/reports+json")
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var resp cspResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if !resp.Success {
		t.Fatalf("expected success=true for no-op batch, got %+v", resp)
	}
}

// A reports+json batch mixing a valid CSP violation with an unrelated report
// type still succeeds and processes the violation.
func TestCSPHandler_ReportingAPIMixedTypes(t *testing.T) {
	h := newTestHandler()
	body := makeReportingAPIBatch(
		map[string]any{"type": "intervention", "url": "https://rotki.com/", "body": map[string]any{"id": "x"}},
		cspViolationReport("https://evil.com/script.js", "script-src-elem"),
	)
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/reports+json")
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestCSPHandler_ReportingAPIInvalidJSON(t *testing.T) {
	h := newTestHandler()
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader("[not json"))
	req.Header.Set("Content-Type", "application/reports+json")
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

// Format detection sniffs the body, not Content-Type: an array body is parsed
// as a Reporting API batch even when the header is missing/wrong.
func TestCSPHandler_ReportingAPIDetectedWithoutContentType(t *testing.T) {
	h := newTestHandler()
	body := makeReportingAPIBatch(cspViolationReport("https://evil.com/script.js", "script-src-elem"))
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	// no Content-Type set
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestCSPHandler_FiltersBotTraffic(t *testing.T) {
	h := newTestHandler()
	body := makeReport("https://evil.com/script.js", "https://rotki.com/", "script-src")
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	req.Header.Set("User-Agent", "Googlebot/2.1 (+http://www.google.com/bot.html)")
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	var resp cspResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if resp.Reason != "bot-traffic" {
		t.Fatalf("expected reason=bot-traffic, got %q", resp.Reason)
	}
}

// newLoggingTestHandler returns a handler whose JSON log output is captured
// at Debug level so tests can assert on messages, levels and fields.
func newLoggingTestHandler() (*Handler, *bytes.Buffer) {
	buf := &bytes.Buffer{}
	logger := slog.New(slog.NewJSONHandler(buf, &slog.HandlerOptions{Level: slog.LevelDebug}))
	return NewHandler(logger), buf
}

func logRecords(t *testing.T, buf *bytes.Buffer) []map[string]any {
	t.Helper()
	var records []map[string]any
	for line := range strings.SplitSeq(strings.TrimSpace(buf.String()), "\n") {
		if line == "" {
			continue
		}
		var rec map[string]any
		if err := json.Unmarshal([]byte(line), &rec); err != nil {
			t.Fatalf("invalid log line %q: %v", line, err)
		}
		records = append(records, rec)
	}
	return records
}

func singleRecord(t *testing.T, buf *bytes.Buffer) map[string]any {
	t.Helper()
	records := logRecords(t, buf)
	if len(records) != 1 {
		t.Fatalf("expected exactly 1 log record, got %d: %s", len(records), buf.String())
	}
	return records[0]
}

func postReport(h *Handler, body, userAgent string) {
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	if userAgent != "" {
		req.Header.Set("User-Agent", userAgent)
	}
	h.ServeHTTP(httptest.NewRecorder(), req)
}

func TestCSPHandler_LogsDetectedViolationOnceAtWarn(t *testing.T) {
	h, buf := newLoggingTestHandler()
	postReport(h, makeReport("https://evil.com/script.js", "https://rotki.com/", "script-src"), "")

	rec := singleRecord(t, buf)
	if rec["msg"] != "CSP violation detected" {
		t.Fatalf("unexpected msg %q", rec["msg"])
	}
	if rec["level"] != "WARN" {
		t.Fatalf("expected level WARN, got %q", rec["level"])
	}
	want := map[string]any{
		"report_format":       reportFormatReportURI,
		"own_document":        true,
		"policy_hash":         policyHash(testOriginalPolicy),
		"git_sha":             "unknown",
		"blocked_uri":         "https://evil.com/script.js",
		"effective_directive": "script-src",
	}
	for key, value := range want {
		if rec[key] != value {
			t.Errorf("%s: expected %v, got %v", key, value, rec[key])
		}
	}
	if ip, _ := rec["ip"].(string); ip == "" {
		t.Error("expected ip to be set")
	}
}

func TestCSPHandler_LogsReportingAPIFormat(t *testing.T) {
	h, buf := newLoggingTestHandler()
	postReport(h, makeReportingAPIBatch(cspViolationReport("https://evil.com/script.js", "script-src-elem")), "")

	rec := singleRecord(t, buf)
	if rec["report_format"] != reportFormatReportingAPI {
		t.Fatalf("expected report_format=%s, got %v", reportFormatReportingAPI, rec["report_format"])
	}
}

func TestCSPHandler_LogsFilteredReportsAtInfo(t *testing.T) {
	tests := []struct {
		name      string
		body      string
		userAgent string
		reason    string
	}{
		{"browser extension", makeReport("chrome-extension://abc123", "https://rotki.com/", "script-src"), "", reasonBrowserExtension},
		{"false positive", makeReport("https://rotki.com/favicon.ico", "https://rotki.com/", "img-src"), "", reasonFalsePositive},
		{"localhost development", makeReport("inline", "http://localhost:3000/", "script-src"), "", reasonLocalhostDev},
		{"bot traffic", makeReport("https://evil.com/script.js", "https://rotki.com/", "script-src"), "Googlebot/2.1", reasonBotTraffic},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h, buf := newLoggingTestHandler()
			postReport(h, tt.body, tt.userAgent)

			rec := singleRecord(t, buf)
			if rec["msg"] != "CSP report filtered" {
				t.Fatalf("unexpected msg %q", rec["msg"])
			}
			if rec["level"] != "INFO" {
				t.Fatalf("expected level INFO, got %q", rec["level"])
			}
			if rec["reason"] != tt.reason {
				t.Fatalf("expected reason=%s, got %v", tt.reason, rec["reason"])
			}
			if _, ok := rec["effective_directive"]; !ok {
				t.Error("expected effective_directive field")
			}
			if ip, _ := rec["ip"].(string); ip == "" {
				t.Error("expected ip to be set")
			}
		})
	}
}

func TestCSPHandler_LogsSuspiciousReportWithReason(t *testing.T) {
	h, buf := newLoggingTestHandler()
	postReport(h, makeReport("https://evil.com/<script>alert(1)</script>", "https://rotki.com/", "script-src"), "")

	rec := singleRecord(t, buf)
	if rec["msg"] != "suspicious CSP report pattern detected" || rec["level"] != "WARN" {
		t.Fatalf("unexpected record %v", rec)
	}
	if rec["reason"] != reasonSuspiciousPattern {
		t.Fatalf("expected reason=%s, got %v", reasonSuspiciousPattern, rec["reason"])
	}
}

// Blocked URIs mentioning eval are real signals now that script-src allows
// 'unsafe-eval', so they must not be dropped as false positives.
func TestCSPHandler_DoesNotFilterEval(t *testing.T) {
	for _, blocked := range []string{"eval", "https://cdn.example.com/medieval.js"} {
		t.Run(blocked, func(t *testing.T) {
			h, buf := newLoggingTestHandler()
			postReport(h, makeReport(blocked, "https://rotki.com/", "script-src"), "")

			rec := singleRecord(t, buf)
			if rec["msg"] != "CSP violation detected" {
				t.Fatalf("expected violation to be logged, got %v", rec)
			}
		})
	}
}

func TestPolicyHash(t *testing.T) {
	a := policyHash("script-src 'self' 'nonce-abc123=='; object-src 'none'")
	b := policyHash("script-src 'self' 'nonce-XYZ/789+'; object-src 'none'")
	if a != b {
		t.Fatalf("expected nonce-independent hash, got %s and %s", a, b)
	}
	if len(a) != 12 {
		t.Fatalf("expected 12 hex chars, got %q", a)
	}
	if c := policyHash("script-src 'self'; object-src 'self'"); c == a {
		t.Fatal("expected different policies to hash differently")
	}
}

func TestIsOwnDocument(t *testing.T) {
	tests := map[string]bool{
		"https://rotki.com/":                 true,
		"https://staging.rotki.com/checkout": true,
		"https://ROTKI.com/":                 true,
		"https://notrotki.com/":              false,
		"https://rotki.com.evil.com/":        false,
		"http://localhost:3000/":             false,
		"about:blank":                        false,
		"":                                   false,
	}
	for uri, want := range tests {
		if got := isOwnDocument(uri); got != want {
			t.Errorf("isOwnDocument(%q) = %v, want %v", uri, got, want)
		}
	}
}
