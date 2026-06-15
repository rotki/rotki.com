---
slug: bitstamp
label: "Bitstamp"
type: exchange
image: "/img/integrations/bitstamp.svg"
tagline: "Bitstamp portfolio tracker - local, private, and complete"
intro: "Connect Bitstamp to rotki to import trades, deposits, and withdrawals. Authenticate with a read-only API key, or import Bitstamp's transaction CSV export. Everything is processed on your machine."
metaDescription: "Connect Bitstamp to rotki to import trades, deposits, and withdrawals."
keywords: "bitstamp portfolio tracker, bitstamp tax report, bitstamp cost basis, bitstamp csv import"
features:
  - "Spot trades imported as swap events with fees in the settlement currency."
  - "Deposits and withdrawals with on-chain addresses and transaction IDs where Bitstamp returns them."
  - "CSV import for Bitstamp transaction exports, useful for backfilling old history."
  - "Balance reconciliation against your Bitstamp account."
setup:
  - "In Bitstamp, open Account → Security → API Access and create a new API key."
  - "Grant only read permissions (account balance, user transactions). Leave trading and withdrawal permissions off."
  - "Approve the key by email."
  - "In rotki, open API Keys → Exchanges → Add Bitstamp and paste the key and secret."
  - "Alternatively, in rotki open Import Data and select Bitstamp to import a transaction CSV."
faq:
  - q: "Can I import Bitstamp data via CSV?"
    a: "Yes. rotki accepts Bitstamp's transaction CSV export, which is useful if you'd rather not generate an API key or want very old history."
  - q: "Where are my Bitstamp API keys sent?"
    a: "rotki is a local application: your Bitstamp API key is stored on your computer and used to sign each request, which goes directly from your machine to Bitstamp's API. No rotki-operated server ever sees the key or the request."
  - q: "Can rotki withdraw from Bitstamp?"
    a: "No. rotki only requests read scopes and never sends withdrawal calls."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
