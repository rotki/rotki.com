package rotkidata

import (
	"strings"
	"testing"
	"time"
)

type fakeImages struct {
	prefixTTL map[string]time.Duration
}

func (f *fakeImages) SetPrefixTTL(prefix string, ttl time.Duration) {
	f.prefixTTL[prefix] = ttl
}

func TestRegisterImageTTL(t *testing.T) {
	images := &fakeImages{prefixTTL: map[string]time.Duration{}}
	RegisterImageTTL(images)
	if got := images.prefixTTL[RepoURL+"/"]; got != ImageTTL {
		t.Errorf("rotki/data image TTL = %v, want %v", got, ImageTTL)
	}
}

func TestBranch(t *testing.T) {
	if got := Branch(false); got != "main" {
		t.Errorf("Branch(false) = %q, want main", got)
	}
	if got := Branch(true); got != "develop" {
		t.Errorf("Branch(true) = %q, want develop", got)
	}
}

func TestIconURL(t *testing.T) {
	if got, want := IconURL(RepoURL, "main", "eth.png"), RepoURL+"/main/assets/icons/eth.png"; got != want {
		t.Errorf("IconURL = %q, want %q", got, want)
	}
}

func TestIsIconFile(t *testing.T) {
	for _, name := range []string{
		"eth.png", "EURe.PNG", "app_logo.png", "wrapped-btc.svg", "x.webp", "a.gif", "b.jpg", "c.jpeg",
		strings.Repeat("a", 64) + ".png",
	} {
		if !IsIconFile(name) {
			t.Errorf("IsIconFile(%q) = false, want true", name)
		}
	}
	for _, name := range []string{
		"", "eth", "eth.json", "eth.png.html", ".png",
		"../constants/asset-mappings.json", "../eth.png", "icons/eth.png", `..\eth.png`,
		"eth.png?x=1", "%00.png", "a b.png",
		strings.Repeat("a", 65) + ".png",
	} {
		if IsIconFile(name) {
			t.Errorf("IsIconFile(%q) = true, want false", name)
		}
	}
}
