package csp

import "strings"

// RouteOverride holds per-route CSP and additional header overrides.
type RouteOverride struct {
	CSP     Policy
	Headers map[string]string // additional headers (COOP, COEP, CORP, etc.)
}

// routeOverrides maps URL path prefixes to their CSP overrides.
// Order matters: more specific paths must be checked before less specific ones.
var routeOverrides = []struct {
	Path     string
	Override RouteOverride
}{
	{"/home/saved-cards", RouteOverride{
		CSP: SavedCardsCSP,
		Headers: map[string]string{
			"Cross-Origin-Embedder-Policy": "unsafe-none",
			"Cross-Origin-Resource-Policy": "cross-origin",
		},
	}},
	{"/checkout/pay/card", RouteOverride{
		CSP: CardPaymentMerged,
		Headers: map[string]string{
			"Cross-Origin-Opener-Policy":   "same-origin",
			"Cross-Origin-Embedder-Policy": "unsafe-none",
			"Cross-Origin-Resource-Policy": "cross-origin",
		},
	}},
	{"/checkout/pay/3d-secure", RouteOverride{
		CSP: ThreeDSecurePageCSP,
		Headers: map[string]string{
			"Cross-Origin-Embedder-Policy": "unsafe-none",
			"Cross-Origin-Resource-Policy": "cross-origin",
		},
	}},
	{"/checkout/pay/crypto", RouteOverride{
		CSP: CryptoPayCSP,
		Headers: map[string]string{
			"Cross-Origin-Opener-Policy": "unsafe-none",
		},
	}},
	{"/checkout/pay/method", RouteOverride{
		CSP: PaymentMethodCSP,
	}},
	{"/checkout/pay/paypal", RouteOverride{
		CSP: PaypalPayCSP,
		Headers: map[string]string{
			"Cross-Origin-Opener-Policy":   "same-origin-allow-popups",
			"Cross-Origin-Embedder-Policy": "unsafe-none",
			"Cross-Origin-Resource-Policy": "cross-origin",
		},
	}},
	{"/checkout/pay/request-crypto", RouteOverride{
		CSP: RequestCryptoCSP,
		Headers: map[string]string{
			"Cross-Origin-Opener-Policy": "unsafe-none",
		},
	}},
	{"/checkout/pay", RouteOverride{
		CSP: CheckoutPayCSP,
	}},
	{"/password/recover", RouteOverride{
		CSP: PasswordRecoverCSP,
	}},
	{"/signup", RouteOverride{
		CSP: SignupCSP,
	}},
	{"/sponsor/", RouteOverride{
		CSP: SponsorCSP,
		Headers: map[string]string{
			"Cross-Origin-Opener-Policy": "unsafe-none",
		},
	}},
	{"/sponsor", RouteOverride{
		CSP: SponsorCSP,
		Headers: map[string]string{
			"Cross-Origin-Opener-Policy": "unsafe-none",
		},
	}},
}

// ForRoute returns the CSP override for the given URL path, or nil for the default.
func ForRoute(urlPath string) *RouteOverride {
	for i := range routeOverrides {
		entry := &routeOverrides[i]
		if urlPath == entry.Path || strings.HasPrefix(urlPath, entry.Path+"/") || (strings.HasPrefix(urlPath, entry.Path) && entry.Path[len(entry.Path)-1] == '/') {
			return &entry.Override
		}
	}
	return nil
}
