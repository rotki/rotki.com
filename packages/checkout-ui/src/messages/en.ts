import type { MessageTree } from '../utils/translator';

/**
 * Copy for the shared checkout components, in vue-i18n locale shape. The website loads it
 * as a second locale file next to en.json; the card payment app wraps it in
 * `createTranslator`. Keys are spelled out in full (no keys built at runtime).
 */
export const checkoutMessages: MessageTree = {
  checkout: {
    discount: {
      applied: 'Discount code applied:',
      apply_code: 'Apply code',
      campaign_hint: 'Code {code} gives {percent}% off your first payment.',
      clear: 'Clear discount code',
      first_payment_only: '* Applies to first payment only',
      hint: 'Optional: Enter a discount code to apply savings to your purchase.',
      label: 'Discount/Referral Code',
      percent_off: '({percentage} off)',
      referral_applied: 'Referral code applied:',
      remove: 'Remove discount code',
      you_save: 'You save {amount}',
    },
    methods: {
      card: 'Card',
      card_renewal: 'Renews automatically',
      crypto: 'Crypto',
      crypto_renewal: 'One payment, no renewal',
      label: 'Payment method',
      paypal: 'PayPal',
      paypal_renewal: 'Renews through PayPal',
      unavailable: 'Not available right now',
    },
    price_rows: {
      credit_applied: 'Credit applied:',
      discount_savings: 'Discount savings:',
      grand_total: 'Grand Total',
      one_time: 'Crypto payments are non-recurring (one time payment).\nManual renewal is required.',
      original_price: 'Original price:',
      recurring_month: 'You will be charged automatically each month until you cancel',
      recurring_year: 'You will be charged automatically each year until you cancel',
      renews_on: 'Renews on:',
      subtotal: 'Subtotal:',
      vat: 'VAT ({rate}):',
    },
    shell: {
      back_to_plans: 'Back to plans',
      copyright: '© Rotki Solutions GmbH 2018-{year}. All rights reserved.',
      home: 'rotki home page',
      imprint: 'Imprint',
      legal: 'Legal',
      privacy: 'Privacy policy',
      refund: 'Refund policy',
      secure_checkout: 'Secure checkout',
      terms: 'Terms of service',
    },
    steps: {
      confirmation: 'Confirmation',
      label: 'Checkout steps',
      payment: 'Payment',
      plan: 'Plan',
      progress: 'Step {current} of {total}',
    },
  },
};
