import { type DOMWrapper, mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { installCheckoutMessages } from '../composables/checkout-messages';
import { checkoutMessages } from '../messages/en';
import { createTranslator } from '../utils/translator';
import MethodTiles from './MethodTiles.vue';

type Props = InstanceType<typeof MethodTiles>['$props'];

const allMethods: Props['links'] = {
  crypto: { href: '/checkout/pay/request-crypto?planId=1' },
  card: { href: '/checkout/pay/card?planId=1' },
  paypal: { href: '/checkout/pay/paypal?planId=1' },
};

/** The tile's title, its short renewal line for phones, and the full one for wider screens. */
function lines(tile: Pick<DOMWrapper<Element>, 'findAll'>): string[] {
  const [title, renewal] = tile.findAll(':scope > span');
  return [title?.text() ?? '', renewal?.get('.sm\\:hidden').text() ?? '', renewal?.get('.sm\\:inline').text() ?? ''];
}

function mountTiles(props: Partial<Props> = {}): VueWrapper {
  return mount(MethodTiles, {
    global: {
      plugins: [{ install: app => installCheckoutMessages(app, createTranslator(checkoutMessages)) }],
    },
    props: { links: allMethods, ...props },
  });
}

describe('methodTiles', () => {
  it('links each method in a fixed order inside a labelled nav', () => {
    const wrapper = mountTiles();

    expect(wrapper.get('nav').attributes('aria-label')).toBe('Payment method');
    const links = wrapper.findAll('a');
    expect(links.map(link => link.attributes('href'))).toEqual([
      '/checkout/pay/card?planId=1',
      '/checkout/pay/paypal?planId=1',
      '/checkout/pay/request-crypto?planId=1',
    ]);
    expect(links.map(lines)).toEqual([
      ['Card', 'Auto-renews', 'Renews automatically'],
      ['PayPal', 'Auto-renews', 'Renews through PayPal'],
      ['Crypto', 'No renewal', 'One payment, no renewal'],
    ]);
  });

  it('marks the method of the current page', () => {
    const links = mountTiles({ current: 'paypal' }).findAll('a');

    expect(links.map(link => link.attributes('aria-current'))).toEqual([undefined, 'page', undefined]);
  });

  it('leaves out methods without a link', () => {
    const wrapper = mountTiles({ links: { card: allMethods.card } });

    expect(wrapper.findAll('a')).toHaveLength(1);
    expect(wrapper.text()).not.toContain('PayPal');
  });

  it('shows an unavailable method without a link', () => {
    const wrapper = mountTiles({
      links: { ...allMethods, card: { disabled: true, href: '/checkout/pay/card' } },
    });

    const card = wrapper.get('[data-testid="method-tile"][data-key="card"]');
    expect(card.element.tagName).toBe('DIV');
    expect(card.attributes('aria-disabled')).toBe('true');
    expect(lines(card)).toEqual(['Card', 'Unavailable', 'Not available right now']);
    expect(wrapper.findAll('a')).toHaveLength(2);
  });

  it('reports which method the buyer followed', async () => {
    const wrapper = mountTiles();

    await wrapper.get('[data-testid="method-tile"][data-key="crypto"]').trigger('click');

    expect(wrapper.emitted('select')).toEqual([['crypto']]);
  });
});
