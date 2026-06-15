---
slug: okx
label: "OKX"
type: exchange
image: "/img/integrations/okx.svg"
tagline: "OKX trades, conversions, and balances, locally signed"
intro: "Connect OKX to rotki to import spot trades, conversions, deposits, withdrawals, and balances. rotki uses a read-only API key signed from your machine."
metaDescription: "Connect OKX to rotki to import spot trades, conversions, deposits, withdrawals, and balances. rotki uses a read-only API key signed from your machine."
keywords: "okx portfolio tracker, okx tax report, okx cost basis"
features:
  - "Spot trades imported as swap events from your OKX account."
  - "OKX conversions imported as trades."
  - "Deposits and withdrawals imported as asset movements."
  - "Balance reconciliation across your OKX account."
limitations:
  - "Margin and derivatives history is not imported."
setup:
  - "In OKX, open Account → API → Create V5 API Key."
  - "Set permissions to \"Read\" only. Leave trade and withdraw permissions disabled."
  - "Set an API passphrase - you'll need it in rotki."
  - "Whitelist your IP for additional safety."
  - "In rotki, open API Keys → Exchanges → Add OKX and paste the key, secret, and passphrase."
faq:
  - q: "Why does OKX need a passphrase?"
    a: "OKX uses a user-set passphrase as part of its API signing. rotki needs the API key, secret, and passphrase to authenticate."
  - q: "Where are my OKX API keys sent?"
    a: "rotki is a local application: your OKX API key is stored on your computer and used to sign each request, which goes directly from your machine to OKX's API. No rotki-operated server ever sees the key or the request."
  - q: "Can rotki trade or withdraw on OKX?"
    a: "No. rotki only requests the Read scope and never sends trading or withdrawal calls."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
