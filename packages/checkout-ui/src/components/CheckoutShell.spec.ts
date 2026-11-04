import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { installCheckoutMessages } from '../composables/checkout-messages';
import { checkoutMessages } from '../messages/en';
import { createTranslator } from '../utils/translator';
import CheckoutShell from './CheckoutShell.vue';

type Props = InstanceType<typeof CheckoutShell>['$props'];

function mountShell(props: Partial<Props> = {}): VueWrapper {
  return mount(CheckoutShell, {
    global: {
      plugins: [{ install: app => installCheckoutMessages(app, createTranslator(checkoutMessages)) }],
    },
    props: { homeHref: '/', logoSrc: '/img/logo.svg', step: 'payment', ...props },
    slots: { default: '<h1>How would you like to pay?</h1>' },
  });
}

describe('checkoutShell', () => {
  it('renders the page inside the main landmark', () => {
    expect(mountShell().get('main h1').text()).toBe('How would you like to pay?');
  });

  it('links the logo home with an accessible name', () => {
    const home = mountShell({ homeHref: 'https://rotki.com' }).get('header a');

    expect(home.attributes('href')).toBe('https://rotki.com');
    expect(home.get('img').attributes('alt')).toBe('rotki home page');
  });

  it('shows the given step in the stepper', () => {
    expect(mountShell({ step: 'confirmation' }).get('[aria-current="step"]').text()).toBe('3 Confirmation');
  });

  it('offers a way back to the plans only when given one', () => {
    expect(mountShell().text()).not.toContain('Back to plans');

    const links = mountShell({ backHref: '/checkout/pay?planId=1' })
      .findAll('a')
      .filter(link => link.text() === 'Back to plans');
    // One in the header on wide screens, one under the page on phones.
    expect(links.map(link => link.attributes('href'))).toEqual(['/checkout/pay?planId=1', '/checkout/pay?planId=1']);
  });

  it('keeps the legal links, on the site when the shell runs elsewhere', () => {
    const local = mountShell().get('footer nav');
    expect(local.attributes('aria-label')).toBe('Legal');
    expect(local.findAll('a').map(link => link.attributes('href')))
      .toEqual(['/impressum', '/privacy-policy', '/tos', '/refund-policy']);

    const remote = mountShell({ siteUrl: 'https://rotki.com' }).get('footer nav a');
    expect(remote.attributes('href')).toBe('https://rotki.com/impressum');
  });

  it('shows the current year in the copyright', () => {
    expect(mountShell().get('footer').text()).toContain(`2018-${new Date().getFullYear()}. All rights reserved.`);
  });
});
