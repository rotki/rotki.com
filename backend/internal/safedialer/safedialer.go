// Package safedialer provides a net.Dialer wrapper that blocks connections
// to private, loopback, and link-local IP addresses. This prevents SSRF
// attacks where an attacker-controlled URL resolves to an internal service.
package safedialer

import (
	"context"
	"fmt"
	"net"
	"time"
)

// New returns a DialContext function that resolves DNS first, rejects
// private/reserved IPs, then connects only to allowed addresses.
func New() func(ctx context.Context, network, addr string) (net.Conn, error) {
	dialer := &net.Dialer{
		Timeout:   30 * time.Second,
		KeepAlive: 30 * time.Second,
	}

	return func(ctx context.Context, network, addr string) (net.Conn, error) {
		host, port, err := net.SplitHostPort(addr)
		if err != nil {
			return nil, fmt.Errorf("invalid address %q: %w", addr, err)
		}

		// Resolve DNS to get actual IPs
		ips, err := net.DefaultResolver.LookupIPAddr(ctx, host)
		if err != nil {
			return nil, fmt.Errorf("DNS lookup failed for %q: %w", host, err)
		}

		// Check all resolved IPs before connecting
		for _, ip := range ips {
			if isBlockedIP(ip.IP) {
				return nil, fmt.Errorf("connection to %s (%s) blocked: private/reserved IP", host, ip.IP)
			}
		}

		// All IPs are safe — connect to the resolved address
		return dialer.DialContext(ctx, network, net.JoinHostPort(ips[0].String(), port))
	}
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
