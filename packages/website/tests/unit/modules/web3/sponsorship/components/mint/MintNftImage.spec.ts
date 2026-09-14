import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import MintNftImage from '~/modules/web3/sponsorship/components/mint/MintNftImage.vue';

const images: Record<string, string> = {
  bronze: '/api/nft/image?tier=0&release=5',
  gold: '/api/nft/image?tier=2&release=5',
  silver: '/api/nft/image?tier=1&release=5',
};

describe('mintNftImage', () => {
  it('shows a skeleton while tier data is loading', async () => {
    const wrapper = await mountSuspended(MintNftImage, {
      props: { isLoading: true, nftImages: {}, selectedTier: 'silver' },
    });

    expect(wrapper.find('[data-id="nft-image-skeleton"]').exists()).toBe(true);
    expect(wrapper.find('[data-id="nft-image"]').exists()).toBe(false);
    expect(wrapper.find('[data-id="nft-image-unavailable"]').exists()).toBe(false);
  });

  it('shows the selected tier image', async () => {
    const wrapper = await mountSuspended(MintNftImage, {
      props: { nftImages: images, selectedTier: 'silver' },
    });

    const img = wrapper.find('[data-id="nft-image"]');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe(images.silver);
  });

  it('keeps showing the image while tier data refreshes', async () => {
    const wrapper = await mountSuspended(MintNftImage, {
      props: { isLoading: true, nftImages: images, selectedTier: 'gold' },
    });

    expect(wrapper.find('[data-id="nft-image"]').exists()).toBe(true);
    expect(wrapper.find('[data-id="nft-image-skeleton"]').exists()).toBe(false);
  });

  it('shows the unavailable state when the selected tier has no image', async () => {
    const wrapper = await mountSuspended(MintNftImage, {
      props: { nftImages: { ...images, silver: '' }, selectedTier: 'silver' },
    });

    const unavailable = wrapper.find('[data-id="nft-image-unavailable"]');
    expect(unavailable.exists()).toBe(true);
    expect(wrapper.find('[data-id="nft-image-tier"]').text()).toBe('Silver');
    expect(wrapper.find('[data-id="nft-image-title"]').text()).toBe('Artwork unavailable');
    expect(wrapper.find('[data-id="nft-image-message"]').text()).toBe('The Silver artwork isn\'t available right now. You can still mint this tier.');
    expect(wrapper.find('[data-id="nft-image"]').exists()).toBe(false);
    expect(wrapper.find('[data-id="nft-image-skeleton"]').exists()).toBe(false);
  });

  it('tints the placeholder with the selected tier colors', async () => {
    const wrapper = await mountSuspended(MintNftImage, {
      props: { nftImages: { bronze: '', gold: '', silver: '' }, selectedTier: 'gold' },
    });

    const panelClasses = wrapper.find('[data-id="nft-image-unavailable"]').classes().join(' ');
    expect(panelClasses).toContain('from-[#fdf8e4]');

    await wrapper.setProps({ selectedTier: 'bronze' });
    expect(wrapper.find('[data-id="nft-image-unavailable"]').classes().join(' ')).toContain('from-[#fbf0e4]');
    expect(wrapper.find('[data-id="nft-image-tier"]').text()).toBe('Bronze');
  });

  it('refetches tier data when retrying a tier without an image', async () => {
    const wrapper = await mountSuspended(MintNftImage, {
      props: { nftImages: { ...images, silver: '' }, selectedTier: 'silver' },
    });

    await wrapper.find('[data-id="nft-image-retry"]').trigger('click');
    expect(wrapper.emitted('retry')).toHaveLength(1);
  });

  it('shows the unavailable state when the image fails to load and reloads it on retry', async () => {
    const wrapper = await mountSuspended(MintNftImage, {
      props: { nftImages: images, selectedTier: 'gold' },
    });

    await wrapper.find('[data-id="nft-image"]').trigger('error');
    expect(wrapper.find('[data-id="nft-image-unavailable"]').exists()).toBe(true);
    expect(wrapper.find('[data-id="nft-image"]').exists()).toBe(false);
    expect(wrapper.find('[data-id="nft-image-title"]').text()).toBe('Artwork didn\'t load');
    expect(wrapper.find('[data-id="nft-image-message"]').text()).toBe('Couldn\'t load the Gold artwork right now. You can still mint this tier.');

    await wrapper.find('[data-id="nft-image-retry"]').trigger('click');
    const img = wrapper.find('[data-id="nft-image"]');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe(images.gold);
    expect(wrapper.emitted('retry')).toBeUndefined();
  });

  it('clears a failed image when switching tiers', async () => {
    const wrapper = await mountSuspended(MintNftImage, {
      props: { nftImages: images, selectedTier: 'gold' },
    });

    await wrapper.find('[data-id="nft-image"]').trigger('error');
    expect(wrapper.find('[data-id="nft-image-unavailable"]').exists()).toBe(true);

    await wrapper.setProps({ selectedTier: 'bronze' });
    const img = wrapper.find('[data-id="nft-image"]');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe(images.bronze);
  });

  it('shows the load error with a retry when tier data failed', async () => {
    const wrapper = await mountSuspended(MintNftImage, {
      props: { error: true, nftImages: {}, selectedTier: 'silver' },
    });

    expect(wrapper.find('[data-id="nft-image-skeleton"]').exists()).toBe(false);
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('retry')).toHaveLength(1);
  });
});
