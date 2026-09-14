// Package ipfs resolves ipfs:// URIs across multiple HTTP gateways.
//
// Public gateways rate-limit aggressively (ipfs.io answers 429 with a
// Retry-After of half an hour after a few dozen requests) and come and go,
// so a single gateway is not reliable. Pool tries gateways in order and puts
// a gateway on cooldown when it rate-limits or fails, so later requests skip
// it instead of hammering it.
package ipfs

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"slices"
	"strconv"
	"strings"
	"sync"
	"time"
)

// Cooldown bounds applied to gateways.
const (
	// FailureCooldown is how long a gateway is skipped after a timeout, network error,
	// 5xx, or an unusable response (e.g. an HTML landing page instead of the content).
	FailureCooldown = 60 * time.Second

	// DefaultRateLimitCooldown applies to a 429 without a usable Retry-After header.
	DefaultRateLimitCooldown = 5 * time.Minute

	// MinRateLimitCooldown and MaxRateLimitCooldown clamp the Retry-After value.
	MinRateLimitCooldown = 30 * time.Second
	MaxRateLimitCooldown = time.Hour
)

// DefaultGateways is the ordered list of public gateways used when none are configured.
// Only gateways from known operators with independent infrastructure are listed:
// dweb.link, w3s.link, nftstorage.link and ipfs.infura.io share ipfs.io's rate limit,
// so they fail together, and Cloudflare's gateway has been shut down.
var DefaultGateways = []string{
	"https://ipfs.filebase.io/ipfs/",
	"https://gateway.pinata.cloud/ipfs/",
	"https://ipfs.io/ipfs/",
}

// ErrContentRejected marks an attempt error caused by the content itself (e.g. an
// unsupported type or unparsable metadata) rather than by the gateway. Every gateway
// would serve the same bytes, so Pool stops without trying others or setting a cooldown.
var ErrContentRejected = errors.New("ipfs content rejected")

// StatusError is returned by attempts for a non-success HTTP response.
type StatusError struct {
	StatusCode int
	RetryAfter string
}

func (e *StatusError) Error() string {
	return fmt.Sprintf("gateway returned %d", e.StatusCode)
}

// HTTPStatus implements StatusCoder.
func (e *StatusError) HTTPStatus() int { return e.StatusCode }

// RetryAfterHeader implements StatusCoder.
func (e *StatusError) RetryAfterHeader() string { return e.RetryAfter }

// StatusCoder is implemented by attempt errors that carry an upstream HTTP status,
// so Pool can tell rate limits and missing content apart from other failures.
type StatusCoder interface {
	HTTPStatus() int
	RetryAfterHeader() string
}

// AttemptFunc performs one request against a gateway URL. It must fully read
// the response before returning, because ctx is cancelled right after.
type AttemptFunc func(ctx context.Context, url string) error

// Pool holds an ordered list of gateways and their cooldown state.
type Pool struct {
	gateways []string
	hosts    map[string]bool
	logger   *slog.Logger
	now      func() time.Time

	mu        sync.Mutex
	cooldowns map[string]time.Time
}

// NewPool creates a gateway pool. An empty list uses DefaultGateways.
func NewPool(gateways []string, logger *slog.Logger) *Pool {
	if len(gateways) == 0 {
		gateways = DefaultGateways
	}

	// Recognise URLs on any known gateway (configured or default), so metadata that
	// points at e.g. https://ipfs.io/ipfs/<cid> still gets the fallback.
	hosts := make(map[string]bool)
	for _, g := range slices.Concat(gateways, DefaultGateways) {
		if u, err := url.Parse(g); err == nil && u.Host != "" {
			hosts[strings.ToLower(u.Host)] = true
		}
	}

	return &Pool{
		gateways:  slices.Clone(gateways),
		hosts:     hosts,
		logger:    logger.With("component", "ipfs-gateways"),
		now:       time.Now,
		cooldowns: make(map[string]time.Time),
	}
}

// IsIPFS reports whether rawURL is an ipfs:// URI or a path on a known gateway.
func (p *Pool) IsIPFS(rawURL string) bool {
	_, ok := p.contentPath(rawURL)
	return ok
}

