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
  SCRIPT_SRC_ELEM: 'script-src-elem',
  STYLE_SRC: 'style-src',
  WORKER_SRC: 'worker-src',
} as const;

type ContentPolicy = (typeof ContentPolicy)[keyof typeof ContentPolicy];

function developOnlyRules(...rules: string[]): string[] {
  // eslint-disable-next-line node/prefer-global/process
  return process.env.NODE_ENV === 'development' ? rules : [];
}

const policy: Record<ContentPolicy, string[]> = {
  [ContentPolicy.BASE_URI]: [SELF],
  [ContentPolicy.BLOCK_ALL_MIXED_CONTENT]: [],
  [ContentPolicy.CHILD_SRC]: [NONE],
  [ContentPolicy.CONNECT_SRC]: [
    SELF,
    'api.github.com',
    'raw.githubusercontent.com/rotki/data/',
    'raw.githubusercontent.com/rotki/rotki.com/',
    ...developOnlyRules('ws://localhost:4000/ws'),
    // required for walletconnect
    'https://rpc.walletconnect.com',
    'https://rpc.walletconnect.org',
    'https://relay.walletconnect.com',
    'https://relay.walletconnect.org',
    'wss://relay.walletconnect.com',
    'wss://relay.walletconnect.org',
    'https://pulse.walletconnect.com',
    'https://pulse.walletconnect.org',
    'https://api.web3modal.com',
    'https://api.web3modal.org',
    'https://keys.walletconnect.com',
    'https://keys.walletconnect.org',
    'https://notify.walletconnect.com',
    'https://notify.walletconnect.org',
    'https://echo.walletconnect.com',
    'https://echo.walletconnect.org',
    'https://push.walletconnect.com',
    'https://push.walletconnect.org',
    'wss://www.walletlink.org',
    'www.google.com/recaptcha/',
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
    ...developOnlyRules('http://localhost:3000/__nuxt_devtools__/client/'),
    // required for walletconnect
    'https://verify.walletconnect.com',
    'https://verify.walletconnect.org',
    'https://secure.walletconnect.com',
    'https://secure.walletconnect.org',
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
    // required for wallet connect
    'blob:',
    'https://walletconnect.org',
    'https://walletconnect.com',
    'https://secure.walletconnect.com',
    'https://secure.walletconnect.org',
    'https://tokens-data.1inch.io',
    'https://tokens.1inch.io',
    'https://ipfs.io',
  ],
  [ContentPolicy.OBJECT_SRC]: [NONE],
  [ContentPolicy.SCRIPT_SRC]: [
    SELF,
    UNSAFE_INLINE,
    UNSAFE_EVAL,
    'www.recaptcha.net',
    'recaptcha.net',
    'www.gstatic.com/recaptcha/',
    'www.gstatic.cn/recaptcha/',
    'www.google.com/recaptcha/',
  ],
  [ContentPolicy.SCRIPT_SRC_ELEM]: [
    SELF,
    UNSAFE_INLINE,
    UNSAFE_EVAL,
    'www.recaptcha.net',
    'recaptcha.net',
    'www.gstatic.com/recaptcha/',
    'www.gstatic.cn/recaptcha/',
    'www.google.com/recaptcha/',
  ],
  [ContentPolicy.STYLE_SRC]: [SELF, UNSAFE_INLINE, 'fonts.googleapis.com'],
  [ContentPolicy.WORKER_SRC]: [SELF, 'www.recaptcha.net'],
};

function getCSP(page?: 'card' | 'paypal') {
  let csp = '';
  const finalPolicy = {
    ...policy,
    [ContentPolicy.CHILD_SRC]: [
      'assets.braintreegateway.com',
    ],
    [ContentPolicy.CONNECT_SRC]: [
      ...policy[ContentPolicy.CONNECT_SRC],
      'api.sandbox.braintreegateway.com',
      'api.braintreegateway.com',
      'client-analytics.sandbox.braintreegateway.com',
      'client-analytics.braintreegateway.com',
      '*.braintree-api.com',
      '*.paypal.com',
    ],
    [ContentPolicy.FRAME_SRC]: [
      ...policy[ContentPolicy.FRAME_SRC],
      'assets.braintreegateway.com',
    ],
    [ContentPolicy.SCRIPT_SRC]: [
      ...policy[ContentPolicy.SCRIPT_SRC],
      'js.braintreegateway.com',
      'assets.braintreegateway.com',
    ],
    [ContentPolicy.SCRIPT_SRC_ELEM]: [
      ...policy[ContentPolicy.SCRIPT_SRC_ELEM],
      'js.braintreegateway.com',
      'assets.braintreegateway.com',
    ],
  };

  if (page === 'card') {
    finalPolicy[ContentPolicy.FRAME_SRC] = ['*'];
    finalPolicy[ContentPolicy.SCRIPT_SRC] = [
      SELF,
      UNSAFE_INLINE,
      UNSAFE_EVAL,
      '*',
      // 3D Secure directives
      'songbird.cardinalcommerce.com',
      'songbirdstag.cardinalcommerce.com',
    ];
    finalPolicy[ContentPolicy.SCRIPT_SRC_ELEM] = [
      ...finalPolicy[ContentPolicy.SCRIPT_SRC_ELEM],
      // 3D Secure directives
      'songbird.cardinalcommerce.com',
      'songbirdstag.cardinalcommerce.com',
    ];
    finalPolicy[ContentPolicy.FORM_ACTION] = [SELF, '*'];
    finalPolicy[ContentPolicy.CONNECT_SRC] = [
      ...finalPolicy[ContentPolicy.CONNECT_SRC],
      // 3D Secure directives
      '*.cardinalcommerce.com',
    ];
  }
  else if (page === 'paypal') {
    finalPolicy[ContentPolicy.SCRIPT_SRC] = [
      ...finalPolicy[ContentPolicy.SCRIPT_SRC],
      '*.paypal.com',
      'www.paypalobjects.com',
    ];
    finalPolicy[ContentPolicy.SCRIPT_SRC_ELEM] = [
      ...finalPolicy[ContentPolicy.SCRIPT_SRC_ELEM],
      '*.paypal.com',
      'www.paypalobjects.com',
    ];
    finalPolicy[ContentPolicy.IMG_SRC] = [
      ...finalPolicy[ContentPolicy.IMG_SRC],
      'checkout.paypal.com',
      'www.paypalobjects.com',
    ];
    finalPolicy[ContentPolicy.CHILD_SRC] = [
      ...finalPolicy[ContentPolicy.CHILD_SRC],
      '*.paypal.com',
    ];
    finalPolicy[ContentPolicy.FRAME_SRC] = [
      ...finalPolicy[ContentPolicy.FRAME_SRC],
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
