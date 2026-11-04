import { mountSuspended } from '@nuxt/test-utils/runtime';
import PriceRows from '@rotki/checkout-ui/components/PriceRows.vue';
import { describe, expect, it } from 'vitest';

/* The shared checkout components get their copy from i18n/locales/checkout.ts through the
   checkout-messages plugin. A missing plugin throws; a missing locale file shows raw keys. */
describe('shared checkout copy', () => {
  it('reaches the shared components through vue-i18n', async () => {
    const wrapper = await mountSuspended(PriceRows, {
      props: { durationInMonths: 1, plan: { price: 25 } },
    });

    expect(wrapper.text()).toContain('Due today');
    expect(wrapper.text()).toContain('Subtotal');
    expect(wrapper.text()).not.toContain('checkout.price_rows');
  });
});