// contentPath extracts "<cid>[/subpath]" from an ipfs:// URI or a known gateway URL.
func (p *Pool) contentPath(rawURL string) (string, bool) {
	rawURL = strings.TrimSpace(rawURL)
	if rest, ok := strings.CutPrefix(rawURL, "ipfs://"); ok {
		rest = strings.TrimPrefix(rest, "ipfs/")
		rest = strings.TrimLeft(rest, "/")
		return rest, rest != ""
	}

	u, err := url.Parse(rawURL)
	if err != nil || !p.hosts[strings.ToLower(u.Host)] {
		return "", false
	}
	rest, ok := strings.CutPrefix(u.Path, "/ipfs/")
	return rest, ok && rest != ""
}

type candidate struct {
	gateway string
	url     string
}

// candidates returns the gateway URLs to try for a content path. Gateways on
// cooldown are skipped; if every gateway is cooling down, only the one whose
// cooldown ends first is returned, so a request still has a chance to succeed.
func (p *Pool) candidates(path string) []candidate {
	p.mu.Lock()
	defer p.mu.Unlock()

	now := p.now()
	available := make([]candidate, 0, len(p.gateways))
	soonest := ""
	for _, g := range p.gateways {
		until, cooling := p.cooldowns[g]
		if !cooling || !now.Before(until) {
			available = append(available, candidate{gateway: g, url: g + path})
			continue
		}
		if soonest == "" || until.Before(p.cooldowns[soonest]) {
			soonest = g
		}
	}

	if len(available) == 0 && soonest != "" {
		return []candidate{{gateway: soonest, url: soonest + path}}
	}
	return available
}

// Fetch tries attempt against each available gateway for rawURL, with a per-gateway
// timeout, until one succeeds. rawURL must satisfy IsIPFS.
//
// A 429 puts the gateway on cooldown for its Retry-After; timeouts, network errors,
// 5xx, 403 and other failures put it on FailureCooldown; a 404 moves on without a
// cooldown. Problems with the content itself (ErrContentRejected, 400, 413, 415) are
// returned immediately without a cooldown, since every gateway would serve the same.
//
// A wrapped 404 is returned only when every configured gateway was tried and each
// returned 404; if some were skipped on cooldown the error does not wrap the 404, so
// callers don't cache a miss that another gateway might have served.
// Cancellation of ctx stops immediately.
func (p *Pool) Fetch(ctx context.Context, rawURL string, timeout time.Duration, attempt AttemptFunc) error {
	path, ok := p.contentPath(rawURL)
	if !ok {
		return fmt.Errorf("not an IPFS URL: %q", rawURL)
	}

	candidates := p.candidates(path)
	triedAll := len(candidates) == len(p.gateways)
	notFoundCount := 0
	var lastErr, lastNotFound error

	for i, c := range candidates {
		attemptCtx, cancel := context.WithTimeout(ctx, timeout)
		err := attempt(attemptCtx, c.url)
		cancel()

		if err == nil {
			p.clearCooldown(c.gateway)
			if i > 0 {
				p.logger.Info("ipfs content served by fallback gateway", "gateway", c.gateway, "path", path, "position", i+1)
			}
			return nil
		}

		// The caller gave up (client disconnect, task timeout): don't blame the gateway.
		if ctx.Err() != nil {
			return ctx.Err()
		}

		var sc StatusCoder
		hasStatus := errors.As(err, &sc)
		switch {
		case errors.Is(err, ErrContentRejected) || (hasStatus && isContentStatus(sc.HTTPStatus())):
			p.logger.Warn("ipfs content rejected, not trying other gateways", "gateway", c.gateway, "path", path, "error", err)
			return err
		case hasStatus && sc.HTTPStatus() == http.StatusTooManyRequests:
			wait := ParseRetryAfter(sc.RetryAfterHeader(), p.now())
			p.setCooldown(c.gateway, wait)
			p.logger.Warn("ipfs gateway rate limited, skipping", "gateway", c.gateway, "path", path, "cooldown", wait.String())
			lastErr = err
		case hasStatus && sc.HTTPStatus() == http.StatusNotFound:
			p.logger.Warn("ipfs gateway returned not found, trying next", "gateway", c.gateway, "path", path)
			notFoundCount++
			lastNotFound = err
		default:
			if errors.Is(err, context.DeadlineExceeded) {
				err = fmt.Errorf("gateway timed out after %s: %w", timeout, err)
			}
			p.setCooldown(c.gateway, FailureCooldown)
			p.logger.Warn("ipfs gateway attempt failed, skipping", "gateway", c.gateway, "path", path, "error", err)
			lastErr = err
		}
	}

	switch {
	case lastErr != nil:
		return fmt.Errorf("all %d ipfs gateways failed for %s: %w", len(candidates), path, lastErr)
	case lastNotFound != nil && triedAll && notFoundCount == len(candidates):
		return fmt.Errorf("ipfs content not found on %d gateways: %w", len(candidates), lastNotFound)
	case lastNotFound != nil:
		// Deliberately not wrapped: gateways on cooldown were not asked, so this is not a confirmed miss
		return fmt.Errorf("ipfs content not found on %d of %d gateways (others on cooldown) for %s",
			notFoundCount, len(p.gateways), path)
	default:
		return fmt.Errorf("no ipfs gateways configured")
	}
}

