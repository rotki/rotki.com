---
slug: bitmex
label: "BitMEX"
type: exchange
image: "/img/integrations/bitmex.svg"
tagline: "BitMEX portfolio tracker - derivatives and margin, locally tracked"
intro: "Connect BitMEX to rotki to import your margin trading history, deposits, withdrawals, and balances."
metaDescription: "Connect BitMEX to rotki to import your margin trading history, deposits, withdrawals, and balances."
keywords: "bitmex portfolio tracker, bitmex tax report, bitmex margin tracker, bitmex perpetual swap tracker"
features:
  - "Margin trades imported as margin position records with realised P/L and fees."
  - "Deposits and withdrawals imported as asset movements."
  - "Balance reconciliation: BitMEX returns balances in satoshi-style integer units; rotki normalises them to real amounts using the asset's decimals."
setup:
  - "In BitMEX, open Account → API Keys → Create API Key."
  - "Leave only read access; do not grant the \"Order\" or \"Withdraw\" permissions."
  - "In rotki, open API Keys → Exchanges → Add BitMEX and paste the key and secret."
faq:
  - q: "Where are my BitMEX API keys sent?"
    a: "rotki is a local application: your BitMEX API key is stored on your computer and used to sign each request, which goes directly from your machine to BitMEX's API. No rotki-operated server ever sees the key or the request."
  - q: "Can rotki place trades or withdraw on BitMEX?"
    a: "No. rotki only requests read access and never sends order or withdrawal calls."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
