---
slug: uphold
label: "Uphold"
type: exchange
image: "/img/integrations/uphold.svg"
tagline: "Uphold multi-asset trades from CSV, processed locally"
intro: "Import your Uphold transaction history into rotki via CSV: trades, deposits, withdrawals, and BAT reward payouts. CSV files are processed entirely on your computer."
metaDescription: "Import your Uphold transaction history into rotki via CSV: trades, deposits, withdrawals, and BAT reward payouts."
keywords: "uphold portfolio tracker, uphold tax report, uphold cost basis, uphold csv import, brave bat tracker"
features:
  - "CSV import of Uphold transaction history exports, including multi-asset trades."
  - "Trades imported with matched spend and receive sides."
  - "Integrates with the rest of your portfolio for unified PnL and tax reporting."
setup:
  - "In Uphold, open Activity → Documents → Generate Transaction History CSV."
  - "In rotki, open Import Data and select your Uphold file."
faq:
  - q: "Does my Uphold data leave my machine?"
    a: "No. CSV imports are parsed entirely on your computer; the file never leaves your machine."
  - q: "Are BAT (Brave) rewards tracked?"
    a: "Yes. BAT payouts received via Uphold are imported from the CSV as income events."
screenshots: []
ctaPlan: free
---
