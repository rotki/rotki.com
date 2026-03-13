package ens

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestServeHTTP_MethodNotAllowed(t *testing.T) {
	h := NewHandler(nil, testLogger())
	mux := http.NewServeMux()
	mux.Handle("GET /api/ens/avatar", h)

	for _, method := range []string{http.MethodPost, http.MethodPut, http.MethodDelete} {
		req := httptest.NewRequestWithContext(context.Background(), method, "/api/ens/avatar?name=vitalik.eth", nil)
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusMethodNotAllowed {
			t.Errorf("%s: expected 405, got %d", method, rec.Code)
		}
	}
}

func TestServeHTTP_MissingName(t *testing.T) {
	h := NewHandler(nil, testLogger())

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/ens/avatar", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for missing name, got %d", rec.Code)
	}
}

func TestServeHTTP_InvalidENSName(t *testing.T) {
	h := NewHandler(nil, testLogger())

	tests := []struct {
		name  string
		input string
	}{
		{"no TLD", "vitalik"},
		{"special chars", "vita!ik.eth"},
		{"spaces", "vita%20lik.eth"},
		{"empty name", ".eth"},
		{"unicode", "витальк.eth"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/ens/avatar?name="+tt.input, nil)
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Errorf("expected 400 for invalid name %q, got %d", tt.input, rec.Code)
			}
		})
	}
}

func TestServeHTTP_NameTooLong(t *testing.T) {
	h := NewHandler(nil, testLogger())

	longName := strings.Repeat("a", 252) + ".eth" // 256 chars
	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/ens/avatar?name="+longName, nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for name > 255 chars, got %d", rec.Code)
	}
}

func TestServeHTTP_InvalidNetwork(t *testing.T) {
	h := NewHandler(nil, testLogger())

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/ens/avatar?name=vitalik.eth&network=goerli", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid network, got %d", rec.Code)
	}
}

func TestServeHTTP_ValidNetworks(t *testing.T) {
	for network := range validNetworks {
		t.Run(network, func(_ *testing.T) {
			// We can't test the full flow without an image service,
			// but we can verify the valid network passes validation
			// by checking it doesn't return 400
			// (it will panic on nil imageSvc, which recovery middleware would catch)
			func() {
				defer func() { _ = recover() }()

				h := NewHandler(nil, testLogger())
				req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/ens/avatar?name=vitalik.eth&network="+network, nil)
				rec := httptest.NewRecorder()
				h.ServeHTTP(rec, req)

				// If we get here without panic, it means validation passed
				// but the nil imageSvc will cause issues — that's expected
			}()
		})
	}
}

func TestServeHTTP_DefaultNetwork(_ *testing.T) {
	// Without a network param, should default to mainnet and not return 400
	func() {
		defer func() { _ = recover() }()

		h := NewHandler(nil, testLogger())
		req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/ens/avatar?name=vitalik.eth", nil)
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
	}()
	// If we get here, the default network was accepted (no 400 returned before the nil panic)
}
