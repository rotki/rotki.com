// Package rotkidata holds what the handlers reading rotki/data share: where it lives,
// which branch to read, and how its icons are named and cached.
package rotkidata

import (
	"fmt"
	"regexp"
	"time"
)

// RepoURL is the raw file root of the rotki/data repository.
const RepoURL = "https://raw.githubusercontent.com/rotki/data"

// ImageTTL is how long the image cache keeps rotki/data images and 404s. rotki/data can
// replace an icon under the same filename, so they are not kept for the default 7 days.
const ImageTTL = 10 * time.Minute

// iconFile is a plain image filename, so a name cannot reach outside `assets/icons/`.
// The website's localIconUrl uses the same pattern; keep the two in sync.
var iconFile = regexp.MustCompile(`(?i)^[\w.-]{1,64}\.(?:png|svg|webp|gif|jpe?g)$`)

// Branch is the branch the site reads: develop when testing, main otherwise.
func Branch(testing bool) string {
	if testing {
		return "develop"
	}
	return "main"
}

// IsIconFile reports whether name is a plain image filename under `assets/icons/`.
func IsIconFile(name string) bool {
	return iconFile.MatchString(name)
}

// IconURL is the raw URL of an icon on the given branch, below baseURL (RepoURL outside tests).
func IconURL(baseURL, branch, file string) string {
	return fmt.Sprintf("%s/%s/assets/icons/%s", baseURL, branch, file)
}

// prefixTTLSetter is the part of the image service that sets per-prefix cache lifetimes.
type prefixTTLSetter interface {
	SetPrefixTTL(prefix string, ttl time.Duration)
}

// RegisterImageTTL makes the image cache keep rotki/data images for ImageTTL.
func RegisterImageTTL(images prefixTTLSetter) {
	images.SetPrefixTTL(RepoURL+"/", ImageTTL)
}
