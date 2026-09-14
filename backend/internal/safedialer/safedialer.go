// Package safedialer provides a net.Dialer wrapper that blocks connections
// to private, loopback, and link-local IP addresses. This prevents SSRF
// attacks where an attacker-controlled URL resolves to an internal service.
package safedialer

import (
	"context"
	"fmt"
	"net"
	"syscall"
	"time"
)

// New returns a DialContext function that rejects private/reserved IPs.
//
// The check runs in the dialer's Control hook, i.e. on the exact address
// being connected to after DNS resolution. This lets the standard dialer
// walk every resolved address (falling back between IPv6 and IPv4 when one
// family is unreachable) while still blocking internal targets, including
// hosts whose DNS answer changes between lookup and connect.
func New() func(ctx context.Context, network, addr string) (net.Conn, error) {
	dialer := &net.Dialer{
		Timeout:        30 * time.Second,
		KeepAlive:      30 * time.Second,
		ControlContext: control,
	}
	return dialer.DialContext
}

// control rejects connections to blocked IPs. address is always a resolved
// "ip:port" pair when called by net.Dialer.
func control(_ context.Context, _, address string, _ syscall.RawConn) error {
	host, _, err := net.SplitHostPort(address)
	if err != nil {
		return fmt.Errorf("invalid address %q: %w", address, err)
	}

	ip := net.ParseIP(host)
	if ip == nil {
		return fmt.Errorf("connection to %q blocked: not a resolved IP", host)
	}

	if isBlockedIP(ip) {
		return fmt.Errorf("connection to %s blocked: private/reserved IP", ip)
	}

	return nil
}

// isBlockedIP returns true if the IP is private, loopback, link-local,
// or otherwise should not be accessed by outbound requests.
func isBlockedIP(ip net.IP) bool {
	return ip.IsLoopback() ||
		ip.IsPrivate() ||
		ip.IsLinkLocalUnicast() ||
		ip.IsLinkLocalMulticast() ||
		ip.IsUnspecified()
}
