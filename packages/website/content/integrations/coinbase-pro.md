---
slug: coinbase-pro
label: "Coinbase Pro"
type: exchange
image: "/img/integrations/coinbasepro.svg"
tagline: "Coinbase Pro historical records via CSV import"
intro: "Coinbase Pro was retired by Coinbase in late 2022. If you traded there, rotki can ingest your historical trades and transfers from the Coinbase Pro CSV export and feed them into your portfolio history and tax reports."
keywords: "coinbase pro portfolio tracker, coinbase pro tax report, coinbase pro historical data, coinbase pro csv"
features:
  - "CSV import of Coinbase Pro account statements: trades, deposits, and withdrawals."
  - "Trade rows are grouped by Trade ID so each fill becomes a single swap event."
  - "Historical Coinbase Pro activity feeds into the same cost basis and tax report as the rest of your portfolio."
limitations:
  - "Coinbase Pro was retired by Coinbase; for trades after the shutdown, use the Coinbase integration with Advanced Trade."
  - "There is no live Coinbase Pro API; rotki supports CSV imports only."
setup:
  - "Export your Coinbase Pro account statement from the Coinbase reports archive (or use a copy you saved before the shutdown)."
  - "In rotki, open Import Data and select the Coinbase Pro file."
faq:
  - q: "Is Coinbase Pro still active?"
    a: "No. Coinbase retired Coinbase Pro in late 2022 and merged trading into Coinbase Advanced Trade. rotki supports it for historical accounting only."
  - q: "Should I use the Coinbase integration instead?"
    a: "For activity after the shutdown, yes. Use the Coinbase integration for current trades and keep your historical Coinbase Pro data in this separate entry."
  - q: "Where is my Coinbase Pro CSV processed?"
    a: "Entirely on your computer. CSV imports never leave your machine."
screenshots: []
ctaPlan: free
---
