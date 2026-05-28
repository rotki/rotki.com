---
slug: binance-us
label: "Binance.US"
type: exchange
image: "/img/integrations/binance.svg"
tagline: "Binance.US portfolio tracker - local-first, read-only"
intro: "Connect Binance.US to rotki to import spot trades, deposits, and withdrawals via the API, with CSV import to fill the gaps Binance.US doesn't expose."
keywords: "binance us portfolio tracker, binance.us tax report, binance us cost basis, binance us csv import"
features:
  - "Spot trades - full Binance.US trade history once you select your market pairs."
  - "Deposits and withdrawals - reconciled against your balance history."
  - "CSV import - load Binance.US exported trade and history CSVs, including Convert history."
limitations:
  - "Binance.US does not expose the Convert API that Binance.com offers - Convert trades must be imported via CSV."
  - "Binance.US does not expose Simple Earn history via API."
  - "You must paste your market pairs into rotki - the API requires the pair to query trades."
setup:
  - "In Binance.US, open Account → API Management and click \"Create API\"."
  - "Restrict permissions to \"Enable Reading\" only. Leave trading and withdrawal permissions off."
  - "Optionally whitelist your IP."
  - "In rotki, open API Keys → Exchanges → Add Binance.US and paste the API key and secret."
  - "Paste your active market pairs (e.g. BTCUSD, ETHUSD)."
faq:
  - q: "Can I track Binance and Binance.US in the same rotki instance?"
    a: "Yes. They are separate integrations - add both with their own API keys."
  - q: "Where are my Binance.US API keys sent?"
    a: "rotki is a local application: your Binance.US API key is stored on your computer and used to sign each request, which goes directly from your machine to Binance.US's API. No rotki-operated server ever sees the key or the request."
  - q: "Can rotki trade or withdraw on Binance.US?"
    a: "No. rotki only requests read scopes and never sends trade or withdrawal calls."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
