---
slug: blockfi
label: "BlockFi"
type: exchange
image: "/img/integrations/blockfi.svg"
tagline: "BlockFi historical records for tax and bankruptcy claims"
intro: "BlockFi filed for bankruptcy in November 2022 and ceased operations. If you held assets there, rotki can ingest your historical BlockFi trades, interest, deposits, and withdrawals from CSV exports so they appear in your portfolio history and tax reports."
keywords: "blockfi historical records, blockfi tax report, blockfi interest income, blockfi bankruptcy records"
features:
  - "CSV import for BlockFi trading activity (trades export)."
  - "CSV import for BlockFi transactions (deposits, withdrawals, interest payments, bonuses, referrals)."
  - "Interest, bonus, and referral payments imported as receive events that flow into your portfolio and tax report."
limitations:
  - "BlockFi is no longer operational. There is no live API; rotki supports historical CSV imports only."
setup:
  - "Locate your saved BlockFi trading activity and transaction CSVs."
  - "In rotki, open Import Data and select the BlockFi file (trades and transactions are imported separately)."
faq:
  - q: "Is BlockFi still active?"
    a: "No. BlockFi filed for bankruptcy in November 2022. rotki supports it for historical accounting only."
  - q: "Are BlockFi interest payments included in my tax report?"
    a: "Yes. Imported interest, bonus, and referral payments are treated as receive events and flow through to your PnL and tax exports."
  - q: "Where is my BlockFi CSV processed?"
    a: "Entirely on your computer. CSV imports never leave your machine."
screenshots: []
ctaPlan: free
---
