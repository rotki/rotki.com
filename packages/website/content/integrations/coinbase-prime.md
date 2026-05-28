---
slug: coinbase-prime
label: "Coinbase Prime"
type: exchange
image: "/img/integrations/coinbaseprime.svg"
tagline: "Coinbase Prime portfolio tracker - institutional accounts, local data"
intro: "Connect Coinbase Prime to rotki to import institutional trades, conversions, deposits, withdrawals, and rewards. Authenticate with a read-only API key; rotki processes everything on your own machine."
keywords: "coinbase prime portfolio tracker, coinbase prime tax report, coinbase prime staking, institutional crypto accounting"
features:
  - "Coinbase Prime orders (FILLED status) imported as swap events with commission as the trade fee."
  - "Conversions imported with the Coinbase Prime conversion fee captured."
  - "Deposits, withdrawals, and internal Coinbase deposits (COINBASE_DEPOSIT) imported as asset movements."
  - "Rewards imported as receive events."
  - "Balance reconciliation across every portfolio linked to the API key (portfolios are auto-discovered)."
limitations:
  - "Margin/derivatives history is not imported."
setup:
  - "In Coinbase Prime, create an API key under Settings → API with read-only scopes."
  - "Note the API key, secret, and passphrase. Coinbase Prime requires all three; portfolio IDs are discovered automatically."
  - "In rotki, open API Keys → Exchanges → Add Coinbase Prime and paste the credentials."
faq:
  - q: "How is Coinbase Prime different from Coinbase?"
    a: "Coinbase Prime is Coinbase's institutional offering with multi-portfolio accounts. Add it as a separate integration; consumer Coinbase uses its own integration entry."
  - q: "Do I need to enter each portfolio ID?"
    a: "No. rotki lists all portfolios linked to the API key and queries each one automatically."
  - q: "Are Coinbase Prime rewards included in tax reports?"
    a: "Yes. Rewards are imported as receive events and flow through to your PnL and tax exports."
  - q: "Where are my Coinbase Prime API credentials sent?"
    a: "rotki is a local application: your Coinbase Prime credentials are stored on your computer and used to sign each request, which goes directly from your machine to Coinbase Prime's API. No rotki-operated server ever sees the credentials or the request."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
