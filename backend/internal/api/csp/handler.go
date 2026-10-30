// Package csp handles Content Security Policy violation reporting.
package csp

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/rotki/rotki.com/backend/internal/validate"
	"github.com/rotki/rotki.com/backend/internal/version"
)

const maxReportSize = 8 * 1024 // 8KB

// Wire formats a report can arrive in, logged as report_format.
const (
	reportFormatReportURI    = "report-uri"
	reportFormatReportingAPI = "reporting-api"
)

// Filter reasons, shared by the response body and the "CSP report filtered"
// log line. Grafana queries match on these values, so keep them stable.
const (
	reasonSuspiciousPattern = "suspicious-pattern"
	reasonBrowserExtension  = "browser-extension"
	reasonFalsePositive     = "false-positive"
	reasonLocalhostDev      = "localhost-development"
	reasonBotTraffic        = "bot-traffic"
)

// Known false positive patterns to filter out.
//
// Eval reports are deliberately not listed: script-src already allows
// 'unsafe-eval', so an eval report that still arrives points at a page whose
// policy differs, which is worth seeing.
var knownFalsePositives = []*regexp.Regexp{
	// Browser prefetch/preconnect
	regexp.MustCompile(`^https?://[\da-z.-]+/(favicon\.ico|apple-touch-icon|robots\.txt)$`),
	// Data URIs for images
	regexp.MustCompile(`^data:image/(svg\+xml|png|jpeg|gif|webp);base64`),
}

// Suspicious patterns that may indicate malicious reports.
var suspiciousPatterns = []*regexp.Regexp{
	// Multiple encoded layers that might hide payloads
	regexp.MustCompile(`%25%25|%2525`),
	// SQL injection attempts in URIs
	regexp.MustCompile(`(?i)(union|select|insert|update|delete|drop)\s+(from|into|table)`),
	// Script injection attempts
	regexp.MustCompile(`(?i)<script[^>]*>|javascript:|on\w+\s*=`),
}

// Browser extension URI patterns.
var extensionPattern = regexp.MustCompile(`^(moz|chrome|safari|edge|webkit)-extension(:|$)`)

// Bot/crawler user agent patterns.
var botPattern = regexp.MustCompile(`(?i)bot|crawler|spider|scraper|headless|puppeteer|playwright`)

// noncePattern matches per-request nonce sources so that policy_hash is stable
// across requests to the same page.
var noncePattern = regexp.MustCompile(`'nonce-[^']*'`)

// Handler handles CSP violation reports.
type Handler struct {
	logger *slog.Logger
}

// NewHandler creates a new CSP violation handler.
func NewHandler(logger *slog.Logger) *Handler {
	return &Handler{
		logger: logger.With("handler", "csp.violation", "git_sha", version.GitSHA),
	}
}

// cspReport mirrors the W3C CSP Level 2/3 report-uri format.
// Unknown fields are silently ignored so that browser-specific extras
// (e.g. Safari's "document-url") do not cause parse failures.
type cspReport struct {
	BlockedURI         string `json:"blocked-uri"`
	ColumnNumber       int    `json:"column-number"`
	Disposition        string `json:"disposition"`
	DocumentURI        string `json:"document-uri"`
	EffectiveDirective string `json:"effective-directive"`
	LineNumber         int    `json:"line-number"`
	OriginalPolicy     string `json:"original-policy"`
	Referrer           string `json:"referrer"`
	ScriptSample       string `json:"script-sample"`
	SourceFile         string `json:"source-file"`
	StatusCode         int    `json:"status-code"`
	ViolatedDirective  string `json:"violated-directive"`
}

type cspReportWrapper struct {
	CSPReport cspReport `json:"csp-report"`
}

// reportingAPIReport mirrors a single entry of the Reporting API payload sent
// via the `report-to` directive / `Reporting-Endpoints` header. The body is
// posted as a JSON array with Content-Type "application/reports+json" and uses
// camelCase field names, unlike the legacy hyphenated `report-uri` format.
// Modern Firefox/Chrome/Edge prefer this mechanism when both are advertised.
type reportingAPIReport struct {
	Type string        `json:"type"`
	URL  string        `json:"url"`
	Body cspReportBody `json:"body"`
}

