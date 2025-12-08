import type { TierMetadata } from '~/composables/rotki-sponsorship/types';

/**
 * Metadata Processor - Handles extraction and processing of NFT metadata
 * Provides methods to extract specific attributes from tier and token metadata
 */
class MetadataProcessor {
  /**
   * Extract and convert image URL to proxied format
   */
  processImageUrl(metadata: TierMetadata): string {
    let imageUrl = metadata.image;
    if (imageUrl) {
      // Use our image proxy endpoint to hide client IP
      imageUrl = `/api/nft/image?url=${encodeURIComponent(imageUrl)}`;
    }
    return imageUrl;
  }

  /**
   * Extract release name from metadata attributes
   */
  extractReleaseName(metadata: TierMetadata): string {
    const releaseAttribute = metadata.attributes?.find(attr =>
      attr.trait_type === 'Release' || attr.trait_type === 'Release Name',
    );
    return releaseAttribute?.value || metadata.name || '';
  }

  /**
   * Extract benefits from metadata attributes
   */
  extractBenefits(metadata: TierMetadata): string {
    const benefitsAttribute = metadata.attributes?.find(attr => attr.trait_type === 'Benefits');
    return benefitsAttribute?.value || '';
  }

  /**
   * Process tier metadata to extract all relevant information
   */
  processTierMetadata(metadata: TierMetadata): {
    imageUrl: string;
    benefits: string;
    releaseName: string;
  } {
    return {
      benefits: this.extractBenefits(metadata),
      imageUrl: this.processImageUrl(metadata),
      releaseName: this.extractReleaseName(metadata),
    };
  }
}

// Create and export singleton instance
export const metadataProcessor = new MetadataProcessor();
