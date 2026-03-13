package oauth

import (
	"context"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
}

// --- Google handler tests ---

func TestGoogle_MethodNotAllowed(t *testing.T) {
	h := NewGoogleHandler("secret", testLogger())
	mux := http.NewServeMux()
	mux.Handle("POST /api/oauth/google/token", h)

	for _, method := range []string{http.MethodGet, http.MethodPut, http.MethodDelete} {
		req := httptest.NewRequestWithContext(context.Background(), method, "/api/oauth/google/token", nil)
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusMethodNotAllowed {
			t.Errorf("%s: expected 405, got %d", method, rec.Code)
		}
	}
}

func TestGoogle_MissingSecret(t *testing.T) {
	h := NewGoogleHandler("", testLogger())

	body := strings.NewReader(`{"client_id":"id","code":"code","redirect_uri":"https://example.com/callback"}`)
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/oauth/google/token", body)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 for missing secret, got %d", rec.Code)
	}
}

func TestGoogle_InvalidJSON(t *testing.T) {
	h := NewGoogleHandler("secret", testLogger())

	body := strings.NewReader(`{invalid}`)
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/oauth/google/token", body)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid JSON, got %d", rec.Code)
	}
}

func TestGoogle_MissingFields(t *testing.T) {
	h := NewGoogleHandler("secret", testLogger())

	body := strings.NewReader(`{"client_id":"id"}`)
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/oauth/google/token", body)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for missing fields, got %d", rec.Code)
	}
}

func TestGoogle_InvalidRedirectURI(t *testing.T) {
	h := NewGoogleHandler("secret", testLogger())

	body := strings.NewReader(`{"client_id":"id","code":"code","redirect_uri":"not-a-url"}`)
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/oauth/google/token", body)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid redirect_uri, got %d", rec.Code)
	}
}

func TestGoogle_TokenExchange_Success(t *testing.T) {
	// Mock Google's OAuth endpoint
	googleSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("expected POST to Google, got %s", r.Method)
		}
		if ct := r.Header.Get("Content-Type"); ct != "application/x-www-form-urlencoded" {
			t.Errorf("expected form content-type, got %s", ct)
		}
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		if err := r.ParseForm(); err != nil {
			t.Fatalf("failed to parse form: %v", err)
		}
		if got := r.PostFormValue("client_secret"); got != "test-secret" {
			t.Errorf("expected client_secret=test-secret, got %q", got)
		}
		if got := r.PostFormValue("grant_type"); got != "authorization_code" {
			t.Errorf("expected grant_type=authorization_code, got %q", got)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"access_token":"tok","token_type":"Bearer"}`))
	}))
	defer googleSrv.Close()

	h := NewGoogleHandler("test-secret", testLogger())
	// Point the handler at the mock server instead of real Google
	h.httpClient = googleSrv.Client()
	h.tokenURL = googleSrv.URL + "/token"

	body := strings.NewReader(`{"client_id":"cid","code":"authcode","redirect_uri":"https://example.com/callback"}`)
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/oauth/google/token", body)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("expected application/json, got %q", ct)
	}
	if !strings.Contains(rec.Body.String(), "access_token") {
		t.Errorf("expected access_token in response body, got %q", rec.Body.String())
	}
}

// --- Monerium handler tests ---

func TestMonerium_MethodNotAllowed(t *testing.T) {
	h := NewMoneriumHandler("secret", "https://api.monerium.dev", testLogger())
	mux := http.NewServeMux()
	mux.Handle("POST /api/oauth/monerium/token", h)

	for _, method := range []string{http.MethodGet, http.MethodPut, http.MethodDelete} {
		req := httptest.NewRequestWithContext(context.Background(), method, "/api/oauth/monerium/token", nil)
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusMethodNotAllowed {
			t.Errorf("%s: expected 405, got %d", method, rec.Code)
		}
	}
}

func TestMonerium_MissingSecret(t *testing.T) {
	h := NewMoneriumHandler("", "https://api.monerium.dev", testLogger())

	body := strings.NewReader(`{"client_id":"id","code":"code","redirect_uri":"https://example.com/cb","code_verifier":"verifier"}`)
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/oauth/monerium/token", body)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 for missing secret, got %d", rec.Code)
	}
}

func TestMonerium_InvalidJSON(t *testing.T) {
	h := NewMoneriumHandler("secret", "https://api.monerium.dev", testLogger())

	body := strings.NewReader(`{bad}`)
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/oauth/monerium/token", body)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid JSON, got %d", rec.Code)
	}
}

func TestMonerium_MissingFields(t *testing.T) {
	h := NewMoneriumHandler("secret", "https://api.monerium.dev", testLogger())

	body := strings.NewReader(`{"client_id":"id"}`)
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/oauth/monerium/token", body)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for missing fields, got %d", rec.Code)
	}
}

func TestMonerium_InvalidRedirectURI(t *testing.T) {
	h := NewMoneriumHandler("secret", "https://api.monerium.dev", testLogger())

	body := strings.NewReader(`{"client_id":"id","code":"code","redirect_uri":"not-a-url","code_verifier":"` + strings.Repeat("a", 43) + `"}`)
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/oauth/monerium/token", body)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid redirect_uri, got %d", rec.Code)
	}
}

func TestMonerium_CodeVerifierTooShort(t *testing.T) {
	h := NewMoneriumHandler("secret", "https://api.monerium.dev", testLogger())

	// PKCE code_verifier must be at least 43 characters
	body := strings.NewReader(`{"client_id":"id","code":"code","redirect_uri":"https://example.com/cb","code_verifier":"short"}`)
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/oauth/monerium/token", body)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for short code_verifier, got %d", rec.Code)
	}
}

func TestMonerium_TokenExchange_Success(t *testing.T) {
	moneriumSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("expected POST, got %s", r.Method)
		}
		if ct := r.Header.Get("Content-Type"); ct != "application/x-www-form-urlencoded" {
			t.Errorf("expected form content-type, got %s", ct)
		}
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		if err := r.ParseForm(); err != nil {
			t.Fatalf("failed to parse form: %v", err)
		}
		if got := r.PostFormValue("client_secret"); got != "test-secret" {
			t.Errorf("expected client_secret=test-secret, got %q", got)
		}
		if got := r.PostFormValue("code_verifier"); got == "" {
			t.Error("expected code_verifier to be present")
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"access_token":"monerium-tok","token_type":"Bearer"}`))
	}))
	defer moneriumSrv.Close()

	h := NewMoneriumHandler("test-secret", moneriumSrv.URL, testLogger())
	h.httpClient = moneriumSrv.Client()

	verifier := strings.Repeat("a", 43)
	body := strings.NewReader(`{"client_id":"cid","code":"authcode","redirect_uri":"https://example.com/cb","code_verifier":"` + verifier + `"}`)
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/oauth/monerium/token", body)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), "monerium-tok") {
		t.Errorf("expected monerium-tok in response, got %q", rec.Body.String())
	}
}
