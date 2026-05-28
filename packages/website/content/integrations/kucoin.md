---
slug: kucoin
label: "KuCoin"
type: exchange
image: "/img/integrations/kucoin.svg"
tagline: "KuCoin trades, transfers, and balances, locally signed"
intro: "Connect your KuCoin account to rotki to import spot trades (current and v1 legacy formats), deposits, withdrawals, and balances. rotki uses a read-only API key signed from your machine."
keywords: "kucoin portfolio tracker, kucoin tax report, kucoin cost basis, kucoin csv import"
features:
  - "Spot trades imported as swap events; both the current API responses and the older v1 trade format are handled."
  - "Deposits and withdrawals imported as asset movements, including paginated historical entries."
  - "CSV import of KuCoin trade exports for periods before your API key existed."
limitations:
  - "KuCoin margin trades are not imported; only spot trades, deposits, and withdrawals are retrieved."
setup:
  - "In KuCoin, open Account → API Management → Create API."
  - "Set permission to \"General\" (read-only). Leave \"Trade\" and \"Transfer\" off."
  - "Set an API passphrase when prompted - you'll need it in rotki."
  - "Whitelist your IP if you want extra safety."
  - "In rotki, open API Keys → Exchanges → Add KuCoin and paste the key, secret, and passphrase."
faq:
  - q: "Where are my KuCoin API keys sent?"
    a: "rotki is a local application: your KuCoin API key is stored on your computer and used to sign each request, which goes directly from your machine to KuCoin's API. No rotki-operated server ever sees the key or the request."
  - q: "What does the API passphrase do?"
    a: "KuCoin requires a user-set passphrase alongside the key and secret as an additional signing factor. rotki needs all three to authenticate API calls."
  - q: "Can rotki withdraw from my KuCoin account?"
    a: "No. rotki only requests the General (read-only) scope and never sends withdrawal or transfer calls."
  - q: "Are my old v1 trades imported?"
    a: "Yes. rotki detects KuCoin v1 trade entries and imports them with the correct timestamp and pair conversion."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
