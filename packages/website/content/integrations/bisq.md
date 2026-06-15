---
slug: bisq
label: "Bisq"
type: exchange
image: "/img/integrations/bisq.svg"
tagline: "Bisq portfolio tracker - peer-to-peer trades, locally tracked"
intro: "Bisq is a decentralised, peer-to-peer Bitcoin exchange that runs on your machine, a natural fit for rotki's local-first approach. Import your Bisq trade history via CSV; everything is processed on your computer."
metaDescription: "Bisq is a decentralised, peer-to-peer Bitcoin exchange that runs on your machine, a natural fit for rotki's local-first approach."
keywords: "bisq portfolio tracker, bisq tax report, p2p bitcoin tracker, decentralised exchange tracker"
features:
  - "CSV import for Bisq trade history exports."
  - "Peer-to-peer trades imported as swap events with buy/sell sides and trade fees preserved."
  - "Imported trades sit alongside the rest of your portfolio for unified PnL."
setup:
  - "In Bisq, export your trade history as CSV from your trade history view."
  - "In rotki, open Import Data and select the Bisq trades file."
faq:
  - q: "Why is Bisq CSV-only?"
    a: "Bisq is a desktop application without a remote API, it runs entirely on your computer. CSV export is the canonical way to share data with other tools."
  - q: "Does my Bisq data leave my machine?"
    a: "No. Both Bisq and rotki are local applications, and the CSV import is read straight from disk. Nothing about your trades is sent to any rotki-operated server."
screenshots: []
ctaPlan: free
---
