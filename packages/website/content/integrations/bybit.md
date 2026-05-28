---
slug: bybit
label: "Bybit"
type: exchange
image: "/img/integrations/bybit.svg"
tagline: "Bybit portfolio tracker - read-only, runs on your computer"
intro: "Connect Bybit to rotki to pull spot trades, deposits, withdrawals, and balances."
keywords: "bybit portfolio tracker, bybit tax report, bybit cost basis"
features:
  - "Spot trades imported from Bybit's order history."
  - "Deposits and withdrawals walked in 30-day windows over your full history."
  - "Balance reconciliation across your Bybit wallet (unified or classic) and funding account."
limitations:
  - "Bybit's deposit/withdrawal API enforces a maximum 30-day window per request, so the first sync over a long history takes some time."
  - "Trade fees from the execution-list endpoint are not yet imported; trades are sourced from the order history."
  - "Bybit's API does not expose balances locked in bots, so those are not included."
  - "Margin/derivatives history is not imported."
setup:
  - "In Bybit, open Account → API → Create New Key."
  - "Choose System-generated API Keys and set permissions to Read-Only. Leave trading and withdrawal scopes off."
  - "Optionally whitelist your IP for additional safety."
  - "In rotki, open API Keys → Exchanges → Add Bybit and paste the key and secret."
faq:
  - q: "Where are my Bybit API keys sent?"
    a: "rotki is a local application: your Bybit API key is stored on your computer and used to sign each request, which goes directly from your machine to Bybit's API. No rotki-operated server ever sees the key or the request."
  - q: "Why does the first sync take a while?"
    a: "Bybit limits its deposit and withdrawal endpoints to a 30-day window per request. rotki walks through your history in chunks since the account's earliest activity."
  - q: "Can rotki place trades or withdraw funds?"
    a: "No. rotki only asks for read-only scopes and never sends trade or withdrawal calls."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
