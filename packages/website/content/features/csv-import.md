---
slug: csv-import
label: "CSV import"
tagline: "Import exchange and wallet history into rotki from CSV files"
intro: "rotki can import your crypto history from CSV files, so activity from exchanges and sources that rotki does not read through an API still ends up in your local portfolio and accounting. Imports are processed on your own computer and stored in your local encrypted database."
metaDescription: "Import crypto history into rotki from CSV files. Bring in exchange and wallet data that has no API connection, processed locally on your own machine."
keywords: "crypto csv import, import csv crypto tax, exchange csv import, rotki csv import, import transactions csv crypto"
updatedAt: "June 2026"
docsUrl: "https://docs.rotki.com/usage-guides/history/import-data.html"
ctaPlan: free
keyTakeaways:
  - "rotki imports transaction history from CSV files for sources without a live API connection."
  - "Imported data is processed locally and stored in your encrypted database on your own machine."
  - "CSV import complements rotki's read-only API and on-chain connections to fill in the gaps."
  - "Imported events are accounted for alongside the rest of your portfolio and tax reports."
capabilities:
  - "Imports historical trades and transactions from CSV files exported by exchanges and other tools."
  - "Supports import formats for several exchanges, plus a generic import for custom data."
  - "Processes every import locally, so your files are read on your machine, not uploaded to a cloud."
  - "Merges imported activity with API and on-chain data into one portfolio and accounting view."
  - "Lets you review and edit imported events so your records stay accurate."
limitations:
  - "CSV exports differ between providers; a format rotki does not recognise may need to be mapped to the generic importer."
  - "A CSV is a snapshot. Unlike a read-only API key, it will not keep updating as you trade, so you re-import to stay current."
  - "Incomplete or inconsistent exports can produce gaps that need a manual fix after import."
setup:
  - "Export your transaction history as CSV from the exchange or tool."
  - "In rotki, open the import section and choose the matching exchange importer, or the generic importer for custom data."
  - "Select your CSV file and run the import."
  - "Review the imported events for any rows that need mapping or correction."
  - "Confirm the activity appears in your portfolio and reports."
troubleshooting:
  - problem: "My CSV is rejected or columns are not recognised."
    fix: "The export format probably does not match the selected importer. Use the generic importer and map the columns, or adjust the file to the expected format, then import again."
  - problem: "Imported amounts or dates look off."
    fix: "Check the timezone and decimal formatting in the source export, and confirm you picked the right importer. You can edit imported events in rotki to correct individual rows."
relatedIntegrations:
  - slug: kraken
    label: "Kraken"
  - slug: binance
    label: "Binance"
  - slug: coinbase
    label: "Coinbase"
relatedComparisons:
  - slug: koinly
    label: "rotki vs Koinly"
  - slug: cointracking
    label: "rotki vs CoinTracking"
relatedFeatures:
  - slug: local-first-crypto-accounting
    label: "Local-first crypto accounting"
  - slug: open-source-crypto-tax
    label: "Open-source crypto tax software"
faq:
  - q: "Can I import crypto transactions into rotki from CSV?"
    a: "Yes. rotki imports transaction history from CSV files, including formats for several exchanges and a generic importer for custom data. Imports are processed locally on your machine."
  - q: "When should I use CSV import instead of an API connection?"
    a: "Use CSV import for sources rotki does not read through a read-only API, or for historical data that predates your API key. For supported exchanges, a read-only API key keeps updating automatically, so it is usually the better default."
  - q: "Are my CSV files uploaded anywhere?"
    a: "No. rotki reads and processes your CSV files locally and stores the result in your encrypted database. Your files are not uploaded to rotki-operated servers."
  - q: "Which exchanges and tools can I import by CSV?"
    a: "rotki has dedicated CSV importers for exchanges such as Binance, KuCoin, Bitstamp, Bittrex, Coinbase Pro, Crypto.com, BitMEX, Uphold, Bisq, ShapeShift, BlockFi and Nexo, plus tax and portfolio tools including CoinTracking, CoinLedger, Blockpit and Bitcoin.tax. A generic CSV format covers anything else."
  - q: "What if my exchange's CSV format is not supported?"
    a: "Use the generic importer and map your columns to the expected fields, or adjust the export to match. You can then review and edit the imported events."
---

Not every source can be connected with an API key, and you often have older history that predates any key you hold. CSV import is how rotki fills those gaps: you bring in the file, rotki reads it on your machine, and the activity joins the rest of your portfolio and accounting.

## When CSV import is the right tool

For supported exchanges, a read-only API key is usually the better default because it keeps updating as you trade. CSV import is for everything else: exchanges or tools without an API connection in rotki, accounts you have closed, or historical data you exported once. It is what lets you complete your records.

## How importing works

You export a CSV from the source, pick the matching importer in rotki (or the generic importer for custom data), and run it. Because exports differ between providers, a format rotki does not recognise can be mapped through the generic importer. Everything is processed locally and stored in your encrypted database, and you can review and edit imported events afterwards.

## Which sources have a built-in importer

rotki ships dedicated CSV importers for a range of exchanges and tools, including Binance, KuCoin, Bitstamp, Bittrex, Coinbase Pro, Crypto.com, BitMEX, Uphold, Bisq, ShapeShift, BlockFi and Nexo. It also imports from other tax and portfolio tools, including CoinTracking, CoinLedger, Blockpit and Bitcoin.tax, which helps if you are moving over from one of them. For anything without a dedicated importer, the generic rotki CSV format lets you map your own columns.

## Keeping it accurate

A CSV is a snapshot, so you re-import to stay current, and messy exports can leave gaps worth a quick manual fix. Once imported, the data is accounted for alongside your API and on-chain activity, so your portfolio view and tax reports reflect your full history, all without anything leaving your computer.
