---
slug: open-source-crypto-tax
label: "Open-source crypto tax software"
tagline: "Open-source crypto tax software you can audit and run yourself"
intro: "rotki is open-source crypto tax and accounting software. The entire application is public on GitHub, so you can read the code, verify exactly how your transactions are processed, and run it on your own computer instead of trusting a closed cloud service with your financial history."
metaDescription: "rotki is open-source crypto tax software you can audit on GitHub and run locally. Produce cost-basis tax reports on your own machine, not in a cloud."
keywords: "open source crypto tax software, open source crypto tax, auditable crypto tax tool, self-hosted crypto tax, crypto tax report local"
updatedAt: "June 2026"
ctaPlan: free
keyTakeaways:
  - "rotki's source code is public and auditable on GitHub, so you can verify how it calculates your taxes."
  - "Tax and accounting reports are generated locally on your machine, not uploaded to a vendor cloud."
  - "It supports common cost-basis methods and produces a detailed, exportable report of your taxable events."
  - "A free local tier covers core accounting and reporting; premium raises limits and adds features."
capabilities:
  - "Generates profit-and-loss and cost-basis reports from your exchange and on-chain history, processed on your own computer."
  - "Supports configurable accounting settings, including cost-basis method and the accounting period."
  - "Decodes on-chain activity into readable events so DeFi swaps, transfers and rewards are accounted for."
  - "Exports a detailed report of taxable events you can review or hand to your accountant."
  - "Is fully open source, so the calculation logic can be inspected and verified."
limitations:
  - "rotki gives you the underlying accounting and a detailed events report; it is not a substitute for advice from a tax professional in your jurisdiction."
  - "It does not pre-fill country-specific government tax forms the way some hosted services do. It produces the figures and an exportable report."
  - "You run rotki as a desktop app and keep your own backups, which is the trade-off for processing everything locally."
setup:
  - "Download and install the rotki desktop app for Windows, macOS or Linux."
  - "Add your exchanges with read-only API keys and your wallet addresses so rotki can build your history."
  - "Open the accounting settings and choose your cost-basis method and accounting period."
  - "Run the profit-and-loss report for the tax year and review the breakdown of taxable events."
  - "Export the report for your records or your accountant."
troubleshooting:
  - problem: "My tax report has gaps or unknown transactions."
    fix: "Gaps usually mean a source is missing. Make sure every exchange account and wallet address is added, then re-run the report. rotki flags events it could not fully process so you can resolve them."
  - problem: "The numbers do not match what I expected."
    fix: "Check the cost-basis method and accounting period in settings, since different methods produce different results. Because rotki is open source, the calculation logic is documented and auditable if you want to verify it."
relatedIntegrations:
  - slug: kraken
    label: "Kraken"
  - slug: coinbase
    label: "Coinbase"
  - slug: ethereum
    label: "Ethereum"
relatedComparisons:
  - slug: koinly
    label: "rotki vs Koinly"
  - slug: cointracking
    label: "rotki vs CoinTracking"
relatedFeatures:
  - slug: privacy-first-portfolio-management
    label: "Privacy-first portfolio management"
  - slug: local-first-crypto-accounting
    label: "Local-first crypto accounting"
faq:
  - q: "Is there open-source crypto tax software?"
    a: "Yes. rotki is open-source crypto tax and accounting software. Its full source code is public on GitHub, and it runs locally on your computer, so you can audit how it works and keep your data on your own machine."
  - q: "Does rotki file my taxes for me?"
    a: "No. rotki does the accounting and produces a detailed report of your taxable events and gains using your chosen cost-basis method. You or your accountant use that to file. It is not a replacement for professional tax advice."
  - q: "Where are my tax calculations performed?"
    a: "On your own computer. rotki reads your data and runs the accounting locally; the resulting reports are not uploaded to rotki-operated servers."
  - q: "Which cost-basis methods does rotki support?"
    a: "rotki supports FIFO, LIFO, HIFO and ACB (average cost basis). You choose the method and the accounting period in settings, and rotki applies it locally when generating your report."
  - q: "Is rotki free for tax reports?"
    a: "rotki has a free local tier that covers core accounting and reporting with some limits. A premium subscription raises those limits and adds features."
---

rotki approaches crypto taxes differently from most tools: it is open source, and it runs on your computer. That combination is deliberate. You are not uploading your transaction history to a service and trusting calculations you cannot see; you can read exactly how rotki turns your trades and on-chain activity into a tax report.

## Why open source matters for taxes

Tax calculations involve judgement calls: which cost-basis method to use, how to treat a transfer between your own wallets, how to value a DeFi reward. With closed software you have to take the vendor's word for how those decisions are made. Because rotki is open source, the accounting logic is public and auditable. If a number looks wrong, you can trace why.

## How rotki produces your report

rotki builds your history from the exchanges and wallets you add, decodes on-chain activity into readable events, and then applies your accounting settings to calculate gains and losses. It produces a detailed, exportable report of taxable events for the period you choose. All of that happens locally on your machine.

## Cost-basis methods rotki supports

rotki supports four cost-basis methods: FIFO (first in, first out), LIFO (last in, first out), HIFO (highest in, first out) and ACB (average cost basis). You pick the method and the accounting period in settings, and rotki applies it locally when it builds the report. The profit-and-loss report and its underlying events can be exported as CSV for your records or your accountant.

## What rotki does and does not do

rotki gives you accurate, auditable accounting and a clear report of taxable events. It does not pre-fill your country's specific government forms, and it is not tax advice. If you want to understand and own your crypto accounting while keeping it private, running open-source software locally is a solid basis for that.
