package paymentlog

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
	"time"
)

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
}

func validEvent() event {
	return event{
		PaymentMethod: "card",
		Event:         "braintree_init_failed",
		ErrorMessage:  "Client initialization failed",
		Timestamp:     time.Now().UnixMilli(),
	}
}

func makeRequest(t *testing.T, ev event) *http.Request {
	t.Helper()
	body, err := json.Marshal(ev)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/logging/payment", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	return req
}

func TestHandler_ValidEvent(t *testing.T) {
	h := NewHandler(testLogger())
	ev := validEvent()
	req := makeRequest(t, ev)

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Errorf("expected 204, got %d: %s", w.Code, w.Body.String())
	}
}

func TestHandler_ValidEventWithOptionalFields(t *testing.T) {
	h := NewHandler(testLogger())
	planID := 42
	ev := validEvent()
	ev.ErrorCode = "500"
	ev.PlanID = &planID
	ev.Step = "submit"

	req := makeRequest(t, ev)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Errorf("expected 204, got %d: %s", w.Code, w.Body.String())
	}
}

func TestHandler_AllPaymentMethods(t *testing.T) {
	h := NewHandler(testLogger())

	methods := map[string]string{
		"card":   "braintree_init_failed",
		"paypal": "paypal_sdk_init_failed",
		"crypto": "crypto_tx_failed",
	}

	for method, evt := range methods {
		t.Run(method, func(t *testing.T) {
			ev := validEvent()
			ev.PaymentMethod = method
			ev.Event = evt

			req := makeRequest(t, ev)
			w := httptest.NewRecorder()
			h.ServeHTTP(w, req)

			if w.Code != http.StatusNoContent {
				t.Errorf("expected 204 for %s, got %d", method, w.Code)
			}
		})
	}
}

func TestHandler_UnknownPaymentMethod(t *testing.T) {
	h := NewHandler(testLogger())
	ev := validEvent()
	ev.PaymentMethod = "bitcoin"

	req := makeRequest(t, ev)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestHandler_UnknownEvent(t *testing.T) {
	h := NewHandler(testLogger())
	ev := validEvent()
	ev.Event = "custom_event"

	req := makeRequest(t, ev)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestHandler_UnknownStep(t *testing.T) {
	h := NewHandler(testLogger())
	ev := validEvent()
	ev.Step = "finalize"

	req := makeRequest(t, ev)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestHandler_EmptyErrorMessage(t *testing.T) {
	h := NewHandler(testLogger())
	ev := validEvent()
	ev.ErrorMessage = ""

	req := makeRequest(t, ev)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestHandler_MissingTimestamp(t *testing.T) {
	h := NewHandler(testLogger())
	ev := validEvent()
	ev.Timestamp = 0

	req := makeRequest(t, ev)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestHandler_TimestampTooFarInFuture(t *testing.T) {
	h := NewHandler(testLogger())
	ev := validEvent()
	ev.Timestamp = time.Now().Add(10 * time.Minute).UnixMilli()

	req := makeRequest(t, ev)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestHandler_TimestampTooOld(t *testing.T) {
	h := NewHandler(testLogger())
	ev := validEvent()
	ev.Timestamp = time.Now().Add(-2 * time.Hour).UnixMilli()

	req := makeRequest(t, ev)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestHandler_WrongContentType(t *testing.T) {
	h := NewHandler(testLogger())
	ev := validEvent()
	body, _ := json.Marshal(ev)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/logging/payment", bytes.NewReader(body))
	req.Header.Set("Content-Type", "text/plain")

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusUnsupportedMediaType {
		t.Errorf("expected 415, got %d", w.Code)
	}
}

func TestHandler_ContentTypeWithCharset(t *testing.T) {
	h := NewHandler(testLogger())
	ev := validEvent()
	body, _ := json.Marshal(ev)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/logging/payment", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json; charset=utf-8")

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Errorf("expected 204 for charset variant, got %d", w.Code)
	}
}

func TestHandler_BodyTooLarge(t *testing.T) {
	h := NewHandler(testLogger())
	largeBody := make([]byte, maxBodySize+100)
	for i := range largeBody {
		largeBody[i] = 'a'
	}

	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/logging/payment", bytes.NewReader(largeBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestHandler_InvalidJSON(t *testing.T) {
	h := NewHandler(testLogger())
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/logging/payment", strings.NewReader("{not json"))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestHandler_UnknownFieldsRejected(t *testing.T) {
	h := NewHandler(testLogger())
	body := `{"payment_method":"card","event":"braintree_init_failed","error_message":"test","timestamp":` +
		strings.TrimRight(strings.TrimLeft(json.Number(time.Now().Format("20060102150405")).String(), "\""), "\"") +
		`,"extra_field":"evil"}`

	// Build proper JSON with current timestamp
	ev := map[string]any{
		"payment_method": "card",
		"event":          "braintree_init_failed",
		"error_message":  "test",
		"timestamp":      time.Now().UnixMilli(),
		"extra_field":    "should be rejected",
	}
	data, _ := json.Marshal(ev)
	_ = body // unused, using data instead

	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/logging/payment", bytes.NewReader(data))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for unknown fields, got %d", w.Code)
	}
}

func TestHandler_ErrorMessageSanitized(t *testing.T) {
	// This test verifies the handler doesn't crash with control characters.
	// Actual sanitization is tested in validate package.
	h := NewHandler(testLogger())
	ev := validEvent()
	ev.ErrorMessage = "error\x00with\nnewlines\rand\ttabs"

	req := makeRequest(t, ev)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Errorf("expected 204, got %d", w.Code)
	}
}

func TestHandler_AllEvents(t *testing.T) {
	h := NewHandler(testLogger())

	for evt := range allowedEvents {
		t.Run(evt, func(t *testing.T) {
			ev := validEvent()
			ev.Event = evt

			req := makeRequest(t, ev)
			w := httptest.NewRecorder()
			h.ServeHTTP(w, req)

			if w.Code != http.StatusNoContent {
				t.Errorf("expected 204 for event %s, got %d", evt, w.Code)
			}
		})
	}
}

func TestHandler_AllSteps(t *testing.T) {
	h := NewHandler(testLogger())

	for step := range allowedSteps {
		t.Run(step, func(t *testing.T) {
			ev := validEvent()
			ev.Step = step

			req := makeRequest(t, ev)
			w := httptest.NewRecorder()
			h.ServeHTTP(w, req)

			if w.Code != http.StatusNoContent {
				t.Errorf("expected 204 for step %s, got %d", step, w.Code)
			}
		})
	}
}
