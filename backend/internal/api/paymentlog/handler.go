// Package paymentlog handles frontend payment error event logging.
// Events are logged as structured JSON for Grafana/Loki ingestion.
// No PII is collected — no IPs, no user/session identifiers.
package paymentlog

import (
	"log/slog"
	"mime"
	"net/http"
	"time"

	"github.com/rotki/rotki.com/backend/internal/validate"
)

const maxBodySize = 4096 // 4 KB

// Allowed payment methods.
var allowedMethods = map[string]bool{
	"card":   true,
	"paypal": true,
	"crypto": true,
}

// Allowed event names.
var allowedEvents = map[string]bool{
	"braintree_init_failed":      true,
	"3ds_verification_failed":    true,
	"3ds_liability_shift_failed": true,
	"card_payment_api_error":     true,
	"paypal_sdk_init_failed":     true,
	"paypal_payment_error":       true,
	"paypal_submit_error":        true,
	"crypto_wrong_chain":         true,
	"crypto_tx_failed":           true,
	"crypto_payment_api_error":   true,
	"checkout_error":             true,
}

// Allowed step values.
var allowedSteps = map[string]bool{
	"init":     true,
	"verify":   true,
	"submit":   true,
	"callback": true,
}

// event is the request body for a payment error event.
type event struct {
	PaymentMethod string `json:"payment_method"`
	Event         string `json:"event"`
	ErrorMessage  string `json:"error_message"`
	ErrorCode     string `json:"error_code,omitempty"`
	PlanID        *int   `json:"plan_id,omitempty"`
	Step          string `json:"step,omitempty"`
	Timestamp     int64  `json:"timestamp"`
}

// Handler logs frontend payment error events.
type Handler struct {
	logger *slog.Logger
}

// NewHandler creates a new payment logging handler.
func NewHandler(logger *slog.Logger) *Handler {
	return &Handler{
		logger: logger.With("handler", "paymentlog"),
	}
}

// ServeHTTP handles POST /api/logging/payment.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Enforce Content-Type (accept "application/json" with optional params like charset)
	mediaType, _, _ := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if mediaType != "application/json" {
		http.Error(w, "unsupported content type", http.StatusUnsupportedMediaType)
		return
	}

	// Read and parse body
	var ev event
	if err := validate.ReadJSONBody(r, &ev, maxBodySize); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	// Validate — generic 400 for all failures (avoids allowlist enumeration)
	if !h.isValid(&ev) {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	// Sanitize free-text fields
	ev.ErrorMessage = validate.SanitizeString(ev.ErrorMessage, 500)
	ev.ErrorCode = validate.SanitizeString(ev.ErrorCode, 32)

	// Log as structured event
	attrs := []any{
		"payment_method", ev.PaymentMethod,
		"event", ev.Event,
		"error_message", ev.ErrorMessage,
		"timestamp", ev.Timestamp,
	}
	if ev.ErrorCode != "" {
		attrs = append(attrs, "error_code", ev.ErrorCode)
	}
	if ev.PlanID != nil {
		attrs = append(attrs, "plan_id", *ev.PlanID)
	}
	if ev.Step != "" {
		attrs = append(attrs, "step", ev.Step)
	}

	h.logger.Info("payment_event", attrs...)

	w.WriteHeader(http.StatusNoContent)
}

// isValid checks all fields against allowlists and constraints.
func (h *Handler) isValid(ev *event) bool {
	if !allowedMethods[ev.PaymentMethod] {
		return false
	}
	if !allowedEvents[ev.Event] {
		return false
	}
	if ev.ErrorMessage == "" {
		return false
	}
	if ev.Step != "" && !allowedSteps[ev.Step] {
		return false
	}
	if ev.Timestamp == 0 {
		return false
	}

	// Timestamp must be within reasonable range: not >5min in future, not >1hr in past
	now := time.Now().UnixMilli()
	fiveMinFuture := now + 5*60*1000
	oneHourPast := now - 60*60*1000

	if ev.Timestamp > fiveMinFuture || ev.Timestamp < oneHourPast {
		return false
	}

	return true
}
