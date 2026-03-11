package validate

import (
	"context"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"
)

func TestRequiredString(t *testing.T) {
	tests := []struct {
		name    string
		value   string
		wantErr bool
	}{
		{"non-empty", "hello", false},
		{"empty", "", true},
		{"whitespace only", "   ", true},
		{"tabs only", "\t\t", true},
		{"has content", "  hello  ", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := RequiredString("field", tt.value)
			if (err != nil) != tt.wantErr {
				t.Errorf("RequiredString(%q) error = %v, wantErr %v", tt.value, err, tt.wantErr)
			}
		})
	}
}

func TestMinLength(t *testing.T) {
	tests := []struct {
		name    string
		value   string
		min     int
		wantErr bool
	}{
		{"exact", "abc", 3, false},
		{"longer", "abcd", 3, false},
		{"too short", "ab", 3, true},
		{"empty", "", 1, true},
		{"unicode runes", "héllo", 5, false},
		{"unicode too short", "hé", 3, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := MinLength("field", tt.value, tt.min)
			if (err != nil) != tt.wantErr {
				t.Errorf("MinLength(%q, %d) error = %v, wantErr %v", tt.value, tt.min, err, tt.wantErr)
			}
		})
	}
}

func TestMaxLength(t *testing.T) {
	tests := []struct {
		name    string
		value   string
		max     int
		wantErr bool
	}{
		{"exact", "abc", 3, false},
		{"shorter", "ab", 3, false},
		{"too long", "abcd", 3, true},
		{"empty", "", 3, false},
		{"unicode runes", "hé", 2, false},
		{"unicode over", "héllo", 4, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := MaxLength("field", tt.value, tt.max)
			if (err != nil) != tt.wantErr {
				t.Errorf("MaxLength(%q, %d) error = %v, wantErr %v", tt.value, tt.max, err, tt.wantErr)
			}
		})
	}
}

func TestIsURL(t *testing.T) {
	tests := []struct {
		name    string
		value   string
		wantErr bool
	}{
		{"valid https", "https://example.com", false},
		{"valid http", "http://example.com", false},
		{"with path", "https://example.com/path?q=1", false},
		{"no scheme", "example.com", true},
		{"ftp scheme", "ftp://example.com", true},
		{"empty", "", true},
		{"just scheme", "https://", true},
		{"ipfs scheme", "ipfs://Qm123", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := IsURL("field", tt.value)
			if (err != nil) != tt.wantErr {
				t.Errorf("IsURL(%q) error = %v, wantErr %v", tt.value, err, tt.wantErr)
			}
		})
	}
}

func TestIsIPFSURL(t *testing.T) {
	tests := []struct {
		name    string
		value   string
		wantErr bool
	}{
		{"valid ipfs", "ipfs://QmTest123", false},
		{"https", "https://example.com", true},
		{"empty", "", true},
		{"no scheme", "QmTest123", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := IsIPFSURL("field", tt.value)
			if (err != nil) != tt.wantErr {
				t.Errorf("IsIPFSURL(%q) error = %v, wantErr %v", tt.value, err, tt.wantErr)
			}
		})
	}
}

func TestMatchesPattern(t *testing.T) {
	pattern := regexp.MustCompile(`^[a-z]+$`)

	if err := MatchesPattern("field", "hello", pattern, "lowercase only"); err != nil {
		t.Errorf("expected nil error for matching input, got %v", err)
	}
	if err := MatchesPattern("field", "Hello123", pattern, "lowercase only"); err == nil {
		t.Error("expected error for non-matching input")
	}
}