// IsHTML reports whether a gateway response is an HTML page (a landing page or a bot
// challenge) instead of the requested content. Image types are never HTML, so SVGs
// starting with "<" are not misclassified.
func IsHTML(contentType string, body []byte) bool {
	mediaType, _, _ := strings.Cut(contentType, ";")
	mediaType = strings.ToLower(strings.TrimSpace(mediaType))
	switch {
	case mediaType == "text/html" || mediaType == "application/xhtml+xml":
		return true
	case strings.HasPrefix(mediaType, "image/"):
		return false
	}

	head := bytes.ToLower(bytes.TrimSpace(body[:min(len(body), 512)]))
	return bytes.HasPrefix(head, []byte("<!doctype html")) || bytes.HasPrefix(head, []byte("<html"))
}

// isContentStatus reports statuses caused by the request/content rather than the gateway.
func isContentStatus(status int) bool {
	switch status {
	case http.StatusBadRequest, http.StatusRequestEntityTooLarge, http.StatusUnsupportedMediaType:
		return true
	default:
		return false
	}
}

func (p *Pool) setCooldown(gateway string, d time.Duration) {
	p.mu.Lock()
	defer p.mu.Unlock()
	until := p.now().Add(d)
	if current, ok := p.cooldowns[gateway]; !ok || until.After(current) {
		p.cooldowns[gateway] = until
	}
}

func (p *Pool) clearCooldown(gateway string) {
	p.mu.Lock()
	defer p.mu.Unlock()
	delete(p.cooldowns, gateway)
}

// ParseRetryAfter converts a Retry-After header (delta-seconds or HTTP-date) into a
// cooldown, clamped to [MinRateLimitCooldown, MaxRateLimitCooldown]. A missing or
// unparsable value yields DefaultRateLimitCooldown.
func ParseRetryAfter(value string, now time.Time) time.Duration {
	value = strings.TrimSpace(value)
	d := DefaultRateLimitCooldown

	if secs, err := strconv.Atoi(value); err == nil {
		d = time.Duration(secs) * time.Second
	} else if at, err := http.ParseTime(value); err == nil {
		d = at.Sub(now)
	}

	return min(max(d, MinRateLimitCooldown), MaxRateLimitCooldown)
}

// ParseGateways parses a comma-separated gateway list (e.g. from IPFS_GATEWAYS).
// Each entry must be an https URL; "/ipfs/" is appended when missing. An empty
// value returns nil (use DefaultGateways).
func ParseGateways(raw string) ([]string, error) {
	if strings.TrimSpace(raw) == "" {
		return nil, nil
	}

	var gateways []string
	for entry := range strings.SplitSeq(raw, ",") {
		entry = strings.TrimSpace(entry)
		if entry == "" {
			continue
		}
		u, err := url.Parse(entry)
		if err != nil || u.Scheme != "https" || u.Host == "" {
			return nil, fmt.Errorf("invalid IPFS gateway %q: must be an https URL", entry)
		}
		base := strings.TrimRight(u.Scheme+"://"+u.Host+u.Path, "/")
		if !strings.HasSuffix(base, "/ipfs") {
			base += "/ipfs"
		}
		gateways = append(gateways, base+"/")
	}

	if len(gateways) == 0 {
		return nil, errors.New("IPFS gateway list is empty")
	}
	return gateways, nil
}
