package safedialer

import (
	"net"
	"testing"
)

func TestIsBlockedIP(t *testing.T) {
	tests := []struct {
		ip      string
		blocked bool
	}{
		// Blocked: loopback
		{"127.0.0.1", true},
		{"::1", true},
		// Blocked: private (RFC 1918)
		{"10.0.0.1", true},
		{"172.16.0.1", true},
		{"192.168.1.1", true},
		// Blocked: link-local
		{"169.254.169.254", true},
		{"fe80::1", true},
		// Blocked: unspecified
		{"0.0.0.0", true},
		{"::", true},
		// Allowed: public IPs
		{"8.8.8.8", false},
		{"1.1.1.1", false},
		{"2606:4700:4700::1111", false},
		{"93.184.216.34", false},
	}

	for _, tt := range tests {
		ip := net.ParseIP(tt.ip)
		if ip == nil {
			t.Fatalf("invalid test IP: %s", tt.ip)
		}
		got := isBlockedIP(ip)
		if got != tt.blocked {
			t.Errorf("isBlockedIP(%s) = %v, want %v", tt.ip, got, tt.blocked)
		}
	}
}
