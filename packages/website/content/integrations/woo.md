---
slug: woo
label: "WOO X"
type: exchange
image: "/img/integrations/woo.svg"
tagline: "WOO X trades, transfers, and balances, locally signed"
intro: "Connect WOO X to rotki to import spot trades, deposits, withdrawals, and balances. rotki uses a read-only API key signed from your machine."
metaDescription: "Connect WOO X to rotki to import spot trades, deposits, withdrawals, and balances. rotki uses a read-only API key signed from your machine."
keywords: "woo portfolio tracker, woo x portfolio tracker, woo tax report, woo cost basis"
features:
  - "Spot trades imported as swap events from your WOO X account."
  - "Deposits and withdrawals imported as asset movements."
  - "Balance reconciliation across your WOO X account."
limitations:
  - "Margin and derivatives history is not imported."
setup:
  - "In WOO X, open the profile menu → Subaccounts and API and create a new API key."
  - "Set permissions to \"Read\" only and leave trade and transfer permissions off."
  - "Whitelist your IP for additional safety."
  - "In rotki, open API Keys → Exchanges → Add WOO X and paste the key and secret."
faq:
  - q: "Where are my WOO X API keys sent?"
    a: "rotki is a local application: your WOO X API key is stored on your computer and used to sign each request, which goes directly from your machine to WOO X's API. No rotki-operated server ever sees the key or the request."
  - q: "Can rotki trade or withdraw on WOO X?"
    a: "No. rotki only requests Read-only scopes and never sends trade or withdrawal calls."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
