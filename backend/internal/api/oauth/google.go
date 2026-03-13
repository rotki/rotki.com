// Package oauth handles OAuth token exchange for third-party providers.
package oauth

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/rotki/rotki.com/backend/internal/validate"
)

// googleOAuthEndpoint is the URL for Google's OAuth2 exchange.
const googleOAuthEndpoint = "https://oauth2.googleapis.com/token" //nolint:gosec // URL, not a credential

// GoogleHandler handles Google OAuth token exchange.
// It keeps the client secret server-side and proxies the token request to Google.
type GoogleHandler struct {
	clientSecret string
	tokenURL     string
	httpClient   *http.Client
	logger       *slog.Logger
}

// NewGoogleHandler creates a new Google OAuth handler.
func NewGoogleHandler(clientSecret string, logger *slog.Logger) *GoogleHandler {
	return &GoogleHandler{
		clientSecret: clientSecret,
		tokenURL:     googleOAuthEndpoint,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		logger: logger.With("handler", "oauth.google"),
	}
}

type googleTokenRequest struct {
	ClientID    string `json:"client_id"`
	Code        string `json:"code"`
	RedirectURI string `json:"redirect_uri"`
}

// ServeHTTP handles POST /api/oauth/google/token.
func (h *GoogleHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if h.clientSecret == "" {
		h.logger.Error("Google client secret is not configured")
		validate.WriteJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "OAuth configuration error",
		})
		return
	}

	var req googleTokenRequest
	if err := validate.ReadJSONBody(r, &req, 4096); err != nil {
		validate.WriteJSON(w, http.StatusBadRequest, map[string]string{
			"error": err.Error(),
		})
		return
	}

	// Validate fields
	if errs := validate.Collect(
		validate.RequiredString("client_id", req.ClientID),
		validate.RequiredString("code", req.Code),
		validate.RequiredString("redirect_uri", req.RedirectURI),
		validate.IsURL("redirect_uri", req.RedirectURI),
	); len(errs) > 0 {
		errs.WriteJSON(w)
		return
	}

	// Exchange authorization code for access token
	form := url.Values{
		"client_id":     {req.ClientID},
		"client_secret": {h.clientSecret},
		"code":          {req.Code},
		"grant_type":    {"authorization_code"},
		"redirect_uri":  {req.RedirectURI},
	}

	tokenReq, err := http.NewRequestWithContext(r.Context(), http.MethodPost,
		h.tokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		h.logger.Error("failed to create token request", "error", err)
		validate.WriteJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Internal error",
		})
		return
	}
	tokenReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := h.httpClient.Do(tokenReq) //nolint:gosec // G704: URL is a constant (googleOAuthEndpoint), not user input
	if err != nil {
		h.logger.Error("Google token exchange failed", "error", err)
		validate.WriteJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to exchange authorization code for access token",
		})
		return
	}
	defer func() { _ = resp.Body.Close() }()

	// Read and forward Google's response
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20)) // 1MB limit
	if err != nil {
		h.logger.Error("failed to read Google response", "error", err)
		validate.WriteJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to read token response",
		})
		return
	}

	// Validate response is JSON before forwarding
	if !json.Valid(body) {
		h.logger.Error("Google returned non-JSON response", "status", resp.StatusCode)
		validate.WriteJSON(w, http.StatusBadGateway, map[string]string{
			"error": "Invalid response from authentication provider",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = w.Write(body)
}
