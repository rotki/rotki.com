package csp

import (
	"slices"
	"strings"
	"testing"
)

func TestGenerateNonce(t *testing.T) {
	n1 := GenerateNonce()
	n2 := GenerateNonce()

	if n1 == "" {
		t.Fatal("nonce should not be empty")
	}
	if n1 == n2 {
		t.Fatal("consecutive nonces should differ")
	}
	// base64 of 18 bytes = 24 chars
	if len(n1) != 24 {
		t.Fatalf("expected nonce length 24, got %d", len(n1))
	}
}

func TestMerge(t *testing.T) {
	a := Policy{
		"default-src": {"'self'"},
		"script-src":  {"'self'"},
		"child-src":   {"'none'"},
	}
	b := Policy{
		"script-src": {"cdn.example.com"},
		"child-src":  {"assets.example.com"},
		"img-src":    {"data:"},
	}

	merged := Merge(a, b)

	// script-src should combine
	if got := merged["script-src"]; len(got) != 2 || got[0] != "'self'" || got[1] != "cdn.example.com" {
		t.Fatalf("script-src = %v, want ['self' cdn.example.com]", got)
	}
	// child-src: 'none' should be removed since assets.example.com is also present
	if got := merged["child-src"]; len(got) != 1 || got[0] != "assets.example.com" {
		t.Fatalf("child-src = %v, want [assets.example.com]", got)
	}
	// img-src from b only
	if got := merged["img-src"]; len(got) != 1 || got[0] != "data:" {
		t.Fatalf("img-src = %v, want [data:]", got)
	}
	// default-src from a only
	if got := merged["default-src"]; len(got) != 1 || got[0] != "'self'" {
		t.Fatalf("default-src = %v, want ['self']", got)
	}
}

func TestMergeDeduplicates(t *testing.T) {
	a := Policy{"script-src": {"'self'", "cdn.example.com"}}
	b := Policy{"script-src": {"'self'", "other.example.com"}}

	merged := Merge(a, b)

	if got := merged["script-src"]; len(got) != 3 {
		t.Fatalf("script-src length = %d, want 3, values = %v", len(got), got)
	}
}

func TestPolicyString(t *testing.T) {
	p := Policy{
		"default-src": {"'self'"},
		"script-src":  {"'self'", "'nonce-{{nonce}}'"},
	}

	result := p.String("abc123")

	if !strings.Contains(result, "default-src 'self';") {
		t.Fatalf("missing default-src in %q", result)
	}
	if !strings.Contains(result, "'nonce-abc123'") {
		t.Fatalf("nonce not replaced in %q", result)
	}
	if strings.Contains(result, "{{nonce}}") {
		t.Fatalf("unreplaced nonce placeholder in %q", result)
	}
}

func TestPolicyStringUpgradeInsecureRequests(t *testing.T) {
	p := Policy{
		"upgrade-insecure-requests": {},
		"default-src":               {"'self'"},
	}

	result := p.String("")
	if !strings.Contains(result, "upgrade-insecure-requests;") {
		t.Fatalf("missing upgrade-insecure-requests in %q", result)
	}
}

func TestCardPaymentMergedNotEmpty(t *testing.T) {
	if len(CardPaymentMerged) == 0 {
		t.Fatal("CardPaymentMerged should not be empty")
	}
	// Should contain directives from all three policies
	if _, ok := CardPaymentMerged["default-src"]; !ok {
		t.Fatal("missing default-src from BaseCSP")
	}
	if _, ok := CardPaymentMerged["child-src"]; !ok {
		t.Fatal("missing child-src from BraintreeBaseCSP")
	}
	// img-src should include cardPayment sources
	imgSrc := CardPaymentMerged["img-src"]
	if !slices.Contains(imgSrc, "rotki.com") {
		t.Fatalf("img-src missing rotki.com: %v", imgSrc)
	}
	if !slices.Contains(imgSrc, "localhost") {
		t.Fatalf("img-src missing localhost: %v", imgSrc)
	}
}
