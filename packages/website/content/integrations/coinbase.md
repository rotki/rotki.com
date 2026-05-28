---
slug: coinbase
label: "Coinbase"
type: exchange
image: "/img/integrations/coinbase.svg"
tagline: "Coinbase portfolio tracker - your data stays local"
intro: "Connect your Coinbase account to rotki and import trades, conversions, deposits, withdrawals, and staking rewards. rotki talks to Coinbase directly from your computer with a read-only API key."
keywords: "coinbase portfolio tracker, coinbase tax report, coinbase cost basis, coinbase staking tracker, coinbase advanced trade tracker"
features:
  - "Simple buys and sells imported as swap events."
  - "Coinbase Advanced Trade order fills imported (multiple fills under one order are folded into the single trade)."
  - "Coin-to-coin conversions imported as a sell of the source asset and a buy of the destination, with the Coinbase conversion fee captured."
  - "External transfers (deposits/withdrawals) and internal Coinbase transfers (exchange_deposit / exchange_withdrawal) imported as asset movements."
  - "Staking rewards, inflation rewards, interest, cardbuyback, and staking/unstaking transfers recognised."
  - "Balance reconciliation across all account portfolios."
setup:
  - "In Coinbase, open Settings → API and click New API Key."
  - "Select the accounts you want rotki to see and grant view (read-only) scopes only."
  - "Save the key. Coinbase shows the secret only once; copy it now."
  - "In rotki, open API Keys → Exchanges → Add Coinbase and paste the key and secret."
faq:
  - q: "Does rotki support Coinbase Advanced Trade?"
    a: "Yes. Advanced Trade order fills are picked up alongside simple buys/sells through the same API key."
  - q: "Are Coinbase staking rewards included in tax reports?"
    a: "Yes. Staking rewards, inflation rewards, and interest are recognised as income events and flow into PnL and tax exports."
  - q: "Where are my Coinbase API keys sent?"
    a: "rotki is a local application: your Coinbase API key is stored on your computer and used to sign each request, which goes directly from your machine to Coinbase's API. No rotki-operated server ever sees the key or the request."
  - q: "Can rotki move my coins or place trades?"
    a: "No. rotki only requests view scopes and never sends trade or withdrawal calls."
  - q: "What about Coinbase Pro / Coinbase Prime?"
    a: "Coinbase Pro and Coinbase Prime are separate integrations in rotki. Coinbase Pro was shut down by Coinbase in late 2022; rotki retains its historical support."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
