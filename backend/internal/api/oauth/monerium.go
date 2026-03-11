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

// MoneriumHandler handles Monerium OAuth token exchange with PKCE.
type MoneriumHandler struct {
	clientSecret string
	authBaseURL  string
	httpClient   *http.Client
	logger       *slog.Logger
}

// NewMoneriumHandler creates a new Monerium OAuth handler.
func NewMoneriumHandler(clientSecret, authBaseURL string, logger *slog.Logger) *MoneriumHandler {
	return &MoneriumHandler{
		clientSecret: clientSecret,
		authBaseURL:  strings.TrimRight(authBaseURL, "/"),
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		logger: logger.With("handler", "oauth.monerium"),
	}
}

type moneriumTokenRequest struct {
	ClientID     string `json:"client_id"`
	Code         string `json:"code"`
	RedirectURI  string `json:"redirect_uri"`
	CodeVerifier string `json:"code_verifier"`
}

// ServeHTTP handles POST /api/oauth/monerium/token.
func (h *MoneriumHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if h.clientSecret == "" {
		h.logger.Error("Monerium client secret is not configured")
		validate.WriteJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "OAuth configuration error, please contact the server administrator",
		})
		return
	}

	var req moneriumTokenRequest
	if err := validate.ReadJSONBody(r, &req, 4096); err != nil {
		validate.WriteJSON(w, http.StatusBadRequest, map[string]string{
			"error": err.Error(),
		})
		return
	}

	// Validate fields — code_verifier must be at least 43 chars per PKCE spec
	if errs := validate.Collect(
		validate.RequiredString("client_id", req.ClientID),
		validate.RequiredString("code", req.Code),
		validate.RequiredString("redirect_uri", req.RedirectURI),
		validate.IsURL("redirect_uri", req.RedirectURI),
		validate.RequiredString("code_verifier", req.CodeVerifier),
		validate.MinLength("code_verifier", req.CodeVerifier, 43),
	); len(errs) > 0 {
		errs.WriteJSON(w)
		return
	}

	// Build token exchange request
	form := url.Values{
		"client_id":     {req.ClientID},
		"code":          {req.Code},
		"redirect_uri":  {req.RedirectURI},
		"code_verifier": {req.CodeVerifier},
		"grant_type":    {"authorization_code"},
	}

	form.Set("client_secret", h.clientSecret)

	tokenURL := h.authBaseURL + "/auth/token"
	tokenReq, err := http.NewRequestWithContext(r.Context(), http.MethodPost,
		tokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		h.logger.Error("failed to create token request", "error", err)
		validate.WriteJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Internal error",
		})
		return
	}
	tokenReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := h.httpClient.Do(tokenReq) //nolint:gosec // G704: URL is from validated config (MoneriumTokenURL), not user input
	if err != nil {
		h.logger.Error("Monerium token exchange failed", "error", err)
		validate.WriteJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to exchange authorization code for access token",
		})
		return
	}
	defer func() { _ = resp.Body.Close() }()

	// Forward Monerium's response
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		h.logger.Error("failed to read Monerium response", "error", err)
		validate.WriteJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to read token response",
		})
		return
	}

	// Validate response is JSON before forwarding
	if !json.Valid(body) {
		h.logger.Error("Monerium returned non-JSON response", "status", resp.StatusCode)
		validate.WriteJSON(w, http.StatusBadGateway, map[string]string{
			"error": "Invalid response from authentication provider",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = w.Write(body)
}
