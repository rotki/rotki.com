---
slug: bitmex
label: "BitMEX"
type: exchange
image: "/img/integrations/bitmex.svg"
tagline: "BitMEX historical records via wallet history CSV import"
intro: "BitMEX has shut down and its API is no longer available, so rotki no longer connects to it with an API key. If you traded there, import your saved BitMEX wallet history CSV to bring realised PnL, deposits, and withdrawals into your portfolio history and tax reports."
metaDescription: "BitMEX has shut down and its API is gone. Import your saved BitMEX wallet history CSV into rotki to keep realised PnL, deposits, and withdrawals in your tax reports."
keywords: "bitmex tax report, bitmex historical data, bitmex wallet history csv, bitmex realised pnl"
features:
  - "CSV import of the BitMEX wallet history: realised PnL rows become margin position records with their fees, and completed deposits and withdrawals become asset movements."
  - "BitMEX history you already pulled in through the old API connection stays in your database."
  - "Historical BitMEX activity feeds into the same cost basis and tax report as the rest of your portfolio."
limitations:
  - "There is no BitMEX API connection any more: the exchange shut down and its API is unavailable. rotki 1.44.1 removes saved BitMEX API keys when you upgrade."
  - "Amounts in the wallet history file are read as Bitcoin. Other currencies in the file are not supported."
  - "Only realised PnL rows and completed deposits and withdrawals are imported; rotki reports other transaction types as unsupported rows."
setup:
  - "Find the BitMEX wallet history CSV you saved before the shutdown."
  - "In rotki, open Import Data, select BitMEX, and import the wallet history file."
faq:
  - q: "Can I still connect BitMEX with an API key?"
    a: "No. BitMEX has shut down and its API is no longer available, so rotki removed the API connection. Use the wallet history CSV import instead."
  - q: "What happens to BitMEX history I already imported?"
    a: "It stays. rotki keeps existing BitMEX events in your database and includes them in reports."
  - q: "Where is my BitMEX CSV processed?"
    a: "Entirely on your computer. CSV imports never leave your machine."
screenshots: []
ctaPlan: free
---
