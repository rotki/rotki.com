---
slug: bitpanda
label: "Bitpanda"
type: exchange
image: "/img/integrations/bitpanda.svg"
tagline: "Bitpanda portfolio tracker - local, private, complete"
intro: "Connect Bitpanda to rotki to import trades, deposits, withdrawals, and balances."
metaDescription: "Connect Bitpanda to rotki to import trades, deposits, withdrawals, and balances."
keywords: "bitpanda portfolio tracker, bitpanda tax report, bitpanda cost basis"
features:
  - "Spot trades imported as swap events with fees."
  - "Crypto deposits and withdrawals from your Bitpanda wallets."
  - "Fiat deposits and withdrawals from your Bitpanda fiat wallets."
  - "Balance reconciliation against your Bitpanda wallet view."
setup:
  - "In Bitpanda, open Settings → API key → Generate API key."
  - "Select the read scopes you want rotki to use (balances, trades, transactions). Bitpanda API keys grant no trading or withdrawal capability."
  - "Save the key. Bitpanda shows it only once."
  - "In rotki, open API Keys → Exchanges → Add Bitpanda and paste the key."
faq:
  - q: "Can rotki place trades or withdraw on Bitpanda?"
    a: "No. Bitpanda API keys are read-only by design and rotki only issues read calls."
  - q: "Where is my Bitpanda API key sent?"
    a: "rotki is a local application: your Bitpanda API key is stored on your computer and sent in the request header to authenticate each call, which goes directly from your machine to Bitpanda's API. No rotki-operated server ever sees the key or the request."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
