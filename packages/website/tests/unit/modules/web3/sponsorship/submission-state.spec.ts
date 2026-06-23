import type { SimpleTokenMetadata, StoredNft } from '~/modules/web3/sponsorship/types';
import type { NftSubmission } from '~/types/sponsor';
import { describe, expect, it } from 'vitest';
import { buildNftIdOptions, buildSubmissionFormData, evaluateNftMetadata, isCurrentReleaseSubmission, isSubmitBlockedByOwnership } from '~/modules/web3/sponsorship/submission-state';

function storedNft(partial: Partial<StoredNft> & Pick<StoredNft, 'id'>): StoredNft {
  return { address: '0xowner', releaseId: 1, tier: 0, ...partial };
}

function submission(partial: Partial<NftSubmission> & Pick<NftSubmission, 'nftId'>): NftSubmission {
  return {
    createdAt: '2026-01-01',
    displayName: null,
    email: null,
    imageUrl: null,
    updatedAt: '2026-01-01',
    ...partial,
  };
}

function metadata(partial: Partial<SimpleTokenMetadata> = {}): SimpleTokenMetadata {
  return { owner: '0xOwner', releaseId: 1, releaseName: 'Release One', tier: 'gold', ...partial };
}

describe('buildNftIdOptions', () => {
  it('filters to the current release and stringifies ids', () => {
    const nfts = [storedNft({ id: 2, releaseId: 1 }), storedNft({ id: 5, releaseId: 2 })];
    const result = buildNftIdOptions(nfts, 1, undefined, '0xowner');
    expect(result).toEqual([{ address: '0xowner', id: '2', releaseId: 1, tier: 0 }]);
  });

  it('appends the edited NFT when it is not already present', () => {
    const result = buildNftIdOptions([], 1, submission({ nftId: 7 }), '0xABC');
    expect(result).toEqual([{ address: '0xabc', id: '7', releaseId: 1, tier: -1 }]);
  });

  it('does not duplicate the edited NFT when already present', () => {
    const nfts = [storedNft({ id: 7, releaseId: 1 })];
    const result = buildNftIdOptions(nfts, 1, submission({ nftId: 7 }), '0xowner');
    expect(result).toHaveLength(1);
  });

  it('dedupes by id and sorts ascending', () => {
    const nfts = [storedNft({ id: 9 }), storedNft({ id: 3 }), storedNft({ id: 9 })];
    const result = buildNftIdOptions(nfts, undefined, undefined, '0xowner');
    expect(result.map(n => n.id)).toEqual(['3', '9']);
  });
});

describe('buildSubmissionFormData', () => {
  function entries(formData: FormData): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string')
        result[key] = value;
    }
    return result;
  }

  it('includes required fields and trims text', () => {
    const formData = buildSubmissionFormData({
      address: '0xabc',
      deleteImage: false,
      displayName: '  Alice  ',
      email: '  a@b.com  ',
      imageFile: undefined,
      isEditing: false,
      tokenId: '4',
    });
    expect(entries(formData)).toEqual({ display_name: 'Alice', email: 'a@b.com', evm_address: '0xabc', nft_id: '4' });
  });

  it('omits empty optional fields', () => {
    const formData = buildSubmissionFormData({
      address: undefined,
      deleteImage: false,
      displayName: '',
      email: '   ',
      imageFile: undefined,
      isEditing: false,
      tokenId: '',
    });
    expect(entries(formData)).toEqual({ display_name: '', evm_address: '' });
  });

  it('appends the image file and delete flag only when editing', () => {
    const file = new File(['x'], 'pic.png', { type: 'image/png' });
    const formData = buildSubmissionFormData({
      address: '0xabc',
      deleteImage: true,
      displayName: 'Bob',
      email: '',
      imageFile: file,
      isEditing: true,
      tokenId: '1',
    });
    expect(formData.get('image_file')).toBe(file);
    expect(formData.get('delete_image')).toBe('true');
  });

  it('does not set the delete flag when not editing', () => {
    const formData = buildSubmissionFormData({
      address: '0xabc',
      deleteImage: true,
      displayName: 'Bob',
      email: '',
      imageFile: undefined,
      isEditing: false,
      tokenId: '1',
    });
    expect(formData.get('delete_image')).toBeNull();
  });
});

