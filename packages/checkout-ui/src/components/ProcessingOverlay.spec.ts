import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { installCheckoutMessages } from '../composables/checkout-messages';
import { checkoutMessages } from '../messages/en';
import { createTranslator } from '../utils/translator';
import ProcessingOverlay from './ProcessingOverlay.vue';

type Props = InstanceType<typeof ProcessingOverlay>['$props'];

function mountOverlay(props: Partial<Props> = {}): VueWrapper {
  return mount(ProcessingOverlay, {
    global: {
      plugins: [{ install: app => installCheckoutMessages(app, createTranslator(checkoutMessages)) }],
      stubs: { Teleport: true },
    },
    props: { visible: true, ...props },
  });
}

describe('processingOverlay', () => {
  it('says the payment is processing and asks to wait', () => {
    const overlay = mountOverlay().get('[role="status"]');

    expect(overlay.text()).toContain('Processing payment');
    expect(overlay.text()).toContain('Please wait and do not close this window.');
  });

  it('can ask for something else instead, such as confirming in the wallet', () => {
    expect(mountOverlay({ message: 'Confirm the transaction in your wallet.' }).text()).toContain('Confirm the transaction in your wallet.');
  });

  it('shows nothing while not processing', () => {
    expect(mountOverlay({ visible: false }).find('[role="status"]').exists()).toBe(false);
  });
});