func TestSanitizeString(t *testing.T) {
	tests := []struct {
		name   string
		input  string
		maxLen int
		want   string
	}{
		{"no change", "hello", 100, "hello"},
		{"trim whitespace", "  hello  ", 100, "hello"},
		{"remove control chars", "he\x00ll\x01o", 100, "hello"},
		{"preserve newline", "hello\nworld", 100, "hello\nworld"},
		{"preserve tab", "hello\tworld", 100, "hello\tworld"},
		{"truncate", "hello world", 5, "hello"},
		{"unicode truncate", "héllo", 3, "hél"},
		{"zero maxLen", "hello", 0, "hello"},
		{"empty", "", 10, ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := SanitizeString(tt.input, tt.maxLen)
			if got != tt.want {
				t.Errorf("SanitizeString(%q, %d) = %q, want %q", tt.input, tt.maxLen, got, tt.want)
			}
		})
	}
}

func TestCollect(t *testing.T) {
	// All nil — no errors
	errs := Collect(nil, nil, nil)
	if len(errs) != 0 {
		t.Errorf("expected 0 errors, got %d", len(errs))
	}

	// Mixed nil and errors
	errs = Collect(
		RequiredString("name", ""),
		RequiredString("email", "test@example.com"),
		RequiredString("phone", ""),
	)
	if len(errs) != 2 {
		t.Errorf("expected 2 errors, got %d", len(errs))
	}
}

func TestErrors_Error(t *testing.T) {
	errs := Errors{
		{Field: "name", Message: "required"},
		{Field: "email", Message: "invalid"},
	}
	got := errs.Error()
	if !strings.Contains(got, "name: required") || !strings.Contains(got, "email: invalid") {
		t.Errorf("unexpected error string: %s", got)
	}
}

func TestErrors_WriteJSON(t *testing.T) {
	errs := Errors{{Field: "name", Message: "required"}}
	rec := httptest.NewRecorder()
	errs.WriteJSON(rec)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("expected application/json, got %s", ct)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "validation_error") {
		t.Errorf("expected validation_error in body, got: %s", body)
	}
}

func TestReadJSONBody(t *testing.T) {
	type payload struct {
		Name string `json:"name"`
	}

	t.Run("valid JSON", func(t *testing.T) {
		body := strings.NewReader(`{"name":"test"}`)
		req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/", body)
		var p payload
		if err := ReadJSONBody(req, &p, 1024); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if p.Name != "test" {
			t.Errorf("expected name=test, got %s", p.Name)
		}
	})

	t.Run("invalid JSON", func(t *testing.T) {
		body := strings.NewReader(`{invalid}`)
		req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/", body)
		var p payload
		err := ReadJSONBody(req, &p, 1024)
		if err == nil {
			t.Fatal("expected error for invalid JSON")
		}
		if !strings.Contains(err.Error(), "invalid request body") {
			t.Errorf("expected 'invalid request body' error, got: %v", err)
		}
	})

	t.Run("too large", func(t *testing.T) {
		body := strings.NewReader(`{"name":"` + strings.Repeat("x", 1000) + `"}`)
		req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/", body)
		var p payload
		err := ReadJSONBody(req, &p, 50)
		if err == nil {
			t.Fatal("expected error for oversized body")
		}
		if !strings.Contains(err.Error(), "too large") {
			t.Errorf("expected 'too large' error, got: %v", err)
		}
	})

	t.Run("multiple JSON objects", func(t *testing.T) {
		body := strings.NewReader(`{"name":"a"}{"name":"b"}`)
		req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/", body)
		var p payload
		err := ReadJSONBody(req, &p, 1024)
		if err == nil {
			t.Fatal("expected error for multiple JSON objects")
		}
		if !strings.Contains(err.Error(), "single JSON object") {
			t.Errorf("expected 'single JSON object' error, got: %v", err)
		}
	})

	t.Run("unknown fields rejected", func(t *testing.T) {
		body := strings.NewReader(`{"name":"test","unknown":"field"}`)
		req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/", body)
		var p payload
		err := ReadJSONBody(req, &p, 1024)
		if err == nil {
			t.Fatal("expected error for unknown fields")
		}
	})

	t.Run("default maxBytes", func(t *testing.T) {
		body := strings.NewReader(`{"name":"test"}`)
		req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/", body)
		var p payload
		if err := ReadJSONBody(req, &p, 0); err != nil {
			t.Fatalf("unexpected error with default max: %v", err)
		}
	})
}
