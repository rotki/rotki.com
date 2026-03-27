// Package webhooks handles incoming webhook requests from external services.
package webhooks

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"strings"
)

// VerifySignature validates a GitHub webhook signature.
// The header value must be in the form "sha256=<hex>".
// Returns true if the signature is valid.
func VerifySignature(payload []byte, headerValue, secret string) bool {
	if secret == "" || headerValue == "" {
		return false
	}

	sig, ok := strings.CutPrefix(headerValue, "sha256=")
	if !ok {
		return false
	}

	decoded, err := hex.DecodeString(sig)
	if err != nil {
		return false
	}

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	expected := mac.Sum(nil)

	return hmac.Equal(decoded, expected)
}
