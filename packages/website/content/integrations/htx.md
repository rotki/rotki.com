---
slug: htx
label: "HTX"
type: exchange
image: "/img/integrations/htx.svg"
tagline: "HTX (formerly Huobi) spot trades, transfers, and balances, locally signed"
intro: "Connect HTX (formerly Huobi) to rotki to import spot trades, deposits, withdrawals, and balances. rotki uses a read-only API key signed from your machine."
metaDescription: "Connect HTX (formerly Huobi) to rotki to import spot trades, deposits, withdrawals, and balances. rotki uses a read-only API key signed from your machine."
keywords: "htx portfolio tracker, huobi portfolio tracker, htx tax report, htx cost basis"
features:
  - "Spot trades imported as swap events from the HTX match-results endpoint."
  - "Deposits and withdrawals imported from the deposit-withdraw endpoint as asset movements."
  - "Balance reconciliation against your HTX spot, OTC, and point account types."
limitations:
  - "HTX's spot trade-history endpoint exposes roughly the last 120 days of trades; older history is not retrievable via the connector. If you need older history, fall back to manual entry or rotki's generic CSV import."
  - "Margin/derivatives history is not imported."
setup:
  - "In HTX, open Account → API Management → Create."
  - "Set permissions to Read Only. Leave trading and withdrawal scopes off."
  - "Optionally whitelist your IP for additional safety."
  - "In rotki, open API Keys → Exchanges → Add HTX and paste the key and secret."
faq:
  - q: "Is HTX the same as Huobi?"
    a: "Yes. HTX is Huobi's rebranded name (renamed in 2023). The API and account structure are unchanged."
  - q: "Why is my older trade history missing?"
    a: "HTX's spot trade-history endpoint only returns roughly the last 120 days. For older history, supplement with rotki's generic CSV import or manual entry."
  - q: "Where are my HTX API keys sent?"
    a: "rotki is a local application: your HTX API key is stored on your computer and used to sign each request, which goes directly from your machine to HTX's API. No rotki-operated server ever sees the key or the request."
  - q: "Can rotki trade or withdraw on HTX?"
    a: "No. rotki only requests Read Only scopes and never sends trade or withdrawal calls."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
