package safedialer

import (
	"context"
	"net"
	"strings"
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
		// Blocked: IPv4-mapped IPv6 forms of internal addresses
		{"::ffff:127.0.0.1", true},
		{"::ffff:10.0.0.1", true},
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

func TestControl(t *testing.T) {
	tests := []struct {
		address string
		wantErr bool
	}{
		{"127.0.0.1:443", true},
		{"[::1]:443", true},
		{"[fe80::1]:443", true},
		{"192.168.1.1:80", true},
		{"209.94.90.1:443", false},
		{"[2602:fea2:2::1]:443", false},
		{"not-an-ip:443", true},
		{"missing-port", true},
	}

	for _, tt := range tests {
		t.Run(tt.address, func(t *testing.T) {
			err := control(context.Background(), "tcp", tt.address, nil)
			if (err != nil) != tt.wantErr {
				t.Errorf("control(%q) error = %v, wantErr %v", tt.address, err, tt.wantErr)
			}
		})
	}
}

func TestNew_BlocksLoopbackListener(t *testing.T) {
	var lc net.ListenConfig
	ln, err := lc.Listen(context.Background(), "tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	defer func() { _ = ln.Close() }()

	dial := New()
	conn, err := dial(context.Background(), "tcp", ln.Addr().String())
	if err == nil {
		_ = conn.Close()
		t.Fatal("expected dial to loopback to be blocked")
	}
	if !strings.Contains(err.Error(), "blocked") {
		t.Errorf("expected blocked error, got %v", err)
	}
}

func TestNew_BlocksHostnameResolvingToLoopback(t *testing.T) {
	var lc net.ListenConfig
	ln, err := lc.Listen(context.Background(), "tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	defer func() { _ = ln.Close() }()

	_, port, _ := net.SplitHostPort(ln.Addr().String())
	dial := New()
	conn, err := dial(context.Background(), "tcp", net.JoinHostPort("localhost", port))
	if err == nil {
		_ = conn.Close()
		t.Fatal("expected dial to localhost to be blocked")
	}
	if !strings.Contains(err.Error(), "blocked") {
		t.Errorf("expected blocked error, got %v", err)
	}
}
