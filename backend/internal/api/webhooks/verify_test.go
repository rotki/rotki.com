package webhooks

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"testing"
)

func computeSignature(payload []byte, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	return "sha256=" + hex.EncodeToString(mac.Sum(nil))
}

func TestVerifySignature(t *testing.T) {
	secret := "test-secret-key"
	payload := []byte(`{"action":"published"}`)

	tests := []struct {
		name   string
		header string
		secret string
		want   bool
	}{
		{
			name:   "valid signature",
			header: computeSignature(payload, secret),
			secret: secret,
			want:   true,
		},
		{
			name:   "wrong secret",
			header: computeSignature(payload, "wrong-secret"),
			secret: secret,
			want:   false,
		},
		{
			name:   "empty header",
			header: "",
			secret: secret,
			want:   false,
		},
		{
			name:   "empty secret",
			header: computeSignature(payload, secret),
			secret: "",
			want:   false,
		},
		{
			name:   "missing sha256= prefix",
			header: hex.EncodeToString([]byte("not-a-real-sig")),
			secret: secret,
			want:   false,
		},
		{
			name:   "invalid hex",
			header: "sha256=not-hex-at-all!",
			secret: secret,
			want:   false,
		},
		{
			name:   "sha1 prefix rejected",
			header: "sha1=abcdef",
			secret: secret,
			want:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := VerifySignature(payload, tt.header, tt.secret)
			if got != tt.want {
				t.Errorf("VerifySignature() = %v, want %v", got, tt.want)
			}
		})
	}
}
