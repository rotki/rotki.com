// Package csp handles Content Security Policy violation reporting.
package csp

import (
	"log/slog"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/rotki/rotki.com/backend/internal/validate"
)

const maxReportSize = 8 * 1024 // 8KB

// Known false positive patterns to filter out.
var knownFalsePositives = []*regexp.Regexp{
	// Browser prefetch/preconnect
	regexp.MustCompile(`^https?://[\da-z.-]+/(favicon\.ico|apple-touch-icon|robots\.txt)$`),
	// Common CDN eval/inline issues
	regexp.MustCompile(`(?i)eval|unsafe-eval|unsafe-inline`),
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

// Handler handles CSP violation reports.
type Handler struct {
	logger *slog.Logger
}

// NewHandler creates a new CSP violation handler.
func NewHandler(logger *slog.Logger) *Handler {
	return &Handler{
		logger: logger.With("handler", "csp.violation"),
	}
}

// cspReport mirrors the W3C CSP Level 3 report format.
type cspReport struct {
	BlockedURI         string `json:"blocked-uri"`
	ColumnNumber       int    `json:"column-number"`
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

	var wrapper cspReportWrapper
	if err := validate.ReadJSONBody(r, &wrapper, maxReportSize); err != nil {
		h.logger.Error("invalid CSP report format", "error", err)
		validate.WriteJSON(w, http.StatusBadRequest, cspResponse{
			Message: "Invalid CSP violation report format",
		})
		return
	}

	report := wrapper.CSPReport

	// Validate required fields
	if errs := validate.Collect(
		validate.RequiredString("document-uri", report.DocumentURI),
		validate.RequiredString("violated-directive", report.ViolatedDirective),
		validate.RequiredString("original-policy", report.OriginalPolicy),
	); len(errs) > 0 {
		h.logger.Error("CSP report missing required fields", "errors", errs.Error())
		errs.WriteJSON(w)
		return
	}

	clientIP := validate.ClientIP(r)

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
			h.logger.Warn("suspicious CSP report pattern detected", "ip", clientIP)
			validate.WriteJSON(w, http.StatusOK, cspResponse{
				Message: "Report filtered due to suspicious content",
				Status:  "filtered",
				Reason:  "suspicious-pattern",
			})
			return
		}
	}

	// Filter browser extension violations
	if extensionPattern.MatchString(report.SourceFile) || extensionPattern.MatchString(report.BlockedURI) {
		h.logger.Debug("CSP violation from browser extension filtered")
		validate.WriteJSON(w, http.StatusOK, cspResponse{
			Message: "Browser extension violation filtered out",
			Status:  "ignored",
			Reason:  "browser-extension",
		})
		return
	}

	// Filter known false positives
	if report.BlockedURI != "" {
		for _, pattern := range knownFalsePositives {
			if pattern.MatchString(report.BlockedURI) {
				h.logger.Debug("known false positive filtered", "blocked_uri", report.BlockedURI)
				validate.WriteJSON(w, http.StatusOK, cspResponse{
					Message: "Known false positive filtered",
					Status:  "ignored",
					Reason:  "false-positive",
				})
				return
			}
		}
	}

	// Filter localhost inline/eval in development
	if strings.Contains(report.DocumentURI, "localhost") &&
		(report.BlockedURI == "inline" || report.BlockedURI == "eval") {
		h.logger.Debug("localhost inline/eval violation filtered")
		validate.WriteJSON(w, http.StatusOK, cspResponse{
			Message: "Localhost development violation filtered",
			Status:  "ignored",
			Reason:  "localhost-development",
		})
		return
	}

	// Filter bot traffic
	userAgent := r.UserAgent()
	if botPattern.MatchString(userAgent) {
		h.logger.Debug("CSP violation from bot/crawler filtered")
		validate.WriteJSON(w, http.StatusOK, cspResponse{
			Message: "Bot/crawler violation filtered",
			Status:  "ignored",
			Reason:  "bot-traffic",
		})
		return
	}

	// Log the violation with sanitized fields
	violationType := report.ViolatedDirective
	if idx := strings.IndexByte(violationType, ' '); idx > 0 {
		violationType = violationType[:idx]
	}

	h.logger.Error("CSP violation detected",
		"blocked_uri", sanitize(report.BlockedURI, 500),
		"column_number", report.ColumnNumber,
		"document_uri", sanitize(report.DocumentURI, 500),
		"effective_directive", sanitize(report.EffectiveDirective, 100),
		"ip", clientIP,
		"line_number", report.LineNumber,
		"original_policy", sanitize(report.OriginalPolicy, 1200),
		"referrer", sanitize(report.Referrer, 500),
		"script_sample", sanitize(report.ScriptSample, 100),
		"source_file", sanitize(report.SourceFile, 500),
		"status_code", report.StatusCode,
		"timestamp", time.Now().UTC().Format(time.RFC3339),
		"user_agent", sanitize(userAgent, 200),
		"violated_directive", sanitize(report.ViolatedDirective, 100),
	)

	blockedResource := sanitize(report.BlockedURI, 100)
	if blockedResource == "" {
		blockedResource = "inline"
	}
	documentURI := sanitize(report.DocumentURI, 100)
	if documentURI == "" {
		documentURI = "unknown"
	}

	h.logger.Warn("CSP violation summary",
		"type", violationType,
		"blocked", blockedResource,
		"document", documentURI,
	)

	validate.WriteJSON(w, http.StatusOK, cspResponse{
		Message: "CSP violation report received and logged",
		Success: true,
	})
}

// sanitize removes control characters and truncates to maxLen (rune-safe).
func sanitize(s string, maxLen int) string {
	return validate.SanitizeString(s, maxLen)
}
