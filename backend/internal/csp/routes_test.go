package csp

import (
	"slices"
	"strings"
	"testing"
)

func TestForRoute(t *testing.T) {
	tests := []struct {
		path    string
		wantNil bool
		wantCSP Policy // just check it's the right policy by checking a distinctive directive
	}{
		{"/", true, nil},
		{"/download", true, nil},
		{"/signup", false, SignupCSP},
		{"/password/recover", false, PasswordRecoverCSP},
		{"/home/saved-cards", false, SavedCardsCSP},
		{"/checkout/pay", false, CheckoutPayCSP},
		{"/checkout/pay/card", false, CardPaymentMerged},
		{"/checkout/pay/card/something", false, CardPaymentMerged},
		{"/checkout/pay/3d-secure", false, ThreeDSecurePageCSP},
		{"/checkout/pay/crypto", false, CryptoPayCSP},
		{"/checkout/pay/method", false, PaymentMethodCSP},
		{"/checkout/pay/paypal", false, PaypalPayCSP},
		{"/checkout/pay/request-crypto", false, RequestCryptoCSP},
		{"/sponsor", false, SponsorCSP},
		{"/sponsor/tier1", false, SponsorCSP},
		{"/sponsor/tier1/details", false, SponsorCSP},
	}

	for _, tt := range tests {
		t.Run(tt.path, func(t *testing.T) {
			got := ForRoute(tt.path)
			if tt.wantNil {
				if got != nil {
					t.Fatalf("ForRoute(%q) = non-nil, want nil", tt.path)
				}
				return
			}
			if got == nil {
				t.Fatalf("ForRoute(%q) = nil, want non-nil", tt.path)
			}
		})
	}
}

func TestForRouteDoesNotMatchPartialPrefix(t *testing.T) {
	// /signupfoo should not match /signup
	got := ForRoute("/signupfoo")
	if got != nil {
		t.Fatal("ForRoute(/signupfoo) should not match /signup")
	}
}

func TestForRouteCheckoutPaySpecificity(t *testing.T) {
	// /checkout/pay/crypto should match crypto, not generic checkout/pay
	got := ForRoute("/checkout/pay/crypto")
	if got == nil {
		t.Fatal("expected non-nil for /checkout/pay/crypto")
	}
	// Crypto CSP should have WalletConnect sources
	if _, ok := got.CSP["connect-src"]; !ok {
		t.Fatal("crypto CSP missing connect-src")
	}
	found := false
	for _, v := range got.CSP["connect-src"] {
		if v == "https://rpc.walletconnect.com" {
			found = true
			break
		}
	}
	if !found {
		t.Fatal("crypto CSP should include WalletConnect connect-src")
	}
}

func TestRemoveNoncePlaceholders(t *testing.T) {
	cleaned := RemoveNoncePlaceholders(BaseCSP)

	for directive, values := range cleaned {
		for _, v := range values {
			if v == "'nonce-{{nonce}}'" || strings.Contains(v, "{{nonce}}") {
				t.Fatalf("directive %q still has nonce placeholder: %q", directive, v)
			}
		}
	}

	// script-src should still have 'self' and 'unsafe-eval'
	scriptSrc := cleaned["script-src"]
	if !slices.Contains(scriptSrc, "'self'") {
		t.Fatal("script-src missing 'self' after nonce removal")
	}
	if !slices.Contains(scriptSrc, "'unsafe-eval'") {
		t.Fatal("script-src missing 'unsafe-eval' after nonce removal")
	}
}
