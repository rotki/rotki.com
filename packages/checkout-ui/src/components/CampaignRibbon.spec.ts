import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { installCheckoutMessages } from '../composables/checkout-messages';
import { checkoutMessages } from '../messages/en';
import { createTranslator } from '../utils/translator';
import CampaignRibbon from './CampaignRibbon.vue';

type Props = InstanceType<typeof CampaignRibbon>['$props'];

const campaign = { code: 'AUTUMN', percent: 20, periodEnd: '2026-09-30T00:00:00Z' };

function mountRibbon(props: Partial<Props> = {}): VueWrapper {
  return mount(CampaignRibbon, {
    global: {
      plugins: [{ install: app => installCheckoutMessages(app, createTranslator(checkoutMessages)) }],
    },
    props: { campaign, ...props },
  });
}

describe('campaignRibbon', () => {
  it('offers the code with its last day, and emphasizes the code', () => {
    const wrapper = mountRibbon();

    expect(wrapper.text()).toContain('Limited-time offer: 20% off your first payment with code AUTUMN.');
    expect(wrapper.text()).toContain('Last day September 29 (UTC).');
    expect(wrapper.get('strong').text()).toBe('AUTUMN');
  });

  it('confirms an applied code, without pressing the last day', () => {
    const wrapper = mountRibbon({ applied: true });

    expect(wrapper.text()).toContain('Code AUTUMN applied: 20% off your first payment.');
    expect(wrapper.text()).not.toContain('Last day');
  });

  it('leaves the last day out when the campaign has no end', () => {
    const wrapper = mountRibbon({ campaign: { code: 'AUTUMN', percent: 20 } });

    expect(wrapper.text()).not.toContain('Last day');
  });
});
