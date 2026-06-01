---
slug: poloniex
label: "Poloniex"
type: exchange
image: "/img/integrations/poloniex.svg"
tagline: "Poloniex trades, transfers, and balances, locally signed"
intro: "Connect Poloniex to rotki to import spot trades, deposits, withdrawals, and balances. rotki uses a read-only API key signed from your machine."
keywords: "poloniex portfolio tracker, poloniex tax report, poloniex cost basis"
features:
  - "Spot trades imported as swap events with matched spend and receive sides."
  - "Deposits and withdrawals imported as asset movements."
  - "Balance reconciliation across your Poloniex account."
limitations:
  - "Margin and derivatives history is not imported."
setup:
  - "In Poloniex, open Account → API Keys → Create new key."
  - "Grant read-only scopes and leave trade and withdrawal permissions off."
  - "Whitelist your IP if available."
  - "In rotki, open API Keys → Exchanges → Add Poloniex and paste the key and secret."
faq:
  - q: "Where are my Poloniex API keys sent?"
    a: "rotki is a local application: your Poloniex API key is stored on your computer and used to sign each request, which goes directly from your machine to Poloniex's API. No rotki-operated server ever sees the key or the request."
  - q: "Can rotki trade or withdraw on Poloniex?"
    a: "No. rotki only requests read-only scopes and never sends trade or withdrawal calls."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
