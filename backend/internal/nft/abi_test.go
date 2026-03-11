package nft

import (
	"encoding/hex"
	"testing"
)

func TestFunctionSelector(t *testing.T) {
	// Known keccak256 selectors
	tests := []struct {
		sig  string
		want string
	}{
		{"currentReleaseId()", hex.EncodeToString(selCurrentReleaseID)},
		{"ownerOf(uint256)", hex.EncodeToString(selOwnerOf)},
	}

	for _, tt := range tests {
		t.Run(tt.sig, func(t *testing.T) {
			got := hex.EncodeToString(functionSelector(tt.sig))
			if got != tt.want {
				t.Errorf("functionSelector(%q) = %s, want %s", tt.sig, got, tt.want)
			}
		})
	}
}

func TestEncodeDecodeUint256(t *testing.T) {
	for _, val := range []int{0, 1, 42, 255, 1000000} {
		encoded := encodeUint256(val)
		if len(encoded) != 32 {
			t.Fatalf("expected 32 bytes, got %d", len(encoded))
		}
		decoded := decodeUint256(encoded)
		if decoded != val {
			t.Errorf("roundtrip failed: %d -> %d", val, decoded)
		}
	}
}

func TestDecodeAddress(t *testing.T) {
	// 20-byte address padded to 32 bytes
	addr := make([]byte, 32)
	addrBytes, _ := hex.DecodeString("deadbeefdeadbeefdeadbeefdeadbeefdeadbeef")
	copy(addr[12:], addrBytes)

	result := decodeAddress(addr)
	if result != "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef" {
		t.Errorf("got %s", result)
	}
}

func TestEncodeGetTierInfo(t *testing.T) {
	data := EncodeGetTierInfo(1, 2)
	// Should be 4 (selector) + 32 (releaseId) + 32 (tierId) = 68 bytes
	if len(data) != 68 {
		t.Errorf("expected 68 bytes, got %d", len(data))
	}
}
