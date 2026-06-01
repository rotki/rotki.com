---
slug: nexo
label: "Nexo"
type: exchange
image: "/img/integrations/nexo.svg"
tagline: "Nexo interest, loans, and trades from CSV, processed locally"
intro: "Import your Nexo history into rotki via CSV: interest accruals, deposits, withdrawals, conversions, and loan events. CSV files are processed entirely on your computer."
keywords: "nexo portfolio tracker, nexo tax report, nexo interest income, nexo csv import, nexo loan tracker"
features:
  - "CSV import of Nexo's transaction history export."
  - "Interest, cashback, dividend, and bonus entries recognised as income events for tax reporting."
  - "Deposits, withdrawals, and conversions imported."
  - "Loan repayments and liquidations recognised where present in the CSV."
limitations:
  - "Nexo is integrated via CSV import only; there is no real-time API integration."
setup:
  - "In Nexo, export your transaction history as CSV."
  - "In rotki, open Import Data and select your Nexo file."
faq:
  - q: "Is Nexo interest income included in my tax report?"
    a: "Yes. rotki treats Nexo interest entries as income events and includes them in PnL and tax exports."
  - q: "Does my Nexo data leave my machine?"
    a: "No. CSV imports are parsed entirely on your computer; the file never leaves your machine."
  - q: "Why is Nexo not available via API?"
    a: "Nexo does not offer a stable public account API, so CSV import is the supported path."
screenshots: []
ctaPlan: free
---
