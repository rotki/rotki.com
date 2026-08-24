---
slug: coinex
label: "CoinEx"
type: exchange
image: "/img/integrations/coinex.svg"
tagline: "CoinEx portfolio tracker - read-only, runs on your computer"
intro: "Connect CoinEx to rotki to pull spot balances, finished spot orders, and deposits and withdrawals into one local portfolio, with withdrawal fees recorded separately from the amount sent."
metaDescription: "Connect CoinEx to rotki to pull spot balances, finished spot orders, and deposits and withdrawals, with withdrawal fees tracked separately."
keywords: "CoinEx portfolio tracker, CoinEx tax report, CoinEx accounting, CoinEx cost basis"
features:
  - "Spot balances read from your CoinEx spot account."
  - "Trades imported from CoinEx's finished spot order history."
  - "Deposits and withdrawals imported as asset movements."
  - "Withdrawal fees split out into their own fee event, so the amount that actually left your account is not overstated."
limitations:
  - "Only the spot account is covered. Margin and futures history is not imported."
  - "There is no CoinEx CSV importer. The integration works through the read-only API key."
setup:
  - "In CoinEx, open Account → API Management and create a new API key."
  - "Grant read-only permissions. Leave trading and withdrawal scopes off."
  - "Optionally restrict the key to your IP address."
  - "In rotki, open API Keys → Exchanges → Add CoinEx and paste the key and secret."
faq:
  - q: "Where are my CoinEx API keys sent?"
    a: "rotki is a local application: your CoinEx API key is stored on your computer and used to sign each request, which goes directly from your machine to CoinEx's API. No rotki-operated server ever sees the key or the request."
  - q: "Why is the withdrawal amount different from what CoinEx shows?"
    a: "CoinEx reports the requested amount including the fee. rotki records the amount that actually left the account and tracks the withdrawal fee as its own event, so the two are not double counted."
  - q: "Are futures positions tracked?"
    a: "No. The CoinEx integration covers the spot account: balances, spot trades, deposits, and withdrawals."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