// cspReportBody is the CSP Level 3 `csp-violation` report body (camelCase).
type cspReportBody struct {
	BlockedURL         string `json:"blockedURL"`
	ColumnNumber       int    `json:"columnNumber"`
	Disposition        string `json:"disposition"`
	DocumentURL        string `json:"documentURL"`
	EffectiveDirective string `json:"effectiveDirective"`
	LineNumber         int    `json:"lineNumber"`
	OriginalPolicy     string `json:"originalPolicy"`
	Referrer           string `json:"referrer"`
	Sample             string `json:"sample"`
	SourceFile         string `json:"sourceFile"`
	StatusCode         int    `json:"statusCode"`
	ViolatedDirective  string `json:"violatedDirective"`
}

type cspResponse struct {
	Message string `json:"message"`
	Success bool   `json:"success,omitempty"`
	Status  string `json:"status,omitempty"`
	Reason  string `json:"reason,omitempty"`
}

// ServeHTTP handles POST /api/csp/violation.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Check content length before reading body
	if r.ContentLength > maxReportSize {
		h.logger.Warn("CSP report rejected: exceeds size limit",
			"size", r.ContentLength,
			"max", maxReportSize,
		)
		http.Error(w, "Request body too large", http.StatusRequestEntityTooLarge)
		return
	}

	reports, format, err := readCSPReports(r)
	if err != nil {
		h.logger.Warn("invalid CSP report format", "error", err)
		validate.WriteJSON(w, http.StatusBadRequest, cspResponse{
			Message: "Invalid CSP violation report format",
		})
		return
	}

	// A Reporting API batch can legitimately contain zero csp-violation entries
	// (e.g. only deprecation/intervention reports) — accept it as a no-op.
	if len(reports) == 0 {
		validate.WriteJSON(w, http.StatusOK, cspResponse{
			Message: "No CSP violations to process",
			Success: true,
		})
		return
	}

	clientIP := validate.ClientIP(r)
	userAgent := r.UserAgent()

	// Single report (the common legacy report-uri case): preserve the original
	// per-report response semantics so callers see the precise filter reason.
	if len(reports) == 1 {
		status, resp, errs := h.evaluateReport(reports[0], clientIP, userAgent, format)
		if len(errs) > 0 {
			h.logger.Warn("CSP report missing required fields", "errors", errs.Error())
			errs.WriteJSON(w)
			return
		}
		validate.WriteJSON(w, status, resp)
		return
	}

	// Reporting API batch: process every report for its side effects (filtering
	// and structured logging) and return a single aggregate acknowledgement.
	for _, report := range reports {
		if _, _, errs := h.evaluateReport(report, clientIP, userAgent, format); len(errs) > 0 {
			h.logger.Warn("CSP report missing required fields", "errors", errs.Error())
		}
	}
	validate.WriteJSON(w, http.StatusOK, cspResponse{
		Message: "CSP violation reports received and logged",
		Success: true,
	})
}

