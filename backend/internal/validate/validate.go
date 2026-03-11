// Package validate provides request validation utilities.
// All external input must be validated before use.
package validate

import (
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"unicode"
	"unicode/utf8"
)

// Error represents a validation failure with a user-safe message.
type Error struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

func (e *Error) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// Errors collects multiple validation errors.
type Errors []Error

func (e Errors) Error() string {
	msgs := make([]string, len(e))
	for i, err := range e {
		msgs[i] = err.Error()
	}
	return strings.Join(msgs, "; ")
}

// WriteJSON writes validation errors as a 400 JSON response.
func (e Errors) WriteJSON(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"error":  "validation_error",
		"errors": e,
	})
}

// RequiredString checks that a string field is non-empty after trimming.
func RequiredString(field, value string) *Error {
	if strings.TrimSpace(value) == "" {
		return &Error{Field: field, Message: "required"}
	}
	return nil
}

// MinLength checks minimum string length (in runes, not bytes).
func MinLength(field, value string, minLen int) *Error {
	if utf8.RuneCountInString(value) < minLen {
		return &Error{Field: field, Message: fmt.Sprintf("must be at least %d characters", minLen)}
	}
	return nil
}

// MaxLength checks maximum string length (in runes).
func MaxLength(field, value string, maxLen int) *Error {
	if utf8.RuneCountInString(value) > maxLen {
		return &Error{Field: field, Message: fmt.Sprintf("must be at most %d characters", maxLen)}
	}
	return nil
}

// IsURL validates that the value is a well-formed HTTP or HTTPS URL.
func IsURL(field, value string) *Error {
	u, err := url.ParseRequestURI(value)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" {
		return &Error{Field: field, Message: "must be a valid HTTP(S) URL"}
	}
	return nil
}

// IsIPFSURL validates that the value is a valid IPFS URL.
func IsIPFSURL(field, value string) *Error {
	u, err := url.Parse(value)
	if err != nil || u.Scheme != "ipfs" {
		return &Error{Field: field, Message: "must be a valid IPFS URL (ipfs://)"}
	}
	return nil
}

// MatchesPattern validates a string against a regex pattern.
func MatchesPattern(field, value string, pattern *regexp.Regexp, hint string) *Error {
	if !pattern.MatchString(value) {
		return &Error{Field: field, Message: hint}
	}
	return nil
}

// SanitizeString removes control characters and trims whitespace.
// This should be applied to any user-provided string before logging or storage.
func SanitizeString(s string, maxLen int) string {
	// Remove control characters except newline and tab
	cleaned := strings.Map(func(r rune) rune {
		if unicode.IsControl(r) && r != '\n' && r != '\t' {
			return -1
		}
		return r
	}, s)

	cleaned = strings.TrimSpace(cleaned)

	if maxLen > 0 && utf8.RuneCountInString(cleaned) > maxLen {
		runes := []rune(cleaned)
		cleaned = string(runes[:maxLen])
	}

	return cleaned
}

// Collect gathers non-nil validation errors into an Errors slice.
func Collect(checks ...*Error) Errors {
	var errs Errors
	for _, e := range checks {
		if e != nil {
			errs = append(errs, *e)
		}
	}
	return errs
}

// ClientIP extracts the client IP from the request, checking
// X-Forwarded-For and X-Real-IP headers for proxy support.
// The extracted value is validated as a real IP address to prevent log injection.
func ClientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ip := xff
		if idx := strings.IndexByte(xff, ','); idx != -1 {
			ip = xff[:idx]
		}
		ip = strings.TrimSpace(ip)
		if parsed := net.ParseIP(ip); parsed != nil {
			return ip
		}
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		xri = strings.TrimSpace(xri)
		if parsed := net.ParseIP(xri); parsed != nil {
			return xri
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// ReadJSONBody decodes a JSON request body with size limits.
// maxBytes <= 0 defaults to 1MB.
func ReadJSONBody(r *http.Request, dst any, maxBytes int64) error {
	if maxBytes <= 0 {
		maxBytes = 1 << 20 // 1MB
	}
	r.Body = http.MaxBytesReader(nil, r.Body, maxBytes)

	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) {
			return fmt.Errorf("request body too large (max %d bytes)", maxBytes)
		}
		return errors.New("invalid request body")
	}

	// Reject multiple JSON values in body
	if dec.More() {
		return fmt.Errorf("request body must contain a single JSON object")
	}

	return nil
}

// WriteJSON writes a JSON response with the given status code.
func WriteJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}
