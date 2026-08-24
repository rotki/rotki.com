---
slug: bit2me
label: "Bit2Me"
type: exchange
image: "/img/integrations/bit2me.png"
tagline: "Bit2Me portfolio tracker - read-only, runs on your computer"
intro: "Connect Bit2Me to rotki to pull pocket balances, spot and brokerage trades, deposits and withdrawals, Earn movements, and airdrops into one local portfolio."
metaDescription: "Connect Bit2Me to rotki to pull balances, spot and brokerage trades, deposits, withdrawals, Earn movements, and airdrops."
keywords: "Bit2Me portfolio tracker, Bit2Me tax report, Bit2Me accounting, Bit2Me cost basis"
features:
  - "Balances across all your Bit2Me pockets, accumulated per asset when a currency has more than one pocket."
  - "Spot trades from Bit2Me's trading history, plus brokerage buys and sells derived from your transaction history."
  - "Deposits and withdrawals imported as asset movements."
  - "Earn (staking) movements tracked as transfers between your pocket and the Earn program, in both directions."
  - "Airdrops received on Bit2Me recorded as their own event type rather than as unexplained incoming balance."
limitations:
  - "Bit2Me does not expose margin positions through its API, so margin history is not imported."
  - "There is no Bit2Me CSV importer. The integration works through the read-only API key."
setup:
  - "In Bit2Me, open your account settings and create an API key."
  - "Grant read-only scopes. Leave trading and withdrawal permissions off."
  - "In rotki, open API Keys → Exchanges → Add Bit2Me and paste the key and secret."
  - "Open History and let the initial sync run."
faq:
  - q: "Where are my Bit2Me API keys sent?"
    a: "rotki is a local application: your Bit2Me API key is stored on your computer and used to sign each request, which goes directly from your machine to Bit2Me's API. No rotki-operated server ever sees the key or the request."
  - q: "Are my Earn positions included?"
    a: "Movements into and out of the Earn program are tracked, so the assets are followed as they leave and return to your pocket."
  - q: "Can rotki trade or withdraw on my behalf?"
    a: "No. rotki only needs read-only scopes and never sends trade or withdrawal calls."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
