const SELF = '\'self\'';
const UNSAFE_INLINE = '\'unsafe-inline\'';
const UNSAFE_EVAL = '\'unsafe-eval\'';
const NONE = '\'none\'';

const ContentPolicy = {
  BASE_URI: 'base-uri',
  BLOCK_ALL_MIXED_CONTENT: 'block-all-mixed-content',
  CHILD_SRC: 'child-src',
  CONNECT_SRC: 'connect-src',
  DEFAULT_SRC: 'default-src',
  FONT_SRC: 'font-src',
  FORM_ACTION: 'form-action',
  FRAME_ANCESTORS: 'frame-ancestors',
  FRAME_SRC: 'frame-src',
  IMG_SRC: 'img-src',
  OBJECT_SRC: 'object-src',
  SCRIPT_SRC: 'script-src',
  STYLE_SRC: 'style-src',
  WORKER_SRC: 'worker-src',
} as const;

type ContentPolicy = (typeof ContentPolicy)[keyof typeof ContentPolicy];

const policy: Record<ContentPolicy, string[]> = {
  [ContentPolicy.BASE_URI]: [SELF],
  [ContentPolicy.BLOCK_ALL_MIXED_CONTENT]: [],
  [ContentPolicy.CHILD_SRC]: [NONE],
  [ContentPolicy.CONNECT_SRC]: [
    SELF,
    'api.github.com',
    'raw.githubusercontent.com/rotki/data/',
    'raw.githubusercontent.com/rotki/rotki.com/',
  ],
  [ContentPolicy.DEFAULT_SRC]: [SELF],
  [ContentPolicy.FONT_SRC]: [SELF, 'data:', 'fonts.gstatic.com'],
  [ContentPolicy.FORM_ACTION]: [SELF],
  [ContentPolicy.FRAME_ANCESTORS]: [SELF],
  [ContentPolicy.FRAME_SRC]: [
    '*.recaptcha.net',
    'recaptcha.net',
    'https://www.google.com/recaptcha/',
    'https://recaptcha.google.com',
  ],
  [ContentPolicy.IMG_SRC]: [
    SELF,
    UNSAFE_INLINE,
    'data:',
    'www.gstatic.com/recaptcha',
    'https://pbs.twimg.com/profile_images/',
    'assets.braintreegateway.com',
    'https://raw.githubusercontent.com/rotki/data/',
    'https://raw.githubusercontent.com/rotki/rotki/',
  ],
  [ContentPolicy.OBJECT_SRC]: [NONE],
  [ContentPolicy.SCRIPT_SRC]: [
    SELF,
    UNSAFE_INLINE,
    UNSAFE_EVAL,
    'https://www.recaptcha.net',
    'https://recaptcha.net',
    'https://www.gstatic.com/recaptcha/',
    'https://www.gstatic.cn/recaptcha/',
    'https://www.google.com/recaptcha/',
  ],
  [ContentPolicy.STYLE_SRC]: [SELF, UNSAFE_INLINE, 'fonts.googleapis.com'],
  [ContentPolicy.WORKER_SRC]: [SELF, 'www.recaptcha.net'],
};

function getCSP(page?: 'card' | 'paypal') {
  let csp = '';
  const finalPolicy = { ...policy };
  if (page === 'card') {
    finalPolicy[ContentPolicy.FRAME_SRC] = ['*'];
    finalPolicy[ContentPolicy.SCRIPT_SRC] = [
      SELF,
      UNSAFE_INLINE,
      UNSAFE_EVAL,
      '*',
    ];
    finalPolicy[ContentPolicy.CONNECT_SRC] = [SELF, '*'];
    finalPolicy[ContentPolicy.FORM_ACTION] = [SELF, '*'];
  }
  else if (page === 'paypal') {
    finalPolicy[ContentPolicy.SCRIPT_SRC] = [
      ...finalPolicy[ContentPolicy.SCRIPT_SRC],
      'js.braintreegateway.com',
      'assets.braintreegateway.com',
      '*.paypal.com',
      'www.paypalobjects.com',
    ];
    finalPolicy[ContentPolicy.IMG_SRC] = [
      ...finalPolicy[ContentPolicy.IMG_SRC],
      'checkout.paypal.com',
      'www.paypalobjects.com',
    ];
    finalPolicy[ContentPolicy.CHILD_SRC] = [
      '*.paypal.com',
      'assets.braintreegateway.com',
    ];
    finalPolicy[ContentPolicy.FRAME_SRC] = [
      '*.paypal.com',
      'assets.braintreegateway.com',
    ];
    finalPolicy[ContentPolicy.CONNECT_SRC] = [
      SELF,
      'api.sandbox.braintreegateway.com',
      'api.braintreegateway.com',
      'client-analytics.sandbox.braintreegateway.com',
      'client-analytics.braintreegateway.com',
      '*.braintree-api.com',
      '*.paypal.com',
    ];
  }
  for (const policyKey in finalPolicy)
    csp += `${policyKey} ${finalPolicy[policyKey as ContentPolicy].join(' ')};`;

  return csp;
}

const defaultCSP = getCSP();

export default defineEventHandler((event) => {
  const url = event.node.req.url;
  if (!url || import.meta.env.SKIP_CSP === 'true')
    return;

  let csp = defaultCSP;
  if (url.startsWith('/checkout/pay/card'))
    csp = getCSP('card');
  else if (url.startsWith('/checkout/pay/paypal'))
    csp = getCSP('paypal');

  event.node.res.setHeader('content-security-policy', csp);
});