// evaluateReport runs validation, security/false-positive/bot filtering and
// structured logging for a single normalized report. It returns the HTTP status
// and response body the handler should emit for a single-report request, plus
// any validation errors (empty when the report is valid). All logging happens
// as a side effect so batch callers can discard the returned response.
func (h *Handler) evaluateReport(report cspReport, clientIP, userAgent, format string) (int, cspResponse, validate.Errors) {
	// Validate required fields
	if errs := validate.Collect(
		validate.RequiredString("document-uri", report.DocumentURI),
		validate.RequiredString("violated-directive", report.ViolatedDirective),
		validate.RequiredString("original-policy", report.OriginalPolicy),
	); len(errs) > 0 {
		return 0, cspResponse{}, errs
	}

	// Check for suspicious patterns across all report field values.
	// We check the raw field values rather than JSON-encoded strings
	// because JSON escapes characters like < which would defeat regex matching.
	reportFields := []string{
		report.BlockedURI, report.DocumentURI, report.EffectiveDirective,
		report.OriginalPolicy, report.Referrer, report.ScriptSample,
		report.SourceFile, report.ViolatedDirective,
	}
	reportStr := strings.Join(reportFields, " ")
	for _, pattern := range suspiciousPatterns {
		if pattern.MatchString(reportStr) {
			h.logger.Warn("suspicious CSP report pattern detected", filterAttrs(reasonSuspiciousPattern, report, clientIP)...)
			return http.StatusOK, cspResponse{
				Message: "Report filtered due to suspicious content",
				Status:  "filtered",
				Reason:  reasonSuspiciousPattern,
			}, nil
		}
	}

	// Filter browser extension violations
	if extensionPattern.MatchString(report.SourceFile) || extensionPattern.MatchString(report.BlockedURI) ||
		isBlobInjectedInline(report) {
		return h.ignore(reasonBrowserExtension, "Browser extension violation filtered out", report, clientIP)
	}

	// Filter known false positives
	if report.BlockedURI != "" {
		for _, pattern := range knownFalsePositives {
			if pattern.MatchString(report.BlockedURI) {
				return h.ignore(reasonFalsePositive, "Known false positive filtered", report, clientIP)
			}
		}
	}

	host := documentHost(report.DocumentURI)

	// Filter localhost inline/eval in development
	if (report.BlockedURI == "inline" || report.BlockedURI == "eval") && isLocalhost(host) {
		return h.ignore(reasonLocalhostDev, "Localhost development violation filtered", report, clientIP)
	}

	// Filter bot traffic
	if botPattern.MatchString(userAgent) {
		return h.ignore(reasonBotTraffic, "Bot/crawler violation filtered", report, clientIP)
	}

	// Client reports are not server errors, so they log at Warn.
	h.logger.Warn("CSP violation detected",
		"blocked_uri", sanitize(report.BlockedURI, 500),
		"column_number", report.ColumnNumber,
		"disposition", sanitize(report.Disposition, 20),
		"document_uri", sanitize(report.DocumentURI, 500),
		"effective_directive", sanitize(report.EffectiveDirective, 100),
		"ip", clientIP,
		"line_number", report.LineNumber,
		"original_policy", sanitize(report.OriginalPolicy, 1200),
		"own_document", isOwnHost(host),
		"policy_hash", policyHash(report.OriginalPolicy),
		"referrer", sanitize(report.Referrer, 500),
		"report_format", format,
		"script_sample", sanitize(report.ScriptSample, 100),
		"source_file", sanitize(report.SourceFile, 500),
		"status_code", report.StatusCode,
		"timestamp", time.Now().UTC().Format(time.RFC3339),
		"user_agent", sanitize(userAgent, 200),
		"violated_directive", sanitize(report.ViolatedDirective, 100),
	)

	return http.StatusOK, cspResponse{
		Message: "CSP violation report received and logged",
		Success: true,
	}, nil
}

// ignore records a report dropped by one of the noise filters and builds the
// matching response. It logs at Info with a single stable message so
// dashboards can count filtered reports per reason without treating them as
// violations.
func (h *Handler) ignore(reason, message string, report cspReport, clientIP string) (int, cspResponse, validate.Errors) {
	h.logger.Info("CSP report filtered", filterAttrs(reason, report, clientIP)...)
	return http.StatusOK, cspResponse{
		Message: message,
		Status:  "ignored",
		Reason:  reason,
	}, nil
}

// filterAttrs are the fields shared by every dropped-report log line.
func filterAttrs(reason string, report cspReport, clientIP string) []any {
	return []any{
		"reason", reason,
		"ip", clientIP,
		"effective_directive", sanitize(report.EffectiveDirective, 100),
	}
}

// policyHash returns a short hash of the reported policy with nonces removed,
// so reports from the same page and deploy share a value.
func policyHash(policy string) string {
	normalized := strings.Join(strings.Fields(noncePattern.ReplaceAllString(policy, "")), " ")
	sum := sha256.Sum256([]byte(normalized))
	return hex.EncodeToString(sum[:6])
}

// isBlobInjectedInline reports whether an inline script was added by a script
// running from a blob: URL. No policy allows scripts from blob:, so a page
// script loaded that way would have been blocked itself; one that runs anyway
// was injected outside the page's CSP by an extension or userscript.
func isBlobInjectedInline(report cspReport) bool {
	return report.BlockedURI == "inline" && strings.HasPrefix(report.SourceFile, "blob:")
}

// documentHost returns the lower-cased host of the document URI without a
// trailing dot, or "" when the URI does not parse.
func documentHost(documentURI string) string {
	u, err := url.Parse(documentURI)
	if err != nil {
		return ""
	}
	return strings.TrimSuffix(strings.ToLower(u.Hostname()), ".")
}

// isOwnHost reports whether a document host is rotki.com or one of its
// subdomains, as opposed to a mirror, proxy or forged report.
func isOwnHost(host string) bool {
	return host == "rotki.com" || strings.HasSuffix(host, ".rotki.com")
}

