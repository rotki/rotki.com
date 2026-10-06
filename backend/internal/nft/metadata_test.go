package nft

import (
	"testing"
)

func TestProcessImageURL(t *testing.T) {
	tests := []struct {
		name     string
		metadata *TierMetadata
		want     string
	}{
		{
			name:     "nil metadata",
			metadata: nil,
			want:     "",
		},
		{
			name:     "empty image",
			metadata: &TierMetadata{Image: ""},
			want:     "",
		},
		{
			name:     "ipfs image returns raw URL",
			metadata: &TierMetadata{Image: "ipfs://QmTest123"},
			want:     "ipfs://QmTest123",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := ProcessImageURL(tt.metadata); got != tt.want {
				t.Errorf("ProcessImageURL() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestExtractReleaseName(t *testing.T) {
	tests := []struct {
		name     string
		metadata *TierMetadata
		want     string
	}{
		{
			name:     "nil metadata",
			metadata: nil,
			want:     "",
		},
		{
			name: "from Release attribute",
			metadata: &TierMetadata{
				Name: "Fallback",
				Attributes: []MetadataAttribute{
					{TraitType: "Release", Value: "v1.0"},
				},
			},
			want: "v1.0",
		},
		{
			name: "from Release Name attribute",
			metadata: &TierMetadata{
				Attributes: []MetadataAttribute{
					{TraitType: "Release Name", Value: "Genesis"},
				},
			},
			want: "Genesis",
		},
		{
			name:     "fallback to name",
			metadata: &TierMetadata{Name: "Test NFT"},
			want:     "Test NFT",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := ExtractReleaseName(tt.metadata); got != tt.want {
				t.Errorf("ExtractReleaseName() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestExtractBenefits(t *testing.T) {
	metadata := &TierMetadata{
		Attributes: []MetadataAttribute{
			{TraitType: "Benefits", Value: "Premium support"},
		},
	}
	if got := ExtractBenefits(metadata); got != "Premium support" {
		t.Errorf("ExtractBenefits() = %q, want %q", got, "Premium support")
	}
}

func TestFindTierByID(t *testing.T) {
	tier := FindTierByID(0)
	if tier == nil || tier.Key != "bronze" {
		t.Errorf("FindTierByID(0) = %v, want bronze", tier)
	}

	tier = FindTierByID(1)
	if tier == nil || tier.Key != "silver" {
		t.Errorf("FindTierByID(1) = %v, want silver", tier)
	}

	tier = FindTierByID(99)
	if tier != nil {
		t.Errorf("FindTierByID(99) = %v, want nil", tier)
	}
}
