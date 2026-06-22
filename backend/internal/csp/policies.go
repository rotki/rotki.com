package csp

import "strings"

// BaseCSP applies to all pages.
var BaseCSP = Policy{
	"base-uri":    {"'self'"},
	"child-src":   {"'none'"},
	"default-src": {"'self'"},
	"connect-src": {
		"'self'",
		"api.github.com",
		"raw.githubusercontent.com/rotki/data/",
		"raw.githubusercontent.com/rotki/rotki.com/",
		"sigil.rotki.com",
	},
	"font-src":        {"'self'", "data:", "fonts.gstatic.com"},
	"form-action":     {"'self'"},
	"frame-ancestors": {"'self'"},
	"frame-src":       {"'none'"},
	"img-src":         {"'self'", "data:", "https://raw.githubusercontent.com/rotki/data/", "https://raw.githubusercontent.com/rotki/rotki/"},
	"object-src":      {"'none'"},
	"report-uri":      {"/api/csp/violation"},
	"report-to":       {"csp-endpoint"},
	"script-src":      {"'self'", "'unsafe-eval'", "'nonce-{{nonce}}'", "sigil.rotki.com"},
	"script-src-elem": {"'self'", "'nonce-{{nonce}}'", "sigil.rotki.com"},
	"style-src":       {"'self'", "'unsafe-inline'", "fonts.googleapis.com"},
	"worker-src":      {"'self'"},
}

// RecaptchaCSP covers signup/password pages.
var RecaptchaCSP = Policy{
	"connect-src": {"www.google.com/recaptcha/"},
	"frame-src": {
		"*.recaptcha.net",
		"recaptcha.net",
		"https://www.google.com/recaptcha/",
		"https://recaptcha.google.com",
	},
	"img-src": {"www.gstatic.com/recaptcha"},
	"script-src": {
		"www.recaptcha.net",
		"recaptcha.net",
		"www.gstatic.com/recaptcha/",
		"www.gstatic.cn/recaptcha/",
		"www.google.com/recaptcha/",
	},
	"script-src-elem": {
		"www.recaptcha.net",
		"recaptcha.net",
		"www.gstatic.com/recaptcha/",
		"www.gstatic.cn/recaptcha/",
		"www.google.com/recaptcha/",
	},
	"worker-src": {"www.recaptcha.net"},
}

// WalletConnectCSP covers Web3 wallet pages.
var WalletConnectCSP = Policy{
	"connect-src": {
		"https://rpc.walletconnect.com",
		"https://rpc.walletconnect.org",
		"https://relay.walletconnect.com",
		"https://relay.walletconnect.org",
		"wss://relay.walletconnect.com",
		"wss://relay.walletconnect.org",
		"https://pulse.walletconnect.com",
		"https://pulse.walletconnect.org",
		"https://api.web3modal.com",
		"https://api.web3modal.org",
		"https://keys.walletconnect.com",
		"https://keys.walletconnect.org",
		"https://notify.walletconnect.com",
		"https://notify.walletconnect.org",
		"https://echo.walletconnect.com",
		"https://echo.walletconnect.org",
		"https://push.walletconnect.com",
		"https://push.walletconnect.org",
		// Verify API attestation fetched during connect() (also framed via frame-src);
		// without these the fetch is CSP-blocked and the dApp-verification step fails.
		"https://verify.walletconnect.com",
		"https://verify.walletconnect.org",
		// Coinbase Wallet SDK: WalletLink relay handshake, RPC proxy and metrics.
		"wss://www.walletlink.org",
		"https://www.walletlink.org",
		"https://chain-proxy.wallet.coinbase.com",
		"https://cca-lite.coinbase.com",
		// Direct JSON-RPC endpoints hit by viem transports after the AppKit→viem
		// migration: reads (balances / allowance / tier supplies) and receipt
		// polling now go straight to these public RPCs instead of via AppKit.
		// MUST stay in sync with the rpcUrls in app/modules/web3/core/chains.ts —
		// a host missing here is blocked by CSP and the read silently returns empty.
		// Production: Ethereum
		"https://eth.merkle.io",
		"https://eth.llamarpc.com",
		"https://ethereum-rpc.publicnode.com",
		"https://rpc.mevblocker.io",
		// Production: Arbitrum One
		"https://arbitrum-one-rpc.publicnode.com",
		"https://arbitrum.llamarpc.com",
		// Production: Base
		"https://base-rpc.publicnode.com",
		"https://base.llamarpc.com",
		// Production: OP Mainnet
		"https://optimism-rpc.publicnode.com",
		"https://optimism.llamarpc.com",
		// Production: Gnosis
		"https://gnosis-rpc.publicnode.com",
		"https://rpc.gnosischain.com",
		// Testnets: Ethereum / Arbitrum / Base / Optimism Sepolia
		"https://sepolia.gateway.tenderly.co",
		"https://sepolia.drpc.org",
		"https://ethereum-sepolia-rpc.publicnode.com",
		"https://arbitrum-sepolia-rpc.publicnode.com",
		"https://sepolia-rollup.arbitrum.io",
		"https://base-sepolia-rpc.publicnode.com",
		"https://sepolia.base.org",
		"https://optimism-sepolia-rpc.publicnode.com",
		"https://sepolia.optimism.io",
	},
	"frame-src": {
		"https://verify.walletconnect.com",
		"https://verify.walletconnect.org",
		"https://secure.walletconnect.com",
		"https://secure.walletconnect.org",
		// Coinbase WalletLink relay iframe (mobile pairing).
		"https://www.walletlink.org",
	},
	"img-src": {
		"'unsafe-inline'",
		"blob:",
		"https://walletconnect.org",
		"https://walletconnect.com",
		"https://secure.walletconnect.com",
		"https://secure.walletconnect.org",
		"https://tokens-data.1inch.io",
		"https://tokens.1inch.io",
		"https://ipfs.io",
	},
	"script-src": {
		"chrome-extension:",
		"moz-extension:",
		"safari-web-extension:",
		"edge-extension:",
		"'unsafe-inline'",
	},
	"script-src-elem": {
		"chrome-extension:",
		"moz-extension:",
		"safari-web-extension:",
		"edge-extension:",
		"'unsafe-inline'",
	},
}