// isLocalhost reports whether a document host is a local development host.
// It matches the host only, so a public URL that merely mentions localhost in
// its path or query is not treated as development.
func isLocalhost(host string) bool {
	if host == "localhost" || strings.HasSuffix(host, ".localhost") {
		return true
	}
	ip := net.ParseIP(host)
	return ip != nil && ip.IsLoopback()
}

// readCSPReports decodes one or more CSP violation reports from the request
// body, transparently handling both wire formats a browser may send:
//
//   - Legacy `report-uri` (Content-Type application/csp-report): a single
//     JSON object {"csp-report": {...}} with hyphenated field names.
//   - Reporting API `report-to` / `Reporting-Endpoints` (Content-Type
//     application/reports+json): a JSON array of reports with camelCase fields
//     nested under "body". Modern Firefox/Chrome/Edge use this.
//
// The format is detected by sniffing the first non-whitespace byte rather than
// trusting Content-Type, since intermediaries occasionally rewrite it. Unknown
// fields are silently ignored so browser-specific extras never cause a 400.
func readCSPReports(r *http.Request) ([]cspReport, string, error) {
	r.Body = http.MaxBytesReader(nil, r.Body, maxReportSize)

	data, err := io.ReadAll(r.Body)
	if err != nil {
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) {
			return nil, "", fmt.Errorf("request body too large (max %d bytes)", maxReportSize)
		}
		return nil, "", errors.New("invalid request body")
	}

	trimmed := bytes.TrimLeft(data, " \t\r\n")
	if len(trimmed) == 0 {
		return nil, "", errors.New("empty request body")
	}

	// Reporting API batch: a JSON array of report objects.
	if trimmed[0] == '[' {
		var batch []reportingAPIReport
		if err := json.Unmarshal(data, &batch); err != nil {
			return nil, "", errors.New("invalid request body")
		}
		reports := make([]cspReport, 0, len(batch))
		for i := range batch {
			// Reporting endpoints are shared across report types; keep only CSP
			// violations and drop deprecation/intervention/other entries.
			if batch[i].Type != "" && batch[i].Type != "csp-violation" {
				continue
			}
			reports = append(reports, normalizeReportingAPIReport(&batch[i]))
		}
		return reports, reportFormatReportingAPI, nil
	}

	// Legacy report-uri format: a single {"csp-report": {...}} object.
	var wrapper cspReportWrapper
	if err := json.Unmarshal(data, &wrapper); err != nil {
		return nil, "", errors.New("invalid request body")
	}
	return []cspReport{fillDirectives(wrapper.CSPReport)}, reportFormatReportURI, nil
}

// normalizeReportingAPIReport maps a Reporting API report onto the internal
// cspReport shape used by the rest of the pipeline.
func normalizeReportingAPIReport(rep *reportingAPIReport) cspReport {
	b := rep.Body
	documentURI := b.DocumentURL
	if documentURI == "" {
		documentURI = rep.URL // top-level url is the document URL in this format
	}
	return fillDirectives(cspReport{
		BlockedURI:         b.BlockedURL,
		ColumnNumber:       b.ColumnNumber,
		Disposition:        b.Disposition,
		DocumentURI:        documentURI,
		EffectiveDirective: b.EffectiveDirective,
		LineNumber:         b.LineNumber,
		OriginalPolicy:     b.OriginalPolicy,
		Referrer:           b.Referrer,
		ScriptSample:       b.Sample,
		SourceFile:         b.SourceFile,
		StatusCode:         b.StatusCode,
		ViolatedDirective:  b.ViolatedDirective,
	})
}

// fillDirectives cross-populates the violated/effective directive fields. The
// legacy format favors `violated-directive` while the Reporting API favors
// `effectiveDirective` (and often omits the deprecated `violatedDirective`);
// downstream validation and logging expect both to be present.
func fillDirectives(rep cspReport) cspReport {
	if rep.ViolatedDirective == "" {
		rep.ViolatedDirective = rep.EffectiveDirective
	}
	if rep.EffectiveDirective == "" {
		rep.EffectiveDirective = rep.ViolatedDirective
	}
	return rep
}

// sanitize removes control characters and truncates to maxLen (rune-safe).
func sanitize(s string, maxLen int) string {
	return validate.SanitizeString(s, maxLen)
}
