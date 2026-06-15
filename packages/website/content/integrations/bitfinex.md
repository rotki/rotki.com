---
slug: bitfinex
label: "Bitfinex"
type: exchange
image: "/img/integrations/bitfinex.svg"
tagline: "Bitfinex portfolio tracker - across exchange, margin, and funding wallets"
intro: "Connect Bitfinex to rotki to import trades, deposits, and withdrawals, with balances tracked separately across exchange, margin, and funding wallets. Authenticate with a read-only API key; rotki processes everything locally on your machine."
metaDescription: "Connect Bitfinex to rotki to import trades, deposits, and withdrawals, with balances tracked separately across exchange, margin, and funding wallets."
keywords: "bitfinex portfolio tracker, bitfinex tax report, bitfinex cost basis, bitfinex spot tracker"
features:
  - "Spot trades: full trade history including legacy pairs."
  - "Deposits and withdrawals with fees preserved."
  - "Balance reconciliation across all three Bitfinex wallet types (exchange, margin, funding)."
limitations:
  - "Margin position history (funding fees, P/L, interest events) is not currently fetched - only balances on the margin and funding wallets are reported."
setup:
  - "In Bitfinex, open API → Create New Key."
  - "Grant read permissions for Account History and Wallets. Leave Orders and Withdrawals disabled."
  - "Optionally restrict the key to your IP."
  - "In rotki, open API Keys → Exchanges → Add Bitfinex and paste the key and secret."
faq:
  - q: "Does rotki separate exchange, margin, and funding wallets?"
    a: "Yes. Bitfinex returns wallet type per balance, and rotki preserves that distinction in your portfolio view."
  - q: "Where are my Bitfinex API keys sent?"
    a: "rotki is a local application: your Bitfinex API key is stored on your computer and used to sign each request, which goes directly from your machine to Bitfinex's API. No rotki-operated server ever sees the key or the request."
  - q: "Can rotki place trades or withdraw from Bitfinex?"
    a: "No. rotki only requests read scopes and never sends order or withdrawal calls."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