// BraintreeBaseCSP covers all Braintree payment pages.
var BraintreeBaseCSP = Policy{
	"child-src": {"assets.braintreegateway.com"},
	"connect-src": {
		"api.sandbox.braintreegateway.com",
		"api.braintreegateway.com",
		"client-analytics.sandbox.braintreegateway.com",
		"client-analytics.braintreegateway.com",
		"*.braintree-api.com",
		"www.paypal.com/xoplatform/logger/api/logger",
	},
	"frame-src":       {"assets.braintreegateway.com"},
	"img-src":         {"assets.braintreegateway.com"},
	"script-src":      {"js.braintreegateway.com", "assets.braintreegateway.com"},
	"script-src-elem": {"js.braintreegateway.com", "assets.braintreegateway.com"},
}

// PaypalCSP adds PayPal-specific sources.
var PaypalCSP = Policy{
	"child-src":       {"*.paypal.com"},
	"connect-src":     {"*.paypal.com"},
	"frame-src":       {"*.paypal.com"},
	"img-src":         {"checkout.paypal.com", "www.paypalobjects.com"},
	"script-src":      {"*.paypal.com", "www.paypalobjects.com", "'unsafe-inline'"},
	"script-src-elem": {"*.paypal.com", "www.paypalobjects.com", "'unsafe-inline'"},
}

// ThreeDSecureCSP covers 3D Secure verification pages.
// Uses wildcard (*) because 3DS flows redirect to issuing bank domains that
// vary per card issuer and cannot be enumerated. Banks load their own scripts,
// open iframes, and submit forms to arbitrary endpoints during verification.
// This is an inherent limitation of the 3DS protocol — the payment page must
// allow any origin to complete the bank's authentication challenge.
var ThreeDSecureCSP = Policy{
	"connect-src":     {"*"},
	"form-action":     {"'self'", "*"},
	"frame-src":       {"*"},
	"script-src":      {"*"},
	"script-src-elem": {"*"},
}

// CardPaymentCSP adds card-payment-specific sources.
var CardPaymentCSP = Policy{
	"img-src": {"rotki.com", "localhost"},
}

// RemoveNoncePlaceholders returns a copy of the policy with nonce-related
// values removed from all directives. Used for routes that need unsafe-inline
// (nonce and unsafe-inline are mutually exclusive in CSP).
func RemoveNoncePlaceholders(p Policy) Policy {
	cleaned := Policy{}
	for directive, values := range p {
		var filtered []string
		for _, v := range values {
			if v != "'nonce-{{nonce}}'" && !strings.Contains(v, "nonce-") && !strings.Contains(v, "{{nonce}}") {
				filtered = append(filtered, v)
			}
		}
		if len(filtered) > 0 {
			cleaned[directive] = filtered
		}
	}
	return cleaned
}

// Pre-merged policies for each route pattern (computed once at init).
var (
	// CardPaymentMerged is the pre-merged CSP for card payment HTML pages.
	CardPaymentMerged = Merge(BaseCSP, BraintreeBaseCSP, CardPaymentCSP)

	// DefaultCSP is the base CSP for pages with no special requirements.
	DefaultCSP = BaseCSP

	// SavedCardsCSP covers /home/saved-cards.
	SavedCardsCSP = Merge(BaseCSP, BraintreeBaseCSP, ThreeDSecureCSP)

	// CheckoutPayCSP covers /checkout/pay.
	CheckoutPayCSP = Merge(BaseCSP, RecaptchaCSP, BraintreeBaseCSP, ThreeDSecureCSP)

	// ThreeDSecurePageCSP covers /checkout/pay/3d-secure.
	ThreeDSecurePageCSP = Merge(BaseCSP, BraintreeBaseCSP, ThreeDSecureCSP)

	// CryptoPayCSP covers /checkout/pay/crypto.
	CryptoPayCSP = Merge(RemoveNoncePlaceholders(BaseCSP), WalletConnectCSP)

	// PaymentMethodCSP covers /checkout/pay/method.
	PaymentMethodCSP = Merge(BaseCSP, RecaptchaCSP, BraintreeBaseCSP)

	// PaypalPayCSP covers /checkout/pay/paypal.
	PaypalPayCSP = Merge(RemoveNoncePlaceholders(BaseCSP), RecaptchaCSP, BraintreeBaseCSP, PaypalCSP)

	// RequestCryptoCSP covers /checkout/pay/request-crypto.
	RequestCryptoCSP = Merge(BaseCSP, WalletConnectCSP)

	// PasswordRecoverCSP covers /password/recover.
	PasswordRecoverCSP = Merge(BaseCSP, RecaptchaCSP)

	// SignupCSP covers /signup.
	SignupCSP = Merge(BaseCSP, RecaptchaCSP)

	// SponsorCSP covers /sponsor/*.
	SponsorCSP = Merge(RemoveNoncePlaceholders(BaseCSP), WalletConnectCSP)
)
