// Package csp provides Content Security Policy building and serialization.
package csp

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"slices"
	"strings"
)

// Policy maps CSP directives to their source lists.
type Policy map[string][]string

// GenerateNonce returns a cryptographically random base64-encoded nonce.
// Panics if the system CSPRNG fails, which should never happen on modern systems.
func GenerateNonce() string {
	b := make([]byte, 18)
	if _, err := rand.Read(b); err != nil {
		panic("csp: failed to generate nonce: " + err.Error())
	}
	return base64.StdEncoding.EncodeToString(b)
}

// Merge combines multiple policies, deduplicating values per directive
// and removing 'none' when other values are present.
func Merge(policies ...Policy) Policy {
	merged := Policy{}

	for _, p := range policies {
		for directive, values := range p {
			existing := merged[directive]
			for _, v := range values {
				if !slices.Contains(existing, v) {
					existing = append(existing, v)
				}
			}
			merged[directive] = existing
		}
	}

	// Post-process: remove 'none' when other values exist
	for directive, values := range merged {
		if len(values) > 1 && slices.Contains(values, "'none'") {
			filtered := make([]string, 0, len(values)-1)
			for _, v := range values {
				if v != "'none'" {
					filtered = append(filtered, v)
				}
			}
			merged[directive] = filtered
		}
	}

	return merged
}

// String serializes the policy to an HTTP header value.
// Nonce placeholders ({{nonce}} and 'nonce-{{nonce}}') are replaced with the given nonce.
// Directives are sorted alphabetically for deterministic output.
func (p Policy) String(nonce string) string {
	// Sort directive keys for deterministic output
	directives := make([]string, 0, len(p))
	for k := range p {
		directives = append(directives, k)
	}
	slices.Sort(directives)

	var b strings.Builder

	for _, directive := range directives {
		sources := p[directive]
		if directive == "upgrade-insecure-requests" {
			b.WriteString("upgrade-insecure-requests; ")
			continue
		}

		b.WriteString(directive)
		b.WriteByte(' ')

		for i, src := range sources {
			s := strings.ReplaceAll(src, "{{nonce}}", nonce)
			s = strings.ReplaceAll(s, "'nonce-{{nonce}}'", fmt.Sprintf("'nonce-%s'", nonce))
			if i > 0 {
				b.WriteByte(' ')
			}
			b.WriteString(s)
		}

		b.WriteString("; ")
	}

	return strings.TrimSpace(b.String())
}
