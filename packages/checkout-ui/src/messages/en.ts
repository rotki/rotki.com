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
      add: 'Add a discount or referral code',
      apply_code: 'Apply',
      campaign_hint: 'Code {code} gives {percent}% off your first payment.',
      clear: 'Clear discount code',
      first_payment_only: '* Applies to first payment only',
      label: 'Discount or referral code',
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
    plan: {
      name_monthly: '{name}, monthly',
      name_yearly: '{name}, yearly',
      one_time_month: '1 month, paid once',
      one_time_year: '12 months, paid once',
      recurring_month: 'Monthly subscription',
      recurring_year: 'Yearly subscription',
      starts: 'Starts {date}',
      upgrade: 'Upgrade',
    },
    price_rows: {
      credit: 'Credit applied',
      discount: 'Discount',
      discount_percent: 'Discount ({percent})',
      due_today: 'Due today',
      one_time: 'Crypto payments do not renew. We e-mail you before {date} so you can pay for the next period.',
      one_time_no_date: 'Crypto payments do not renew. We e-mail you before the period ends so you can pay for the next one.',
      prorated_subtotal: 'Prorated upgrade',
      proration_note: 'An upgrade charges the price difference between the plans for the rest of your current period.',
      referral: 'Referral discount',
      referral_percent: 'Referral discount ({percent})',
      renews_month: 'Then {amount} per month from {date}. Cancel any time from your account.',
      renews_month_no_date: 'Then {amount} per month. Cancel any time from your account.',
      renews_year: 'Then {amount} per year from {date}. Cancel any time from your account.',
      renews_year_no_date: 'Then {amount} per year. Cancel any time from your account.',
      subtotal: 'Subtotal',
      vat_included: 'VAT ({rate}, included)',
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