describe('evaluateNftMetadata', () => {
  it('returns not_found when metadata is missing', () => {
    expect(evaluateNftMetadata(undefined, '0xabc', 1)).toMatchObject({ status: 'not_found' });
  });

  it('flags a wrong release with a fallback release name', () => {
    const result = evaluateNftMetadata(metadata({ releaseId: 2, releaseName: '' }), '0xOwner', 1);
    expect(result).toMatchObject({ releaseName: 'Release 2', status: 'wrong_release' });
  });

  it('returns ok when the connected wallet owns the NFT', () => {
    const result = evaluateNftMetadata(metadata({ owner: '0xOWNER' }), '0xowner', 1);
    expect(result).toMatchObject({ owner: '0xOWNER', status: 'ok', tier: 'gold' });
  });

  it('returns not_owner when a different wallet owns the NFT', () => {
    expect(evaluateNftMetadata(metadata({ owner: '0xother' }), '0xowner', 1)).toMatchObject({ status: 'not_owner' });
  });

  it('returns unverified when owner or address is unavailable', () => {
    expect(evaluateNftMetadata(metadata({ owner: '' }), '0xowner', 1)).toMatchObject({ status: 'unverified' });
    expect(evaluateNftMetadata(metadata(), undefined, 1)).toMatchObject({ status: 'unverified' });
  });

  it('skips the release check when no current release is known', () => {
    expect(evaluateNftMetadata(metadata({ releaseId: 99 }), '0xowner', undefined)).toMatchObject({ status: 'ok' });
  });
});

describe('isSubmitBlockedByOwnership', () => {
  it('does not block before the NFT has been checked', () => {
    expect(isSubmitBlockedByOwnership({ hasCheckedNft: false, isNftOwnerValid: false, isEditing: false })).toBe(false);
  });

  it('does not block once ownership is confirmed', () => {
    expect(isSubmitBlockedByOwnership({ hasCheckedNft: true, isNftOwnerValid: true, isEditing: false })).toBe(false);
  });

  it('blocks a new submission when the ownership check failed', () => {
    expect(isSubmitBlockedByOwnership({ hasCheckedNft: true, isNftOwnerValid: false, isEditing: false })).toBe(true);
  });

  it('never blocks editing an existing submission, even when the re-check fails', () => {
    // Regression: editing an NFT from a previous release re-evaluates to
    // wrong_release (isNftOwnerValid=false), which previously left the update
    // button disabled until the user re-selected the NFT.
    expect(isSubmitBlockedByOwnership({ hasCheckedNft: true, isNftOwnerValid: false, isEditing: true })).toBe(false);
  });
});

describe('isCurrentReleaseSubmission', () => {
  it('matches identical release tags', () => {
    expect(isCurrentReleaseSubmission('v1.40.0', 'v1.40.0')).toBe(true);
  });

  it('tolerates a v-prefix mismatch between the two backends', () => {
    expect(isCurrentReleaseSubmission('1.40.0', 'v1.40.0')).toBe(true);
    expect(isCurrentReleaseSubmission('v1.40.0', '1.40.0')).toBe(true);
  });

  it('ignores surrounding whitespace and casing', () => {
    expect(isCurrentReleaseSubmission('  V1.40.0 ', 'v1.40.0')).toBe(true);
  });

  it('does not match a different (older) release', () => {
    expect(isCurrentReleaseSubmission('v1.40.0', 'v1.39.0')).toBe(false);
  });

  it('never treats a missing release on either side as current', () => {
    expect(isCurrentReleaseSubmission(undefined, 'v1.40.0')).toBe(false);
    expect(isCurrentReleaseSubmission('v1.40.0', undefined)).toBe(false);
    expect(isCurrentReleaseSubmission('', '')).toBe(false);
  });

  it('only strips a leading v when it precedes a digit', () => {
    // Guards against mangling word-like names into a false match.
    expect(isCurrentReleaseSubmission('version', 'ersion')).toBe(false);
  });
});
