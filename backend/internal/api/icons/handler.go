// Package icons serves the payment token icons published in rotki/data from the site's own origin.
package icons

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/rotki/rotki.com/backend/internal/rotkidata"
)

// clientMaxAge is long because token icons practically never change. The server keeps
// them for rotkidata.ImageTTL, so a replaced icon reaches visitors within about a day.
const clientMaxAge = 24 * time.Hour

// maxConcurrent caps the requests this route has in the image service at once. Every
// unknown filename is a GitHub fetch, so without it a client could fill the service's
// shared in-flight fetches and fail the ENS avatar and NFT image routes.
const maxConcurrent = 16

// retryAfter is the Retry-After, in seconds, sent when maxConcurrent is reached.
const retryAfter = 1

// imageServer serves the first of several remote images through the shared image cache.
type imageServer interface {
	ServeFirstImage(ctx context.Context, w http.ResponseWriter, r *http.Request, urls []string, maxAge time.Duration)
}

// Handler serves files from rotki/data's `assets/icons/` through the image cache.
type Handler struct {
	images   imageServer
	baseURL  string
	branches []string
	slots    chan struct{}
}

// NewHandler creates an icons handler reading rotki/data's develop branch when testing.
// Otherwise it reads main and falls back to develop, since the backend can list a token
// whose icon has not reached main yet.
func NewHandler(images imageServer, testing bool) *Handler {
	branches := []string{rotkidata.Branch(testing)}
	if !testing {
		branches = append(branches, rotkidata.Branch(true))
	}
	return &Handler{
		images:   images,
		baseURL:  rotkidata.RepoURL,
		branches: branches,
		slots:    make(chan struct{}, maxConcurrent),
	}
}

// ServeHTTP handles GET /api/icons/{file}.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	file := r.PathValue("file")
	if !rotkidata.IsIconFile(file) {
		http.NotFound(w, r)
		return
	}

	select {
	case h.slots <- struct{}{}:
		defer func() { <-h.slots }()
	default:
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Retry-After", strconv.Itoa(retryAfter))
		http.Error(w, "Too many icon requests, retry shortly", http.StatusServiceUnavailable)
		return
	}

	urls := make([]string, len(h.branches))
	for i, branch := range h.branches {
		urls[i] = rotkidata.IconURL(h.baseURL, branch, file)
	}
	h.images.ServeFirstImage(r.Context(), w, r, urls, clientMaxAge)
}
