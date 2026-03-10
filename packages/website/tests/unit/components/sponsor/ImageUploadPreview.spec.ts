import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import ImageUploadPreview from '~/components/sponsor/ImageUploadPreview.vue';

describe('imageUploadPreview', () => {
  it('shows upload area when no image preview is set', async () => {
    const wrapper = await mountSuspended(ImageUploadPreview);

    expect(wrapper.find('input[type="file"]').exists()).toBe(true);
    expect(wrapper.find('img').exists()).toBe(false);
  });

  it('shows image preview with plain img tag when imagePreview is a data URL', async () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const wrapper = await mountSuspended(ImageUploadPreview, {
      props: { imagePreview: dataUrl },
    });

    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe(dataUrl);
    expect(img.element.tagName).toBe('IMG');
    expect(wrapper.find('input[type="file"]').exists()).toBe(false);
  });

  it('shows image preview with plain img tag when imagePreview is an HTTP URL', async () => {
    const httpUrl = 'https://example.com/image.png';
    const wrapper = await mountSuspended(ImageUploadPreview, {
      props: { imagePreview: httpUrl },
    });

    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe(httpUrl);
  });

  it('emits remove event when remove button is clicked', async () => {
    const wrapper = await mountSuspended(ImageUploadPreview, {
      props: { imagePreview: 'data:image/png;base64,abc' },
    });

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('remove')).toHaveLength(1);
  });

  it('emits file-selected event when a file is chosen', async () => {
    const wrapper = await mountSuspended(ImageUploadPreview);

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = wrapper.find('input[type="file"]');

    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false,
    });
    await input.trigger('change');

    expect(wrapper.emitted('file-selected')).toHaveLength(1);
    expect(wrapper.emitted('file-selected')![0]).toEqual([file]);
  });

  it('displays error messages when provided', async () => {
    const errors = ['File too large', 'Invalid type'];
    const wrapper = await mountSuspended(ImageUploadPreview, {
      props: { errorMessages: errors },
    });

    const errorTexts = wrapper.findAll('.text-rui-error p');
    expect(errorTexts).toHaveLength(2);
    expect(errorTexts.at(0)?.text()).toBe('File too large');
    expect(errorTexts.at(1)?.text()).toBe('Invalid type');
  });

  it('displays hint when no errors are present', async () => {
    const wrapper = await mountSuspended(ImageUploadPreview, {
      props: { hint: 'Max 5MB, JPEG/PNG/WebP' },
    });

    expect(wrapper.find('.text-caption.text-rui-text-secondary').text()).toContain('Max 5MB, JPEG/PNG/WebP');
  });

  it('disables file input when disabled prop is true', async () => {
    const wrapper = await mountSuspended(ImageUploadPreview, {
      props: { disabled: true },
    });

    expect(wrapper.find('input[type="file"]').attributes('disabled')).toBeDefined();
  });

  it('uses plain img tag instead of NuxtImg to support data URLs', () => {
    const componentPath = resolve(__dirname, '../../../../app/components/sponsor/ImageUploadPreview.vue');
    const source = readFileSync(componentPath, 'utf-8');

    // Strip HTML comments, then check that NuxtImg is not used as a tag.
    // NuxtImg cannot process data URLs from FileReader.
    const withoutComments = source.replace(/<!--[\S\s]*?-->/g, '');
    expect(withoutComments).not.toMatch(/<NuxtImg[\s/>]/);
    expect(withoutComments).not.toMatch(/<nuxt-img[\s/>]/);
  });
});
