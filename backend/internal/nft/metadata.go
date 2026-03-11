package nft

import "strings"

// ProcessImageURL extracts the raw image URL from metadata.
// The raw IPFS URL is stored internally; API handlers convert it
// to an opaque proxy URL (e.g. /api/nft/image?tier=0) before
// sending it to clients.
func ProcessImageURL(metadata *TierMetadata) string {
	if metadata == nil || metadata.Image == "" {
		return ""
	}
	return metadata.Image
}

// ExtractReleaseName extracts the release name from metadata attributes.
func ExtractReleaseName(metadata *TierMetadata) string {
	if metadata == nil {
		return ""
	}
	for _, attr := range metadata.Attributes {
		if attr.TraitType == "Release" || attr.TraitType == "Release Name" {
			return attr.Value
		}
	}
	return metadata.Name
}

// ExtractBenefits extracts benefits from metadata attributes.
func ExtractBenefits(metadata *TierMetadata) string {
	if metadata == nil {
		return ""
	}
	for _, attr := range metadata.Attributes {
		if attr.TraitType == "Benefits" {
			return attr.Value
		}
	}
	return ""
}

// ProcessTierMetadata extracts all relevant fields from tier metadata.
func ProcessTierMetadata(metadata *TierMetadata) (imageURL, benefits, releaseName string) {
	return ProcessImageURL(metadata), ExtractBenefits(metadata), ExtractReleaseName(metadata)
}

// NormalizeIPFSURL converts ipfs:// URLs to HTTPS gateway URLs.
func NormalizeIPFSURL(uri string) string {
	if strings.HasPrefix(uri, "ipfs://") {
		cid := strings.TrimPrefix(uri, "ipfs://")
		return IPFSGateway + cid
	}
	return uri
}
