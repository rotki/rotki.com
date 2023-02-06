const SELF = "'self'"
const UNSAFE_INLINE = "'unsafe-inline'"
const UNSAFE_EVAL = "'unsafe-eval'"
const NONE = "'none'"

const ContentPolicy = {
  FRAME_ANCESTORS: 'frame-ancestors',
  BLOCK_ALL_MIXED_CONTENT: 'block-all-mixed-content',
  DEFAULT_SRC: 'default-src',
  SCRIPT_SRC: 'script-src',
  STYLE_SRC: 'style-src',
  OBJECT_SRC: 'object-src',
  FRAME_SRC: 'frame-src',
  CHILD_SRC: 'child-src',
  IMG_SRC: 'img-src',
  CONNECT_SRC: 'connect-src',
  BASE_URI: 'base-uri',
  FORM_ACTION: 'form-action',
  WORKER_SRC: 'worker-src',
  FONT_SRC: 'font-src',
} as const

type ContentPolicy = (typeof ContentPolicy)[keyof typeof ContentPolicy]

const policy: Record<ContentPolicy, string[]> = {
  [ContentPolicy.FRAME_ANCESTORS]: [SELF],
  [ContentPolicy.BLOCK_ALL_MIXED_CONTENT]: [],
  [ContentPolicy.DEFAULT_SRC]: [SELF],
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
  [ContentPolicy.OBJECT_SRC]: [NONE],
  [ContentPolicy.FRAME_SRC]: [
    '*.recaptcha.net',
    'recaptcha.net',
    'https://www.google.com/recaptcha/',
    'https://recaptcha.google.com',
  ],
  [ContentPolicy.CHILD_SRC]: [NONE],
  [ContentPolicy.IMG_SRC]: [
    SELF,
    UNSAFE_INLINE,
    'data:',
    'www.gstatic.com/recaptcha',
  ],
  [ContentPolicy.CONNECT_SRC]: [SELF, 'api.github.com'],
  [ContentPolicy.BASE_URI]: [SELF],
  [ContentPolicy.FORM_ACTION]: [SELF],
  [ContentPolicy.WORKER_SRC]: [SELF, 'www.recaptcha.net'],
  [ContentPolicy.FONT_SRC]: [SELF, 'fonts.gstatic.com'],
}

function getCSP(page?: 'card' | 'paypal') {
  let csp = ''
  const finalPolicy = { ...policy }
  if (page === 'card') {
    finalPolicy[ContentPolicy.FRAME_SRC] = ['*']
    finalPolicy[ContentPolicy.SCRIPT_SRC] = [
      SELF,
      UNSAFE_INLINE,
      UNSAFE_EVAL,
      '*',
    ]
    finalPolicy[ContentPolicy.CONNECT_SRC] = [SELF, '*']
    finalPolicy[ContentPolicy.FORM_ACTION] = [SELF, '*']
  } else if (page === 'paypal') {
    finalPolicy[ContentPolicy.SCRIPT_SRC] = [
      ...finalPolicy[ContentPolicy.SCRIPT_SRC],
      'js.braintreegateway.com',
      'assets.braintreegateway.com',
      '*.paypal.com',
      'www.paypalobjects.com',
    ]
    finalPolicy[ContentPolicy.IMG_SRC] = [
      ...finalPolicy[ContentPolicy.IMG_SRC],
      'assets.braintreegateway.com',
      'checkout.paypal.com',
    ]
    finalPolicy[ContentPolicy.CHILD_SRC] = [
      '*.paypal.com',
      'assets.braintreegateway.com',
    ]
    finalPolicy[ContentPolicy.FRAME_SRC] = [
      '*.paypal.com',
      'assets.braintreegateway.com',
    ]
    finalPolicy[ContentPolicy.CONNECT_SRC] = [
      SELF,
      'api.sandbox.braintreegateway.com',
      'api.braintreegateway.com',
      'client-analytics.sandbox.braintreegateway.com',
      'client-analytics.braintreegateway.com',
      '*.braintree-api.com',
      '*.paypal.com',
    ]
  }
  for (const policyKey in finalPolicy) {
    csp += `${policyKey} ${finalPolicy[policyKey as ContentPolicy].join(' ')};`
  }
  return csp
}

const defaultCSP = getCSP()

export default defineEventHandler((event) => {
  const url = event.node.req.url
  if (!url || import.meta.env.SKIP_CSP === 'true') {
    return
  }
  let csp = defaultCSP
  if (url.startsWith('/checkout/pay/card')) {
    csp = getCSP('card')
  } else if (url.startsWith('/checkout/pay/paypal')) {
    csp = getCSP('paypal')
  }
  event.node.res.setHeader('content-security-policy', csp)
})
