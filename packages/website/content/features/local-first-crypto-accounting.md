---
slug: local-first-crypto-accounting
label: "Local-first crypto accounting"
tagline: "Local-first crypto accounting that keeps your books on your machine"
intro: "rotki is a local-first crypto accounting tool. It reconciles your trades, transfers and on-chain activity into a complete picture of your portfolio and produces accounting and tax reports, all on your own computer, with your data stored in a local encrypted database."
metaDescription: "rotki is local-first crypto accounting software. Reconcile trades, transfers and on-chain activity and produce reports on your own machine, not a cloud."
keywords: "local-first crypto accounting, local crypto accounting software, self-hosted crypto accounting, crypto bookkeeping local, offline crypto accounting"
updatedAt: "June 2026"
ctaPlan: free
keyTakeaways:
  - "rotki runs locally and keeps your accounting data in an encrypted database on your own device."
  - "It reconciles exchange and on-chain activity into readable events with full profit-and-loss accounting."
  - "Accounting settings such as cost-basis method and period are configurable and applied on your machine."
  - "A free local tier covers core accounting; premium raises limits and adds features."
capabilities:
  - "Aggregates balances and transactions across exchanges, wallets and chains into one local ledger."
  - "Decodes on-chain activity into readable, categorised events instead of raw hashes."
  - "Calculates profit and loss using configurable accounting settings, processed locally."
  - "Lets you add manual entries and edit events to keep your books accurate."
  - "Produces exportable reports for review or for your accountant."
limitations:
  - "rotki provides the accounting and reports; it is not a replacement for advice from a tax professional."
  - "It is a desktop app, not a hosted multi-user bookkeeping platform."
  - "You keep your own backups of the local database. Premium adds optional encrypted sync."
setup:
  - "Install the rotki desktop app and create a local, password-protected account."
  - "Connect exchanges with read-only API keys and add your wallet addresses."
  - "Let rotki import and decode your history into events."
  - "Set your cost-basis method and accounting period in settings."
  - "Review events, add any manual entries, then generate and export your report."
troubleshooting:
  - problem: "Some transactions are uncategorised or look wrong."
    fix: "Open the event, check the detected type, and correct it if needed. rotki lets you edit events and add manual entries so your books stay accurate; re-run the report afterwards."
  - problem: "Transfers between my own accounts look like taxable disposals."
    fix: "Make sure both the sending and receiving accounts or addresses are added to rotki so it can match the two sides of the transfer and treat it as an internal movement rather than a disposal."
relatedIntegrations:
  - slug: kraken
    label: "Kraken"
  - slug: binance
    label: "Binance"
  - slug: ethereum
    label: "Ethereum"
relatedComparisons:
  - slug: cointracking
    label: "rotki vs CoinTracking"
  - slug: koinly
    label: "rotki vs Koinly"
relatedFeatures:
  - slug: open-source-crypto-tax
    label: "Open-source crypto tax software"
  - slug: defi-portfolio-tracking
    label: "DeFi portfolio tracking"
faq:
  - q: "What is local-first crypto accounting?"
    a: "It means your books are kept and processed on your own device rather than in a cloud service. rotki reads your accounts, reconciles activity, and runs the accounting locally, storing the data in an encrypted database on your machine."
  - q: "Can rotki handle transfers between my own wallets?"
    a: "Yes. If both sides are added to rotki, it matches the sending and receiving addresses and treats the movement as an internal transfer rather than a taxable disposal."
  - q: "Does my accounting data leave my computer?"
    a: "No, not by default. rotki processes and stores your accounting locally. Optional premium sync uploads only data already encrypted on your device."
  - q: "Is rotki free?"
    a: "rotki has a free local tier covering core accounting and reporting with some limits, plus a premium subscription for higher limits and extra features."
---

Crypto accounting means turning a messy stream of trades, transfers and on-chain events into a coherent ledger you can report from. rotki does that work locally: it lives on your computer, reads your accounts, and keeps the resulting books in an encrypted database that never has to leave your machine.

## Building an accurate ledger

rotki pulls balances and transactions from the exchanges and wallets you add and decodes on-chain activity into readable, categorised events. Where automation needs a hand, for example an unusual transaction or an off-exchange trade, you can edit events and add manual entries so the ledger reflects reality.

## Accounting you control

You choose the cost-basis method and accounting period, and rotki applies them on your machine to calculate profit and loss. Because it is local and open source, you can see how each figure is derived rather than relying on calculations you cannot inspect.

## Who it is for

rotki gives you the accounting foundation and exportable reports. It is not multi-user bookkeeping software and it is not tax advice. For an individual or a small operation that wants accurate, private, auditable crypto books, doing the accounting locally is a good fit.
