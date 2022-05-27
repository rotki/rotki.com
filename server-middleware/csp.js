const SELF = "'self'"
const UNSAFE_INLINE = "'unsafe-inline'"
const UNSAFE_EVAL = "'unsafe-eval'"
const NONE = "'none'"

const policy = {
  'frame-ancestors': [SELF],
  'block-all-mixed-content': [],
  'default-src': [SELF],
  'script-src': [
    SELF,
    UNSAFE_INLINE,
    UNSAFE_EVAL,
    'https://www.recaptcha.net',
    'https://recaptcha.net',
    'https://www.gstatic.com/recaptcha/',
    'https://www.gstatic.cn/recaptcha/',
    'https://www.google.com/recaptcha/',
  ],
  'style-src': [SELF, UNSAFE_INLINE, 'fonts.googleapis.com'],
  'object-src': [NONE],
  'frame-src': [
    '*.recaptcha.net',
    'recaptcha.net',
    'https://www.google.com/recaptcha/',
    'https://recaptcha.google.com',
  ],
  'child-src': [NONE],
  'img-src': [SELF, UNSAFE_INLINE, 'data:', 'www.gstatic.com/recaptcha'],
  'connect-src': [SELF, 'api.github.com'],
  'base-uri': [SELF],
  'form-action': [SELF],
  'worker-src': [SELF, 'www.recaptcha.net'],
  'font-src': [SELF, 'fonts.gstatic.com'],
}

function getCSP(page) {
  let csp = ''
  const finalPolicy = { ...policy }
  if (page === 'card') {
    finalPolicy['frame-src'] = ['*']
    finalPolicy['script-src'] = [SELF, UNSAFE_INLINE, UNSAFE_EVAL, '*']
    finalPolicy['connect-src'] = [SELF, '*']
    finalPolicy['form-action'] = [SELF, '*']
  } else if (page === 'paypal') {
    finalPolicy['script-src'] = [
      ...finalPolicy['script-src'],
      'js.braintreegateway.com',
      'assets.braintreegateway.com',
      '*.paypal.com',
      'www.paypalobjects.com',
    ]
    finalPolicy['img-src'] = [
      ...finalPolicy['img-src'],
      'assets.braintreegateway.com',
      'checkout.paypal.com',
    ]
    finalPolicy['child-src'] = ['*.paypal.com', 'assets.braintreegateway.com']
    finalPolicy['frame-src'] = ['*.paypal.com', 'assets.braintreegateway.com']
    finalPolicy['connect-src'] = [
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
    csp += `${policyKey} ${finalPolicy[policyKey].join(' ')};`
  }
  return csp
}

const defaultCSP = getCSP()

export default function (req, res, next) {
  const url = req.url
  let csp = defaultCSP
  if (url.startsWith('/checkout/pay/card')) {
    csp = getCSP('card')
  } else if (url.startsWith('/checkout/pay/paypal')) {
    csp = getCSP('paypal')
  }
  res.setHeader('content-security-policy', csp)
  next()
}
